import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class ObjetoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "objeto"],
    position: {
      width: 420,
      height: 340,
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
    form: { template: "systems/tierras-quebradas/templates/items/objeto-sheet.hbs", scrollable: [".item-body"] }
  };
}
