const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class PJSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "actor", "pj"],
    position: {
      width: 860,
      height: 950,
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
      template: "systems/tierras-quebradas/templates/actors/pj-sheet.hbs", scrollable: [".sheet-body"]
    }
  };

  /** Active tab survives re-renders (actor updates) */
  _activeTab = "hoja1";

  get title() {
    return this.actor.name;
  }

  async _prepareContext(options) {
    const habs = this.actor.system.habilidades;

    // Columnas de habilidades según orden de la hoja oficial
    const COL1 = [
      "academia", "actuacion", "armasAsta", "escudo", "armasEspada", "armasMangos", "armasPunhal", "arco", "ballesta", "canonDeMano", "honda", "artesania", "atletismo", "buscar", "callejeo", "conocimientoMagico", "disfrazarse", "documentacion", "encanto", "esquivar"
    ];
    const COL2 = [
      "estrategia", "forzarCerraduras", "hurtar", "idioma1", "idioma2", "idioma3", "imponerse", "instruir", "juego", "lanzar", "leyendas", "manejarBotes", "manejarCarros", "manipulacion", "medicina", "memorizar", "montar", "multiverso"
    ];
    const COL3 = [
      "nadar", "naturaleza", "navegacion", "ocultar", "oratoria", "pelea", "percatarse", "perspicacia", "pociones", "primerosAuxilios", "rastrear", "seguir", "sigilo", "sueños", "tierrasQuebradas", "tratarAnimales", "trepar"
    ];

    const IDIOMAS = new Set(["idioma1", "idioma2", "idioma3"]);
    const makeCol = keys => keys
      .map(k => habs[k] ? { key: k, hab: habs[k], esIdioma: IDIOMAS.has(k) } : null)
      .filter(Boolean);

    // Fórmulas de bases para mostrar en tabla
    const basesFormulas = {
      agilidad: "CUE − TAM", comunicacion: "ESP + ATR", cultura: "MEN", hechiceria: "(MEN+ESP)/3", percepcion: "(MEN+ESP)/2", tecnica: "(MEN+CUE)/2", vigor: "CUE"
    };

    const armasEnriquecidas = this.actor.items
      .filter(i => i.type === "arma")
      .map(arma => {
        const habClave = arma.system.habilidad;
        const habilidad = habs[habClave];
        const manos = arma.system.manos ?? "1m";
        let md, mdStr;
        if (manos === "2m") {
          md = this.actor.system.derivadas?.mDano2m?.valor ?? 0;
          mdStr = md >= 0 ? `+${md}` : `${md}`;
        } else if (manos === "ambas") {
          const md1 = this.actor.system.derivadas?.mDano1m?.valor ?? 0;
          const md2 = this.actor.system.derivadas?.mDano2m?.valor ?? 0;
          md = md1;
          mdStr = `${md1 >= 0 ? "+" : ""}${md1}/${md2 >= 0 ? "+" : ""}${md2}`;
        } else {
          md = this.actor.system.derivadas?.mDano1m?.valor ?? 0;
          mdStr = md >= 0 ? `+${md}` : `${md}`;
        }
        let habTotal = "—";
        if (habilidad) {
          const base = this.actor.system.bases[habilidad.base]?.valor ?? 0;
          habTotal = base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) - (this.actor.system.estorbo?.valor ?? 0);
        }
        return { item: arma, habTotal, md, mdStr };
      });

    // Alineamiento e hitos de Lealtad
    const plealtad = this.actor.system.lealtad;
    const religiones = ["caos", "ley", "elementos", "antepasados"];
    const maxPL = Math.max(...religiones.map(r => plealtad[r] ?? 0));
    const alineado = {};
    for (const r of religiones) {
      const valorLealtad = plealtad[r] ?? 0;
      const otrasMax = Math.max(...religiones.filter(x => x !== r).map(x => plealtad[x] ?? 0));
      alineado[r] = valorLealtad - otrasMax >= 10;
    }

    const LEALTAD_IMG = { caos: "Caos", ley: "Ley", elementos: "Elementos", antepasados: "Antepasados" };
    const lealtadVals = this.actor.system.lealtad;
    const maxLealtad = Math.max(lealtadVals.caos, lealtadVals.ley, lealtadVals.elementos, lealtadVals.antepasados);
    const ganadoras = Object.keys(LEALTAD_IMG).filter(k => lealtadVals[k] === maxLealtad && maxLealtad > 0);
    const simboloActivo = game.settings.get("tierras-quebradas", "mostrarSimboloLealtad")
                       && game.settings.get("tierras-quebradas", "mostrarSimboloLealtadJugador");
    const imagenLealtad = (simboloActivo && ganadoras.length === 1)
      ? `systems/tierras-quebradas/images/lealtades/${LEALTAD_IMG[ganadoras[0]]}.png`
      : null;

    return {
      actor: this.actor, system: this.actor.system, cssClass: this.options.classes.join(" "), activeTab: this._activeTab, imagenLealtad, items: {
        armas: armasEnriquecidas, armaduras: this.actor.items.filter(i => i.type === "armadura"), hechizos: this.actor.items.filter(i => i.type === "hechizo"), ventajas: this.actor.items.filter(i => i.type === "ventaja"), rasgos: this.actor.items.filter(i => i.type === "rasgo"), pactos: this.actor.items.filter(i => i.type === "pacto"), bendiciones: this.actor.items.filter(i => i.type === "bendicion"), especie: this.actor.items.find(i => i.type === "especie") ?? null, entorno: this.actor.items.find(i => i.type === "entorno") ?? null, origen: this.actor.items.find(i => i.type === "origen") ?? null, profesion: this.actor.items.find(i => i.type === "profesion") ?? null, objetos: this.actor.items.filter(i => i.type === "objeto"), consumibles: this.actor.items.filter(i => i.type === "consumible")
      }, lealtad: { alineado }, pasionAmorActiva: this.actor.system.pasionFlag === "amor", pasionOdioActiva: this.actor.system.pasionFlag === "odio", config: CONFIG.TQ, col1: makeCol(COL1), col2: makeCol(COL2), col3: makeCol(COL3), basesFormulas
    };
  }

  async _onDropItem(event, data) {
    const item = await fromUuid(data.uuid);

    if (item?.type === "habilidad") {
      const clave = item.system.clave;
      if (!clave || this.actor.system.habilidades?.[clave] !== undefined) return;
      await this.actor.update({
        [`system.habilidades.${clave}`]: {
          base: item.system.base, nivel: 0, puntosFijos: item.system.puntosFijos, estorbo: item.system.estorbo, marcado: false, px: 0
        }
      });
      return;
    }

    const cargaItem = item?.system?.carga ?? 0;
    const esNuevo = !item?.parent || item.parent.id !== this.actor.id;
    if (esNuevo && cargaItem >= 0.3) {
      const cargaActual = this.actor.system.carga?.valor ?? 0;
      const fuerza = this.actor.system.derivadas?.fuerza?.valor ?? 0;
      const limite = fuerza * 4;
      if (cargaActual + cargaItem > limite) {
        if (!game.user.isGM) {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<div class="tq-result-card complicacion"><div class="tq-card-titulo">Sobrepasa límite de carga</div><hr/><p>Límite de carga es 4 x FUERZA = <strong>${limite}</strong></p></div>`
          });
          return;
        }
        const confirmar = await DialogV2.wait({
          window: { title: "Límite de Carga Superado" }, content: `<p>${this.actor.name} superaría el límite absoluto de 4×FUE (${limite} puntos). ¿Añadir igualmente?</p>`, rejectClose: false, buttons: [
            { action: "si", label: "Sí, añadir", default: true }, { action: "no", label: "Cancelar" }
          ]
        });
        if (confirmar !== "si") return;
      }
    }

    return super._onDropItem(event, data);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;
    this._activarTab(el, this._activeTab);

    // Imagen de perfil
    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path })
      }).browse();
    });

    // Tabs
    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        const id = ev.currentTarget.dataset.tab;
        this._activeTab = id;
        this._activarTab(el, id);
      });
    });

    // Toggle éxito manual (círculo)
    el.querySelectorAll(".toggle-exito").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.alternarExitoHabilidad(ev.currentTarget.dataset.habilidad);
      });
    });

    // Tiradas de habilidad (nombre)
    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.tirarHabilidad(ev.currentTarget.dataset.habilidad);
      });
      a.addEventListener("contextmenu", ev => {
        ev.preventDefault();
        const clave = ev.currentTarget.dataset.habilidad;
        const hab = this.actor.system.habilidades?.[clave];
        if (!hab) return;
        const nombre = game.i18n.localize(`TQ.Habilidades.${clave}`) || clave;
        this.actor.abrirDialogoEnfrentada(nombre, hab.total ?? 0, clave);
      });
    });

    // Tiradas de característica
    el.querySelectorAll(".tirar-caracteristica").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.tirarCaracteristica(ev.currentTarget.dataset.caracteristica);
      });
    });

    // Tiradas de arma
    el.querySelectorAll(".tirar-arma").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.tirarArma(ev.currentTarget.dataset.itemId);
      });
    });

    // Items: crear
    el.querySelectorAll(".item-create").forEach(a => {
      a.addEventListener("click", ev => {
        const tipo = ev.currentTarget.dataset.tipo ?? "arma";
        const NOMBRES = { rasgo: "Nuevo rasgo", pacto: "Nuevo pacto", bendicion: "Nueva bendición", ventaja: "Nueva ventaja", arma: "Nueva arma", armadura: "Nueva armadura" };
        Item.create({ name: NOMBRES[tipo] ?? `Nuevo ${tipo}`, type: tipo }, { parent: this.actor });
      });
    });
    // Items: editar
    el.querySelectorAll(".item-edit").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = ev.currentTarget.dataset.itemId;
        this.actor.items.get(id)?.sheet.render(true);
      });
    });
    // Items: borrar
    el.querySelectorAll(".item-delete").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = ev.currentTarget.dataset.itemId;
        this.actor.items.get(id)?.delete();
      });
    });

    // Intervención Divina
    el.querySelectorAll(".tirar-intervencion").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        this.actor.intentarIntervencionDivina(ev.currentTarget.dataset.itemId);
      });
    });

    // Activar Bendición
    el.querySelectorAll(".activar-bendicion").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        this.actor.activarBendicion(ev.currentTarget.dataset.itemId);
      });
    });

    // Experiencia: fin de sesión y fin de aventura
    el.querySelector(".fin-sesion-px")?.addEventListener("click", () => this.actor.aplicarFinDeSesionPX());
    el.querySelector(".fin-aventura-px")?.addEventListener("click", () => this.actor.asignarPXHito());

    // PX editable al hacer clic sobre el texto "(n)"
    el.querySelectorAll(".tq-habilidad-px").forEach(span => {
      span.addEventListener("click", async ev => {
        ev.preventDefault();
        const clave = ev.currentTarget.dataset.habilidad;
        const actual = this.actor.system.habilidades?.[clave]?.px ?? 0;
        const nuevo = await DialogV2.wait({
          window: { title: "PX acumulados", width: 175 }, content: `<div style="display:flex;align-items:center;gap:8px;padding:4px;">
            <label>PX a añadir: </label>
            <input type="number" id="tq-px-val" value="0" style="width:60px;" />
          </div>`, rejectClose: false, buttons: [
            {
              action: "ok", label: "Guardar", default: true, callback: (_ev, btn) => parseInt(btn.form.elements["tq-px-val"]?.value) || 0
            }, { action: "cancelar", label: "Cancelar", callback: () => 0 }
          ]
        });
        if (nuevo == null || nuevo === 0) return;
        await this.actor.añadirPXHabilidad(clave, nuevo);
      });
    });

    // Fin de sesión por actitud
    el.querySelector(".fin-sesion-actitud")?.addEventListener("click", () => {
      this.actor.aplicarFinSesion();
    });

    // Cambiar Lealtad por PM
    el.querySelector(".cambiar-lealtad-pm")?.addEventListener("click", () => {
      this.actor.cambiarLealtadPorPM();
    });

    // Recuperar PM durmiendo
    el.querySelector(".recuperar-pm")?.addEventListener("click", () => {
      this.actor.recuperarPM();
    });

    // Lanzar hechizo
    el.querySelectorAll(".tirar-hechizo").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.lanzarHechizo(ev.currentTarget.dataset.itemId);
      });
    });

    // Toggle espíritu consagrado en hechizos
    el.querySelectorAll(".hechizo-permanent").forEach(span => {
      span.addEventListener("click", ev => {
        ev.preventDefault();
        const hechizo = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (!hechizo) return;
        const nuevoPermanent = !hechizo.system.permanent;
        const pmCoste = hechizo.system.pmCoste || 1;
        const espActual = this.actor.system.hechiceria?.espirituConsagrado ?? 0;
        const nuevoEsp = nuevoPermanent ? espActual + pmCoste : Math.max(0, espActual - pmCoste);
        hechizo.update({ "system.permanent": nuevoPermanent });
        this.actor.update({ "system.hechiceria.espirituConsagrado": nuevoEsp });
      });
    });

    // Tabla de Lesiones
    el.querySelector(".tirar-lesion")?.addEventListener("click", ev => {
      ev.preventDefault();
      const objetivo = game.user.targets.first()?.actor ?? this.actor;
      objetivo.tirarLesion();
    });

    // Pasiones
    el.querySelectorAll(".activar-pasion").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        if (ev.currentTarget.classList.contains("pasion-usada")) return;
        this.actor.activarPasion(ev.currentTarget.dataset.tipo);
      });
    });
    el.querySelectorAll(".toggle-pasion-usada").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const campo = ev.currentTarget.dataset.campo;
        this.actor.update({ [`system.${campo}`]: !this.actor.system[campo] });
      });
    });
    el.querySelector(".resetear-pasiones")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.actor.resetearPasiones();
    });

    // Marcas de La Mentira
    el.querySelectorAll(".marcar-mentira").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.marcarMentira(parseInt(ev.currentTarget.dataset.marca));
      });
    });

    // Círculos de salud (estados y heridas)
    el.querySelectorAll(".toggle-estado").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.actor, campo);
        const nuevoValor = !actual;
        const updates = { [campo]: nuevoValor };
        if (campo === "system.salud.heridasGraves1" || campo === "system.salud.heridasGraves2") {
          const salud = this.actor.system.salud;
          const graves1 = campo === "system.salud.heridasGraves1" ? nuevoValor : salud.heridasGraves1;
          const graves2 = campo === "system.salud.heridasGraves2" ? nuevoValor : salud.heridasGraves2;
          if (graves1 && graves2) updates["system.salud.incapacitado"] = true;
          else updates["system.salud.incapacitado"] = false;
        }
        this.actor.update(updates);
      });
    });

    // Toggle visera yelmo
    el.querySelectorAll(".toggle-visera").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (item) item.update({ "system.viseraBajada": !item.system.viseraBajada });
      });
    });

    // Fortuna
    el.querySelector(".usar-fortuna")?.addEventListener("click", () => {
      const fortuna = this.actor.system.fortuna;
      if (fortuna.actual > 0) this.actor.update({ "system.fortuna.actual": fortuna.actual - 1 });
    });
    el.querySelector(".recuperar-fortuna")?.addEventListener("click", () => {
      const fortuna = this.actor.system.fortuna;
      if (fortuna.actual < fortuna.max) this.actor.update({ "system.fortuna.actual": fortuna.actual + 1 });
    });
  }

  _activarTab(el, tabId) {
    el.querySelectorAll(".sheet-tabs .item").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
    el.querySelectorAll(".sheet-body .tab").forEach(t =>
      t.classList.toggle("active", t.dataset.tab === tabId)
    );
  }
}
