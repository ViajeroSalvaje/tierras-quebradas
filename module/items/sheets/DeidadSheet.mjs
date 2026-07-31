import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class DeidadSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "deidad"],
    position: { width: 440, height: 460 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/deidad-sheet.hbs", scrollable: [".item-body"] }
  };

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(".item-img")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.item.img, callback: path => this.item.update({ img: path })
      }).browse();
    });
    this.element.querySelectorAll(".toggle-estado").forEach(el => {
      el.addEventListener("click", async ev => {
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.item, campo);
        await this.item.update({ [campo]: !actual });
      });
    });
  }
}
