import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class BendicionSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "bendicion"],
    position: { width: 400, height: 320 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/bendicion-sheet.hbs", scrollable: [".item-body"] }
  };
}
