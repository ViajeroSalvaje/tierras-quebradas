const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class IdiomaSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "idioma"],
    position: {
      width: 420,
      height: 280,
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
    form: {
      template: "systems/tierras-quebradas/templates/items/idioma-sheet.hbs", scrollable: [".item-body"]
    }
  };

  get title() { return this.item.name; }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelectorAll(".toggle-estado").forEach(el => {
      el.addEventListener("click", async ev => {
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.item, campo);
        await this.item.update({ [campo]: !actual });
      });
    });
  }

  async _prepareContext(options) {
    return { item: this.item, system: this.item.system };
  }
}
