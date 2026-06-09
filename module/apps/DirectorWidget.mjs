const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class DirectorWidget extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-director-widget",
    classes: ["tierras-quebradas", "director-widget"],
    position: { width: 230, height: "auto", top: 80, left: 5 },
    window: { title: "Director", resizable: false, minimizable: true }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/apps/director-widget.hbs"
    }
  };

  _pxAventura = 3;

  async _prepareContext() {
    return {
      infortunio: game.settings.get("tierras-quebradas", "infortunio"),
      pxAventura: this._pxAventura
    };
  }

  _onRender(_context, _options) {
    const el = this.element;

    el.querySelector(".inf-menos")?.addEventListener("click", () => this._cambiarInfortunio(-1));
    el.querySelector(".inf-mas")?.addEventListener("click", () => this._cambiarInfortunio(1));

    const pxInput = el.querySelector(".px-aventura-input");
    if (pxInput) pxInput.addEventListener("change", ev => {
      this._pxAventura = Math.max(1, parseInt(ev.target.value) || 3);
    });

    el.querySelector(".fin-sesion-btn")?.addEventListener("click", () => this._finSesion());
    el.querySelector(".fin-aventura-btn")?.addEventListener("click", () => this._finAventura());
  }

  async _cambiarInfortunio(delta) {
    const actual = game.settings.get("tierras-quebradas", "infortunio");
    await game.settings.set("tierras-quebradas", "infortunio", Math.max(0, actual + delta));
    this.render();
  }

  _getPJsActivos() {
    return game.users.filter(u => u.active && u.character).map(u => u.character);
  }

  async _finSesion() {
    const actores = this._getPJsActivos();
    if (!actores.length) return ui.notifications.warn("No hay jugadores activos con personaje asignado.");
    for (const actor of actores) {
      await actor.aplicarFinDeSesionPX();
      await actor.aplicarFinSesion();
    }
  }

  async _finAventura() {
    const actores = this._getPJsActivos();
    if (!actores.length) return ui.notifications.warn("No hay jugadores activos con personaje asignado.");
    for (const actor of actores) {
      await actor.asignarPXHito(this._pxAventura);
    }
  }
}
