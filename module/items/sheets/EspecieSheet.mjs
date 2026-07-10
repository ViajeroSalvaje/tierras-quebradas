import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class EspecieSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "especie"],
    position: {
      width: 480,
      height: 520,
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
    form: { template: "systems/tierras-quebradas/templates/items/especie-sheet.hbs", scrollable: [".item-body"] }
  };
}
