const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
import { ARMA_A_HABILIDAD_PNJ } from "../../helpers/habilidades.mjs";

export class ArmaSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "arma"],
    position: {
      width: 460,
      height: 500,
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
      template: "systems/tierras-quebradas/templates/items/arma-sheet.hbs", scrollable: [".item-body"]
    }
  };

  get title() { return this.item.name; }

  async _prepareContext(options) {
    const actor = this.item.actor;
    let habilidadesPNJ = [];
    if (actor && actor.type !== "pj") {
      const nombresEstandar = new Set(Object.values(ARMA_A_HABILIDAD_PNJ));
      habilidadesPNJ = Object.keys(actor.system.habilidades ?? {})
        .filter(n => !nombresEstandar.has(n))
        .sort((a, b) => a.localeCompare(b, "es"))
        .map(n => ({ clave: n, nombre: n }));
    }
    return {
      item: this.item, system: this.item.system, cssClass: this.options.classes.join(" "), habilidadesPNJ
    };
  }

  _onRender(context, options) {
    this.element.querySelector(".item-img")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.item.img, callback: path => this.item.update({ img: path })
      }).browse();
    });
  }

  async _processSubmitData(event, form, submitData) {
    const norm = v => parseFloat(String(v).replace(",", ".")) || 0;
    const data = foundry.utils.expandObject(submitData);
    if (data.system?.carga !== undefined) data.system.carga = norm(data.system.carga);
    if (data.system?.recarga !== undefined) data.system.recarga = norm(data.system.recarga);
    const packId = this.item.pack;
    const realId = packId
      ? game.packs.get(packId)?.index.find(e => e.name === this.item.name)?._id
      : null;
    if (realId) {
      const pack = game.packs.get(packId);
      await pack.getDocument(realId);
      await this.item.constructor.updateDocuments([{ _id: realId, ...data }], { pack: packId });
    } else {
      await this.item.update(data);
    }
  }
}
