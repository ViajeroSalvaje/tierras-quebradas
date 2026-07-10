import { HABILIDADES_OPCIONES } from "../../helpers/habilidades.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class OrigenSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "origen"],
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
    form: {
      template: "systems/tierras-quebradas/templates/items/origen-sheet.hbs", scrollable: [".item-body"]
    }
  };

  async _prepareContext(options) {
    return {
      item: this.item, system: this.item.system, habilidadesLista: (this.item.system.habilidades ?? []).map((h, i) => ({
        ...h, index: i, opciones: HABILIDADES_OPCIONES.map(op => ({ ...op, selected: op.clave === h.clave }))
      }))
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    // Añadir fila de habilidad
    el.querySelector(".origen-hab-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.habilidades ?? []), { clave: "", nombre: "", bonus: 1 }];
      await this.item.update({ "system.habilidades": lista });
    });

    // Eliminar fila
    el.querySelectorAll(".origen-hab-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const i = parseInt(btn.dataset.index);
        const lista = [...(this.item.system.habilidades ?? [])];
        lista.splice(i, 1);
        await this.item.update({ "system.habilidades": lista });
      });
    });

    // Editar clave o bonus
    el.querySelectorAll(".origen-hab-clave, .origen-hab-bonus").forEach(input => {
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
