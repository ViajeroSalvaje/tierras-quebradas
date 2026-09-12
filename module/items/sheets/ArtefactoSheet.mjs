import { BaseItemSheet } from "./BaseItemSheet.mjs";

const { DialogV2 } = foundry.applications.api;

export class ArtefactoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "artefacto"],
    position: { width: 520, height: 500 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/artefacto-sheet.hbs", scrollable: [".item-body"] }
  };

  _activeTab = "datos";

  async _prepareContext() {
    const s = this.item.system;
    return {
      item: this.item,
      system: s,
      cssClass: this.options.classes.join(" "),
      vmRestante: (s.valorMagico ?? 0) - (s.vmGastado ?? 0)
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;
    this._syncTabs(el, this._activeTab);

    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        this._activeTab = ev.currentTarget.dataset.tab;
        this._syncTabs(el, this._activeTab);
      });
    });

    el.querySelectorAll(".poder-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const poderes = foundry.utils.deepClone(this.item.system.poderes ?? []);
        poderes.splice(idx, 1);
        this.item.update({ "system.poderes": poderes, "system.vmGastado": poderes.reduce((s, p) => s + (p.vm ?? 0), 0) });
      });
    });

    const dropZone = el.querySelector(".poderes-dropzone");
    if (dropZone) {
      dropZone.addEventListener("dragover", ev => { ev.preventDefault(); dropZone.classList.add("drag-over"); });
      dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
      dropZone.addEventListener("drop", async ev => {
        ev.preventDefault();
        dropZone.classList.remove("drag-over");
        let data;
        try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
        if (data.type !== "Item") return;
        const item = await fromUuid(data.uuid);
        const esHechizo = item?.type === "hechizo";
        const esRasgo = item?.type === "caracteristicaBestiario" && item.system.tipo === "rasgo";
        if (!item || (!esHechizo && !esRasgo)) { ui.notifications.warn("Solo se pueden añadir hechizos o rasgos de bestiario."); return; }
        const poderes = foundry.utils.deepClone(this.item.system.poderes ?? []);
        if (poderes.some(p => p.uuid === data.uuid)) return;
        const dif = item.system.dificultad ?? 15;
        const vm = esHechizo ? (dif <= 10 ? 1 : dif <= 15 ? 2 : dif <= 20 ? 3 : 4) : (item.system.vm || 0);
        poderes.push({ nombre: item.name, vm, uuid: data.uuid });
        await this.item.update({ "system.poderes": poderes, "system.vmGastado": poderes.reduce((s, p) => s + (p.vm ?? 0), 0) });
      });
    }

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.item.img, callback: path => this.item.update({ img: path })
      }).browse();
    });
  }

  _syncTabs(el, tabId) {
    el.querySelectorAll(".sheet-tabs .item").forEach(t => t.classList.toggle("active", t.dataset.tab === tabId));
    el.querySelectorAll(".item-body .tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabId));
  }
}
