import { HABILIDADES_OPCIONES } from "../../helpers/habilidades.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const VERBOS_PROF = [
  { clave: "aumentar", label: "Verbo: Aumentar" }, { clave: "conocer", label: "Verbo: Conocer" },
  { clave: "disminuir", label: "Verbo: Disminuir" }, { clave: "dirigir", label: "Verbo: Dirigir" },
  { clave: "inhibir", label: "Verbo: Inhibir" }, { clave: "invocar", label: "Verbo: Invocar" },
  { clave: "modificar", label: "Verbo: Modificar" }, { clave: "transformar", label: "Verbo: Transformar" }
];
const ESFERAS_PROF = [
  { clave: "agua", label: "Esfera: Agua" }, { clave: "aire", label: "Esfera: Aire" },
  { clave: "caos", label: "Esfera: Caos" }, { clave: "cuerpo", label: "Esfera: Cuerpo" },
  { clave: "espiritu", label: "Esfera: Espíritu" }, { clave: "fuego", label: "Esfera: Fuego" },
  { clave: "ley", label: "Esfera: Ley" }, { clave: "mente", label: "Esfera: Mente" },
  { clave: "planta", label: "Esfera: Planta" }, { clave: "tierra", label: "Esfera: Tierra" }
];

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
      habilidades: (this.item.system.habilidades ?? []).map((h, i) => {
        const todasOpciones = [...HABILIDADES_OPCIONES, ...VERBOS_PROF, ...ESFERAS_PROF];
        return {
          ...h, index: i,
          opciones: todasOpciones.map(op => ({ ...op, selected: op.clave === h.clave })),
          tieneOpciones: !!(h.opciones?.length),
          opcionesList: (h.opciones ?? []).map((oc, j) => ({
            opIdx: j,
            opciones: todasOpciones.map(op => ({ ...op, selected: op.clave === oc }))
          }))
        };
      }),
      ventajas: (this.item.system.ventajas ?? []).map((v, i) => ({ ...v, index: i })),
      rasgos: (this.item.system.rasgos ?? []).map((r, i) => ({ ...r, index: i })),
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

    el.querySelectorAll(".prof-hab-nombre").forEach(input => {
      input.addEventListener("change", async ev => {
        const i = parseInt(ev.target.dataset.index);
        const lista = [...(this.item.system.habilidades ?? [])].map(h => ({ ...h }));
        lista[i].nombre = ev.target.value;
        await this.item.update({ "system.habilidades": lista });
      });
    });

    el.querySelectorAll(".prof-hab-opcion-add").forEach(btn => {
      btn.addEventListener("click", async () => {
        const i = parseInt(btn.dataset.index);
        const lista = [...(this.item.system.habilidades ?? [])].map(h => ({ ...h, opciones: [...(h.opciones ?? [])] }));
        lista[i].opciones.push("");
        await this.item.update({ "system.habilidades": lista });
      });
    });

    el.querySelectorAll(".prof-hab-opcion-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const i = parseInt(btn.dataset.habIdx);
        const j = parseInt(btn.dataset.opIdx);
        const lista = [...(this.item.system.habilidades ?? [])].map(h => ({ ...h, opciones: [...(h.opciones ?? [])] }));
        lista[i].opciones.splice(j, 1);
        await this.item.update({ "system.habilidades": lista });
      });
    });

    el.querySelectorAll(".prof-hab-opcion-clave").forEach(sel => {
      sel.addEventListener("change", async ev => {
        const i = parseInt(ev.target.dataset.habIdx);
        const j = parseInt(ev.target.dataset.opIdx);
        const lista = [...(this.item.system.habilidades ?? [])].map(h => ({ ...h, opciones: [...(h.opciones ?? [])] }));
        lista[i].opciones[j] = ev.target.value;
        await this.item.update({ "system.habilidades": lista });
      });
    });

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

    el.querySelector(".prof-rasgo-add")?.addEventListener("click", async () => {
      const lista = [...(this.item.system.rasgos ?? []), { nombre: "", efecto: "", coste: 0, tipo: "rasgoSobrenatural", fuente: "manual" }];
      await this.item.update({ "system.rasgos": lista });
    });
    el.querySelectorAll(".prof-rasgo-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lista = [...(this.item.system.rasgos ?? [])];
        lista.splice(parseInt(btn.dataset.index), 1);
        await this.item.update({ "system.rasgos": lista });
      });
    });
    el.querySelectorAll(".prof-rasgo-field").forEach(input => {
      input.addEventListener("change", async ev => {
        const i = parseInt(ev.target.dataset.index);
        const field = ev.target.dataset.field;
        const lista = [...(this.item.system.rasgos ?? [])].map(r => ({ ...r }));
        lista[i][field] = field === "coste" ? parseInt(ev.target.value) || 0 : ev.target.value;
        await this.item.update({ "system.rasgos": lista });
      });
    });

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

    const dropZoneVent = el.querySelector(".prof-vent-section");
    if (dropZoneVent) {
      dropZoneVent.addEventListener("dragover", ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = "copy"; });
      dropZoneVent.addEventListener("drop", async ev => {
        ev.preventDefault();
        let data;
        try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
        if (data.type !== "Item") return;
        const doc = await fromUuid(data.uuid);
        if (!doc || doc.type !== "ventaja") return;
        const entrada = { nombre: doc.name, efecto: doc.system.efecto ?? "", coste: doc.system.coste ?? 0, tipo: doc.system.tipo ?? "ventaja", fuente: "item" };
        await this.item.update({ "system.ventajas": [...(this.item.system.ventajas ?? []), entrada] });
      });
    }

    const dropZoneRasgo = el.querySelector(".prof-rasgo-section");
    if (dropZoneRasgo) {
      dropZoneRasgo.addEventListener("dragover", ev => { ev.preventDefault(); ev.dataTransfer.dropEffect = "copy"; });
      dropZoneRasgo.addEventListener("drop", async ev => {
        ev.preventDefault();
        let data;
        try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
        if (data.type !== "Item") return;
        const doc = await fromUuid(data.uuid);
        if (!doc || doc.type !== "rasgo") return;
        const entrada = { nombre: doc.name, efecto: doc.system.efecto ?? "", coste: doc.system.coste ?? 0, tipo: doc.system.tipo ?? "rasgoSobrenatural", fuente: "item" };
        await this.item.update({ "system.rasgos": [...(this.item.system.rasgos ?? []), entrada] });
      });
    }
  }
}
