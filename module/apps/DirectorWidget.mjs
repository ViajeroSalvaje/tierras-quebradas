const { HandlebarsApplicationMixin, ApplicationV2, DialogV2 } = foundry.applications.api;

export class DirectorWidget extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-director-widget", classes: ["tierras-quebradas", "director-widget"], position: { width: 230, height: "auto", top: 80, left: 5 }, window: { title: "Director", resizable: false, minimizable: true }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/apps/director-widget.hbs"
    }
  };

  get title() { return game.i18n.localize("TQ.Director.Titulo"); }

  async _prepareContext() {
    return {
      infortunio: game.settings.get("tierras-quebradas", "infortunio"), pxAventura: game.settings.get("tierras-quebradas", "pxAventura")
    };
  }

  _onRender(_context, _options) {
    const el = this.element;

    el.querySelector(".inf-menos")?.addEventListener("click", () => this._cambiarInfortunio(-1));
    el.querySelector(".inf-mas")?.addEventListener("click", () => this._cambiarInfortunio(1));

    const pxInput = el.querySelector(".px-aventura-input");
    if (pxInput) pxInput.addEventListener("change", async ev => {
      const valor = Math.max(1, parseInt(ev.target.value) || 3);
      await game.settings.set("tierras-quebradas", "pxAventura", valor);
    });

    el.querySelector(".despertar-pasion-btn")?.addEventListener("click", () => this._despertarPasion());
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

  async _despertarPasion() {
    const pjs = game.actors.filter(a => a.type === "pj");
    if (!pjs.length) return ui.notifications.warn(game.i18n.localize("TQ.Director.NoPJs"));

    const pjOptions = pjs.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
    const html = `<div style="display:grid;gap:8px;padding:4px;">
      <div>
        <label>${game.i18n.localize("TQ.Director.Personaje")}</label>
        <select id="tq-dp-pj" style="width:100%;">${pjOptions}</select>
      </div>
      <div>
        <label>${game.i18n.localize("TQ.Director.Pasion")}</label>
        <select id="tq-dp-tipo" style="width:100%;">
          <option value="amor">Amor</option>
          <option value="odio">Odio</option>
        </select>
      </div>
      <div>
        <label>${game.i18n.localize("TQ.Director.DifResistencia")}</label>
        <select id="tq-dp-dif" style="width:100%;">
          <option value="9">Fácil (9)</option>
          <option value="12" selected>Normal (12)</option>
          <option value="15">Difícil (15)</option>
          <option value="18">Muy Difícil (18)</option>
        </select>
      </div>
    </div>`;

    const result = await DialogV2.prompt({
      window: { title: game.i18n.localize("TQ.Botones.DespertarPasion"), width: 280 }, content: html, ok: { label: game.i18n.localize("TQ.Director.Despertar"), callback: () => ({
        actorId: document.getElementById("tq-dp-pj").value, tipo: document.getElementById("tq-dp-tipo").value, dificultad: parseInt(document.getElementById("tq-dp-dif").value) || 15
      })}
    });
    if (!result) return;

    const actor = game.actors.get(result.actorId);
    if (!actor) return;
    const pasionNombre = result.tipo === "amor"
      ? (actor.system.pasionAmor || "Amor")
      : (actor.system.pasionOdio || "Odio");

    await ChatMessage.create({
      content: `<div class="tq-result-card complicacion">
        <div class="tq-card-titulo">${game.i18n.localize("TQ.Botones.DespertarPasion")}</div>
        <hr/>
        <p>${game.i18n.format("TQ.Director.DespertarDesc", { actor: `<strong>${actor.name}</strong>`, pasion: `<em>${pasionNombre}</em>` })}</p>
        <p>${game.i18n.format("TQ.Director.DespertarInstr", { dificultad: `<strong>${result.dificultad}</strong>` })}</p>
        <div class="tq-card-botones">
          <button class="tq-aplicar-pasion" style="display:none"
                  data-actor-id="${result.actorId}"
                  data-pasion-tipo="${result.tipo}">
            ${game.i18n.localize("TQ.Director.AplicarPasion")}
          </button>
        </div>
      </div>`
    });
  }

  async _finSesion() {
    const actores = this._getPJsActivos();
    if (!actores.length) return ui.notifications.warn(game.i18n.localize("TQ.Director.NoActivos"));
    for (const actor of actores) {
      await actor.aplicarFinDeSesionPX();
      await actor.aplicarFinSesion();
    }
  }

  async _finAventura() {
    const actores = this._getPJsActivos();
    if (!actores.length) return ui.notifications.warn(game.i18n.localize("TQ.Director.NoActivos"));
    const px = game.settings.get("tierras-quebradas", "pxAventura");
    for (const actor of actores) {
      await actor.asignarPXHito(px);
    }
  }
}
