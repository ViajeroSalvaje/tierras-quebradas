const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class DemonioSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "actor", "demonio"],
    position: { width: 620, height: 560 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/actors/demonio-sheet.hbs",
      scrollable: [".sheet-body"]
    }
  };

  get title() { return this.actor.name; }

  async _prepareContext(options) {
    return {
      actor: this.actor,
      system: this.actor.system,
      cssClass: this.options.classes.join(" ")
    };
  }

  _onRender(context, options) {
    const el = this.element;

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image",
        current: this.actor.img,
        callback: path => this.actor.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".tirar-caracteristica").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.tirarCaracteristica(ev.currentTarget.dataset.caracteristica);
      });
    });

    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.valor) || 5;
        const { TQRoll } = await import("../../rolls/TQRoll.mjs");
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
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
}
