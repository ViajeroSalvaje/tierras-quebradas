import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class RasgoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "rasgo"],
    position: { width: 440, height: 360 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/rasgo-sheet.hbs", scrollable: [".item-body"] }
  };
}
