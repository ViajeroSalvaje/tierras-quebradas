import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class VentajaSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "ventaja"],
    position: {
      width: 440,
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
    form: { template: "systems/tierras-quebradas/templates/items/ventaja-sheet.hbs", scrollable: [".item-body"] }
  };
}
