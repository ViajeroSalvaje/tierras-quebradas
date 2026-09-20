import { TQRoll } from "../../rolls/TQRoll.mjs";
import { getDeidadesGrupos } from "../../helpers/deidades.mjs";
import { printActorPDF } from "../../apps/printPDF.mjs";

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

  static _habDescripciones = null;

  // persiste entre re-renders
  _activeTab = "hoja1";

  get title() {
    return this.actor.name;
  }

  async _prepareContext(options) {
    const habs = this.actor.system.habilidades;

    const byType = {};
    for (const i of this.actor.items) (byType[i.type] ??= []).push(i);

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

    if (!PJSheet._habDescripciones) {
      PJSheet._habDescripciones = {};
      const packHabs = game.packs.get("tierras-quebradas.habilidades");
      if (packHabs) {
        const docs = await packHabs.getDocuments();
        for (const item of docs) {
          if (item.system.clave && item.system.descripcion)
            PJSheet._habDescripciones[item.system.clave] = item.system.descripcion;
        }
      }
    }
    const habDescripciones = { ...PJSheet._habDescripciones };
    for (const item of game.items) {
      if (item.type === "habilidad" && item.system.clave && item.system.descripcion)
        habDescripciones[item.system.clave] = item.system.descripcion;
    }

    const instrucciones = `Click <strong>izquierdo</strong> para tirada normal | Click <strong>derecho</strong> para tirada enfrentada`;
    const IDIOMAS = new Set(["idioma1", "idioma2", "idioma3"]);
    const makeCol = keys => keys
      .map(k => {
        if (!habs[k]) return null;
        const desc = habDescripciones[k];
        const tooltip = desc ? `${instrucciones}<hr>${desc}` : instrucciones;
        return { key: k, hab: habs[k], esIdioma: IDIOMAS.has(k), tooltip };
      })
      .filter(Boolean);

    const basesFormulas = {
      agilidad: "CUE − TAM", comunicacion: "ESP + ATR", cultura: "MEN", hechiceria: "(MEN+ESP)/3", percepcion: "(MEN+ESP)/2", tecnica: "(MEN+CUE)/2", vigor: "CUE"
    };

    const armasEnriquecidas = (byType.arma ?? [])
      .map(arma => {
        const { md, mdStr, habTotal } = this._calcMDHab(arma.system.habilidad, arma.system.manos ?? "1m");
        return { item: arma, habTotal, md, mdStr, equipped: arma.system.equipped !== false, esDemoniaco: arma.system.esDemoniaco ?? false };
      });

    const alineadoLey = this._esAlineadoLey();
    const armasArtefacto = (byType.artefacto ?? [])
      .filter(i => i.system.objetoBase?.tipo === "arma")
      .map(artefacto => {
        const baseSys = artefacto.system.objetoBase._itemData?.system ?? {};
        const { md, mdStr, habTotal } = this._calcMDHab(baseSys.habilidad ?? "", baseSys.manos ?? "1m");
        return { item: { id: artefacto.id, name: artefacto.name, system: { habilidad: baseSys.habilidad, danoArma: baseSys.danoArma, alcance: baseSys.alcance, carga: baseSys.carga } }, habTotal, md, mdStr, equipped: alineadoLey && artefacto.system.equipped !== false, artefacto: true };
      });

    armasEnriquecidas.push(...armasArtefacto);

    const armasMagicasEnriquecidas = (byType.objetoMagico ?? [])
      .filter(i => i.system.tipoObjeto === "arma")
      .map(arma => {
        const { md, mdStr, habTotal } = this._calcMDHab(arma.system.habilidad, arma.system.manos ?? "1m");
        return { item: arma, habTotal, md, mdStr, equipped: arma.system.equipped !== false };
      });

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

    const destinoTotal = Object.values(this.actor.system.destino?.puntos ?? {})
      .reduce((sum, p) => sum + (parseInt(p.valor) || 0), 0);
    const deidadesGrupos = await getDeidadesGrupos();

    const armaduras = [
      ...(byType.armadura ?? []).map(i => { const src = this.actor.items.get(i.getFlag("tierras-quebradas", "fromArmaId") ?? ""); return { id: i.id, name: i.name, system: i.system, esDemoniaco: !!(i.system.esDemoniaco || src?.system?.esDemoniaco) }; }),
      ...(byType.objetoMagico ?? []).filter(i => i.system.tipoObjeto === "armadura")
        .map(i => {
          const modProt = i.system.categoria === "encantado" && !i.system.sintonizado ? 0 : (i.system.modProteccion ?? 0);
          return { id: i.id, name: i.name, system: { proteccion: (i.system.proteccion ?? 0) + modProt, zona: "—", tipo: i.system.tipoProteccion, carga: i.system.carga ?? 0, equipped: i.system.equipped }, magico: true };
        }),
      ...(byType.artefacto ?? []).filter(i => i.system.objetoBase?.tipo === "armadura")
        .map(i => {
          const b = i.system.objetoBase._itemData?.system ?? {};
          return { id: i.id, name: i.name, system: { proteccion: b.proteccion ?? 0, zona: b.zona ?? "—", tipo: b.tipo ?? "", carga: b.carga ?? 0, equipped: alineadoLey ? i.system.equipped : false }, artefacto: true };
        })
    ];
    const armaduraEquipadas = armaduras.filter(a => a.system.equipped !== false);
    const proteccionTotal = armaduraEquipadas.reduce((s, a) => s + (a.system.proteccion ?? 0), 0);
    const cargaProteccionTotal = armaduraEquipadas.reduce((s, a) => s + (a.system.carga ?? 0), 0);

    const espiritu = this.actor.system.caracteristicas?.espiritu?.valor ?? 0;
    const atadurasMax = Math.floor(espiritu / 2);
    const objetosDemoniacos = this.actor.items
      .filter(i => i.system?.esDemoniaco && i.system?.equipped !== false)
      .map(i => {
        let tipoLabel;
        if (i.type === "arma") tipoLabel = i.system.habilidad ? game.i18n.localize(`TQ.Habilidades.${i.system.habilidad}`) || i.system.habilidad : "Arma";
        else if (i.type === "armadura") tipoLabel = `Armadura ${i.system.tipo ?? ""}`.trim();
        else tipoLabel = i.type;
        return { id: i.id, name: i.name, type: i.type, tipoLabel, system: i.system };
      });
    const atadurasActivas = objetosDemoniacos.length;
    const atadurasLibres = Math.max(0, atadurasMax - atadurasActivas);

    const tienePasionExtra = (byType.ventaja ?? []).some(i => i.name === "Pasión extra");
    const hasLucky = (byType.rasgo ?? []).some(i => i.name === "Buena suerte");

    return {
      actor: this.actor,
      system: this.actor.system,
      cssClass: this.options.classes.join(" "),
      activeTab: this._activeTab,
      imagenLealtad,
      destinoTotal,
      items: {
        armas: armasEnriquecidas,
        armasMagicas: armasMagicasEnriquecidas,
        armaduras, proteccionTotal, cargaProteccionTotal,
        hechizos: (byType.hechizo ?? []).filter(h => !h.system.fromDemoniaco),
        ventajas: byType.ventaja ?? [],
        rasgos: byType.rasgo ?? [],
        pactos: byType.pacto ?? [],
        bendiciones: byType.bendicion ?? [],
        especie: (byType.especie ?? [])[0] ?? null,
        entorno: (byType.entorno ?? [])[0] ?? null,
        origen: (byType.origen ?? [])[0] ?? null,
        profesion: (byType.profesion ?? [])[0] ?? null,
        objetos: [
          ...(byType.objeto ?? []),
          ...(byType.artefacto ?? []).filter(i => !["arma", "armadura"].includes(i.system.objetoBase?.tipo)).map(i => ({ id: i.id, name: i.name, system: { categoria: "", carga: 0, equipped: alineadoLey ? i.system.equipped : false }, artefacto: true, poderesTexto: (() => {
              const hechizos = (i.system.poderes ?? []).filter(p => p.tipo === "hechizo" && p.nombre).map(p => p.nombre);
              const rasgos   = (i.system.poderes ?? []).filter(p => p.tipo === "rasgo"   && p.nombre).map(p => p.nombre);
              const habs     = (i.system.habilidadesSostenidas ?? []).filter(h => h.nombre).map(h => h.nombre);
              return [hechizos, rasgos, habs].filter(g => g.length).map(g => g.join(" · ")).join("  -  ");
            })() }))
        ],
        consumibles: byType.consumible ?? [],
        objetosMagicos: byType.objetoMagico ?? [],
        hechizosArtefacto: (byType.artefacto ?? []).flatMap(i =>
          (i.system.poderes ?? []).filter(p => p.tipo === "hechizo" && p.nombre)
            .map((p, idx) => ({ artefactoId: i.id, artefactoNombre: i.name, poderIdx: idx, nombre: p.nombre, pmCoste: p.pmCoste || 0, pmActual: i.system.pm ?? 0 }))
        ),
        hechizosObjetoDemoniaco: (byType.hechizo ?? []).filter(h => h.system.fromDemoniaco).map(h => {
          const obj = this.actor.items.get(h.system.fromDemoniaco);
          return { itemId: h.id, nombre: h.name, objetoNombre: obj?.name ?? "", pmCoste: h.system.pmCoste ?? 1, pmActual: obj?.system.pm ?? 0, pmPropios: obj?.system.pmPropios ?? false };
        })
      },
      atadurasMax, atadurasActivas, atadurasLibres, objetosDemoniacos,
      lealtad: { alineado },
      lealtadesEnTexto: game.settings.get("tierras-quebradas", "lealtadesEnTexto"),
      pasionAmorActiva: this.actor.system.pasionFlag === "amor",
      pasionOdioActiva: this.actor.system.pasionFlag === "odio",
      pasionExtraActiva: this.actor.system.pasionFlag === "extra",
      tienePasionExtra,
      hasLucky,
      luckyMax: hasLucky ? Math.floor((this.actor.system.caracteristicas?.mente?.valor ?? 0) / 2) : 0,
      config: CONFIG.TQ,
      col1: makeCol(COL1), col2: makeCol(COL2), col3: makeCol(COL3),
      basesFormulas,
      deidadesGrupos
    };
  }

  _calcMDHab(habClave, manos) {
    const habs = this.actor.system.habilidades;
    const deriv = this.actor.system.derivadas;
    let md, mdStr;
    if (manos === "2m") {
      md = deriv?.mDano2m?.valor ?? 0;
      mdStr = md >= 0 ? `+${md}` : `${md}`;
    } else if (manos === "ambas") {
      const md1 = deriv?.mDano1m?.valor ?? 0;
      const md2 = deriv?.mDano2m?.valor ?? 0;
      md = md1;
      mdStr = `${md1 >= 0 ? "+" : ""}${md1}/${md2 >= 0 ? "+" : ""}${md2}`;
    } else {
      md = deriv?.mDano1m?.valor ?? 0;
      mdStr = md >= 0 ? `+${md}` : `${md}`;
    }
    const habilidad = habs[habClave];
    let habTotal = "—";
    if (habilidad) {
      const base = this.actor.system.bases[habilidad.base]?.valor ?? 0;
      habTotal = base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0);
    }
    return { md, mdStr, habTotal };
  }

  _esAlineadoLey() {
    const l = this.actor.system.lealtad;
    const religiones = ["caos", "elementos", "antepasados"];
    const otrasMax = Math.max(...religiones.map(r => l[r] ?? 0));
    return (l.ley ?? 0) - otrasMax >= 10;
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

    if (["especie", "origen", "profesion"].includes(item?.type)) {
      const eleccion = await DialogV2.wait({
        window: { title: item.name },
        content: `<p>${game.i18n.format("TQ.Dialogo.ImportarItem", { nombre: item.name })}</p>`,
        rejectClose: false,
        buttons: [
          { action: "todo", label: game.i18n.localize("TQ.Botones.ImportarTodo"), default: true },
          { action: "nombre", label: game.i18n.localize("TQ.Botones.SoloNombre") }
        ]
      });
      if (!eleccion) return;
      if (eleccion === "nombre") {
        await Item.create({ name: item.name, type: item.type }, { parent: this.actor });
        return;
      }
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
            speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<div class="tq-result-card complicacion"><div class="tq-card-titulo">${game.i18n.localize("TQ.Carga.TituloSobrepasa")}</div><hr/><p>${game.i18n.format("TQ.Carga.Limite", { limite })}</p></div>`
          });
          return;
        }
        const confirmar = await DialogV2.wait({
          window: { title: game.i18n.localize("TQ.Carga.TituloSuperado") }, content: `<p>${game.i18n.format("TQ.Carga.Confirmar", { actor: this.actor.name, limite })}</p>`, rejectClose: false, buttons: [
            { action: "si", label: game.i18n.localize("TQ.Botones.SiAnadir"), default: true }, { action: "no", label: game.i18n.localize("TQ.Botones.Cancelar") }
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

    el.querySelector(".profile-img[data-edit]")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.actor.img, callback: path => this.actor.update({ img: path })
      }).browse();
    });

    el.querySelectorAll(".sheet-tabs .item").forEach(tab => {
      tab.addEventListener("click", ev => {
        const id = ev.currentTarget.dataset.tab;
        this._activeTab = id;
        this._activarTab(el, id);
      });
    });

    el.querySelectorAll(".toggle-exito").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.alternarExitoHabilidad(ev.currentTarget.dataset.habilidad);
      });
    });

    el.querySelectorAll(".tirar-habilidad").forEach(a => {
      let tooltipTimer = null;
      a.addEventListener("pointerenter", ev => {
        const target = ev.currentTarget;
        const content = target.dataset.tqHabTooltip;
        if (!content) return;
        tooltipTimer = setTimeout(() => {
          target.dataset.tooltip = content;
          game.tooltip.activate(target, { cssClass: "tq-hab-tooltip", direction: "UP" });
          delete target.dataset.tooltip;
        }, 4000);
      });
      a.addEventListener("pointerleave", () => {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
        game.tooltip.deactivate();
      });
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

    el.querySelectorAll(".tirar-base").forEach(td => {
      td.addEventListener("click", ev => {
        const nombre = ev.currentTarget.dataset.nombre;
        const valor = parseInt(ev.currentTarget.dataset.valor) || 0;
        TQRoll.dialogoTirada(nombre, valor, { actor: this.actor });
      });
    });

    el.querySelectorAll(".tirar-caracteristica").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.tirarCaracteristica(ev.currentTarget.dataset.caracteristica);
      });
    });


    el.querySelectorAll(".toggle-equipado").forEach(a => {
      a.addEventListener("click", async ev => {
        ev.preventDefault();
        const id = ev.currentTarget.dataset.itemId;
        const item = this.actor.items.get(id);
        if (!item) return;
        if (item.type === "artefacto" && !this._esAlineadoLey()) return;
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

    el.querySelectorAll(".tirar-arma").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        if (ev.currentTarget.classList.contains("tq-desequipado")) return;
        this.actor.tirarArma(ev.currentTarget.dataset.itemId);
      });
    });

    el.querySelectorAll(".item-create").forEach(a => {
      a.addEventListener("click", ev => {
        const tipo = ev.currentTarget.dataset.tipo ?? "arma";
        const NOMBRES = {
          rasgo: game.i18n.localize("TQ.Nuevo.rasgo"),
          pacto: game.i18n.localize("TQ.Nuevo.pacto"),
          bendicion: game.i18n.localize("TQ.Nuevo.bendicion"),
          ventaja: game.i18n.localize("TQ.Nuevo.ventaja"),
          arma: game.i18n.localize("TQ.Nuevo.arma"),
          armadura: game.i18n.localize("TQ.Nuevo.armadura"),
          objeto: game.i18n.localize("TQ.Nuevo.objeto"),
          hechizo: game.i18n.localize("TQ.Nuevo.hechizo"),
          consumible: game.i18n.localize("TQ.Nuevo.consumible"),
          objetoMagico: "Nuevo objeto mágico"
        };
        Item.create({ name: NOMBRES[tipo] ?? `${game.i18n.localize("TQ.Dialogo.Nuevo")} ${tipo}`, type: tipo }, { parent: this.actor });
      });
    });
    el.querySelectorAll(".item-edit").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = ev.currentTarget.dataset.itemId;
        this.actor.items.get(id)?.sheet.render(true);
      });
    });
    el.querySelectorAll(".item-delete").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = ev.currentTarget.dataset.itemId;
        this.actor.items.get(id)?.delete();
      });
    });

    el.querySelectorAll(".tirar-intervencion").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        this.actor.intentarIntervencionDivina(ev.currentTarget.dataset.itemId);
      });
    });

    el.querySelectorAll(".activar-bendicion").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        this.actor.activarBendicion(ev.currentTarget.dataset.itemId);
      });
    });

    el.querySelector(".fin-sesion-px")?.addEventListener("click", () => this.actor.aplicarFinDeSesionPX());
    el.querySelector(".fin-aventura-px")?.addEventListener("click", () => this.actor.asignarPXHito());

    // PX editable al hacer clic sobre el texto "(n)"
    el.querySelectorAll(".tq-habilidad-px").forEach(span => {
      span.addEventListener("click", async ev => {
        ev.preventDefault();
        const clave = ev.currentTarget.dataset.habilidad;
        const actual = this.actor.system.habilidades?.[clave]?.px ?? 0;
        const nuevo = await DialogV2.wait({
          window: { title: game.i18n.localize("TQ.Dialogo.PXAcumulados"), width: 175 }, content: `<div style="display:flex;align-items:center;gap:8px;padding:4px;">
            <label>${game.i18n.localize("TQ.Dialogo.PXAnadir")}</label>
            <input type="number" id="tq-px-val" value="0" style="width:60px;" />
          </div>`, rejectClose: false, buttons: [
            {
              action: "ok", label: game.i18n.localize("TQ.Botones.Guardar"), default: true, callback: (_ev, btn) => parseInt(btn.form.elements["tq-px-val"]?.value) || 0
            }, { action: "cancelar", label: game.i18n.localize("TQ.Botones.Cancelar"), callback: () => 0 }
          ]
        });
        if (nuevo == null || nuevo === 0) return;
        await this.actor.añadirPXHabilidad(clave, nuevo);
      });
    });

    el.querySelector(".fin-sesion-actitud")?.addEventListener("click", () => {
      this.actor.aplicarFinSesion();
    });

    el.querySelector(".cambiar-lealtad-pm")?.addEventListener("click", () => {
      this.actor.cambiarLealtadPorPM();
    });

    el.querySelector(".recuperar-pm")?.addEventListener("click", () => {
      this.actor.recuperarPM();
    });

    el.querySelector(".recuperar-pm-meditando")?.addEventListener("click", () => {
      this.actor.meditarPM();
    });

    el.querySelector(".recuperar-pm-rezando")?.addEventListener("click", () => {
      this.actor.rezarPM();
    });

    el.querySelectorAll(".atadura-vinculacion-input").forEach(inp => {
      inp.addEventListener("change", ev => {
        const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (item) item.update({ "system.vinculacionDios": ev.target.value });
      });
    });

    el.querySelectorAll(".tirar-hechizo").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.lanzarHechizo(ev.currentTarget.dataset.itemId);
      });
    });

    el.querySelectorAll(".activar-poder-artefacto").forEach(btn => {
      btn.addEventListener("click", async ev => {
        ev.preventDefault();
        const li = ev.currentTarget.closest("[data-artefacto-id]");
        const artefacto = this.actor.items.get(li?.dataset.artefactoId);
        const poderIdx = parseInt(li?.dataset.poderIdx ?? "-1");
        if (!artefacto) return;
        const poder = artefacto.system.poderes?.[poderIdx];
        if (!poder) return;
        if (!this._esAlineadoLey()) {
          ui.notifications.warn(`La virtud no responde — ${this.actor.name} no está alineado con la Ley.`);
          return;
        }
        const pmCoste = poder.pmCoste || 0;
        const pmActual = artefacto.system.pm ?? 0;
        if (pmCoste > 0 && pmActual < pmCoste) {
          ui.notifications.warn(`PM insuficiente. El artefacto necesita ${pmCoste} PM pero solo le quedan ${pmActual}.`);
          return;
        }
        if (poder.tipo === "hechizo") {
          let hechizoItem = null;
          if (poder.uuid) hechizoItem = await fromUuid(poder.uuid);
          else if (poder._itemData) hechizoItem = new CONFIG.Item.documentClass(foundry.utils.deepClone(poder._itemData), { temporary: true });
          if (hechizoItem) {
            await this.actor.lanzarHechizo(null, { hechizoItem, forzarAutoExito: true, artefacto, artefactoPmCoste: pmCoste });
            return;
          }
        }
        if (pmCoste > 0) await artefacto.update({ "system.pm": pmActual - pmCoste });
        ChatMessage.create({
          content: `<div class="tq-result-card"><p style="text-align:center;font-weight:bold;">${artefacto.name}</p><hr><p><em>${poder.nombre}</em> se activa automáticamente.${pmCoste > 0 ? ` (−${pmCoste} PM)` : ""}</p></div>`,
          speaker: ChatMessage.getSpeaker({ actor: this.actor })
        });
      });
    });

    el.querySelectorAll(".activar-conjuro-demoniaco").forEach(btn => {
      btn.addEventListener("click", async ev => {
        ev.preventDefault();
        const hechizo = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (!hechizo) return;
        const objetoDemoniaco = this.actor.items.get(hechizo.system.fromDemoniaco);
        if (!objetoDemoniaco) return;

        const pmCoste = hechizo.system.pmCoste ?? 1;
        const pmPropios = objetoDemoniaco.system.pmPropios ?? false;
        const pmObjeto = objetoDemoniaco.system.pm ?? 0;

        let pmDelObjeto = 0;
        let pmDelActor = pmCoste;
        if (pmPropios && pmObjeto > 0) {
          pmDelObjeto = Math.min(pmObjeto, pmCoste);
          pmDelActor = pmCoste - pmDelObjeto;
        }

        if (pmDelObjeto > 0) {
          await objetoDemoniaco.update({ "system.pm": pmObjeto - pmDelObjeto });
        }
        if (pmDelActor > 0) {
          const pmActual = this.actor.system.hechiceria?.pmActual ?? 0;
          const pmNuevo = pmActual - pmDelActor;
          await this.actor.update({ "system.hechiceria.pmActual": Math.max(0, pmNuevo) });
          if (pmNuevo <= 0) {
            await this.actor.update({ "system.salud.debilitado": true });
            ui.notifications.warn(game.i18n.format("TQ.Magia.Debilitado", { nombre: this.actor.name }));
          }
        }

        const requiereEsp = hechizo.system.requiereTiradaEspiritu ?? false;
        const espObjeto = objetoDemoniaco.system.vm ?? 0;
        const nombreObjeto = objetoDemoniaco.name;
        const modoTirada = game.settings.get("core", "rollMode");

        const desglosePM = pmDelObjeto > 0 && pmDelActor > 0
          ? ` (−${pmDelObjeto} PM del objeto, −${pmDelActor} PM del actor)`
          : pmDelObjeto > 0 ? ` (−${pmDelObjeto} PM del objeto)` : ` (−${pmDelActor} PM)`;

        const btnEsp = requiereEsp
          ? `<div style="margin-top:8px;text-align:center;"><button class="tq-aplicar-resultado" type="button" data-actor-id="${this.actor.id}" data-etiqueta="${hechizo.name}" data-exitos="0" data-requiere-espiritu="true" data-espiritu-artefacto="${espObjeto}" data-nombre-artefacto="${nombreObjeto}">${game.i18n.localize("TQ.Botones.AplicarResultado")}</button></div>`
          : "";

        const contenido = `<div class="tq-result-card"><p style="text-align:center;font-weight:bold;">${hechizo.name}</p><hr><p>${this.actor.name} ha lanzado <em>${hechizo.name}</em> usando <em>${nombreObjeto}</em>.${pmCoste > 0 ? desglosePM : ""}</p>${btnEsp}</div>`;

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: contenido,
          ...TQRoll._rollModeData(modoTirada),
          flags: { "tierras-quebradas": { etiqueta: hechizo.name, actorId: this.actor.id, requiereTiradaEspiritu: requiereEsp, bonusEspiritu: 0 } }
        });
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
          const espActual = this.actor.system.hechiceria?.espirituConsagrado ?? 0;
          const espMax = this.actor.system.caracteristicas?.espiritu?.valor ?? 0;
          if (espActual + pmCoste > espMax) {
            ui.notifications.warn(game.i18n.format("TQ.Magia.EspirituConsagradoMaximo", { max: espMax }));
            return;
          }
        }
        hechizo.update({ "system.permanent": nuevoPermanent });
      });
    });

    el.querySelector(".tirar-lesion")?.addEventListener("click", ev => {
      ev.preventDefault();
      const objetivo = game.user.targets.first()?.actor ?? this.actor;
      objetivo.tirarLesion();
    });

    el.querySelector(".destino-punto-add")?.addEventListener("click", ev => {
      ev.preventDefault();
      const puntos = Object.values(foundry.utils.deepClone(this.actor.system.destino?.puntos ?? {}));
      puntos.push({ tipo: "objeto", descripcion: "", valor: 0 });
      this.actor.update({ "system.destino.puntos": puntos });
    });

    el.querySelectorAll(".destino-punto-delete").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const puntos = Object.values(foundry.utils.deepClone(this.actor.system.destino?.puntos ?? {}));
        puntos.splice(idx, 1);
        this.actor.update({ "system.destino.puntos": puntos });
      });
    });

    el.querySelector(".herida-add")?.addEventListener("click", ev => {
      ev.preventDefault();
      const heridas = Object.values(foundry.utils.deepClone(this.actor.system.heridas ?? {}));
      heridas.push({ tipo: "rasguño", descripcion: "", dano: 0, sanando: false });
      this.actor.update({ "system.heridas": heridas });
    });

    el.querySelectorAll(".herida-primeros-auxilios").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const idx = parseInt(ev.currentTarget.dataset.idx);
        this.actor.intentarPrimerosAuxilios(idx);
      });
    });

    el.querySelectorAll(".herida-delete").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const heridas = Object.values(foundry.utils.deepClone(this.actor.system.heridas ?? {}));
        heridas.splice(idx, 1);
        this.actor.update({ "system.heridas": heridas });
      });
    });

    el.querySelectorAll(".toggle-herida-sanando").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const idx = parseInt(ev.currentTarget.dataset.idx);
        const heridas = Object.values(foundry.utils.deepClone(this.actor.system.heridas ?? {}));
        if (heridas[idx]) heridas[idx].sanando = !heridas[idx].sanando;
        this.actor.update({ "system.heridas": heridas });
      });
    });

    el.querySelectorAll(".activar-pasion").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        if (ev.currentTarget.classList.contains("pasion-usada")) return;
        this.actor.activarPasion(ev.currentTarget.dataset.tipo);
      });
    });
    el.querySelectorAll(".toggle-pasion-usada, .toggle-rasgo-usada").forEach(a => {
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

    el.querySelector(".resistir-pasion")?.addEventListener("click", ev => {
      ev.preventDefault();
      this.actor.resistirPasion();
    });

    el.querySelectorAll(".marcar-mentira").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        this.actor.marcarMentira(parseInt(ev.currentTarget.dataset.marca));
      });
    });

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
        const esHerida = campo.startsWith("system.salud.heridasLeves") || campo.startsWith("system.salud.heridasGraves");
        if (esHerida && nuevoValor) {
          const tipo = campo.includes("Leves") ? "leve" : "grave";
          const heridas = Object.values(foundry.utils.deepClone(this.actor.system.heridas ?? {}));
          heridas.push({ tipo, descripcion: "", dano: 0, sanando: false });
          updates["system.heridas"] = heridas;
        }
        this.actor.update(updates, { tqDesdeRecibir: true });
      });
    });

    el.querySelectorAll(".toggle-visera").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
        if (item) item.update({ "system.viseraBajada": !item.system.viseraBajada });
      });
    });

    el.querySelectorAll(".md-extra-input").forEach(input => {
      input.addEventListener("change", ev => {
        const campo = ev.currentTarget.dataset.campo;
        this.actor.update({ [`system.derivadas.${campo}`]: parseInt(ev.currentTarget.value) || 0 });
      });
    });

    el.querySelector(".usar-fortuna")?.addEventListener("click", () => {
      const fortuna = this.actor.system.fortuna;
      if (fortuna.actual > 0) this.actor.update({ "system.fortuna.actual": fortuna.actual - 1 });
    });
    el.querySelector(".recuperar-fortuna")?.addEventListener("click", () => {
      const fortuna = this.actor.system.fortuna;
      if (fortuna.actual < fortuna.max) this.actor.update({ "system.fortuna.actual": fortuna.actual + 1 });
    });
    el.querySelector(".restaurar-lucky")?.addEventListener("click", () => {
      const mente = this.actor.system.caracteristicas?.mente?.valor ?? 0;
      const luckyMax = Math.floor(mente / 2);
      this.actor.update({ "system.fortuna.lucky": luckyMax });
    });

    el.querySelector(".tirar-fortuna")?.addEventListener("click", async () => {
      const actor = this.actor;
      const fortActual = actor.system.fortuna?.actual ?? 0;
      const content = await foundry.applications.handlebars.renderTemplate(
        "systems/tierras-quebradas/templates/dialogs/fortuna-dialogo.hbs", { fortActual }
      );
      const eleccion = await DialogV2.wait({
        window: { title: "Tirada por Fortuna" },
        classes: ["tq-tirada-dialog"],
        content,
        rejectClose: false,
        buttons: [
          {
            action: "tirar", label: game.i18n.localize("TQ.Botones.Lanzar"), default: true,
            callback: (_ev, button) => {
              const campos = button.form.elements;
              return {
                dificultad: parseInt(campos.dificultad?.value) || 15,
                bonificador: parseInt(campos.bonificador?.value) || 0
              };
            }
          },
          { action: "cancelar", label: game.i18n.localize("TQ.Cancelar") || "Cancelar", callback: () => null }
        ]
      });
      if (!eleccion) return;
      await TQRoll.tirar("Fortuna", fortActual, eleccion.dificultad, { actor, bonificador: eleccion.bonificador });
    });

    el.querySelector(".btn-print-ficha")?.addEventListener("click", async () => {
      const data = await this._prepareContext({});
      await printActorPDF(this.actor, data);
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
