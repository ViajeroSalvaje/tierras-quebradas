import { HABILIDADES_OPCIONES } from "../../helpers/habilidades.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class ProfesionSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "profesion"],
    position: {
      width: 500,
      height: 560,
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
      template: "systems/tierras-quebradas/templates/items/profesion-sheet.hbs", scrollable: [".item-body"]
    }
  };

  async _prepareContext(options) {
    return {
      item: this.item, system: this.item.system,
      habilidades: (this.item.system.habilidades ?? []).map((h, i) => ({
        ...h, index: i, opciones: HABILIDADES_OPCIONES.map(op => ({ ...op, selected: op.clave === h.clave }))
      })),
      ventajas: (this.item.system.ventajas ?? []).map((v, i) => ({ ...v, index: i })),
      especializaciones: (this.item.system.especializaciones ?? []).map((e, ei) => ({
        ...e, espIdx: ei,
        habilidades: (e.habilidades ?? []).map((h, hi) => ({
          ...h, espIdx: ei, habIdx: hi,
          opciones: HABILIDADES_OPCIONES.map(op => ({ ...op, selected: op.clave === h.clave }))
        }))
      }))
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

    // Ventajas — añadir manual
    el.querySelector(".prof-vent-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.ventajas ?? []), { nombre: "", efecto: "", coste: 0, tipo: "ventaja", fuente: "manual" }];
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

    // Especializaciones
    el.querySelector(".prof-esp-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.especializaciones ?? []), { nombre: "Nueva especialización", habilidades: [] }];
      await this.item.update({ "system.especializaciones": lista });
    });
    el.querySelectorAll(".prof-esp-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lista = [...(this.item.system.especializaciones ?? [])];
        lista.splice(parseInt(btn.dataset.espIdx), 1);
        await this.item.update({ "system.especializaciones": lista });
      });
    });
    el.querySelectorAll(".prof-esp-nombre").forEach(input => {
      input.addEventListener("change", async ev => {
        const ei = parseInt(ev.target.dataset.espIdx);
        const lista = (this.item.system.especializaciones ?? []).map(e => ({ ...e, habilidades: [...(e.habilidades ?? [])] }));
        lista[ei].nombre = ev.target.value;
        await this.item.update({ "system.especializaciones": lista });
      });
    });
    el.querySelectorAll(".prof-esp-hab-add").forEach(btn => {
      btn.addEventListener("click", async () => {
        const ei = parseInt(btn.dataset.espIdx);
        const lista = (this.item.system.especializaciones ?? []).map(e => ({ ...e, habilidades: [...(e.habilidades ?? [])] }));
        lista[ei].habilidades.push({ clave: "", bonus: 1 });
        await this.item.update({ "system.especializaciones": lista });
      });
    });
    el.querySelectorAll(".prof-esp-hab-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const ei = parseInt(btn.dataset.espIdx);
        const hi = parseInt(btn.dataset.habIdx);
        const lista = (this.item.system.especializaciones ?? []).map(e => ({ ...e, habilidades: [...(e.habilidades ?? [])] }));
        lista[ei].habilidades.splice(hi, 1);
        await this.item.update({ "system.especializaciones": lista });
      });
    });
    el.querySelectorAll(".prof-esp-hab-clave, .prof-esp-hab-bonus").forEach(input => {
      input.addEventListener("change", async ev => {
        const ei = parseInt(ev.target.dataset.espIdx);
        const hi = parseInt(ev.target.dataset.habIdx);
        const field = ev.target.dataset.field;
        const lista = (this.item.system.especializaciones ?? []).map(e => ({ ...e, habilidades: (e.habilidades ?? []).map(h => ({ ...h })) }));
        lista[ei].habilidades[hi][field] = field === "bonus" ? parseInt(ev.target.value) || 0 : ev.target.value;
        await this.item.update({ "system.especializaciones": lista });
      });
    });

    // Ventajas — arrastrar desde compendio o mundo
    const dropZone = el.querySelector(".prof-vent-section");
    if (dropZone) {
      dropZone.addEventListener("dragover", ev => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "copy";
      });
      dropZone.addEventListener("drop", async ev => {
        ev.preventDefault();
        let data;
        try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
        if (data.type !== "Item") return;
        const doc = await fromUuid(data.uuid);
        if (!doc || !["ventaja", "rasgo"].includes(doc.type)) return;
        const entrada = {
          nombre: doc.name, efecto: doc.system.efecto ?? "", coste: doc.system.coste ?? 0, tipo: doc.system.tipo ?? "ventaja", fuente: "item"
        };
        const lista = [...(this.item.system.ventajas ?? []), entrada];
        await this.item.update({ "system.ventajas": lista });
      });
    }
  }
}
