const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class HabilidadSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "habilidad"],
    position: {
      width: 420,
      height: 380,
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
      template: "systems/tierras-quebradas/templates/items/habilidad-sheet.hbs", scrollable: [".item-body"]
    }
  };

  get title() { return this.item.name; }

  async _prepareContext(options) {
    return {
      item: this.item, system: this.item.system, cssClass: this.options.classes.join(" ")
    };
  }

  _onRender(context, options) {
    this.element.querySelector(".item-img")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.item.img, callback: path => this.item.update({ img: path })
      }).browse();
    });

    this.element.querySelector(".hab-especializada")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.item.update({ "system.especializada": !this.item.system.especializada });
    });
  }
}
