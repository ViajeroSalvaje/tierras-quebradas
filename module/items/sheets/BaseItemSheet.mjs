const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class BaseItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  get title() { return this.item.name; }

  async _prepareContext() {
    return { item: this.item, system: this.item.system, cssClass: this.options.classes.join(" ") };
  }
}
