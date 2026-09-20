const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const TIPOS_MOV = ["Andar", "Correr", "Nadar", "Trepar", "Volar", "Escalar"];
const VELOCIDADES = ["lento", "normal", "rapido"];

export class AutomataCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "tq-creator"],
    position: { width: 560, height: 580 },
    window: { title: "Creador de Autómata de la Ley", resizable: true },
    form: { submitOnChange: false, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/automata-creator.hbs", scrollable: [".tq-creator-body"] }
  };

  _paso = 1;

  _estado = {
    nombre: "", teaurgoId: null, teaurgoNombre: "", teaurgoNombreManual: "", teaurgoMente: 0, teaurgoMenteManual: 0,
    vmDisponible: 0, poolHabilidades: 0,
    caracteristicaPrincipal: "cuerpo", cuerpo: 0, mente: 0, tamano: 0,
    habilidades: [],
    movimientos: [{ tipo: "Andar", velocidad: "lento" }],
    mejoras: { cuerpo: 0, mente: 0, tamano: 0, atractivo: 0, armadura: 0 },
    boostsHab: {},
    poderes: [],
    debilidades: [],
    espiritu: 0
  };

  static open() { return new AutomataCreator().render(true); }

  async _prepareContext() {
    const estado = this._estado;
    const actores = game.actors
      .filter(a => ["pj", "pnj"].includes(a.type))
      .map(a => ({ id: a.id, name: a.name, mente: a.system.caracteristicas?.mente?.valor ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const vmDebilidades = estado.debilidades.length;
    const vmEfectivo = estado.vmDisponible + vmDebilidades;
    const vmGastado = this._vmTotal();
    const vmRestante = vmEfectivo - vmGastado;
    const poolGastado = estado.habilidades.reduce((acc, h) => acc + (h.nivel || 0), 0);
    const armaduraBase = Math.floor((estado.cuerpo || 0) / 2);

    const pasos = [
      { num: 1, label: "Base" }, { num: 2, label: "Stats" }, { num: 3, label: "Habilidades" },
      { num: 4, label: "VM" }, { num: 5, label: "Virtud" }, { num: 6, label: "Resumen" }
    ].map(p => ({ ...p, activo: p.num === this._paso, completado: p.num < this._paso }));

    const vmLibre = vmEfectivo - this._vmMovimiento() - this._vmMejoras() - this._vmPoderes();
    const boostsPuntos = Object.values(estado.boostsHab).reduce((acc, v) => acc + (v || 0), 0);

    return {
      paso: this._paso, paso1: this._paso === 1, paso2: this._paso === 2,
      paso3: this._paso === 3, paso4: this._paso === 4, paso5: this._paso === 5, paso6: this._paso === 6,
      pasos, estado, actores, vmDebilidades, vmEfectivo, vmGastado, vmRestante, armaduraBase,
      poolGastado, poolRestante: estado.poolHabilidades - poolGastado,
      tiposMov: TIPOS_MOV, velocidades: VELOCIDADES,
      vmMov: this._vmMovimiento(), vmMejoras: this._vmMejoras(),
      vmBoosts: this._vmBoosts(), vmPoderes: this._vmPoderes(),
      puntosBoostDisponibles: vmLibre * 3 - boostsPuntos,
      cuerpoFinal: (estado.cuerpo || 0) + (estado.mejoras.cuerpo || 0),
      menteFinal: (estado.mente || 0) + (estado.mejoras.mente || 0),
      tamanoFinal: (estado.tamano || 0) + (estado.mejoras.tamano || 0),
      armaduraFinal: armaduraBase + (estado.mejoras.armadura || 0),
      coste: estado.vmDisponible * 1000,
      movimientoStr: estado.movimientos.map(m => `${m.tipo}, ${m.velocidad}`).join(". ") + (estado.movimientos.length ? "." : ""),
      habilidadesResumen: estado.habilidades.map(h => ({ nombre: h.nombre, nivel: (h.nivel || 0) + (estado.boostsHab[h.nombre] || 0) }))
    };
  }

  _vmMovimiento() {
    let vm = 0;
    for (const [i, m] of this._estado.movimientos.entries()) {
      if (i > 0) vm += 1;
      if (m.velocidad === "normal") vm += 1;
      if (m.velocidad === "rapido") vm += 2;
    }
    return vm;
  }

  _vmMejoras() { return Object.values(this._estado.mejoras).reduce((acc, v) => acc + (v || 0), 0); }
  _vmBoosts() { return Math.floor(Object.values(this._estado.boostsHab).reduce((acc, v) => acc + (v || 0), 0) / 3); }
  _vmPoderes() { return this._estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0); }
  _vmTotal() { return this._vmMovimiento() + this._vmMejoras() + this._vmBoosts() + this._vmPoderes(); }

  _guardarPaso1(el) {
    this._estado.nombre = el.querySelector("[name=nombre]")?.value?.trim() ?? this._estado.nombre;
    this._estado.teaurgoNombreManual = el.querySelector("[name=teaurgoNombreManual]")?.value?.trim() ?? "";
    this._estado.teaurgoMenteManual = parseInt(el.querySelector("[name=teaurgoMenteManual]")?.value) || 0;
    const sel = el.querySelector("[name=teaurgoId]");
    if (sel?.value) {
      this._estado.teaurgoId = sel.value;
      const actor = game.actors.get(sel.value);
      this._estado.teaurgoNombre = actor?.name ?? "";
      this._estado.teaurgoMente = actor?.system.caracteristicas?.mente?.valor ?? 0;
      this._estado.vmDisponible = this._estado.teaurgoMente;
      this._estado.poolHabilidades = this._estado.teaurgoMente * 3;
    } else if (this._estado.teaurgoMenteManual > 0) {
      this._estado.teaurgoId = null;
      this._estado.vmDisponible = this._estado.teaurgoMenteManual;
      this._estado.poolHabilidades = this._estado.teaurgoMenteManual * 3;
    }
  }

  _guardarPaso4(el) {
    for (const key of ["cuerpo", "mente", "tamano", "atractivo", "armadura"]) {
      const input = el.querySelector(`[name="mejora-${key}"]`);
      if (input) this._estado.mejoras[key] = Math.max(0, parseInt(input.value) || 0);
    }
    for (const h of this._estado.habilidades) {
      const input = el.querySelector(`[name="boost-${h.nombre}"]`);
      if (input) this._estado.boostsHab[h.nombre] = Math.max(0, parseInt(input.value) || 0);
    }
    for (const [i, m] of this._estado.movimientos.entries()) {
      const tipoSel = el.querySelector(`[name="mov-tipo-${i}"]`);
      const velSel = el.querySelector(`[name="mov-vel-${i}"]`);
      if (tipoSel) m.tipo = tipoSel.value;
      if (velSel) m.velocidad = velSel.value;
    }
  }

  _guardarPasoActual(el) {
    if (this._paso === 1) this._guardarPaso1(el);
    if (this._paso === 4) this._guardarPaso4(el);
  }

  _validarPasoActual(el) {
    if (this._paso === 1) {
      this._guardarPaso1(el);
      if (!this._estado.nombre) { ui.notifications.warn("Introduce un nombre para el autómata."); return false; }
      if (!this._estado.teaurgoId) {
        if (!this._estado.teaurgoNombreManual) { ui.notifications.warn("Selecciona el teúrgo creador o introduce su nombre manualmente."); return false; }
        if (!this._estado.teaurgoMenteManual) { ui.notifications.warn("Introduce el valor de Mente del teúrgo creador."); return false; }
      }
    }
    if (this._paso === 2) {
      if (!this._estado.cuerpo || !this._estado.mente) { ui.notifications.warn("Tira todas las características antes de continuar."); return false; }
    }
    if (this._paso === 4) {
      this._guardarPaso4(el);
      const vmEfectivo = this._estado.vmDisponible + this._estado.debilidades.length;
      if (this._vmTotal() > vmEfectivo) { ui.notifications.warn("Has gastado más VM del disponible."); return false; }
    }
    return true;
  }

  _actualizarPoolDisplay(el) {
    const gastado = this._estado.habilidades.reduce((acc, h) => acc + (h.nivel || 0), 0);
    const restante = this._estado.poolHabilidades - gastado;
    const span = el.querySelector(".pool-restante");
    if (span) { span.textContent = restante; span.classList.toggle("tq-rojo", restante < 0); }
  }

  _actualizarVMDisplay() {
    const el = this.element;
    const gastado = this._vmTotal();
    const vmEfectivo = this._estado.vmDisponible + this._estado.debilidades.length;
    const restante = vmEfectivo - gastado;
    const spanG = el?.querySelector(".vm-gastado");
    if (spanG) spanG.textContent = gastado;
    const spanR = el?.querySelector(".vm-restante");
    if (spanR) { spanR.textContent = restante; spanR.classList.toggle("tq-rojo", restante < 0); }
  }

  _actualizarBoostDisplay(el) {
    const estado = this._estado;
    const totalPuntos = Object.values(estado.boostsHab).reduce((acc, v) => acc + (v || 0), 0);
    const vmEfectivo = estado.vmDisponible + estado.debilidades.length;
    const disponibles = (vmEfectivo - this._vmMovimiento() - this._vmMejoras() - this._vmPoderes()) * 3 - totalPuntos;
    const span = el.querySelector(".boost-pts-restante");
    if (span) { span.textContent = disponibles; span.classList.toggle("tq-rojo", disponibles < 0); }
  }

  _vmDisplay(vm) {
    const span = document.createElement("span");
    span.className = "vm-display tq-valor-grande";
    span.textContent = vm;
    return span;
  }

  _poolDisplay(pool) {
    const span = document.createElement("span");
    span.className = "pool-display tq-valor-grande";
    span.textContent = pool;
    return span;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    el.querySelector(".creator-prev")?.addEventListener("click", () => {
      this._guardarPasoActual(el);
      this._paso--;
      this.render();
    });

    el.querySelector(".creator-next")?.addEventListener("click", () => {
      if (!this._validarPasoActual(el)) return;
      this._guardarPasoActual(el);
      this._paso++;
      this.render();
    });

    el.querySelector(".creator-crear")?.addEventListener("click", () => this._crearAutomata());

    if (this._paso === 1) {
      el.querySelector("[name=teaurgoId]")?.addEventListener("change", ev => {
        const actor = game.actors.get(ev.target.value);
        if (!actor) return;
        this._estado.teaurgoId = actor.id;
        this._estado.teaurgoNombre = actor.name;
        this._estado.teaurgoMente = actor.system.caracteristicas?.mente?.valor ?? 0;
        this._estado.vmDisponible = this._estado.teaurgoMente;
        this._estado.poolHabilidades = this._estado.teaurgoMente * 3;
        el.querySelector(".vm-display")?.replaceWith(this._vmDisplay(this._estado.vmDisponible));
        el.querySelector(".pool-display")?.replaceWith(this._poolDisplay(this._estado.poolHabilidades));
      });

      el.querySelector("[name=teaurgoMenteManual]")?.addEventListener("input", ev => {
        if (this._estado.teaurgoId) return;
        const mente = parseInt(ev.target.value) || 0;
        this._estado.teaurgoMenteManual = mente;
        const wasZero = this._estado.vmDisponible === 0;
        this._estado.vmDisponible = mente;
        this._estado.poolHabilidades = mente * 3;
        if (wasZero && mente > 0) {
          this._guardarPaso1(el);
          this.render();
        } else {
          const vmDisplay = el.querySelector(".vm-display");
          const poolDisplay = el.querySelector(".pool-display");
          if (vmDisplay) vmDisplay.textContent = mente;
          if (poolDisplay) poolDisplay.textContent = mente * 3;
        }
      });
    }

    if (this._paso === 2) {
      el.querySelectorAll(".tq-radio-btn").forEach(span => {
        span.addEventListener("click", () => {
          this._estado.caracteristicaPrincipal = span.dataset.principal;
          this.render();
        });
      });

      el.querySelector(".tirar-cuerpo")?.addEventListener("click", async () => {
        const formula = this._estado.caracteristicaPrincipal === "cuerpo" ? "1d10+2" : "1d6+2";
        const roll = await new Roll(formula).evaluate();
        this._estado.cuerpo = roll.total;
        this.render();
      });
      el.querySelector(".tirar-mente")?.addEventListener("click", async () => {
        const formula = this._estado.caracteristicaPrincipal === "mente" ? "1d10+2" : "1d6+2";
        const roll = await new Roll(formula).evaluate();
        this._estado.mente = roll.total;
        this.render();
      });
      el.querySelector(".tirar-tamano")?.addEventListener("click", async () => {
        const roll = await new Roll("1d6-1d6").evaluate();
        this._estado.tamano = roll.total;
        this.render();
      });
    }

    if (this._paso === 3) {
      el.querySelector(".hab-anadir")?.addEventListener("click", async () => {
        const { DialogV2 } = foundry.applications.api;
        const nombre = await DialogV2.prompt({
          window: { title: "Añadir habilidad" },
          content: `<input type="text" name="nombre" placeholder="Nombre de la habilidad" autofocus />`,
          ok: { label: "Añadir", callback: (_ev, btn) => btn.form.elements.nombre.value.trim() }
        }).catch(() => null);
        if (!nombre) return;
        if (this._estado.habilidades.some(h => h.nombre === nombre)) return;
        this._estado.habilidades.push({ nombre, nivel: 0 });
        this.render();
      });

      el.querySelectorAll(".hab-nivel").forEach(input => {
        input.addEventListener("change", ev => {
          const nombre = ev.currentTarget.dataset.nombre;
          const h = this._estado.habilidades.find(h => h.nombre === nombre);
          if (h) h.nivel = Math.max(0, parseInt(ev.currentTarget.value) || 0);
          this._actualizarPoolDisplay(el);
        });
      });

      el.querySelectorAll(".hab-borrar").forEach(a => {
        a.addEventListener("click", ev => {
          const nombre = ev.currentTarget.dataset.nombre;
          this._estado.habilidades = this._estado.habilidades.filter(h => h.nombre !== nombre);
          this.render();
        });
      });

      const habDropzone = el.querySelector(".hab-dropzone");
      if (habDropzone) {
        habDropzone.addEventListener("dragover", ev => { ev.preventDefault(); habDropzone.classList.add("drag-over"); });
        habDropzone.addEventListener("dragleave", () => habDropzone.classList.remove("drag-over"));
        habDropzone.addEventListener("drop", async ev => {
          ev.preventDefault();
          habDropzone.classList.remove("drag-over");
          let data;
          try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
          const item = await fromUuid(data.uuid);
          if (!item || item.type !== "habilidad") { ui.notifications.warn("Solo se pueden añadir items de tipo Habilidad."); return; }
          if (this._estado.habilidades.some(h => h.nombre === item.name)) return;
          this._estado.habilidades.push({ nombre: item.name, nivel: 0 });
          this.render();
        });
      }
    }

    if (this._paso === 4) {
      this._actualizarVMDisplay();

      el.querySelector(".mov-anadir")?.addEventListener("click", () => {
        this._guardarPaso4(el);
        this._estado.movimientos.push({ tipo: "Andar", velocidad: "lento" });
        this._actualizarVMDisplay();
        this.render();
      });
      el.querySelectorAll(".mov-borrar").forEach(a => {
        a.addEventListener("click", ev => {
          const idx = parseInt(ev.currentTarget.dataset.idx);
          if (idx === 0) return;
          this._guardarPaso4(el);
          this._estado.movimientos.splice(idx, 1);
          this._actualizarVMDisplay();
          this.render();
        });
      });

      el.querySelectorAll("[name^='mejora-'],[name^='boost-']").forEach(input => {
        input.addEventListener("change", () => {
          this._guardarPaso4(el);
          this._actualizarVMDisplay();
          this._actualizarBoostDisplay(el);
        });
      });
      el.querySelectorAll("[name^='mov-']").forEach(sel => {
        sel.addEventListener("change", () => {
          this._guardarPaso4(el);
          this._actualizarVMDisplay();
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
          if (!item || item.type !== "caracteristicaBestiario" || item.system.tipo !== "rasgo") {
            ui.notifications.warn("Solo se pueden añadir Rasgos / Poderes del compendio de Bestiario.");
            return;
          }
          if (this._estado.poderes.some(p => p.uuid === data.uuid)) return;
          const vm = item.system.vm || 1;
          const vmRestante = this._estado.vmDisponible + this._estado.debilidades.length - this._vmTotal();
          if (vm > vmRestante) { ui.notifications.warn(`VM insuficiente. Necesitas ${vm} VM pero solo quedan ${vmRestante}.`); return; }
          this._guardarPaso4(el);
          this._estado.poderes.push({ nombre: item.name, vm, uuid: data.uuid });
          this._actualizarVMDisplay();
          this.render();
        });
      }

      const capturarItemTemporal = async (datos, onCapturar) => {
        const item = await Item.create(datos);
        if (!item) return;
        const sheet = item.sheet;
        if (!sheet) return;
        let capturado = false;
        const closeOriginal = sheet.close.bind(sheet);
        sheet.close = async (...args) => {
          const r = await closeOriginal(...args);
          if (!capturado) {
            capturado = true;
            const live = game.items.get(item.id);
            if (live) { onCapturar(live); await live.delete(); }
          }
          return r;
        };
        await sheet.render(true);
      };

      el.querySelector(".poder-anadir")?.addEventListener("click", () => {
        capturarItemTemporal({ name: "Nuevo Rasgo", type: "caracteristicaBestiario", system: { tipo: "rasgo", vm: 1 } }, (live) => {
          const vm = live.system.vm || 0;
          const vmRestante = this._estado.vmDisponible + this._estado.debilidades.length - this._vmTotal();
          if (vm > vmRestante) { ui.notifications.warn(`VM insuficiente. Necesitas ${vm} VM pero solo quedan ${vmRestante}.`); return; }
          this._guardarPaso4(el);
          this._estado.poderes.push({ nombre: live.name, vm, uuid: null, _itemData: live.toObject() });
          this._actualizarVMDisplay();
          this.render();
        });
      });

      el.querySelectorAll(".poder-borrar").forEach(a => {
        a.addEventListener("click", ev => {
          this._guardarPaso4(el);
          this._estado.poderes.splice(parseInt(ev.currentTarget.dataset.idx), 1);
          this._actualizarVMDisplay();
          this.render();
        });
      });

      el.querySelector(".debilidad-anadir")?.addEventListener("click", () => {
        capturarItemTemporal({ name: "Nueva Debilidad", type: "caracteristicaBestiario", system: { tipo: "debilidad" } }, (live) => {
          if (this._estado.debilidades.some(d => d.nombre === live.name)) return;
          this._guardarPaso4(el);
          this._estado.debilidades.push({ nombre: live.name, uuid: null, _itemData: live.toObject() });
          this.render();
        });
      });

      el.querySelectorAll(".debilidad-borrar").forEach(a => {
        a.addEventListener("click", ev => {
          this._guardarPaso4(el);
          this._estado.debilidades.splice(parseInt(ev.currentTarget.dataset.idx), 1);
          this.render();
        });
      });

      const debDropzone = el.querySelector(".debilidades-dropzone");
      if (debDropzone) {
        debDropzone.addEventListener("dragover", ev => { ev.preventDefault(); debDropzone.classList.add("drag-over"); });
        debDropzone.addEventListener("dragleave", () => debDropzone.classList.remove("drag-over"));
        debDropzone.addEventListener("drop", async ev => {
          ev.preventDefault();
          debDropzone.classList.remove("drag-over");
          let data;
          try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
          if (data.type !== "Item") return;
          const item = await fromUuid(data.uuid);
          if (!item || item.type !== "caracteristicaBestiario" || item.system.tipo !== "debilidad") {
            ui.notifications.warn("Solo se pueden añadir Debilidades del compendio de Bestiario.");
            return;
          }
          if (this._estado.debilidades.some(d => d.nombre === item.name)) return;
          this._guardarPaso4(el);
          this._estado.debilidades.push({ nombre: item.name, uuid: data.uuid });
          this.render();
        });
      }

      el.querySelector(".debilidad-aleatoria")?.addEventListener("click", async () => {
        const n = Math.max(1, parseInt(el.querySelector(".debilidad-aleatoria-num")?.value) || 1);
        const tablaPack = game.packs.get("tierras-quebradas.tablas-sucesos");
        let tabla = null;
        if (tablaPack) {
          const docs = await tablaPack.getDocuments();
          tabla = docs.find(t => t.name === "Debilidades de Bestiario");
        }
        if (!tabla) tabla = game.tables.getName("Debilidades de Bestiario");
        if (!tabla) { ui.notifications.warn("No se encontró la tabla 'Debilidades de Bestiario'."); return; }

        const packBestiario = game.packs.get("tierras-quebradas.rasgos-bestiario");
        let debCache = null;
        const getDebCache = async () => {
          if (debCache) return debCache;
          debCache = new Map();
          const docs = packBestiario ? await packBestiario.getDocuments() : [];
          for (const d of docs) debCache.set(d.name, d);
          return debCache;
        };
        const resolver = async (result) => {
          if (result.documentCollection) {
            const pack = game.packs.get(result.documentCollection);
            const item = pack ? await pack.getDocument(result.documentId).catch(() => null) : null;
            if (item) return item;
          }
          const texto = result.text?.trim();
          if (!texto) return null;
          const cache = await getDebCache();
          return cache.get(texto) ?? cache.get(texto.split(":")[0].trim()) ?? null;
        };

        const yaPresentes = new Set(this._estado.debilidades.map(d => d.nombre));
        for (let i = 0; i < n; i++) {
          const draw = await tabla.draw({ displayChat: false });
          for (const result of draw.results) {
            const item = await resolver(result);
            const nombre = item?.name ?? result.text?.split(":")[0].trim();
            if (!nombre || yaPresentes.has(nombre)) continue;
            yaPresentes.add(nombre);
            this._estado.debilidades.push({ nombre, uuid: item?.uuid ?? null });
          }
        }
        this._guardarPaso4(el);
        this.render();
      });
    }

    if (this._paso === 5) {
      el.querySelector(".tirar-espiritu")?.addEventListener("click", async () => {
        const roll = await new Roll("1d6+2").evaluate();
        this._estado.espiritu = roll.total;
        this.render();
      });
    }
  }

  async _crearAutomata() {
    this._guardarPaso4(this.element);
    const estado = this._estado;
    const habilidadesObj = {};
    for (const h of estado.habilidades) {
      const boost = estado.boostsHab[h.nombre] ?? 0;
      habilidadesObj[h.nombre] = { base: "cuerpo", nivel: (h.nivel || 0) + boost, puntosFijos: 0, estorbo: 0 };
    }

    const cuerpoFinal = (estado.cuerpo || 0) + (estado.mejoras.cuerpo || 0);
    const menteFinal = (estado.mente || 0) + (estado.mejoras.mente || 0);
    const tamanoFinal = (estado.tamano || 0) + (estado.mejoras.tamano || 0);
    const armaduraFinal = Math.floor(cuerpoFinal / 2) + (estado.mejoras.armadura || 0);
    const movStr = estado.movimientos.map(m => `${m.tipo}, ${m.velocidad}`).join(". ") + ".";

    const actor = await Actor.create({
      name: estado.nombre || "Nuevo Autómata",
      type: "automata",
      system: {
        caracteristicas: {
          cuerpo: { valor: cuerpoFinal },
          mente: { valor: menteFinal },
          espiritu: { valor: estado.espiritu },
          atractivo: { valor: estado.mejoras.atractivo || 0 },
          tamano: { valor: tamanoFinal }
        },
        habilidades: habilidadesObj,
        valorMagico: estado.vmDisponible,
        coste: estado.vmDisponible * 1000,
        creador: estado.teaurgoNombre || estado.teaurgoNombreManual || "",
        proteccion: { valor: armaduraFinal, tipo: "dura" },
        alImpacto: 0,
        movimiento: movStr,
        notas: ""
      }
    });

    if (!actor) return;

    const itemsToCreate = [{
      name: "Cuerpo del autómata",
      type: "armadura",
      system: { proteccion: armaduraFinal, tipo: "dura", zona: "cuerpo", equipped: true }
    }];

    for (const p of estado.poderes) {
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
      itemsToCreate.push({ name: p.nombre, type: "caracteristicaBestiario", system: { tipo: "rasgo", vm: p.vm } });
    }

    for (const d of estado.debilidades) {
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

    await actor.createEmbeddedDocuments("Item", itemsToCreate);
    this.close();
    actor.sheet.render(true);
  }
}
