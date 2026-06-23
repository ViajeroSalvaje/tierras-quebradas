import { TQRoll } from "../../rolls/TQRoll.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class PNJSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "actor", "pnj"],
    position: { width: 600, height: 540 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/actors/pnj-sheet.hbs", scrollable: [".sheet-body"] }
  };

  _activeTab = "stats";

  get title() { return this.actor.name; }

  async _prepareContext(options) {
    const items = this.actor.items;
    return {
      actor: this.actor,
      system: this.actor.system,
      cssClass: this.options.classes.join(" "),
      config: CONFIG.TQ,
      armas: items.filter(i => i.type === "arma").map(i => ({ id: i.id, name: i.name, dano: i.system.danoArma, habilidad: i.system.habilidad })),
      armaduras: items.filter(i => i.type === "armadura").map(i => ({ id: i.id, name: i.name, proteccion: i.system.proteccion, tipo: i.system.tipo })),
      hechizos: items.filter(i => i.type === "hechizo"),
      rasgos: items.filter(i => i.type === "rasgo").map(i => ({ id: i.id, name: i.name })),
      ventajas: items.filter(i => i.type === "ventaja").map(i => ({ id: i.id, name: i.name })),
      objetos: items.filter(i => i.type === "objeto").map(i => ({ id: i.id, name: i.name, categoria: i.system.categoria, carga: i.system.carga })),
      consumibles: items.filter(i => i.type === "consumible").map(i => ({ id: i.id, name: i.name, dosis: i.system.dosis, efecto: i.system.efecto, carga: i.system.carga }))
    };
  }

  async _onDrop(event) {
    event.preventDefault();
    let data;
    try { data = JSON.parse(event.dataTransfer.getData("text/plain")); } catch { return; }
    if (data?.type !== "Item") return;
    const item = await fromUuid(data.uuid);
    if (!item) return;
    await Item.create(item.toObject(), { parent: this.actor });
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;
    this._syncTabs(el, this._activeTab);

    el.querySelector(".pnj-pv-input")?.addEventListener("change", ev => {
      this.actor.update({ "system.salud.pvActual.valor": parseInt(ev.currentTarget.value) || 0 });
    });

    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        this._activeTab = ev.currentTarget.dataset.tab;
        this._syncTabs(el, this._activeTab);
      });
    });

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image",
        current: this.actor.img,
        callback: path => this.actor.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        if (nombre === "primerosAuxilios") return this.actor.intentarPrimerosAuxilios();
        const valor = parseInt(ev.currentTarget.dataset.valor) || 5;
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
      });
      a.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.valor) || 0;
        this.actor.abrirDialogoEnfrentada(nombre, valor);
      });
    });

    el.querySelectorAll(".tirar-caracteristica").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.tirarCaracteristica(ev.currentTarget.dataset.caracteristica);
      });
    });

    el.querySelector(".anadir-habilidad")?.addEventListener("click", async () => {
      const nombre = await DialogV2.prompt({
        window: { title: "Añadir habilidad" },
        content: `<input type="text" name="nombre" placeholder="Nombre de la habilidad" autofocus />`,
        ok: { label: "Añadir", callback: (_ev, button) => button.form.elements.nombre.value.trim() }
      }).catch(() => null);
      if (nombre) {
        await this.actor.update({ [`system.habilidades.${nombre}`]: 5 });
      }
    });

    el.querySelectorAll(".eliminar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        await this.actor.update({ [`system.habilidades.-=${nombre}`]: null });
      });
    });

    el.querySelectorAll(".pnj-item-nombre").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.id)?.sheet.render(true);
      });
    });

    el.querySelectorAll(".item-edit").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.itemId)?.sheet.render(true);
      });
    });

    el.querySelector(".anadir-arma")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nueva arma", type: "arma" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".anadir-armadura")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nueva protección", type: "armadura" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelectorAll(".pnj-item-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.id)?.delete();
      });
    });

    el.querySelectorAll(".pnj-tirar-arma").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.tirarArma(ev.currentTarget.dataset.id);
      });
    });

    el.querySelectorAll(".pnj-tirar-hechizo").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.lanzarHechizo(ev.currentTarget.dataset.id);
      });
    });
  }

  _syncTabs(el, tabId) {
    el.querySelectorAll(".sheet-tabs .item").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
    el.querySelectorAll(".sheet-body .tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
  }
}
