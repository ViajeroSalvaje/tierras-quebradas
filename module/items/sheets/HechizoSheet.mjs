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

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.querySelectorAll(".toggle-item-bool").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.item, campo) ?? false;
        this.item.update({ [campo]: !actual });
      });
    });
  }
}
