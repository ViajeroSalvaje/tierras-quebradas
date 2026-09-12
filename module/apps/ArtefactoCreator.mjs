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
    nombre: "", teaurgoId: null, teaurgoNombre: "", teaurgoMente: 0,
    vmDisponible: 0, forzarCreacion: false,
    poderes: [], sosten: "",
    planoAjeno: false, resultadoAcademia: 0, resultadoArtesania: 0,
    espiritu: 0
  };

  static open() { return new ArtefactoCreator().render(true); }

  async _prepareContext() {
    const e = this._estado;
    const actores = game.actors
      .filter(a => ["pj", "pnj"].includes(a.type))
      .map(a => ({ id: a.id, name: a.name, mente: a.system.caracteristicas?.mente?.valor ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    const vmGastado = e.poderes.reduce((s, p) => s + (p.vm || 0), 0);
    const vmRestante = e.vmDisponible - vmGastado;

    const pasos = [
      { num: 1, label: "Base" }, { num: 2, label: "Poderes" },
      { num: 3, label: "Fabricación" }, { num: 4, label: "Virtud" }, { num: 5, label: "Resumen" }
    ].map(p => ({ ...p, activo: p.num === this._paso, completado: p.num < this._paso }));

    return {
      paso: this._paso,
      paso1: this._paso === 1, paso2: this._paso === 2, paso3: this._paso === 3,
      paso4: this._paso === 4, paso5: this._paso === 5,
      pasos, estado: e, actores, vmGastado, vmRestante,
      coste: e.vmDisponible * 1000,
      difFabricacion: e.teaurgoMente * 2
    };
  }

  _guardarPaso1(el) {
    this._estado.nombre = el.querySelector("[name=nombre]")?.value?.trim() ?? this._estado.nombre;
    this._estado.forzarCreacion = el.querySelector("[name=forzarCreacion]")?.checked ?? false;
    const sel = el.querySelector("[name=teaurgoId]");
    if (!sel?.value) return;
    this._estado.teaurgoId = sel.value;
    const actor = game.actors.get(sel.value);
    this._estado.teaurgoNombre = actor?.name ?? "";
    this._estado.teaurgoMente = actor?.system.caracteristicas?.mente?.valor ?? 0;
    this._estado.vmDisponible = Math.floor(this._estado.teaurgoMente / 2);
  }

  _guardarPaso2(el) {
    this._estado.sosten = el.querySelector("[name=sosten]")?.value?.trim() ?? this._estado.sosten;
  }

  _guardarPaso3(el) {
    this._estado.planoAjeno = el.querySelector("[name=planoAjeno]")?.checked ?? false;
    this._estado.resultadoAcademia = parseInt(el.querySelector("[name=resultadoAcademia]")?.value) || 0;
    this._estado.resultadoArtesania = parseInt(el.querySelector("[name=resultadoArtesania]")?.value) || 0;
  }

  _guardarPasoActual(el) {
    if (this._paso === 1) this._guardarPaso1(el);
    if (this._paso === 2) this._guardarPaso2(el);
    if (this._paso === 3) this._guardarPaso3(el);
  }

  _validarPasoActual(el) {
    if (this._paso === 1) {
      this._guardarPaso1(el);
      if (!this._estado.nombre) { ui.notifications.warn("Introduce un nombre para el artefacto."); return false; }
      if (!this._estado.teaurgoId) { ui.notifications.warn("Selecciona el teúrgo creador."); return false; }
      if (!this._estado.forzarCreacion) {
        const actor = game.actors.get(this._estado.teaurgoId);
        const norm = s => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
        const tieneInspiracion = actor?.items.some(i => i.type === "hechizo" && norm(i.name) === norm("Inspiración tecnológica"));
        if (!tieneInspiracion) { ui.notifications.warn("El teúrgo no dispone del conjuro Inspiración tecnológica."); return false; }
      }
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
      el.querySelector("[name=teaurgoId]")?.addEventListener("change", ev => {
        const actor = game.actors.get(ev.target.value);
        if (!actor) return;
        this._estado.teaurgoId = actor.id;
        this._estado.teaurgoNombre = actor.name;
        this._estado.teaurgoMente = actor.system.caracteristicas?.mente?.valor ?? 0;
        this._estado.vmDisponible = Math.floor(this._estado.teaurgoMente / 2);
        const span = el.querySelector(".vm-display");
        if (span) span.textContent = this._estado.vmDisponible;
      });
    }

    if (this._paso === 2) {
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
          if (this._estado.poderes.some(p => p.uuid === data.uuid)) return;
          const vm = esHechizo ? difToVM(item.system.dificultad ?? 15) : (item.system.vm || 0);
          const vmGastado = this._estado.poderes.reduce((s, p) => s + (p.vm || 0), 0);
          if (vm > this._estado.vmDisponible - vmGastado) {
            ui.notifications.warn(`VM insuficiente. Necesitas ${vm} VM pero solo quedan ${this._estado.vmDisponible - vmGastado}.`);
            return;
          }
          this._estado.poderes.push({ nombre: item.name, vm, uuid: data.uuid });
          this.render();
        });
      }

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
      if (cbPlano && secAcademia) {
        const toggle = () => { secAcademia.hidden = cbPlano.checked; };
        cbPlano.addEventListener("change", toggle);
        toggle();
      }
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
    const e = this._estado;
    const vmGastado = e.poderes.reduce((s, p) => s + (p.vm || 0), 0);
    const item = await Item.create({
      name: e.nombre || "Nuevo Artefacto",
      type: "artefacto",
      system: {
        teaurgo: e.teaurgoNombre,
        valorMagico: e.vmDisponible,
        vmGastado,
        espiritu: e.espiritu,
        coste: e.vmDisponible * 1000,
        poderes: e.poderes,
        sosten: e.sosten
      }
    });
    this.close();
    item?.sheet.render(true);
  }
}
