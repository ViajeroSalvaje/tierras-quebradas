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
    return {
      actor: this.actor,
      system: this.actor.system,
      cssClass: this.options.classes.join(" "),
      config: CONFIG.TQ
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
