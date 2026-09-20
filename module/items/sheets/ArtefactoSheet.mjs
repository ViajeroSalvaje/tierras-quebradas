import { BaseItemSheet } from "./BaseItemSheet.mjs";

const { DialogV2 } = foundry.applications.api;

function estaAlineadoConLey(actor) {
  if (actor.type === "automata") return true;
  if (actor.type !== "pj") return actor.system.filiacion === "ley";
  const l = actor.system.lealtad ?? {};
  const plLey = l.ley ?? 0;
  const maxOtras = Math.max(0, l.caos ?? 0, l.elementos ?? 0, l.antepasados ?? 0);
  return plLey - maxOtras >= 10;
}

export class ArtefactoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "artefacto"],
    position: { width: 416, height: 550 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/artefacto-sheet.hbs", scrollable: [".item-body"] }
  };

  _activeTab = "datos";

  async _prepareContext() {
    const s = this.item.system;
    const poderes = s.poderes ?? [];
    let objetoBase = null;
    if (s.objetoBase?._itemData) {
      const b = s.objetoBase._itemData.system ?? {};
      objetoBase = { tipoItem: s.objetoBase.tipo, ...b };
    }
    return {
      item: this.item,
      system: s,
      cssClass: this.options.classes.join(" "),
      vmRestante: (s.valorMagico ?? 0) - (s.vmGastado ?? 0),
      pmMax: (s.espiritu ?? 0) * 2,
      poderesHechizos: poderes.map((p, i) => ({ ...p, _idx: i, abrible: !!(p.uuid || p._itemData) })).filter(p => p.tipo === "hechizo"),
      poderesRasgos:   poderes.map((p, i) => ({ ...p, _idx: i, abrible: !!(p.uuid || p._itemData) })).filter(p => p.tipo === "rasgo"),
      habsSostenidas:  (s.habilidadesSostenidas ?? []).map((h, i) => ({ ...h, _idx: i, abrible: !!(h.uuid || h._itemData) })),
      objetoBase
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

    const abrirItemLocal = async (data, onGuardar) => {
      if (data.uuid) { const i = await fromUuid(data.uuid); i?.sheet?.render(true); return; }
      if (!data._itemData) return;
      const tempItem = new CONFIG.Item.documentClass(foundry.utils.deepClone(data._itemData), { temporary: true });
      const sheet = tempItem.sheet;
      if (!sheet) return;
      let guardado = false;
      const origClose = sheet.close.bind(sheet);
      sheet.close = async (...args) => {
        const r = await origClose(...args);
        if (!guardado) { guardado = true; await onGuardar(tempItem); }
        return r;
      };
      sheet.render(true);
    };

    el.querySelectorAll(".tq-abrir-poder").forEach(span => {
      span.addEventListener("click", async () => {
        const idx = parseInt(span.dataset.idx);
        const poder = this.item.system.poderes?.[idx];
        if (!poder) return;
        await abrirItemLocal(poder, async (updated) => {
          const poderes = foundry.utils.deepClone(this.item.system.poderes ?? []);
          poderes[idx] = { ...poderes[idx], nombre: updated.name, pmCoste: updated.system.pmCoste || 0, _itemData: updated.toObject() };
          await this.item.update({ "system.poderes": poderes });
        });
      });
    });

    el.querySelectorAll(".tq-abrir-habilidad").forEach(span => {
      span.addEventListener("click", async () => {
        const idx = parseInt(span.dataset.idx);
        const hab = this.item.system.habilidadesSostenidas?.[idx];
        if (!hab) return;
        await abrirItemLocal(hab, async (updated) => {
          const habs = foundry.utils.deepClone(this.item.system.habilidadesSostenidas ?? []);
          habs[idx] = { ...habs[idx], nombre: updated.name, _itemData: updated.toObject() };
          await this.item.update({ "system.habilidadesSostenidas": habs });
        });
      });
    });

    el.querySelector(".pm-menos")?.addEventListener("click", () => {
      const pm = Math.max(0, (this.item.system.pm ?? 0) - 1);
      this.item.update({ "system.pm": pm });
    });

    el.querySelector(".pm-mas")?.addEventListener("click", () => {
      const pmMax = (this.item.system.espiritu ?? 0) * 2;
      const pm = Math.min(pmMax, (this.item.system.pm ?? 0) + 1);
      this.item.update({ "system.pm": pm });
    });

    el.querySelectorAll(".poder-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const poderes = foundry.utils.deepClone(this.item.system.poderes ?? []);
        poderes.splice(idx, 1);
        this.item.update({ "system.poderes": poderes, "system.vmGastado": poderes.reduce((s, p) => s + (p.vm ?? 0), 0) });
      });
    });

    el.querySelectorAll(".poder-activar").forEach(btn => {
      btn.addEventListener("click", async ev => {
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const poder = this.item.system.poderes?.[idx];
        if (!poder) return;
        const pmCoste = poder.pmCoste || 0;

        const token = canvas.tokens?.controlled[0];
        const actor = token?.actor;
        if (!actor) { ui.notifications.warn("Selecciona el portador del artefacto en el tablero."); return; }

        if (!estaAlineadoConLey(actor)) {
          ui.notifications.warn(`La virtud no responde — ${actor.name} no está alineado con la Ley (PL Ley debe superar en ≥10 al resto).`);
          return;
        }

        const pmActual = this.item.system.pm ?? 0;
        if (pmCoste > 0 && pmActual < pmCoste) {
          ui.notifications.warn(`PM insuficiente. El artefacto necesita ${pmCoste} PM pero solo le quedan ${pmActual}.`);
          return;
        }

        if (pmCoste > 0) await this.item.update({ "system.pm": pmActual - pmCoste });

        ChatMessage.create({
          content: `<div class="tq-result-card"><p style="text-align:center;font-weight:bold;">${this.item.name}</p><hr><p><em>${poder.nombre}</em> se activa automáticamente.${pmCoste > 0 ? ` (−${pmCoste} PM)` : ""}</p></div>`,
          speaker: ChatMessage.getSpeaker({ actor })
        });
      });
    });

    const registrarDropzone = (selector, validar, construir, aviso) => {
      const zona = el.querySelector(selector);
      if (!zona) return;
      zona.addEventListener("dragover", ev => { ev.preventDefault(); zona.classList.add("drag-over"); });
      zona.addEventListener("dragleave", () => zona.classList.remove("drag-over"));
      zona.addEventListener("drop", async ev => {
        ev.preventDefault();
        zona.classList.remove("drag-over");
        let data;
        try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
        if (data.type !== "Item") return;
        const item = await fromUuid(data.uuid);
        if (!item || !validar(item)) { ui.notifications.warn(aviso); return; }
        const poderes = foundry.utils.deepClone(this.item.system.poderes ?? []);
        if (poderes.some(p => p.uuid === data.uuid)) return;
        poderes.push({ uuid: data.uuid, ...construir(item) });
        await this.item.update({ "system.poderes": poderes, "system.vmGastado": poderes.reduce((s, p) => s + (p.vm ?? 0), 0) });
      });
    };

    registrarDropzone(
      ".hechizos-dropzone",
      item => item.type === "hechizo",
      item => { const dif = item.system.dificultad ?? 15; return { nombre: item.name, vm: dif <= 10 ? 1 : dif <= 15 ? 2 : dif <= 20 ? 3 : 4, tipo: "hechizo", pmCoste: item.system.pmCoste || 0 }; },
      "Solo se pueden añadir hechizos aquí."
    );

    registrarDropzone(
      ".rasgos-dropzone",
      item => item.type === "caracteristicaBestiario" && item.system.tipo === "rasgo",
      item => ({ nombre: item.name, vm: item.system.vm || 0, tipo: "rasgo", pmCoste: 0 }),
      "Solo se pueden añadir rasgos de bestiario aquí."
    );

    el.querySelectorAll(".habilidad-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const habs = foundry.utils.deepClone(this.item.system.habilidadesSostenidas ?? []);
        habs.splice(idx, 1);
        this.item.update({ "system.habilidadesSostenidas": habs });
      });
    });

    el.querySelector(".usar-sosten")?.addEventListener("click", async () => {
      const s = this.item.system;
      const pmDisponible = s.pm ?? 0;
      if (pmDisponible < 1) { ui.notifications.warn("El artefacto no tiene PM disponibles."); return; }

      const token = canvas.tokens?.controlled[0];
      const actor = token?.actor;
      if (!actor) { ui.notifications.warn("Selecciona el portador del artefacto en el tablero."); return; }

      if (!estaAlineadoConLey(actor)) {
        ui.notifications.warn(`La virtud no responde — ${actor.name} no está alineado con la Ley (PL Ley debe superar en ≥10 al resto).`);
        return;
      }

      const maximo = Math.min(5, pmDisponible);
      const pmGastar = await DialogV2.prompt({
        window: { title: "Usar Sostén" },
        content: `<form><div class="form-group" style="padding:8px;">
          <p>Bonificador a <strong>${s.sosten || "la habilidad apoyada"}</strong>${s.tipoObjeto ? ` (${s.tipoObjeto})` : ""}.</p>
          <p style="font-size:12px;color:var(--tq-text-dim);">1 PM = +1 al resultado · declara antes de tirar · máx. ${maximo}</p>
          <label style="margin-top:8px;display:block;">PM a gastar</label>
          <input type="number" name="pmGastar" min="1" max="${maximo}" value="1" autofocus style="width:60px;" />
        </div></form>`,
        ok: { label: "Confirmar", callback: (_ev, btn) => parseInt(btn.form.elements.pmGastar?.value) || 1 }
      });
      if (!pmGastar) return;
      const gasto = Math.max(1, Math.min(maximo, pmGastar));
      await this.item.update({ "system.pm": pmDisponible - gasto });
      ChatMessage.create({
        content: `<div class="tq-result-card"><p style="text-align:center;font-weight:bold;">${this.item.name}</p><hr><p>Sostén activo: <strong>+${gasto} a ${s.sosten || "habilidad apoyada"}</strong> hasta la siguiente tirada.${s.tipoObjeto ? ` <em>(${s.tipoObjeto})</em>` : ""} (−${gasto} PM)</p></div>`,
        speaker: ChatMessage.getSpeaker({ actor })
      });
    });

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
