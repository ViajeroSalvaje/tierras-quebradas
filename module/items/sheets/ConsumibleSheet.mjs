import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class ConsumibleSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "consumible"],
    position: {
      width: 420,
      height: 360,
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
    form: { template: "systems/tierras-quebradas/templates/items/consumible-sheet.hbs", scrollable: [".item-body"] }
  };
}
