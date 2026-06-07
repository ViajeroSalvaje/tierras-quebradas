const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class BendicionSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "bendicion"],
    position: { width: 400, height: 320 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/items/bendicion-sheet.hbs",
      scrollable: [".item-body"]
    }
  };

  get title() { return this.item.name; }

  async _prepareContext(options) {
    return {
      item: this.item,
      system: this.item.system,
      cssClass: this.options.classes.join(" ")
    };
  }

}
