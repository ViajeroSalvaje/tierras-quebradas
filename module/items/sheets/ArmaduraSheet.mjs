const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class ArmaduraSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "armadura"],
    position: { width: 440, height: 360 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/items/armadura-sheet.hbs",
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

  async _processSubmitData(event, form, submitData) {
    const data = foundry.utils.expandObject(submitData);
    if (data.system?.carga !== undefined) {
      data.system.carga = parseFloat(String(data.system.carga).replace(",", ".")) || 0;
    }
    const packId = this.item.pack;
    const realId = packId
      ? game.packs.get(packId)?.index.find(e => e.name === this.item.name)?._id
      : null;
    if (realId) {
      const pack = game.packs.get(packId);
      await pack.getDocument(realId);
      await this.item.constructor.updateDocuments([{ _id: realId, ...data }], { pack: packId });
    } else {
      await this.item.update(data);
    }
  }
}
