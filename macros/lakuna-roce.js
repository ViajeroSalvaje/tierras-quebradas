// Macro: Lakuna — Roce (forma difusa)
const { DialogV2 } = foundry.applications.api;

// Obtener actor y arma: desde el botón de la ficha (ctx) o desde el token seleccionado
const ctx = globalThis._tqLakunaMacroCtx;
let actor, arma;
if (ctx) {
  actor = game.actors.get(ctx.actorId)
    ?? canvas.tokens.placeables.find(t => t.actor?.id === ctx.actorId)?.actor;
  arma = actor?.items.get(ctx.itemId);
} else {
  const token = canvas.tokens.controlled[0];
  if (!token) return ui.notifications.warn("Selecciona el token de la lakuna.");
  actor = token.actor;
  arma = actor.items.find(i => i.name.toLowerCase().includes("roce"));
}
if (!actor) return ui.notifications.warn("No se pudo determinar el actor de la lakuna.");
if (!arma) return ui.notifications.warn("No se encontró el arma 'Roce' en la ficha de la lakuna.");

const targets = [...game.user.targets];
if (!targets.length) return ui.notifications.warn("Marca un objetivo con la herramienta de objetivo.");
const target = targets[0].actor;

const resultadoAtaque = await actor.tirarArma(arma.id);
if (!resultadoAtaque) return;
if (!(resultadoAtaque.exitos >= 0 || resultadoAtaque.autoExito)) return;

const espirituObj = target.system.caracteristicas?.espiritu?.valor ?? 0;
const resultadoEspiritu = await TQRoll.dialogoTirada(
  `Espíritu — ${target.name}`,
  espirituObj,
  { dificultadPorDefecto: 10, actor: target }
);
if (!resultadoEspiritu) return;

const resistio = resultadoEspiritu.exitos >= 0 || resultadoEspiritu.autoExito;
const descripcion = resistio
  ? `<strong>${target.name}</strong> resiste. No pierde PV ni recuerdos.`
  : `<strong>${target.name}</strong> falla. Pierde <strong>1 PV</strong> y un recuerdo reciente (a elección del DJ). La víctima no es consciente de que ha olvidado algo.`;

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="tq-result-card complicacion">
    <p><strong>Roce — Resultado</strong></p>
    <hr>
    <p>${descripcion}</p>
  </div>`,
  ...TQRoll._rollModeData()
});
