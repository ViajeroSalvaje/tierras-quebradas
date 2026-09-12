import { BaseItemSheet } from "./BaseItemSheet.mjs";
import { HABILIDADES_OPCIONES } from "../../helpers/habilidades.mjs";

export class RasgoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "rasgo"],
    position: { width: 440, height: 460 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/rasgo-sheet.hbs", scrollable: [".item-body"] }
  };

  async _prepareContext(options) {
    const ctx = await super._prepareContext(options);
    ctx.habilidades = (this.item.system.habilidades ?? []).map((h, i) => ({
      ...h, index: i, opciones: HABILIDADES_OPCIONES.map(op => ({ ...op, selected: op.clave === h.clave }))
    }));
    return ctx;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    el.querySelector(".rasgo-hab-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.habilidades ?? []), { clave: "", bonus: 1 }];
      await this.item.update({ "system.habilidades": lista });
    });

    el.querySelectorAll(".rasgo-hab-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lista = [...(this.item.system.habilidades ?? [])];
        lista.splice(parseInt(btn.dataset.index), 1);
        await this.item.update({ "system.habilidades": lista });
      });
    });

    el.querySelectorAll(".rasgo-hab-clave, .rasgo-hab-bonus").forEach(input => {
      input.addEventListener("change", async ev => {
        const i = parseInt(ev.target.dataset.index);
        const field = ev.target.dataset.field;
        const lista = [...(this.item.system.habilidades ?? [])].map(h => ({ ...h }));
        lista[i][field] = field === "bonus" ? parseInt(ev.target.value) || 0 : ev.target.value;
        await this.item.update({ "system.habilidades": lista });
      });
    });
  }
}
