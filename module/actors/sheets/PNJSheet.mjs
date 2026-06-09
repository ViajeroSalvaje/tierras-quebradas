import { ARMA_A_HABILIDAD_PNJ } from "../../helpers/habilidades.mjs";

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
    form: { template: "systems/tierras-quebradas/templates/actors/pnj-sheet.hbs" }
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
      hechizos: items.filter(i => i.type === "hechizo").map(i => ({ id: i.id, name: i.name, dificultad: i.system.dificultad, pmCoste: i.system.pmCoste }))
    };
  }

  _onRender(context, options) {
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
        type: "image",
        current: this.actor.img,
        callback: path => this.actor.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.valor) || 5;
        const { TQRoll } = await import("../../rolls/TQRoll.mjs");
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
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

    el.querySelectorAll(".pnj-item-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.id)?.delete();
      });
    });

    el.querySelectorAll(".pnj-tirar-arma").forEach(a => {
      a.addEventListener("click", async ev => {
        const item = this.actor.items.get(ev.currentTarget.dataset.id);
        if (!item) return;
        const habClave = item.system.habilidad;
        const habNombre = ARMA_A_HABILIDAD_PNJ[habClave] ?? habClave;
        const valor = this.actor.system.habilidades?.[habNombre] ?? 0;
        const { TQRoll } = await import("../../rolls/TQRoll.mjs");
        const manos = item.system.manos ?? "1m";
        const modo = (item.system.alcance === "contacto") ? "melee" : "distancia";
        const sumaMD = item.system.alcance === "contacto" || item.system.alcance === "arrojadiza";
        const md = !sumaMD ? 0
          : (manos === "2m") ? (this.actor.system.derivadas?.mDano2m?.valor ?? 0)
          : (this.actor.system.derivadas?.mDano1m?.valor ?? 0);
        await TQRoll.dialogoTirada(item.name, valor, {
          actor: this.actor,
          targetActor: game.user.targets.first()?.actor ?? null,
          modo,
          esCombate: true,
          longitudArma: item.system.longitud ?? "media",
          danho: {
            danoArma: item.system.danoArma ?? "0",
            tipo: item.system.tipo ?? "cortante",
            md,
            manos,
            noLetal: item.system.noLetal ?? false
          }
        });
      });
    });

    el.querySelectorAll(".pnj-tirar-hechizo").forEach(a => {
      a.addEventListener("click", async ev => {
        const item = this.actor.items.get(ev.currentTarget.dataset.id);
        if (!item) return;
        const { TQRoll } = await import("../../rolls/TQRoll.mjs");
        TQRoll.dialogoTirada(item.name, item.system.dificultad ?? 15, { actor: this.actor });
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
