const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class ArmaSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "arma"],
    position: { width: 460, height: 400 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/items/arma-sheet.hbs",
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
    const norm = v => parseFloat(String(v).replace(",", ".")) || 0;
    const data = foundry.utils.expandObject(submitData);
    if (data.system?.carga   !== undefined) data.system.carga   = norm(data.system.carga);
    if (data.system?.recarga !== undefined) data.system.recarga = norm(data.system.recarga);
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
