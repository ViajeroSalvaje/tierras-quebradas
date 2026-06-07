const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class PactoSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "pacto"],
    position: { width: 400, height: 300 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/items/pacto-sheet.hbs",
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

  _onRender(context, options) {
    super._onRender(context, options);
    const form = this.element.querySelector("form");
    if (!form) return;
    form.addEventListener("change", async () => {
      const fd = new foundry.applications.ux.FormDataExtended(form);
      await this.item.update(fd.object);
    });
  }
}
