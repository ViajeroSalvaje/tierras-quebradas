import { TQRoll } from "../../rolls/TQRoll.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class DemonioSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "actor", "demonio"],
    position: {
      width: 620,
      height: 560,
    },
    window: {
      resizable: true,
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false,
    }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/actors/demonio-sheet.hbs", scrollable: [".sheet-body"]
    }
  };

  _activeTab = "stats";

  get title() { return this.actor.name; }

  async _prepareContext(options) {
    const CARACTS = ["cuerpo", "mente", "espiritu", "atractivo", "tamano"];
    const LABELS  = { cuerpo: "Cuerpo", mente: "Mente", espiritu: "Espíritu", atractivo: "Atractivo", tamano: "Tamaño" };
    const caracts = this.actor.system.caracteristicas;
    const caracteristicasOrdenadas = CARACTS.map(c => ({
      clave: c, label: LABELS[c], valor: caracts[c]?.valor ?? 0
    }));
    const items = this.actor.items;
    const rawHabs = this.actor.system.habilidades ?? {};
    const habilidades = Object.entries(rawHabs).map(([nombre, hab]) => {
      if (typeof hab === "number") return { nombre, total: hab, nivel: hab, base: "" };
      return { nombre, total: hab.total ?? 0, nivel: hab.nivel ?? 0, base: hab.base ?? "" };
    });
    return {
      actor: this.actor, system: this.actor.system, cssClass: this.options.classes.join(" "), caracteristicasOrdenadas, habilidades, armas: items.filter(i => i.type === "arma").map(i => ({ id: i.id, name: i.name, dano: i.system.danoArma, habilidad: i.system.habilidad, alcance: i.system.alcance, carga: i.system.carga })), armaduras: items.filter(i => i.type === "armadura").map(i => ({ id: i.id, name: i.name, proteccion: i.system.proteccion, zona: i.system.zona, tipo: i.system.tipo, carga: i.system.carga })), poderes: items.filter(i => i.type === "rasgo" && i.system.tipo !== "debilidad").map(i => ({ id: i.id, name: i.name })), debilidades: items.filter(i => i.type === "rasgo" && i.system.tipo === "debilidad").map(i => ({ id: i.id, name: i.name })), hechizos: items.filter(i => i.type === "hechizo")
    };
  }

  _syncTabs(el, tabId) {
    el.querySelectorAll(".sheet-tabs .item").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
    el.querySelectorAll(".sheet-body .tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
  }

  async _onDrop(event) {
    event.preventDefault();
    let data;
    try { data = JSON.parse(event.dataTransfer.getData("text/plain")); } catch { return; }
    if (data?.type !== "Item") return;
    const item = await fromUuid(data.uuid);
    if (!item) return;
    if (item.type === "habilidad") {
      if (this.actor.system.habilidades?.[item.name] !== undefined) return;
      await this.actor.update({ [`system.habilidades.${item.name}`]: {
        base: item.system.base, nivel: 0, puntosFijos: item.system.puntosFijos ?? 0, estorbo: item.system.estorbo ?? 0
      }});
      return;
    }
    await Item.create(item.toObject(), { parent: this.actor });
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;
    this._syncTabs(el, this._activeTab);

    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        this._activeTab = ev.currentTarget.dataset.tab;
        this._syncTabs(el, this._activeTab);
      });
    });

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".tirar-caracteristica").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.tirarCaracteristica(ev.currentTarget.dataset.caracteristica);
      });
    });

    el.querySelectorAll(".hab-nivel-input").forEach(input => {
      input.addEventListener("change", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        const nivel = parseInt(ev.currentTarget.value) || 0;
        const hab = this.actor.system.habilidades?.[nombre];
        if (hab && typeof hab === "object") {
          await this.actor.update({ [`system.habilidades.${nombre}.nivel`]: nivel });
        } else {
          await this.actor.update({ [`system.habilidades.${nombre}`]: nivel });
        }
      });
    });

    el.querySelectorAll(".tirar-base").forEach(div => {
      div.addEventListener("click", ev => {
        const base = ev.currentTarget.dataset.base;
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = this.actor.system.bases[base]?.valor ?? 0;
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
      });
    });

    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.total) || 5;
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
      });
      a.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.total) || 0;
        this.actor.abrirDialogoEnfrentada(nombre, valor);
      });
    });

    el.querySelector(".anadir-habilidad")?.addEventListener("click", async () => {
      const nombre = await DialogV2.prompt({
        window: { title: "Añadir habilidad" }, content: `<input type="text" name="nombre" placeholder="Nombre de la habilidad" autofocus />`, ok: { label: "Añadir", callback: (_ev, button) => button.form.elements.nombre.value.trim() }
      }).catch(() => null);
      if (nombre) {
        await this.actor.update({ [`system.habilidades.${nombre}`]: { base: "cultura", nivel: 0, puntosFijos: 0, estorbo: 0 } });
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

    el.querySelectorAll(".hechizo-nivel-input").forEach(input => {
      input.addEventListener("change", ev => {
        const id = ev.currentTarget.dataset.itemId;
        const nivel = parseInt(ev.currentTarget.value) || 0;
        this.actor.items.get(id)?.update({ "system.nivelLanzamiento": nivel });
      });
    });

    el.querySelectorAll(".pnj-tirar-hechizo").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.lanzarHechizo(ev.currentTarget.dataset.id);
      });
    });

    el.querySelector(".demonio-anadir-poder")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nuevo poder", type: "rasgo", system: { tipo: "rasgoSobrenatural" } }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".demonio-anadir-debilidad")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nueva debilidad", type: "rasgo", system: { tipo: "debilidad" } }, { parent: this.actor });
      item?.sheet.render(true);
    });
  }
}
