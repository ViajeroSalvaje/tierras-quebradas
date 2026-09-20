import { BaseItemSheet } from "./BaseItemSheet.mjs";

export class ObjetoDemoniacoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "objeto-demoniaco"],
    position: { width: 420, height: 460 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/objeto-demoniaco-sheet.hbs", scrollable: [".sheet-body"] }
  };

  _activeTab = "principal";

  async _prepareContext() {
    return { item: this.item, system: this.item.system, cssClass: this.options.classes.join(" ") };
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

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
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
}
