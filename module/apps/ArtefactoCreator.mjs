import { TQRoll } from "../rolls/TQRoll.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

function difToVM(dificultad) {
  if (dificultad <= 10) return 1;
  if (dificultad <= 15) return 2;
  if (dificultad <= 20) return 3;
  return 4;
}

export class ArtefactoCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "tq-creator"],
    position: { width: 500, height: 520 },
    window: { title: "Creador de Artefacto", resizable: true },
    form: { submitOnChange: false, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/artefacto-creator.hbs", scrollable: [".tq-creator-body"] }
  };

  _paso = 1;

  _estado = {
    nombre: "", objetoBase: null, teaurgoId: null, teaurgoNombre: "", teaurgoNombreManual: "", teaurgoMente: 0, teaurgoMenteManual: 0, teaurgoAcademiaManual: 0, teaurgoArtesaniaManual: 0,
    vmDisponible: 0, forzarCreacion: false,
    poderes: [], habilidadesSostenidas: [], sosten: "",
    planoAjeno: false, resultadoAcademia: 0, resultadoArtesania: 0,
    mesesConstruccion: 0,
    espiritu: 0,
    descripcion: "", notas: ""
  };

  static open() { return new ArtefactoCreator().render(true); }

  async _prepareContext() {
    const estado = this._estado;
    const actores = game.actors
      .filter(a => ["pj", "pnj"].includes(a.type))
      .map(a => ({ id: a.id, name: a.name, mente: a.system.caracteristicas?.mente?.valor ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const vmGastado = estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0)
      + estado.habilidadesSostenidas.reduce((acc, h) => acc + (h.vm || 0), 0);
    const vmRestante = estado.vmDisponible - vmGastado;

    const pasos = [
      { num: 1, label: "Base" }, { num: 2, label: "Poderes" },
      { num: 3, label: "Fabricación" }, { num: 4, label: "Virtud" },
      { num: 5, label: "Resumen" }, { num: 6, label: "Notas" }
    ].map(p => ({ ...p, activo: p.num === this._paso, completado: p.num < this._paso }));

    const poderHechizos = estado.poderes.map((p, i) => ({ ...p, _idx: i })).filter(p => p.tipo === "hechizo");
    const poderRasgos   = estado.poderes.map((p, i) => ({ ...p, _idx: i })).filter(p => p.tipo === "rasgo");
    const tieneTeaurgo  = !!(estado.teaurgoId || (estado.teaurgoNombreManual && estado.teaurgoMenteManual > 0));
    const difFabricacion = estado.teaurgoMente * 2;
    const academiaAprobada = estado.planoAjeno || (estado.resultadoAcademia > 0 && estado.resultadoAcademia >= difFabricacion);

    return {
      paso: this._paso,
      paso1: this._paso === 1, paso2: this._paso === 2, paso3: this._paso === 3,
      paso4: this._paso === 4, paso5: this._paso === 5, paso6: this._paso === 6,
      pasos, estado, actores, vmGastado, vmRestante,
      poderHechizos, poderRasgos, tieneTeaurgo, academiaAprobada,
      coste: estado.vmDisponible * 1000,
      difFabricacion,
      pmArtefacto: estado.espiritu * 2,
      tipoObjeto: estado.objetoBase?.nombre ?? "",
      objetoBaseStats: estado.objetoBase?._itemData ? { tipoItem: estado.objetoBase.tipo, ...estado.objetoBase._itemData.system } : null
    };
  }

  _guardarPaso1(el) {
    this._estado.nombre = el.querySelector("[name=nombre]")?.value?.trim() ?? this._estado.nombre;
    this._estado.forzarCreacion = el.querySelector("[name=forzarCreacion]")?.checked ?? false;
    this._estado.teaurgoNombreManual = el.querySelector("[name=teaurgoNombreManual]")?.value?.trim() ?? "";
    this._estado.teaurgoMenteManual = parseInt(el.querySelector("[name=teaurgoMenteManual]")?.value) || 0;
    this._estado.teaurgoAcademiaManual = parseInt(el.querySelector("[name=teaurgoAcademiaManual]")?.value) || 0;
    this._estado.teaurgoArtesaniaManual = parseInt(el.querySelector("[name=teaurgoArtesaniaManual]")?.value) || 0;
    const sel = el.querySelector("[name=teaurgoId]");
    if (sel?.value) {
      this._estado.teaurgoId = sel.value;
      const actor = game.actors.get(sel.value);
      this._estado.teaurgoNombre = actor?.name ?? "";
      this._estado.teaurgoMente = actor?.system.caracteristicas?.mente?.valor ?? 0;
      this._estado.vmDisponible = Math.floor(this._estado.teaurgoMente / 2);
    } else if (this._estado.teaurgoMenteManual > 0) {
      this._estado.teaurgoId = null;
      this._estado.teaurgoNombre = "";
      this._estado.teaurgoMente = this._estado.teaurgoMenteManual;
      this._estado.vmDisponible = Math.floor(this._estado.teaurgoMenteManual / 2);
    }
  }

  _guardarPaso2(el) {
    this._estado.sosten = el.querySelector("[name=sosten]")?.value?.trim() ?? this._estado.sosten;
  }

  _guardarPaso3(el) {
    this._estado.planoAjeno = el.querySelector("[name=planoAjeno]")?.checked ?? false;
    this._estado.resultadoAcademia = parseInt(el.querySelector("[name=resultadoAcademia]")?.value) || 0;
    this._estado.resultadoArtesania = parseInt(el.querySelector("[name=resultadoArtesania]")?.value) || 0;
    this._estado.mesesConstruccion = parseInt(el.querySelector("[name=mesesConstruccion]")?.value) || 0;
  }

  _guardarPaso6(el) {
    this._estado.descripcion = el.querySelector("[name=descripcion]")?.value ?? this._estado.descripcion;
    this._estado.notas = el.querySelector("[name=notas]")?.value ?? this._estado.notas;
  }

  _guardarPasoActual(el) {
    if (this._paso === 1) this._guardarPaso1(el);
    if (this._paso === 2) this._guardarPaso2(el);
    if (this._paso === 3) this._guardarPaso3(el);
    if (this._paso === 6) this._guardarPaso6(el);
  }

  _validarPasoActual(el) {
    if (this._paso === 1) {
      this._guardarPaso1(el);
      if (!this._estado.nombre) { ui.notifications.warn("Introduce un nombre para el artefacto."); return false; }
      if (!this._estado.objetoBase) { ui.notifications.warn("Arrastra un objeto como receptáculo físico del artefacto."); return false; }
      const tieneTeaurgo = this._estado.teaurgoId || (this._estado.teaurgoNombreManual && this._estado.teaurgoMenteManual > 0);
      if (!tieneTeaurgo) { ui.notifications.warn("Selecciona el teúrgo creador o introduce su nombre y MEN manualmente."); return false; }
      if (!this._estado.forzarCreacion && this._estado.teaurgoId) {
        const actor = game.actors.get(this._estado.teaurgoId);
        const norm = s => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
        const tieneInspiracion = actor?.items.some(i => i.type === "hechizo" && norm(i.name) === norm("Inspiración tecnológica"));
        if (!tieneInspiracion) { ui.notifications.warn("El teúrgo no dispone del conjuro Inspiración tecnológica."); return false; }
      }
    }
    if (this._paso === 3) {
      this._guardarPaso3(el);
      const dif = this._estado.teaurgoMente * 2;
      const academiaOk = this._estado.planoAjeno || (this._estado.resultadoAcademia > 0 && this._estado.resultadoAcademia >= dif);
      const artesaniaOk = this._estado.resultadoArtesania > 0 && this._estado.resultadoArtesania >= dif;
      if (!academiaOk) { ui.notifications.warn("Debes superar la tirada de Academia (Diseño en papel) antes de continuar."); return false; }
      if (!artesaniaOk) { ui.notifications.warn("Debes superar la tirada de Artesanía (Ensamblaje físico) antes de continuar."); return false; }
    }
    return true;
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

    el.querySelector(".creator-crear")?.addEventListener("click", () => this._crearArtefacto());

    if (this._paso === 1) {
      const actualizarVMDisplay = () => {
        const span = el.querySelector(".vm-display");
        if (span) span.textContent = this._estado.vmDisponible;
      };

      el.querySelector("[name=teaurgoId]")?.addEventListener("change", ev => {
        const actor = game.actors.get(ev.target.value);
        if (!actor) return;
        this._estado.teaurgoId = actor.id;
        this._estado.teaurgoNombre = actor.name;
        this._estado.teaurgoMente = actor.system.caracteristicas?.mente?.valor ?? 0;
        this._estado.vmDisponible = Math.floor(this._estado.teaurgoMente / 2);
        actualizarVMDisplay();
      });

      el.querySelector("[name=teaurgoMenteManual]")?.addEventListener("input", ev => {
        if (el.querySelector("[name=teaurgoId]")?.value) return;
        const men = parseInt(ev.target.value) || 0;
        this._estado.teaurgoMenteManual = men;
        this._estado.teaurgoMente = men;
        this._estado.vmDisponible = Math.floor(men / 2);
        actualizarVMDisplay();
      });

      const dropzoneObjeto = el.querySelector(".objeto-base-dropzone");
      if (dropzoneObjeto) {
        dropzoneObjeto.addEventListener("dragover", ev => { ev.preventDefault(); dropzoneObjeto.classList.add("drag-over"); });
        dropzoneObjeto.addEventListener("dragleave", () => dropzoneObjeto.classList.remove("drag-over"));
        dropzoneObjeto.addEventListener("drop", async ev => {
          ev.preventDefault();
          dropzoneObjeto.classList.remove("drag-over");
          let data;
          try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
          if (data.type !== "Item") return;
          const item = await fromUuid(data.uuid);
          if (!item) return;
          this._guardarPaso1(el);
          this._estado.objetoBase = { nombre: item.name, tipo: item.type, _itemData: item.toObject() };
          this.render();
        });
      }

      el.querySelector(".objeto-base-quitar")?.addEventListener("click", () => {
        this._guardarPaso1(el);
        this._estado.objetoBase = null;
        this.render();
      });

      el.querySelector(".objeto-base-editar")?.addEventListener("click", async () => {
        const ob = this._estado.objetoBase;
        if (!ob?._itemData) return;
        const tempItem = new CONFIG.Item.documentClass(foundry.utils.deepClone(ob._itemData), { temporary: true });
        const sheet = tempItem.sheet;
        if (!sheet) return;
        const origClose = sheet.close.bind(sheet);
        sheet.close = async (...args) => {
          const r = await origClose(...args);
          this._guardarPaso1(this.element);
          this._estado.objetoBase = { ...ob, nombre: tempItem.name, _itemData: tempItem.toObject() };
          this.render();
          return r;
        };
        sheet.render(true);
      });
    }

    if (this._paso === 2) {
      const registrarDropzone = (selector, validar, obtenerVM, labelTipo, obtenerExtra = () => ({})) => {
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
          if (!item || !validar(item)) { ui.notifications.warn(`Solo se pueden añadir ${labelTipo} aquí.`); return; }
          if (this._estado.poderes.some(p => p.uuid === data.uuid)) return;
          const vm = obtenerVM(item);
          const vmGastado = this._estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0)
            + this._estado.habilidadesSostenidas.reduce((acc, h) => acc + (h.vm || 0), 0);
          if (vm > this._estado.vmDisponible - vmGastado) {
            ui.notifications.warn(`VM insuficiente. Necesitas ${vm} VM pero solo quedan ${this._estado.vmDisponible - vmGastado}.`);
            return;
          }
          this._estado.poderes.push({ nombre: item.name, vm, uuid: data.uuid, ...obtenerExtra(item) });
          this.render();
        });
      };

      registrarDropzone(
        ".hechizos-dropzone",
        item => item.type === "hechizo",
        item => difToVM(item.system.dificultad ?? 15),
        "hechizos",
        item => ({ pmCoste: item.system.pmCoste || 0, tipo: "hechizo" })
      );

      registrarDropzone(
        ".rasgos-dropzone",
        item => item.type === "caracteristicaBestiario" && item.system.tipo === "rasgo",
        item => item.system.vm || 0,
        "rasgos de bestiario",
        () => ({ tipo: "rasgo" })
      );

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

      el.querySelector(".add-hechizo-manual")?.addEventListener("click", () => {
        capturarItemTemporal({ name: "Nuevo hechizo", type: "hechizo" }, (live) => {
          const vm = difToVM(live.system.dificultad ?? 15);
          const vmGastado = this._estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0)
            + this._estado.habilidadesSostenidas.reduce((acc, h) => acc + (h.vm || 0), 0);
          if (vm > this._estado.vmDisponible - vmGastado) { ui.notifications.warn(`VM insuficiente. Necesitas ${vm} VM pero solo quedan ${this._estado.vmDisponible - vmGastado}.`); return; }
          this._estado.poderes.push({ nombre: live.name, vm, tipo: "hechizo", pmCoste: live.system.pmCoste || 0, _itemData: live.toObject() });
          this.render();
        });
      });

      el.querySelector(".add-rasgo-manual")?.addEventListener("click", () => {
        capturarItemTemporal({ name: "Nuevo rasgo", type: "caracteristicaBestiario", system: { tipo: "rasgo" } }, (live) => {
          const vm = live.system.vm || 0;
          const vmGastado = this._estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0)
            + this._estado.habilidadesSostenidas.reduce((acc, h) => acc + (h.vm || 0), 0);
          if (vm > this._estado.vmDisponible - vmGastado) { ui.notifications.warn(`VM insuficiente. Necesitas ${vm} VM pero solo quedan ${this._estado.vmDisponible - vmGastado}.`); return; }
          this._estado.poderes.push({ nombre: live.name, vm, tipo: "rasgo", _itemData: live.toObject() });
          this.render();
        });
      });

      el.querySelector(".add-habilidad-manual")?.addEventListener("click", () => {
        capturarItemTemporal({ name: "Nueva habilidad", type: "habilidad" }, (live) => {
          if (this._estado.habilidadesSostenidas.some(h => h.nombre === live.name)) return;
          const vmGastado = this._estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0)
            + this._estado.habilidadesSostenidas.reduce((acc, h) => acc + (h.vm || 0), 0);
          if (2 > this._estado.vmDisponible - vmGastado) {
            ui.notifications.warn(`VM insuficiente. Necesitas 2 VM pero solo quedan ${this._estado.vmDisponible - vmGastado}.`);
            return;
          }
          this._estado.habilidadesSostenidas.push({ nombre: live.name, clave: live.system.clave || "", _itemData: live.toObject(), vm: 2 });
          this.render();
        });
      });

      const habDropzone = el.querySelector(".habilidades-dropzone");
      if (habDropzone) {
        habDropzone.addEventListener("dragover", ev => { ev.preventDefault(); habDropzone.classList.add("drag-over"); });
        habDropzone.addEventListener("dragleave", () => habDropzone.classList.remove("drag-over"));
        habDropzone.addEventListener("drop", async ev => {
          ev.preventDefault();
          habDropzone.classList.remove("drag-over");
          let data;
          try { data = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch { return; }
          if (data.type !== "Item") return;
          const item = await fromUuid(data.uuid);
          if (!item || item.type !== "habilidad") { ui.notifications.warn("Solo se pueden añadir habilidades aquí."); return; }
          if (this._estado.habilidadesSostenidas.some(h => h.uuid === data.uuid)) return;
          const vmGastado = this._estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0)
            + this._estado.habilidadesSostenidas.reduce((acc, h) => acc + (h.vm || 0), 0);
          if (2 > this._estado.vmDisponible - vmGastado) {
            ui.notifications.warn(`VM insuficiente. Necesitas 2 VM pero solo quedan ${this._estado.vmDisponible - vmGastado}.`);
            return;
          }
          this._estado.habilidadesSostenidas.push({ nombre: item.name, clave: item.system.clave || "", uuid: data.uuid, vm: 2 });
          this.render();
        });
      }

      el.querySelectorAll(".habilidad-borrar").forEach(a => {
        a.addEventListener("click", ev => {
          this._estado.habilidadesSostenidas.splice(parseInt(ev.currentTarget.dataset.idx), 1);
          this.render();
        });
      });

      el.querySelectorAll(".poder-borrar").forEach(a => {
        a.addEventListener("click", ev => {
          this._estado.poderes.splice(parseInt(ev.currentTarget.dataset.idx), 1);
          this.render();
        });
      });
    }

    if (this._paso === 3) {
      const cbPlano = el.querySelector("[name=planoAjeno]");
      const secAcademia = el.querySelector(".fabricacion-academia");
      const secEnsamblaje = el.querySelector(".fabricacion-ensamblaje");
      const inputAcademia = el.querySelector("[name=resultadoAcademia]");

      const dif = this._estado.teaurgoMente * 2;

      const actualizarEnsamblaje = () => {
        const plano = cbPlano?.checked ?? false;
        const resultado = parseInt(inputAcademia?.value) || 0;
        const aprobada = plano || (resultado > 0 && resultado >= dif);
        if (secEnsamblaje) {
          secEnsamblaje.classList.toggle("tq-disabled", !aprobada);
          secEnsamblaje.querySelectorAll("input, button").forEach(el => el.disabled = !aprobada);
        }
      };

      if (cbPlano && secAcademia) {
        const toggle = () => { secAcademia.hidden = cbPlano.checked; actualizarEnsamblaje(); };
        cbPlano.addEventListener("change", toggle);
        toggle();
      }

      inputAcademia?.addEventListener("input", actualizarEnsamblaje);
      actualizarEnsamblaje();

      const calcularPuntuacionHabilidad = (actor, clave) => {
        const hab = actor?.system.habilidades?.[clave];
        if (!hab) return 0;
        const base = actor.system.bases?.[hab.base]?.valor ?? 0;
        return base + (hab.nivel ?? 0);
      };

      el.querySelector(".tirar-academia")?.addEventListener("click", async () => {
        this._guardarPaso3(el);
        const actor = game.actors.get(this._estado.teaurgoId);
        const puntuacion = actor
          ? calcularPuntuacionHabilidad(actor, "academia")
          : (this._estado.teaurgoAcademiaManual || 0);
        const result = await TQRoll.dialogoTirada("Academia", puntuacion, { dificultadForzada: dif });
        if (!result) return;
        this._estado.resultadoAcademia = result.total;
        this._estado.mesesConstruccion += 3;
        this.render();
      });

      el.querySelector(".tirar-artesania")?.addEventListener("click", async () => {
        this._guardarPaso3(el);
        const actor = game.actors.get(this._estado.teaurgoId);
        const puntuacion = actor
          ? calcularPuntuacionHabilidad(actor, "artesania")
          : (this._estado.teaurgoArtesaniaManual || 0);
        const result = await TQRoll.dialogoTirada("Artesanía", puntuacion, { dificultadForzada: dif });
        if (!result) return;
        this._estado.resultadoArtesania = result.total;
        this._estado.mesesConstruccion += 3;
        this.render();
      });
    }

    if (this._paso === 4) {
      el.querySelector(".tirar-espiritu")?.addEventListener("click", async () => {
        const roll = await new Roll("1d6+2").evaluate();
        this._estado.espiritu = roll.total;
        this.render();
      });
    }
  }

  async _crearArtefacto() {
    const estado = this._estado;
    const vmGastado = estado.poderes.reduce((acc, p) => acc + (p.vm || 0), 0);
    const item = await Item.create({
      name: estado.nombre || "Nuevo Artefacto",
      type: "artefacto",
      system: {
        teaurgo: estado.teaurgoNombre || estado.teaurgoNombreManual,
        tipoObjeto: estado.objetoBase?.nombre ?? "",
        objetoBase: estado.objetoBase ?? null,
        valorMagico: estado.vmDisponible,
        vmGastado,
        espiritu: estado.espiritu,
        pm: estado.espiritu * 2,
        coste: estado.vmDisponible * 1000,
        poderes: estado.poderes,
        habilidadesSostenidas: estado.habilidadesSostenidas,
        sosten: estado.sosten,
        tiempoConstruccion: estado.mesesConstruccion ? `${estado.mesesConstruccion} meses` : "",
        descripcion: estado.descripcion,
        notas: estado.notas
      }
    });
    this.close();
    item?.sheet.render(true);
  }
}
