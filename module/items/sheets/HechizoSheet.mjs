import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class HechizoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "hechizo"],
    position: {
      width: 480,
      height: 440,
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
    form: { template: "systems/tierras-quebradas/templates/items/hechizo-sheet.hbs", scrollable: [".item-body"] }
  };
}
