const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class ProfesionSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "profesion"],
    position: { width: 500, height: 560 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/items/profesion-sheet.hbs",
      scrollable: [".item-body"]
    }
  };

  async _prepareContext(options) {
    return {
      item:         this.item,
      system:       this.item.system,
      habilidades:  (this.item.system.habilidades ?? []).map((h, i) => ({ ...h, index: i })),
      ventajas:     (this.item.system.ventajas ?? []).map((v, i) => ({ ...v, index: i }))
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    // Habilidades
    el.querySelector(".prof-hab-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.habilidades ?? []), { clave: "", bonus: 1 }];
      await this.item.update({ "system.habilidades": lista });
    });
    el.querySelectorAll(".prof-hab-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lista = [...(this.item.system.habilidades ?? [])];
        lista.splice(parseInt(btn.dataset.index), 1);
        await this.item.update({ "system.habilidades": lista });
      });
    });
    el.querySelectorAll(".prof-hab-clave, .prof-hab-bonus").forEach(input => {
      input.addEventListener("change", async ev => {
        const i = parseInt(ev.target.dataset.index);
        const field = ev.target.dataset.field;
        const lista = [...(this.item.system.habilidades ?? [])].map(h => ({ ...h }));
        lista[i][field] = field === "bonus" ? parseInt(ev.target.value) || 0 : ev.target.value;
        await this.item.update({ "system.habilidades": lista });
      });
    });

    // Ventajas
    el.querySelector(".prof-vent-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.ventajas ?? []), { nombre: "", efecto: "", coste: 0, tipo: "ventaja" }];
      await this.item.update({ "system.ventajas": lista });
    });
    el.querySelectorAll(".prof-vent-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lista = [...(this.item.system.ventajas ?? [])];
        lista.splice(parseInt(btn.dataset.index), 1);
        await this.item.update({ "system.ventajas": lista });
      });
    });
    el.querySelectorAll(".prof-vent-field").forEach(input => {
      input.addEventListener("change", async ev => {
        const i = parseInt(ev.target.dataset.index);
        const field = ev.target.dataset.field;
        const lista = [...(this.item.system.ventajas ?? [])].map(v => ({ ...v }));
        lista[i][field] = field === "coste" ? parseInt(ev.target.value) || 0 : ev.target.value;
        await this.item.update({ "system.ventajas": lista });
      });
    });
  }
}
