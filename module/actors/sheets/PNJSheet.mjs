import { TQRoll } from "../../rolls/TQRoll.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class PNJSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "actor", "pnj"],
    position: {
      width: 600,
      height: 540,
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
    form: { template: "systems/tierras-quebradas/templates/actors/pnj-sheet.hbs", scrollable: [".sheet-body"] }
  };

  _activeTab = "stats";

  get title() { return this.actor.name; }

  async _prepareContext(options) {
    const items = this.actor.items;
    const rawHabs = this.actor.system.habilidades ?? {};
    const deidadesPack = game.packs.get("tierras-quebradas.deidades");
    const deidadesDocs = deidadesPack ? await deidadesPack.getDocuments() : [];
    const deidadesGrupos = { ley: [], caos: [], elementos: [], antepasados: [] };
    for (const d of deidadesDocs.sort((a, b) => a.name.localeCompare(b.name, "es"))) {
      deidadesGrupos[d.system.tipo]?.push(d.name);
    }
    const filiacion = this.actor.system.filiacion ?? "";
    const todasLasDeidades = Object.values(deidadesGrupos).flat().sort((a, b) => a.localeCompare(b, "es"));
    const esSincretismo = filiacion === "sincretismo";
    const deidadesActuales = esSincretismo ? todasLasDeidades : (filiacion ? (deidadesGrupos[filiacion] ?? []) : []);
    const habilidades = Object.entries(rawHabs).map(([nombre, hab]) => {
      if (typeof hab === "number") return { nombre, total: hab, nivel: hab, base: "" };
      return { nombre, total: hab.total ?? 0, nivel: hab.nivel ?? 0, base: hab.base ?? "" };
    });
    const espHechizos = items.filter(i => i.type === "hechizo" && i.system.permanent).reduce((s, i) => s + (i.system.pmCoste || 1), 0);
    const espSintonizados = items.filter(i => i.type === "objetoMagico" && i.system.categoria === "encantado" && i.system.sintonizado).reduce((s, i) => s + (i.system.sintonizacion || 0), 0);
    const espirituConsagrado = espHechizos + espSintonizados;
    return {
      actor: this.actor, system: this.actor.system, cssClass: this.options.classes.join(" "), config: CONFIG.TQ, habilidades, deidadesActuales, esSincretismo, espirituConsagrado, ocultarRasgosVentajas: true, armas: [...items.filter(i => i.type === "arma").map(i => ({ id: i.id, name: i.name, dano: i.system.danoArma, habilidad: i.system.habilidad, alcance: i.system.alcance, carga: i.system.carga, equipped: i.system.equipped !== false })), ...items.filter(i => i.type === "objetoMagico" && i.system.tipoObjeto === "arma").map(i => ({ id: i.id, name: i.name, dano: i.system.danoArma, habilidad: i.system.habilidad, alcance: i.system.alcance, carga: 0, magico: true, equipped: i.system.equipped !== false }))], armaduras: [...items.filter(i => i.type === "armadura").map(i => ({ id: i.id, name: i.name, proteccion: i.system.proteccion, tipo: i.system.tipo, zona: i.system.zona, carga: i.system.carga, equipped: i.system.equipped !== false })), ...items.filter(i => i.type === "objetoMagico" && i.system.tipoObjeto === "armadura").map(i => { const modProt = i.system.categoria === "encantado" && !i.system.sintonizado ? 0 : (i.system.modProteccion ?? 0); return { id: i.id, name: i.name, proteccion: (i.system.proteccion ?? 0) + modProt, tipo: i.system.tipoProteccion, zona: "—", carga: i.system.carga ?? 0, equipped: i.system.equipped !== false }; })], hechizos: items.filter(i => i.type === "hechizo"), rasgos: items.filter(i => i.type === "rasgo").map(i => ({ id: i.id, name: i.name, coste: i.system.coste ?? 0 })), ventajas: items.filter(i => i.type === "ventaja").map(i => ({ id: i.id, name: i.name })), objetos: items.filter(i => i.type === "objeto").map(i => ({ id: i.id, name: i.name, categoria: i.system.categoria, carga: i.system.carga, equipped: i.system.equipped !== false })), consumibles: items.filter(i => i.type === "consumible").map(i => ({ id: i.id, name: i.name, dosis: i.system.dosis, efecto: i.system.efecto, carga: i.system.carga, equipped: i.system.equipped !== false })), objetosMagicos: items.filter(i => i.type === "objetoMagico"), bendiciones: items.filter(i => i.type === "bendicion")
    };
  }

  async _onDropItem(event, data) {
    const item = await fromUuid(data.uuid);
    if (!item) return;
    if (item.type === "habilidad") {
      const clave = item.system?.clave;
      const loc = clave ? game.i18n.localize(`TQ.Habilidades.${clave}`) : null;
      const nombre = (loc && loc !== `TQ.Habilidades.${clave}`) ? loc : item.name;
      if (this.actor.system.habilidades?.[nombre] !== undefined) return;
      await this.actor.update({ [`system.habilidades.${nombre}`]: {
        base: item.system.base, nivel: 0, puntosFijos: item.system.puntosFijos ?? 0, estorbo: item.system.estorbo ?? 0
      }});
      return;
    }
    await Item.create(item.toObject(), { parent: this.actor });
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;
    if (this._savedScrollTop !== undefined) {
      const sb = el.querySelector(".sheet-body");
      if (sb) sb.scrollTop = this._savedScrollTop;
      delete this._savedScrollTop;
    }
    this._syncTabs(el, this._activeTab);

    el.querySelector(".pnj-pv-input")?.addEventListener("change", ev => {
      this.actor.update({ "system.salud.pvActual.valor": parseInt(ev.currentTarget.value) || 0 });
    });

    el.querySelectorAll(".toggle-estado").forEach(a => {
      a.addEventListener("click", ev => {
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.actor, campo) ?? false;
        this.actor.update({ [campo]: !actual });
      });
    });

    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        this._activeTab = ev.currentTarget.dataset.tab;
        this._syncTabs(el, this._activeTab);
      });
    });

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".hab-nivel-input").forEach(input => {
      input.addEventListener("change", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        const nivel = parseInt(ev.currentTarget.value) || 0;
        const hab = this.actor.system.habilidades?.[nombre];
        if (hab && typeof hab === "object") {
          await this.actor.update({ [`system.habilidades.${nombre}.nivel`]: nivel });
        } else {
          await this.actor.update({ [`system.habilidades.${nombre}`]: nivel });
        }
      });
    });

    el.querySelectorAll(".tirar-base").forEach(div => {
      div.addEventListener("click", ev => {
        const base = ev.currentTarget.dataset.base;
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = this.actor.system.bases[base]?.valor ?? 0;
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
      });
    });

    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        if (nombre === "primerosAuxilios") return this.actor.intentarPrimerosAuxilios();
        const valor = parseInt(ev.currentTarget.dataset.total) || 5;
        const bonificadorDefecto = this.actor._sumModsMagicosHabilidad(nombre);
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor, bonificadorDefecto });
      });
      a.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.total) || 0;
        this.actor.abrirDialogoEnfrentada(nombre, valor);
      });
    });

    el.querySelectorAll(".tirar-caracteristica").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.tirarCaracteristica(ev.currentTarget.dataset.caracteristica);
      });
    });

    el.querySelectorAll(".md-extra-input").forEach(input => {
      input.addEventListener("change", ev => {
        const campo = ev.currentTarget.dataset.campo;
        this.actor.update({ [`system.derivadas.${campo}`]: parseInt(ev.currentTarget.value) || 0 });
      });
    });

    el.querySelector(".anadir-habilidad")?.addEventListener("click", async () => {
      const nombre = await DialogV2.prompt({
        window: { title: game.i18n.localize("TQ.Tooltips.AnadirHabilidad") }, content: `<input type="text" name="nombre" placeholder="${game.i18n.localize("TQ.Placeholders.NombreHabilidad")}" autofocus />`, ok: { label: game.i18n.localize("TQ.Botones.Anadir"), callback: (_ev, button) => button.form.elements.nombre.value.trim() }
      }).catch(() => null);
      if (nombre) {
        await this.actor.update({ [`system.habilidades.${nombre}`]: { base: "cultura", nivel: 0, puntosFijos: 0, estorbo: 0 } });
      }
    });

    el.querySelectorAll(".eliminar-habilidad").forEach(a => {
      a.addEventListener("click", async ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        await this.actor.update({ [`system.habilidades.-=${nombre}`]: null });
      });
    });

    el.querySelectorAll(".pnj-item-nombre").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.id)?.sheet.render(true);
      });
    });

    el.querySelectorAll(".item-edit").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.itemId)?.sheet.render(true);
      });
    });

    el.querySelector(".anadir-arma")?.addEventListener("click", async () => {
      const item = await Item.create({ name: game.i18n.localize("TQ.Nuevo.arma"), type: "arma" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".anadir-armadura")?.addEventListener("click", async () => {
      const item = await Item.create({ name: game.i18n.localize("TQ.Nuevo.armadura"), type: "armadura" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".anadir-objeto")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nuevo objeto", type: "objeto" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".anadir-objeto-magico")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nuevo objeto mágico", type: "objetoMagico" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".anadir-hechizo")?.addEventListener("click", async () => {
      const item = await Item.create({ name: game.i18n.localize("TQ.Nuevo.hechizo"), type: "hechizo" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelectorAll(".pnj-item-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.items.get(ev.currentTarget.dataset.id)?.delete();
      });
    });

    el.querySelectorAll(".toggle-equipado").forEach(a => {
      a.addEventListener("click", async ev => {
        ev.preventDefault();
        this._savedScrollTop = el.querySelector(".sheet-body")?.scrollTop;
        const id = ev.currentTarget.dataset.itemId;
        const item = this.actor.items.get(id);
        if (!item) return;
        const newVal = !(item.system.equipped ?? true);
        const ops = [item.update({ "system.equipped": newVal })];
        const vinculada = this.actor.items.find(i => i.type === "armadura" && i.getFlag("tierras-quebradas", "fromArmaId") === id);
        if (vinculada) ops.push(vinculada.update({ "system.equipped": newVal }, { tqFromArma: true }));
        const fromArmaId = item.getFlag("tierras-quebradas", "fromArmaId");
        if (fromArmaId) {
          const fuente = this.actor.items.get(fromArmaId);
          if (fuente) ops.push(fuente.update({ "system.equipped": newVal }, { tqFromArma: true }));
        }
        await Promise.all(ops);
      });
    });

    el.querySelectorAll(".pnj-tirar-arma").forEach(a => {
      a.addEventListener("click", ev => {
        if (ev.currentTarget.classList.contains("tq-desequipado")) return;
        this.actor.tirarArma(ev.currentTarget.dataset.id);
      });
    });

    el.querySelectorAll(".hechizo-nivel-input").forEach(input => {
      input.addEventListener("change", ev => {
        const id = ev.currentTarget.dataset.itemId;
        const nivel = parseInt(ev.currentTarget.value) || 0;
        this.actor.items.get(id)?.update({ "system.nivelLanzamiento": nivel });
      });
    });

    el.querySelectorAll(".pnj-tirar-hechizo").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.lanzarHechizo(ev.currentTarget.dataset.id);
      });
    });

    el.querySelectorAll(".hechizo-permanent").forEach(span => {
      span.addEventListener("click", ev => {
        ev.preventDefault();
        const hechizo = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (!hechizo) return;
        const nuevoPermanent = !hechizo.system.permanent;
        if (nuevoPermanent) {
          const pmCoste = hechizo.system.pmCoste || 1;
          const espActual = this.actor.system.espirituConsagrado ?? 0;
          const espMax = this.actor.system.caracteristicas?.espiritu?.valor ?? 0;
          if (espActual + pmCoste > espMax) {
            ui.notifications.warn(game.i18n.format("TQ.Magia.EspirituConsagradoMaximo", { max: espMax }));
            return;
          }
        }
        hechizo.update({ "system.permanent": nuevoPermanent });
      });
    });

    el.querySelector(".pnj-anadir-bendicion")?.addEventListener("click", async () => {
      const item = await Item.create({ name: game.i18n.localize("TQ.Nuevo.bendicion"), type: "bendicion" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".pnj-anadir-ventaja")?.addEventListener("click", async () => {
      const item = await Item.create({ name: game.i18n.localize("TQ.Nuevo.ventaja"), type: "ventaja" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelector(".pnj-anadir-rasgo")?.addEventListener("click", async () => {
      const item = await Item.create({ name: game.i18n.localize("TQ.Nuevo.rasgo"), type: "rasgo" }, { parent: this.actor });
      item?.sheet.render(true);
    });

    el.querySelectorAll(".pnj-activar-bendicion").forEach(a => {
      a.addEventListener("click", ev => {
        this.actor.activarBendicion(ev.currentTarget.dataset.id);
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
