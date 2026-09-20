const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
import { ARMA_A_HABILIDAD_PNJ } from "../../helpers/habilidades.mjs";

async function _resolverConjuros(lista) {
  return Promise.all(lista.map(async c => {
    if (c.verbo || c.pmCoste) return c;
    for (const pack of game.packs) {
      if (pack.metadata.type !== "Item") continue;
      const idx = await pack.getIndex({ fields: ["type"] });
      const entry = idx.find(e => e.name === c.nombre && e.type === "hechizo");
      if (entry) {
        const doc = await pack.getDocument(entry._id);
        const r = { nombre: c.nombre, dificultad: c.dificultad };
        if (doc.system.verbo) r.verbo = doc.system.verbo;
        if (doc.system.esfera) r.esfera = doc.system.esfera;
        if (doc.system.pmCoste) r.pmCoste = doc.system.pmCoste;
        if (doc.system.pmMax > doc.system.pmCoste) r.pmMax = doc.system.pmMax;
        return r;
      }
    }
    return c;
  }));
}

export class ArmaSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "arma"],
    position: {
      width: 644,
      height: 676,
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
      template: "systems/tierras-quebradas/templates/items/arma-sheet.hbs", scrollable: [".sheet-body"]
    }
  };

  _activeTab = "principal";

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
    const conjuros = await _resolverConjuros(this.item.system.conjuros ?? []);
    return {
      item: this.item, system: this.item.system, cssClass: this.options.classes.join(" "), habilidadesPNJ, conjuros
    };
  }

  _onRender(context, options) {
    const el = this.element;

    this._syncTabs(el, this._activeTab);

    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        this._activeTab = ev.currentTarget.dataset.tab;
        this._syncTabs(el, this._activeTab);
      });
    });

    el.querySelector(".item-img")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.item.img, callback: path => this.item.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".toggle-estado").forEach(btn => {
      btn.addEventListener("click", async ev => {
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.item, campo);
        await this.item.update({ [campo]: !actual });
      });
    });
  }

  _syncTabs(el, tabId) {
    el.querySelectorAll(".sheet-tabs .item").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
    el.querySelectorAll(".sheet-body .tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
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
