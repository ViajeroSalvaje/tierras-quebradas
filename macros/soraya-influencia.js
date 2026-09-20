// Macro: Soraya — Mecánica de Influencia
const { DialogV2 } = foundry.applications.api;

const tokensPJ = canvas.tokens.placeables.filter(t => t.actor?.type === "pj");
if (!tokensPJ.length) return ui.notifications.warn("No hay tokens de PJ en el canvas.");

const config = await DialogV2.wait({
  window: { title: "Influencia de Soraya" },
  content: `<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">
    <div>
      <label><strong>Portador del ídolo:</strong></label><br>
      <select name="portador" style="width:100%;margin-top:4px">
        ${tokensPJ.map(t => `<option value="${t.actor.id}">${t.actor.name}</option>`).join("")}
      </select>
    </div>
    <label style="display:flex;align-items:center;gap:6px">
      <input type="checkbox" name="biblioteca"/>
      Visitaron la Biblioteca antes (+4 al portador)
    </label>
  </div>`,
  rejectClose: false,
  buttons: [{
    action: "confirmar",
    label: "Confirmar",
    default: true,
    callback: (_ev, btn) => ({
      actorId: btn.form.elements.portador.value,
      biblioteca: btn.form.elements.biblioteca.checked
    })
  }]
});
if (!config) return;

const portador = game.actors.get(config.actorId);
if (!portador) return ui.notifications.warn("No se encontró el actor portador.");

const espSoraya = 14;
const espPortador = (portador.system.caracteristicas?.espiritu?.valor ?? 0) + (config.biblioteca ? 4 : 0);
const modDesglose = config.biblioteca
  ? [{ label: "Investigación en la Biblioteca", valor: 4, signo: "+", valorAbs: 4 }]
  : null;

const resSoraya = await TQRoll.dialogoTirada("Espíritu (Enfrentada) — Soraya", espSoraya, { dificultadPorDefecto: 0 });
if (!resSoraya) return;

const resPortador = await TQRoll.dialogoTirada(
  `Espíritu (Enfrentada) — ${portador.name}`,
  espPortador,
  { dificultadPorDefecto: 0, actor: portador, modDesglose }
);
if (!resPortador) return;

const diferencia = resSoraya.total - resPortador.total;

let titulo, descripcion;
if (diferencia > 0) {
  titulo = "Soraya gana";
  descripcion = `<strong>${portador.name}</strong> cede a la influencia de Soraya. El portador del ídolo actúa conforme a la voluntad del fantasma.`;
} else {
  titulo = diferencia === 0 ? "Empate — Soraya no logra imponerse" : "El portador resiste";
  descripcion = `<strong>${portador.name}</strong> resiste la influencia de Soraya. El fantasma no consigue doblegar su voluntad.`;
}

await ChatMessage.create({
  content: `<div class="tq-result-card complicacion">
    <p><strong>Influencia de Soraya — ${titulo}</strong></p>
    <p style="font-size:0.85em;opacity:0.75">Soraya ${resSoraya.total} vs ${portador.name} ${resPortador.total} (diferencia ${diferencia >= 0 ? "+" : ""}${diferencia})</p>
    <hr>
    <p>${descripcion}</p>
  </div>`,
  ...TQRoll._rollModeData()
});
