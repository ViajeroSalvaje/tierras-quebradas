import { HABILIDADES_OPCIONES } from "../helpers/habilidades.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class TQLinkCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-link-creator",
    classes: ["tierras-quebradas", "tq-link-creator"],
    position: { width: 380, height: "auto" },
    window: { title: "TQ.LinkCreator.Titulo", resizable: false, minimizable: true }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/tq-link-creator.hbs" }
  };

  #tipo = "caracteristica";
  #valor = "cuerpo";
  #dificultad = 12;
  #modificador = 0;
  #rollMode = "publicroll";
  #jugadorId = "";

  static OPCIONES = {
    caracteristica: [
      { key: "cuerpo", label: "Cuerpo" },
      { key: "mente", label: "Mente" },
      { key: "espiritu", label: "Espíritu" },
      { key: "atractivo", label: "Atractivo" },
      { key: "tamano", label: "Tamaño" },
      { key: "fuerza", label: "Fuerza" }
    ],
    base: [
      { key: "agilidad", label: "Agilidad" },
      { key: "comunicacion", label: "Comunicación" },
      { key: "cultura", label: "Cultura" },
      { key: "percepcion", label: "Percepción" },
      { key: "tecnica", label: "Técnica" },
      { key: "vigor", label: "Vigor" }
    ],
    habilidad: HABILIDADES_OPCIONES.map(h => ({ key: h.clave, label: h.label })),
    hechiceria: [
      { key: "hechiceria", label: "Hechicería" },
      { key: "fortuna", label: "Fortuna" }
    ],
    verbo: [
      { key: "aumentar", label: "Aumentar" },
      { key: "conocer", label: "Conocer" },
      { key: "disminuir", label: "Disminuir" },
      { key: "dirigir", label: "Dirigir" },
      { key: "inhibir", label: "Inhibir" },
      { key: "invocar", label: "Invocar" },
      { key: "modificar", label: "Modificar" },
      { key: "transformar", label: "Transformar" }
    ],
    esfera: [
      { key: "agua", label: "Agua" },
      { key: "aire", label: "Aire" },
      { key: "fuego", label: "Fuego" },
      { key: "tierra", label: "Tierra" },
      { key: "cuerpo", label: "Cuerpo" },
      { key: "espiritu", label: "Espíritu" },
      { key: "mente", label: "Mente" },
      { key: "planta", label: "Planta" },
      { key: "caos", label: "Caos" },
      { key: "ley", label: "Ley" }
    ]
  };

  async _prepareContext() {
    const jugadores = game.users.filter(u => !u.isGM && u.active).map(u => ({ key: u.id, label: u.name }));
    return {
      tipo: this.#tipo,
      valor: this.#valor,
      dificultad: this.#dificultad,
      modificador: this.#modificador,
      rollMode: this.#rollMode,
      jugadorId: this.#jugadorId,
      tipos: [
        { key: "caracteristica", label: "Característica" },
        { key: "base", label: "Base de Habilidad" },
        { key: "habilidad", label: "Habilidad" },
        { key: "hechiceria", label: "Hechicería y Fortuna" },
        { key: "verbo", label: "Verbo" },
        { key: "esfera", label: "Esfera" }
      ],
      opciones: TQLinkCreator.OPCIONES[this.#tipo] ?? [],
      rollModes: [
        { key: "publicroll", label: "Pública" },
        { key: "gmroll", label: "Privada" },
        { key: "blindroll", label: "Oculta" }
      ],
      jugadores
    };
  }

  _onRender(_context, _options) {
    const el = this.element;

    el.querySelector("[name='tipo']")?.addEventListener("change", ev => {
      this.#tipo = ev.target.value;
      const opciones = TQLinkCreator.OPCIONES[this.#tipo] ?? [];
      this.#valor = opciones[0]?.key ?? "";
      const valorSel = el.querySelector("[name='valor']");
      if (valorSel) {
        valorSel.innerHTML = opciones.map(o => `<option value="${o.key}">${o.label}</option>`).join("");
        valorSel.value = this.#valor;
      }
    });

    el.querySelector("[name='valor']")?.addEventListener("change", ev => { this.#valor = ev.target.value; });

    const slider = el.querySelector("[name='dificultad']");
    const difDisplay = el.querySelector(".tq-dif-display");
    slider?.addEventListener("input", ev => {
      this.#dificultad = parseInt(ev.target.value);
      if (difDisplay) difDisplay.textContent = ev.target.value;
    });

    el.querySelector("[name='modificador']")?.addEventListener("change", ev => { this.#modificador = parseInt(ev.target.value) || 0; });
    el.querySelector("[name='rollMode']")?.addEventListener("change", ev => { this.#rollMode = ev.target.value; });
    el.querySelector("[name='jugadorId']")?.addEventListener("change", ev => { this.#jugadorId = ev.target.value; });

    el.querySelector("[data-action='copiar-chat']")?.addEventListener("click", () => this._enviarChat(false));
    el.querySelector("[data-action='enviar-jugador']")?.addEventListener("click", () => this._enviarChat(true));
    el.querySelector("[data-action='copiar-portapapeles']")?.addEventListener("click", () => this._copiarPortapapeles());
  }

  _buildLink() {
    const tipo = this.#tipo;
    const valor = this.#valor;
    const dif = this.#dificultad;
    const mod = this.#modificador;
    const label = TQLinkCreator.OPCIONES[tipo]?.find(o => o.key === valor)?.label ?? valor;
    const modStr = mod !== 0 ? `, ${mod > 0 ? "+" : ""}${mod}` : "";
    return `<a class="tq-roll-link" data-tipo="${tipo}" data-valor="${valor}" data-dificultad="${dif}" data-modificador="${mod}" data-rollmode="${this.#rollMode}">${label} (Dif. ${dif}${modStr})</a>`;
  }

  async _enviarChat(aJugador) {
    if (aJugador && !this.#jugadorId) {
      ui.notifications.warn(game.i18n.localize("TQ.LinkCreator.EligeJugador"));
      return;
    }
    const enlace = this._buildLink();
    const whisper = aJugador && this.#jugadorId ? [this.#jugadorId] : [];
    await ChatMessage.create({
      content: `<div class="tq-link-mensaje"><p><strong>${game.i18n.localize("TQ.LinkCreator.ClickParaTirar")}</strong></p><p>${enlace}</p></div>`,
      whisper
    });
  }

  async _copiarPortapapeles() {
    const html = this._buildLink();
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([html], { type: "text/plain" })
    })]);
    ui.notifications.info(game.i18n.localize("TQ.LinkCreator.Copiado"));
  }

  static resolveValue(actor, tipo, valor) {
    const sys = actor.system;
    switch (tipo) {
      case "caracteristica": {
        const puntuacion = valor === "fuerza"
          ? (sys.derivadas?.fuerza?.valor ?? 0)
          : (sys.caracteristicas?.[valor]?.valor ?? 0);
        return {
          puntuacion,
          etiqueta: TQLinkCreator.OPCIONES.caracteristica.find(o => o.key === valor)?.label ?? valor
        };
      }
      case "base":
        return {
          puntuacion: sys.bases?.[valor]?.valor ?? 0,
          etiqueta: TQLinkCreator.OPCIONES.base.find(o => o.key === valor)?.label ?? valor
        };
      case "habilidad": {
        const hab = sys.habilidades?.[valor];
        const baseVal = hab ? (sys.bases?.[hab.base]?.valor ?? 0) : 0;
        return {
          puntuacion: baseVal + (hab?.nivel ?? 0),
          etiqueta: TQLinkCreator.OPCIONES.habilidad.find(o => o.key === valor)?.label ?? valor
        };
      }
      case "hechiceria":
        if (valor === "fortuna") return {
          puntuacion: sys.fortuna?.actual ?? 0,
          etiqueta: "Fortuna"
        };
        return {
          puntuacion: sys.bases?.hechiceria?.valor ?? 0,
          etiqueta: "Hechicería"
        };
      case "verbo": {
        const baseHech = sys.bases?.hechiceria?.valor ?? 0;
        const nivel = sys.hechiceria?.verbos?.[valor] ?? 0;
        return {
          puntuacion: baseHech + nivel,
          etiqueta: TQLinkCreator.OPCIONES.verbo.find(o => o.key === valor)?.label ?? valor
        };
      }
      case "esfera": {
        const baseHech = sys.bases?.hechiceria?.valor ?? 0;
        const nivel = sys.hechiceria?.esferas?.[valor] ?? 0;
        return {
          puntuacion: baseHech + nivel,
          etiqueta: TQLinkCreator.OPCIONES.esfera.find(o => o.key === valor)?.label ?? valor
        };
      }
      default:
        return { puntuacion: 0, etiqueta: valor };
    }
  }
}
