import { TQRoll } from "../rolls/TQRoll.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class DemonioWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "tq-creator"],
    position: { width: 560, height: 620 },
    window: { title: "Asistente de Demonología", resizable: true },
    form: { submitOnChange: false, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/demonio-wizard.hbs", scrollable: [".tq-creator-body"] }
  };

  _paso = 1;
  _subPaso2 = 1;

  _estado = {
    hechiceroId: null,
    hechiceroNombre: "",
    hechiceroEspiritu: 0,
    hechiceroNombreManual: "",
    hechiceroEspirituManual: 0,

    modoOrigen: "conocido",
    demonio: null,
    nuevo: {
      nombre: "",
      dificultad: 15,
      tiradaInvencion: 0,
      invencionExito: false,
      esp: 0, cue: 0, men: 0, tam: 0,
      aspectoHumano: false, inteligenciaAnimal: false, atrIncremento: 0,
      armaduraTipo: "blanda",
      armaduraValor: 0,
      habilidades: [],
      poderes: [],
      debilidades: [],
    },

    tipoVinculo: "invocacion",
    resultadoHechicero: 0,
    vinculoExitoso: false,

    objeto: null,

    poderes: {
      bonoDanho: 0,
      bonoHabilidad: 0,
      bonoHabilidadClave: "",
      bonoHabilidadClaveSistema: "",
      danhoMagico: false,
      danhoEspiritual: false,
      vampiro: false,
      irrompible: false,
      proteccion: 0,
      salvaguardaFuego: false,
      salvaguardaArmas: false,
      conjuros: [],
      pmPropios: false,
    }
  };

  static open() { return new DemonioWizard().render(true); }

  _dropzone(el, selector, onDrop) {
    const dz = el.querySelector(selector);
    if (!dz) return;
    dz.addEventListener("dragover", ev => { ev.preventDefault(); dz.classList.add("drag-over"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("drag-over"));
    dz.addEventListener("drop", async ev => {
      ev.preventDefault();
      dz.classList.remove("drag-over");
      await onDrop(ev);
    });
  }

  _demonioEfectivo() {
    const e = this._estado;
    if (e.modoOrigen === "conocido") return e.demonio;
    if (e.modoOrigen === "descubrir" && e.nuevo.invencionExito && e.nuevo.esp > 0)
      return { nombre: e.nuevo.nombre || "Nuevo demonio", espiritu: e.nuevo.esp };
    return null;
  }

  _calcularAtr() {
    const n = this._estado.nuevo;
    if (n.inteligenciaAnimal) return null;
    const base = n.aspectoHumano ? 0 : -4;
    return base + (n.atrIncremento || 0);
  }

  _dadoPorDificultad(dif) {
    if (dif === 10) return "1d3+2";
    if (dif === 15) return "1d6+2";
    return "1d10+2";
  }

  _vmGastadoPoderes() {
    const p = this._estado.poderes;
    const difVm = d => d === 10 ? 2 : d === 15 ? 4 : d === 20 ? 6 : 8;
    return (p.bonoDanho === 1 ? 2 : p.bonoDanho === 2 ? 4 : 0)
      + (p.bonoHabilidad === 1 ? 2 : p.bonoHabilidad === 2 ? 4 : 0)
      + (p.danhoMagico ? 2 : 0)
      + (p.danhoEspiritual ? 2 : 0)
      + (p.vampiro ? 5 : 0)
      + (p.irrompible ? 1 : 0)
      + (p.proteccion === 1 ? 2 : p.proteccion === 2 ? 4 : 0)
      + (p.salvaguardaFuego ? 4 : 0)
      + (p.salvaguardaArmas ? 7 : 0)
      + p.conjuros.reduce((s, c) => s + difVm(c.dificultad), 0)
      + (p.pmPropios ? 2 : 0);
  }

  async _prepareContext() {
    const e = this._estado;
    const actores = game.actors
      .filter(a => ["pj", "pnj"].includes(a.type))
      .map(a => ({ id: a.id, name: a.name, espiritu: a.system.caracteristicas?.espiritu?.valor ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const pasos = [
      { num: 1, label: "Hechicero" }, { num: 2, label: "Demonio" },
      { num: 3, label: "Ritual" }, { num: 4, label: "Objeto" },
      { num: 5, label: "Poderes" }, { num: 6, label: "Resumen" }
    ].map(p => ({ ...p, activo: p.num === this._paso, completado: p.num < this._paso }));

    const demonio = this._demonioEfectivo();
    const vmPresupuesto = demonio?.espiritu ?? 0;
    const vmDebilidades = e.nuevo.debilidades.length;
    const vmPresupuestoNuevo = e.nuevo.esp + vmDebilidades;
    const n2 = e.nuevo;
    const vmRasgosAtr = n2.inteligenciaAnimal ? 1 : (n2.aspectoHumano ? 2 : 0) + (n2.atrIncremento || 0);
    const vmGastadoNuevo = n2.poderes.reduce((s, p) => s + (p.vm || 0), 0) + vmRasgosAtr;
    const limiteServ = Math.floor(e.hechiceroEspiritu / 2);

    let plazasOcupadas = 0;
    if (e.hechiceroId) {
      const actor = game.actors.get(e.hechiceroId);
      if (actor) plazasOcupadas = actor.items.filter(i => i.type === "demonio" || i.type === "objetoDemoniaco").length;
    }

    const n = e.nuevo;
    const habPresupuesto = n.esp * 2;
    const habGastado = n.habilidades.reduce((s, h) => s + (h.puntos || 0), 0);
    const difInvencion = n.dificultad === 10 ? 15 : n.dificultad === 15 ? 20 : 25;

    const vmGastadoPoderes = this._vmGastadoPoderes();
    const vmRestantePoderes = vmPresupuesto - vmGastadoPoderes;

    let objetoResumen = null;
    if (e.objeto) {
      const p = e.poderes;
      const sourceType = e.objeto.tipoObjeto;
      const targetType = ["arma", "armadura"].includes(sourceType) ? sourceType : "objeto";
      const sourceItem = e.objeto.uuid ? await fromUuid(e.objeto.uuid) : null;
      const sys = sourceItem ? foundry.utils.deepClone(sourceItem.system) : {};
      const campos = [];
      if (targetType === "arma") {
        campos.push({ label: "Daño", valor: p.bonoDanho ? `${sys.danoArma ?? 0}+${p.bonoDanho}` : (sys.danoArma ?? 0) });
        if (sys.tipoDanho) campos.push({ label: "Tipo de daño", valor: sys.tipoDanho });
        if (sys.habilidad) campos.push({ label: "Habilidad", valor: game.i18n.localize(`TQ.Habilidades.${sys.habilidad}`) || sys.habilidad });
        if (p.bonoHabilidad) campos.push({ label: "Bono habilidad", valor: `+${p.bonoHabilidad}${p.bonoHabilidadClave ? ` (${p.bonoHabilidadClave})` : ""}` });
        const baseProt = sys.tieneProteccion ? (sys.proteccionValor ?? 0) : 0;
        const protFinal = baseProt + (p.proteccion || 0);
        if (protFinal > 0) campos.push({ label: "Protección", valor: protFinal });
      } else if (targetType === "armadura") {
        campos.push({ label: "Protección", valor: (sys.proteccion ?? 0) + (p.proteccion || 0) });
        if (sys.tipo) campos.push({ label: "Tipo", valor: sys.tipo });
        if (p.bonoHabilidad) campos.push({ label: "Bono habilidad", valor: `+${p.bonoHabilidad}${p.bonoHabilidadClave ? ` (${p.bonoHabilidadClave})` : ""}` });
      } else {
        if (p.bonoHabilidad) campos.push({ label: "Bono habilidad", valor: `+${p.bonoHabilidad}${p.bonoHabilidadClave ? ` (${p.bonoHabilidadClave})` : ""}` });
      }
      const flags = [
        p.danhoMagico && "Daño mágico", p.danhoEspiritual && "Daño espiritual",
        p.vampiro && "Vampiro", p.irrompible && "Irrompible",
        p.salvaguardaFuego && "Salvaguarda fuego", p.salvaguardaArmas && "Salvaguarda armas",
        p.pmPropios && "PM propios"
      ].filter(Boolean);
      objetoResumen = { nombre: e.objeto.nombreFinal || e.objeto.nombre, tipo: targetType, campos, flags, conjuros: p.conjuros };
    }

    return {
      paso: this._paso,
      paso1: this._paso === 1, paso2: this._paso === 2, paso3: this._paso === 3,
      paso4: this._paso === 4, paso5: this._paso === 5, paso6: this._paso === 6,
      pasos, estado: e, actores,
      limiteServ, plazasOcupadas, plazasLibres: Math.max(0, limiteServ - plazasOcupadas),
      demonio,
      vmPresupuesto,
      vmPresupuestoNuevo, vmGastadoNuevo, vmNuevoRestante: vmPresupuestoNuevo - vmGastadoNuevo,
      habPresupuesto, habGastado, habRestante: habPresupuesto - habGastado,
      difInvocacion: demonio?.espiritu ?? 0,
      vinculoStr: e.tipoVinculo === "convocacion" ? "Convocación (alianza voluntaria)" : "Invocación (vínculo forzado)",
      subPaso2: this._subPaso2,
      subPaso2_1: this._subPaso2 === 1, subPaso2_2: this._subPaso2 === 2,
      subPaso2_3: this._subPaso2 === 3, subPaso2_4: this._subPaso2 === 4,
      dado: this._dadoPorDificultad(n.dificultad),
      difInvencion,
      pmCosto: n.dificultad === 10 ? 1 : n.dificultad === 15 ? 2 : 3,
      atrCalculado: (() => { const v = this._calcularAtr(); return v === null ? "—" : String(v); })(),
      valorInvencion: (() => {
        const actor = e.hechiceroId ? game.actors.get(e.hechiceroId) : null;
        const base = actor?.system?.bases?.hechiceria?.valor ?? 0;
        if (!base) return e.hechiceroEspiritu;
        return base + Math.min(actor?.system?.hechiceria?.verbos?.invocar ?? 0, actor?.system?.hechiceria?.esferas?.caos ?? 0);
      })(),
      vmGastadoPoderes, vmRestantePoderes,
      objetoResumen,
    };
  }

  _guardarPaso1(el) {
    this._estado.hechiceroNombreManual = el.querySelector("[name=hechiceroNombreManual]")?.value?.trim() ?? "";
    this._estado.hechiceroEspirituManual = parseInt(el.querySelector("[name=hechiceroEspirituManual]")?.value) || 0;
    const sel = el.querySelector("[name=hechiceroId]");
    if (sel?.value) {
      const actor = game.actors.get(sel.value);
      this._estado.hechiceroId = sel.value;
      this._estado.hechiceroNombre = actor?.name ?? "";
      this._estado.hechiceroEspiritu = actor?.system.caracteristicas?.espiritu?.valor ?? 0;
    } else if (this._estado.hechiceroEspirituManual > 0) {
      this._estado.hechiceroId = null;
      this._estado.hechiceroNombre = this._estado.hechiceroNombreManual;
      this._estado.hechiceroEspiritu = this._estado.hechiceroEspirituManual;
    }
  }

  _guardarPaso3(el) {
    this._estado.resultadoHechicero = parseInt(el.querySelector("[name=resultadoHechicero]")?.value) || 0;
  }

  _guardarPaso5(el) {
    const p = this._estado.poderes;
    p.bonoDanho = parseInt(el.querySelector("[name=poder_bonoDanho]")?.value) || 0;
    p.bonoHabilidad = parseInt(el.querySelector("[name=poder_bonoHabilidad]")?.value) || 0;
    p.proteccion = parseInt(el.querySelector("[name=poder_proteccion]")?.value) || 0;
  }

  _guardarNuevoNombre(el) {
    const v = el.querySelector("[name=nuevoNombre]")?.value?.trim();
    if (v !== undefined) this._estado.nuevo.nombre = v;
  }

  _guardarPasoActual(el) {
    if (this._paso === 1) this._guardarPaso1(el);
    if (this._paso === 3) this._guardarPaso3(el);
    if (this._paso === 5) this._guardarPaso5(el);
    if (this._paso === 2 && this._estado.modoOrigen === "descubrir") this._guardarNuevoNombre(el);
  }

  _validarPasoActual(el) {
    if (this._paso === 1) {
      this._guardarPaso1(el);
      const ok = this._estado.hechiceroId || (this._estado.hechiceroNombreManual && this._estado.hechiceroEspirituManual > 0);
      if (!ok) { ui.notifications.warn("Selecciona un hechicero o introduce su nombre y Espíritu."); return false; }
    }
    if (this._paso === 2) {
      if (this._estado.modoOrigen === "conocido") {
        if (!this._estado.demonio) { ui.notifications.warn("Arrastra un demonio al área de soltar antes de continuar."); return false; }
      } else {
        const n = this._estado.nuevo;
        if (this._subPaso2 === 1 && !n.invencionExito) { ui.notifications.warn("La tirada de invención debe ser exitosa para continuar."); return false; }
        if (this._subPaso2 === 2 && !n.esp) { ui.notifications.warn("Tira el Espíritu del demonio antes de continuar."); return false; }
        if (this._subPaso2 < 4) {
          this._guardarNuevoNombre(el);
          this._subPaso2++;
          this.render();
          return false;
        }
        this._guardarNuevoNombre(el);
        if (!n.nombre) { ui.notifications.warn("Introduce un nombre para el demonio."); return false; }
      }
    }
    if (this._paso === 3) {
      this._guardarPaso3(el);
      if (this._estado.tipoVinculo === "invocacion") {
        if (!this._estado.resultadoHechicero) { ui.notifications.warn("Realiza la tirada o introduce el resultado manualmente."); return false; }
        const dif = this._demonioEfectivo()?.espiritu ?? 0;
        this._estado.vinculoExitoso = this._estado.resultadoHechicero >= dif;
      } else {
        this._estado.vinculoExitoso = true;
      }
    }
    if (this._paso === 4) {
      if (!this._estado.objeto) { ui.notifications.warn("Arrastra un objeto mundano antes de continuar."); return false; }
    }
    return true;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    el.querySelector(".creator-prev")?.addEventListener("click", () => {
      if (this._paso === 2 && this._estado.modoOrigen === "descubrir" && this._subPaso2 > 1) {
        this._subPaso2--;
        this.render();
        return;
      }
      this._guardarPasoActual(el);
      if (this._paso === 2) this._subPaso2 = 1;
      this._paso--;
      this.render();
    });

    el.querySelector(".creator-next")?.addEventListener("click", () => {
      if (!this._validarPasoActual(el)) return;
      this._guardarPasoActual(el);
      this._paso++;
      this.render();
    });

    el.querySelector(".creator-crear")?.addEventListener("click", () => this._finalizar());

    if (this._paso === 1) this._setupPaso1(el);
    if (this._paso === 2) this._setupPaso2(el);
    if (this._paso === 3) this._setupPaso3(el);
    if (this._paso === 4) this._setupPaso4(el);
    if (this._paso === 5) this._setupPaso5(el);
  }

  _setupPaso1(el) {
    el.querySelector("[name=hechiceroId]")?.addEventListener("change", ev => {
      const actor = game.actors.get(ev.target.value);
      if (!actor) {
        this._estado.hechiceroId = null;
        this._estado.hechiceroEspiritu = 0;
      } else {
        this._estado.hechiceroId = actor.id;
        this._estado.hechiceroNombre = actor.name;
        this._estado.hechiceroEspiritu = actor.system.caracteristicas?.espiritu?.valor ?? 0;
      }
      const disp = el.querySelector(".limit-serv-display");
      if (disp) disp.textContent = Math.floor(this._estado.hechiceroEspiritu / 2);
    });
  }

  _setupPaso2(el) {
    el.querySelectorAll(".tq-radio-btn[data-origen]").forEach(span => {
      span.addEventListener("click", () => {
        this._estado.modoOrigen = span.dataset.origen;
        this._subPaso2 = 1;
        this.render();
      });
    });

    this._dropzone(el, ".demonio-dropzone", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Actor") return;
      const actor = await fromUuid(data.uuid);
      if (!actor || actor.type !== "demonio") { ui.notifications.warn("Suelta un actor de tipo demonio."); return; }
      this._estado.demonio = { nombre: actor.name, espiritu: actor.system.caracteristicas?.espiritu?.valor ?? 0, actorId: actor.id };
      this.render();
    });
    el.querySelector(".demonio-limpiar")?.addEventListener("click", () => { this._estado.demonio = null; this.render(); });

    el.querySelectorAll(".tq-radio-btn[data-dif]").forEach(span => {
      span.addEventListener("click", () => {
        this._estado.nuevo.dificultad = parseInt(span.dataset.dif);
        this.render();
      });
    });

    el.querySelector(".tirar-invencion")?.addEventListener("click", async () => {
      const n = this._estado.nuevo;
      const difTirada = n.dificultad === 10 ? 15 : n.dificultad === 15 ? 20 : 25;
      const actor = this._estado.hechiceroId ? game.actors.get(this._estado.hechiceroId) : null;
      const base = actor?.system?.bases?.hechiceria?.valor ?? 0;
      const bonusInvocar = actor?.system?.hechiceria?.verbos?.invocar ?? 0;
      const bonusCaos = actor?.system?.hechiceria?.esferas?.caos ?? 0;
      const valorTirada = base > 0
        ? base + Math.min(bonusInvocar, bonusCaos)
        : this._estado.hechiceroEspiritu;
      const res = await TQRoll.dialogoTirada("Invocar Caos — Invención demoníaca", valorTirada, {
        dificultadForzada: difTirada,
        actor
      });
      if (res == null) return;
      n.tiradaInvencion = res.total;
      n.invencionExito = res.exitos >= 0;
      this.render();
    });

    const tirarStat = async (formula, campo) => {
      const r = new Roll(formula);
      await r.evaluate();
      r.toMessage({ flavor: `${campo} del demonio` });
      return r.total;
    };
    const dado = this._dadoPorDificultad(this._estado.nuevo.dificultad);
    el.querySelector(".tirar-esp")?.addEventListener("click", async () => { this._estado.nuevo.esp = await tirarStat(dado, "ESP"); this.render(); });
    el.querySelector(".tirar-cue")?.addEventListener("click", async () => { this._estado.nuevo.cue = await tirarStat(dado, "CUE"); this.render(); });
    el.querySelector(".tirar-men")?.addEventListener("click", async () => { this._estado.nuevo.men = await tirarStat(dado, "MEN"); this.render(); });
    el.querySelector(".tirar-tam")?.addEventListener("click", async () => {
      const r = new Roll("1d6-1d6");
      await r.evaluate();
      r.toMessage({ flavor: "TAM del demonio" });
      this._estado.nuevo.tam = Math.min(r.total, this._estado.nuevo.cue - 1);
      this.render();
    });
    el.querySelector(".tirar-armadura")?.addEventListener("click", async () => {
      const formula = this._estado.nuevo.armaduraTipo === "dura" ? "1d3-1" : "1d6-1";
      this._estado.nuevo.armaduraValor = await tirarStat(formula, "Armadura");
      this.render();
    });

    el.querySelectorAll(".tq-radio-btn[data-armadura]").forEach(span => {
      span.addEventListener("click", () => { this._estado.nuevo.armaduraTipo = span.dataset.armadura; this.render(); });
    });
    ["esp", "cue", "men", "tam", "armaduraValor"].forEach(campo => {
      el.querySelector(`[name=nuevo_${campo}]`)?.addEventListener("change", ev => {
        this._estado.nuevo[campo] = parseInt(ev.target.value) || 0;
      });
    });

    this._dropzone(el, ".habilidades-dropzone", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Item") return;
      const item = await fromUuid(data.uuid);
      if (!item || item.type !== "habilidad") { ui.notifications.warn("Suelta un item de tipo Habilidad."); return; }
      this._estado.nuevo.habilidades.push({ nombre: item.name, puntos: 1 });
      this.render();
    });
    el.querySelector(".hab-add")?.addEventListener("click", () => {
      this._estado.nuevo.habilidades.push({ nombre: "", puntos: 0 });
      this.render();
    });
    el.querySelectorAll(".hab-nombre").forEach(inp => {
      inp.addEventListener("change", ev => {
        this._estado.nuevo.habilidades[parseInt(ev.currentTarget.dataset.idx)].nombre = ev.target.value;
      });
    });
    el.querySelectorAll(".hab-puntos").forEach(inp => {
      inp.addEventListener("change", ev => {
        this._estado.nuevo.habilidades[parseInt(ev.currentTarget.dataset.idx)].puntos = parseInt(ev.target.value) || 0;
        this.render();
      });
    });
    el.querySelectorAll(".hab-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this._estado.nuevo.habilidades.splice(parseInt(ev.currentTarget.dataset.idx), 1);
        this.render();
      });
    });

    el.querySelector("[name=nuevoNombre]")?.addEventListener("input", ev => {
      this._estado.nuevo.nombre = ev.target.value;
    });

    el.querySelectorAll(".tq-radio-btn[data-rasgo-atr]").forEach(span => {
      span.addEventListener("click", () => {
        const rasgo = span.dataset.rasgoAtr;
        if (rasgo === "aspectoHumano") {
          this._estado.nuevo.aspectoHumano = !this._estado.nuevo.aspectoHumano;
          if (this._estado.nuevo.aspectoHumano) this._estado.nuevo.inteligenciaAnimal = false;
        } else if (rasgo === "inteligenciaAnimal") {
          this._estado.nuevo.inteligenciaAnimal = !this._estado.nuevo.inteligenciaAnimal;
          if (this._estado.nuevo.inteligenciaAnimal) this._estado.nuevo.aspectoHumano = false;
        }
        this.render();
      });
    });
    el.querySelector("[name=nuevo_atrIncremento]")?.addEventListener("change", ev => {
      this._estado.nuevo.atrIncremento = Math.max(0, parseInt(ev.target.value) || 0);
      this.render();
    });

    el.querySelector(".poder-add-manual")?.addEventListener("click", async () => {
      const item = await Item.create({ name: "Nuevo poder", type: "caracteristicaBestiario" });
      if (!item) return;
      const sheet = item.sheet;
      const wizard = this;
      const origClose = sheet.close.bind(sheet);
      sheet.close = async function(...args) {
        const fresh = game.items.get(item.id);
        if (fresh) {
          wizard._estado.nuevo.poderes.push({
            nombre: fresh.name,
            vm: fresh.system?.vmVariable ? (fresh.system?.vm ?? 1) : (fresh.system?.vm ?? 0),
            origen: "rasgo",
            _itemData: fresh.toObject()
          });
          await fresh.delete();
        }
        wizard.render();
        return origClose(...args);
      };
      sheet.render(true);
    });

    this._dropzone(el, ".rasgos-dropzone", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Item") return;
      const item = await fromUuid(data.uuid);
      if (!item || item.type !== "caracteristicaBestiario") { ui.notifications.warn("Suelta un Rasgo de Bestiario."); return; }
      const vm = item.system?.vmVariable ? 1 : (item.system?.vm ?? 0);
      this._estado.nuevo.poderes.push({ nombre: item.name, vm, uuid: data.uuid });
      this.render();
    });
    el.querySelectorAll(".poder-nombre").forEach(inp => {
      inp.addEventListener("change", ev => {
        this._estado.nuevo.poderes[parseInt(ev.currentTarget.dataset.idx)].nombre = ev.target.value;
      });
    });
    el.querySelectorAll(".poder-vm").forEach(inp => {
      inp.addEventListener("change", ev => {
        this._estado.nuevo.poderes[parseInt(ev.currentTarget.dataset.idx)].vm = parseInt(ev.target.value) || 0;
      });
    });
    el.querySelectorAll(".poder-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this._estado.nuevo.poderes.splice(parseInt(ev.currentTarget.dataset.idx), 1);
        this.render();
      });
    });

    this._dropzone(el, ".debilidades-dropzone", async ev => {
      if (this._estado.nuevo.debilidades.length >= 2) { ui.notifications.warn("Máximo 2 debilidades."); return; }
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Item") return;
      const item = await fromUuid(data.uuid);
      if (!item || item.type !== "caracteristicaBestiario") { ui.notifications.warn("Suelta un Rasgo de Bestiario."); return; }
      this._estado.nuevo.debilidades.push({ nombre: item.name });
      this.render();
    });
    el.querySelector(".debilidad-add")?.addEventListener("click", async () => {
      if (this._estado.nuevo.debilidades.length >= 2) { ui.notifications.warn("Máximo 2 debilidades."); return; }
      const item = await Item.create({ name: "Nueva debilidad", type: "caracteristicaBestiario", system: { tipo: "debilidad" } });
      if (!item) return;
      const sheet = item.sheet;
      const wizard = this;
      const origClose = sheet.close.bind(sheet);
      sheet.close = async function(...args) {
        const fresh = game.items.get(item.id);
        if (fresh) { wizard._estado.nuevo.debilidades.push({ nombre: fresh.name, _itemData: fresh.toObject() }); await fresh.delete(); }
        wizard.render();
        return origClose(...args);
      };
      sheet.render(true);
    });
    el.querySelectorAll(".debilidad-nombre").forEach(inp => {
      inp.addEventListener("change", ev => {
        this._estado.nuevo.debilidades[parseInt(ev.currentTarget.dataset.idx)].nombre = ev.target.value;
      });
    });
    el.querySelectorAll(".debilidad-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this._estado.nuevo.debilidades.splice(parseInt(ev.currentTarget.dataset.idx), 1);
        this.render();
      });
    });
  }

  _setupPaso3(el) {
    el.querySelectorAll(".tq-radio-btn[data-vinculo]").forEach(span => {
      span.addEventListener("click", () => { this._estado.tipoVinculo = span.dataset.vinculo; this.render(); });
    });
    el.querySelector(".tirar-invocacion")?.addEventListener("click", async () => {
      const dif = this._demonioEfectivo()?.espiritu ?? 0;
      const res = await TQRoll.dialogoTirada("Invocación — Espíritu", this._estado.hechiceroEspiritu, {
        dificultadForzada: dif,
        actor: this._estado.hechiceroId ? game.actors.get(this._estado.hechiceroId) : null
      });
      if (res == null) return;
      this._estado.resultadoHechicero = res.total;
      this._estado.vinculoExitoso = res.exitos >= 0;
      this.render();
    });
  }

  _setupPaso4(el) {
    this._dropzone(el, ".objeto-dropzone", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Item") return;
      const item = await fromUuid(data.uuid);
      if (!item) return;
      this._estado.objeto = { nombre: item.name, nombreFinal: item.name, tipoObjeto: item.type, uuid: data.uuid };
      this.render();
    });
    el.querySelector(".objeto-limpiar")?.addEventListener("click", () => { this._estado.objeto = null; this.render(); });
    el.querySelector("[name=objetoNombreFinal]")?.addEventListener("change", ev => {
      if (this._estado.objeto) this._estado.objeto.nombreFinal = ev.target.value.trim() || this._estado.objeto.nombre;
    });
  }

  _setupPaso5(el) {
    el.querySelectorAll(".tq-radio-btn[data-poder]").forEach(span => {
      span.addEventListener("click", () => {
        this._estado.poderes[span.dataset.poder] = !this._estado.poderes[span.dataset.poder];
        this.render();
      });
    });

    this._dropzone(el, ".hab-clave-dropzone", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Item") return;
      const item = await fromUuid(data.uuid);
      if (!item || item.type !== "habilidad") { ui.notifications.warn("Suelta un item de tipo Habilidad."); return; }
      this._estado.poderes.bonoHabilidadClave = item.name;
      this._estado.poderes.bonoHabilidadClaveSistema = item.system?.clave ?? "";
      this.render();
    });
    el.querySelector(".hab-clave-limpiar")?.addEventListener("click", () => { this._estado.poderes.bonoHabilidadClave = ""; this.render(); });

    el.querySelector("[name=poder_bonoDanho]")?.addEventListener("change", ev => { this._estado.poderes.bonoDanho = parseInt(ev.target.value) || 0; this.render(); });
    el.querySelector("[name=poder_bonoHabilidad]")?.addEventListener("change", ev => { this._estado.poderes.bonoHabilidad = parseInt(ev.target.value) || 0; this.render(); });
    el.querySelector("[name=poder_bonoHabilidadClave]")?.addEventListener("change", ev => { this._estado.poderes.bonoHabilidadClave = ev.target.value.trim(); });
    el.querySelector("[name=poder_proteccion]")?.addEventListener("change", ev => { this._estado.poderes.proteccion = parseInt(ev.target.value) || 0; this.render(); });

    this._dropzone(el, ".conjuros-dropzone", async ev => {
      let data;
      try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
      if (data.type !== "Item") return;
      const item = await fromUuid(data.uuid);
      if (!item || item.type !== "hechizo") { ui.notifications.warn("Suelta un item de tipo Hechizo."); return; }
      const dif = [10, 15, 20, 25].includes(item.system?.dificultad) ? item.system.dificultad : 15;
      this._estado.poderes.conjuros.push({ nombre: item.name, dificultad: dif, uuid: data.uuid });
      this.render();
    });
    el.querySelector(".conjuro-add")?.addEventListener("click", () => {
      const nombre = el.querySelector("[name=conjuroNombre]")?.value?.trim();
      const dif = parseInt(el.querySelector("[name=conjuroDificultad]")?.value) || 10;
      if (!nombre) { ui.notifications.warn("Introduce el nombre del conjuro."); return; }
      this._estado.poderes.conjuros.push({ nombre, dificultad: dif });
      const inp = el.querySelector("[name=conjuroNombre]");
      if (inp) inp.value = "";
      this.render();
    });
    el.querySelectorAll(".conjuro-borrar").forEach(a => {
      a.addEventListener("click", ev => {
        this._estado.poderes.conjuros.splice(parseInt(ev.currentTarget.dataset.idx), 1);
        this.render();
      });
    });
  }

  async _finalizar() {
    const e = this._estado;
    const demonio = this._demonioEfectivo();

    if (e.modoOrigen === "descubrir" && e.nuevo.nombre) {
      const n = e.nuevo;
      const atr = this._calcularAtr();
      const habilidadesObj = {};
      for (const h of n.habilidades) { if (h.nombre) habilidadesObj[h.nombre] = h.puntos || 0; }

      const actorCreado = await Actor.create({
        name: n.nombre, type: "demonio", img: "icons/svg/mystery-man.svg",
        system: {
          caracteristicas: {
            espiritu: { valor: n.esp },
            cuerpo: { valor: n.cue },
            mente: { valor: n.men },
            tamano: { valor: n.tam },
            atractivo: { valor: atr ?? 0 }
          },
          proteccion: { valor: n.armaduraValor, tipo: n.armaduraTipo },
          valorMagico: n.esp,
          habilidades: habilidadesObj,
        }
      });

      if (actorCreado) {
        const itemsToCreate = [];
        if (n.armaduraValor > 0) {
          itemsToCreate.push({ name: "Armadura natural", type: "armadura", system: { proteccion: n.armaduraValor, tipo: n.armaduraTipo, zona: "cuerpo", equipped: true } });
        }
        for (const p of n.poderes) {
          if (!p.nombre) continue;
          if (p.uuid) {
            const src = await fromUuid(p.uuid);
            if (src) { itemsToCreate.push(src.toObject()); continue; }
          }
          if (p._itemData) {
            const data = foundry.utils.deepClone(p._itemData);
            data.system.vm = p.vm || data.system.vm;
            itemsToCreate.push(data);
            continue;
          }
          itemsToCreate.push({ name: p.nombre, type: "caracteristicaBestiario", system: { tipo: "rasgo", vm: p.vm || 0 } });
        }
        for (const d of n.debilidades) {
          if (!d.nombre) continue;
          if (d.uuid) {
            const src = await fromUuid(d.uuid);
            if (src) { itemsToCreate.push(src.toObject()); continue; }
          }
          if (d._itemData) {
            itemsToCreate.push(foundry.utils.deepClone(d._itemData));
            continue;
          }
          itemsToCreate.push({ name: d.nombre, type: "caracteristicaBestiario", system: { tipo: "debilidad" } });
        }
        if (itemsToCreate.length) await actorCreado.createEmbeddedDocuments("Item", itemsToCreate);
        if (demonio) demonio.actorId = actorCreado.id;
        actorCreado.sheet.render(true);
      }
    }

    if (e.objeto) {
      const p = e.poderes;
      const sourceType = e.objeto.tipoObjeto;
      const targetType = ["arma", "armadura"].includes(sourceType) ? sourceType : "objeto";
      const sourceItem = e.objeto.uuid ? await fromUuid(e.objeto.uuid) : null;
      const sourceSystem = sourceItem ? foundry.utils.deepClone(sourceItem.system) : {};

      if (p.bonoDanho && targetType === "arma") {
        const base = sourceSystem.danoArma ?? "0";
        const baseNum = parseInt(base);
        sourceSystem.danoArma = (!isNaN(baseNum) && String(baseNum) === base.trim())
          ? String(baseNum + p.bonoDanho)
          : `${base}+${p.bonoDanho}`;
      }

      if (p.proteccion) {
        if (targetType === "armadura") {
          sourceSystem.proteccion = (sourceSystem.proteccion ?? 0) + p.proteccion;
        } else if (targetType === "arma") {
          const baseProt = sourceSystem.tieneProteccion ? (sourceSystem.proteccionValor ?? 0) : 0;
          sourceSystem.tieneProteccion = true;
          sourceSystem.proteccionValor = baseProt + p.proteccion;
        }
      }

      const conjurosResueltos = [];
      for (const c of p.conjuros) {
        let hechizo = null;
        if (c.uuid) {
          hechizo = await fromUuid(c.uuid).catch(() => null);
        }
        if (!hechizo) {
          for (const pack of game.packs) {
            if (pack.metadata.type !== "Item") continue;
            const idx = await pack.getIndex({ fields: ["type"] });
            const entry = idx.find(e => e.name === c.nombre && e.type === "hechizo");
            if (entry) { hechizo = await pack.getDocument(entry._id); break; }
          }
        }
        const resolved = { nombre: c.nombre, dificultad: c.dificultad };
        if (hechizo) {
          if (hechizo.system.pmCoste) resolved.pmCoste = hechizo.system.pmCoste;
          if (hechizo.system.pmMax > hechizo.system.pmCoste) resolved.pmMax = hechizo.system.pmMax;
          if (hechizo.system.verbo) resolved.verbo = hechizo.system.verbo;
          if (hechizo.system.esfera) resolved.esfera = hechizo.system.esfera;
          if (hechizo.system.duracion) resolved.duracion = hechizo.system.duracion;
          if (hechizo.system.requiereTiradaEspiritu) resolved.requiereTiradaEspiritu = hechizo.system.requiereTiradaEspiritu;
        }
        conjurosResueltos.push(resolved);
      }

      const demonioFields = {
        esDemoniaco: true,
        demonioNombre: demonio?.nombre ?? "",
        demonioActorId: demonio?.actorId ?? "",
        creadoPor: e.hechiceroNombre,
        vm: demonio?.espiritu ?? 0,
        bonoDanho: p.bonoDanho,
        bonoHabilidad: p.bonoHabilidad,
        bonoHabilidadClave: p.bonoHabilidadClave,
        bonoHabilidadClaveSistema: p.bonoHabilidadClaveSistema,
        danhoMagico: p.danhoMagico,
        danhoEspiritual: p.danhoEspiritual,
        vampiro: p.vampiro,
        irrompible: p.irrompible,
        demonioProteccion: p.proteccion,
        salvaguardaFuego: p.salvaguardaFuego,
        salvaguardaArmas: p.salvaguardaArmas,
        conjuros: conjurosResueltos,
        pmPropios: p.pmPropios,
        pm: p.pmPropios ? (demonio?.espiritu ?? 0) : 0,
      };

      await Item.create({
        name: e.objeto.nombreFinal || e.objeto.nombre,
        type: targetType,
        img: sourceItem?.img ?? "icons/svg/item-bag.svg",
        system: { ...sourceSystem, ...demonioFields }
      });
    }

    const vinculo = e.tipoVinculo === "convocacion" ? "Convocación" : (e.vinculoExitoso ? "Invocación (éxito)" : "Invocación (fracaso)");
    ui.notifications.info(`${demonio?.nombre ?? "Demonio"} — ${vinculo} registrada.`);
    this.close();
  }
}
