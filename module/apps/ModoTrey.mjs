import { TQRoll } from "../rolls/TQRoll.mjs";

export class ModoTrey {
  static ZONA_ID = "tq-modo-trey-zona";
  static COLORES = { d6: "#c0392b", d8: "#2980b9", d10: "#27ae60" };
  static ICONOS  = { d6: "fa-dice-d6", d8: "fa-dice-d8", d10: "fa-dice-d10" };

  static activar() {
    this._crearZona();
    ui.controls?.render();
  }

  static desactivar() {
    document.getElementById(this.ZONA_ID)?.remove();
    ui.controls?.render();
  }

  static _crearZona() {
    if (document.getElementById(this.ZONA_ID)) return;
    const zona = document.createElement("div");
    zona.id = this.ZONA_ID;
    zona.style.cssText = [
      "position:fixed", "left:0", "bottom:0",
      "width:20vw", "height:50vh",
      "background:rgba(0,0,0,0.35)",
      "border-top:2px solid rgba(255,200,80,0.4)",
      "border-right:2px solid rgba(255,200,80,0.4)",
      "border-radius:0 8px 0 0",
      "z-index:50", "overflow:hidden", "pointer-events:none"
    ].join(";");
    const label = document.createElement("div");
    label.style.cssText = "position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:10px;color:rgba(255,200,80,0.45);letter-spacing:2px;text-transform:uppercase;white-space:nowrap;";
    label.textContent = "zona trey";
    zona.appendChild(label);
    document.body.appendChild(zona);
  }

  static async lanzar() {
    if (!document.getElementById(this.ZONA_ID)) this._crearZona();

    const roll = await new Roll("1d6 + 1d8 + 1d10").evaluate();
    const valores = {
      d6:  roll.dice.find(t => t.faces === 6)?.results[0]?.result  ?? 0,
      d8:  roll.dice.find(t => t.faces === 8)?.results[0]?.result  ?? 0,
      d10: roll.dice.find(t => t.faces === 10)?.results[0]?.result ?? 0
    };

    const posiciones = this._generarPosiciones();

    if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, false, null, false, null, null).catch(() => {});

    this._colocarDadosEnZona(posiciones, valores);

    const ordenados = Object.entries(posiciones)
      .map(([dado, pos]) => ({ dado, y: pos.y }))
      .sort((a, b) => a.y - b.y);

    await this._publicarEnChat(valores, ordenados[0].dado, ordenados[1].dado, ordenados[2].dado);
  }

  static _generarPosiciones() {
    const MARGEN = 32;
    const anchoZona = window.innerWidth  * 0.20;
    const altoZona  = window.innerHeight * 0.50;
    const poss = {};
    const usadas = [];

    for (const dado of ["d6", "d8", "d10"]) {
      let x, y, tries = 0;
      do {
        x = MARGEN + Math.random() * (anchoZona - MARGEN * 2);
        y = MARGEN + Math.random() * (altoZona  - MARGEN * 2);
        tries++;
      } while (tries < 30 && usadas.some(p => Math.hypot(p.x - x, p.y - y) < 55));
      poss[dado] = { x, y };
      usadas.push({ x, y });
    }
    return poss;
  }

  static _colocarDadosEnZona(posiciones, valores) {
    const zona = document.getElementById(this.ZONA_ID);
    if (!zona) return;

    for (const [dado, pos] of Object.entries(posiciones)) {
      let el = zona.querySelector(`.tq-trey-dado[data-dado="${dado}"]`);
      if (!el) {
        el = document.createElement("div");
        el.className = "tq-trey-dado";
        el.dataset.dado = dado;
        el.style.cssText = [
          "position:absolute",
          "width:48px", "height:48px",
          "display:flex", "align-items:center", "justify-content:center",
          "pointer-events:none"
        ].join(";");
        zona.appendChild(el);
      }
      el.innerHTML =
        `<span style="position:relative;display:inline-flex;align-items:center;justify-content:center;">` +
        `<i class="fas ${this.ICONOS[dado]}" style="font-size:48px;color:${this.COLORES[dado]};line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7));"></i>` +
        `<span style="position:absolute;font-size:20px;font-weight:bold;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.9);">${valores[dado]}</span>` +
        `</span>`;
      el.style.left = `${pos.x - 24}px`;
      el.style.top  = `${pos.y - 24}px`;
    }
  }

  static async _publicarEnChat(valores, masArriba, enMedio, masAbajo) {
    const C = this.COLORES;
    const badge = d =>
      `<span style="display:inline-block;width:30px;text-align:center;background:${C[d]};color:#fff;border-radius:4px;font-size:11px;font-weight:bold;padding:2px 4px;">${d.toUpperCase()}</span>`;

    const filas = ["d6", "d8", "d10"].map(d =>
      `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">${badge(d)}<span style="font-size:16px;font-weight:bold;">${valores[d]}</span></div>`
    ).join("");

    const posRow = (icono, etq, d) =>
      `<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin:2px 0;"><i class="fas ${icono}"></i><span><strong>${etq}:</strong> ${d.toUpperCase()} — ${valores[d]}</span></div>`;

    const content = `<div class="tq-result-card">
      <p style="text-align:center;font-weight:bold;margin:0 0 6px;">Modo Trey</p>
      <hr>
      <div style="margin:6px 0;">${filas}</div>
      <hr>
      <div style="margin:6px 0;">
        ${posRow("fa-arrow-up",   "Más arriba",      masArriba)}
        ${posRow("fa-minus",      "Distancia media", enMedio)}
        ${posRow("fa-arrow-down", "Más abajo",       masAbajo)}
      </div>
    </div>`;

    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker(),
      ...TQRoll._rollModeData()
    });
  }
}
