import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class CaracteristicaBestiarioSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "caracteristica-bestiario"],
    position: { width: 420, height: 440 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/caracteristica-bestiario-sheet.hbs", scrollable: [".item-body"] }
  };

  _onRender(context, options) {
    super._onRender(context, options);
    for (const toggle of ["vmVariable", "creaArma"]) {
      this.element.querySelector(`[data-toggle='${toggle}']`)?.addEventListener("click", () => {
        const input = this.element.querySelector(`[name='system.${toggle}']`);
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
  }
}
