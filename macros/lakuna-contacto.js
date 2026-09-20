// Macro: Lakuna — Contacto (forma física)
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
  arma = actor.items.find(i => i.name.toLowerCase().includes("contacto"));
}
if (!actor) return ui.notifications.warn("No se pudo determinar el actor de la lakuna.");
if (!arma) return ui.notifications.warn("No se encontró el arma 'Contacto' en la ficha de la lakuna.");

const targets = [...game.user.targets];
if (!targets.length) return ui.notifications.warn("Marca un objetivo con la herramienta de objetivo.");
const target = targets[0].actor;

// Ataque
const resultadoAtaque = await actor.tirarArma(arma.id);
if (!resultadoAtaque) return;
if (!(resultadoAtaque.exitos >= 0 || resultadoAtaque.autoExito)) return;

// Tiradas enfrentadas de Espíritu
const espirituLakuna = actor.system.caracteristicas?.espiritu?.valor ?? 0;
const espirituObj = target.system.caracteristicas?.espiritu?.valor ?? 0;

const resLakuna = await TQRoll.dialogoTirada(
  `Espíritu (Enfrentada) — ${actor.name}`,
  espirituLakuna,
  { dificultadPorDefecto: 0, actor }
);
if (!resLakuna) return;

const resObjetivo = await TQRoll.dialogoTirada(
  `Espíritu (Enfrentada) — ${target.name}`,
  espirituObj,
  { dificultadPorDefecto: 0, actor: target }
);
if (!resObjetivo) return;

const totalLakuna = resLakuna.total;
const totalObjetivo = resObjetivo.total;
const diferencia = totalLakuna - totalObjetivo;

let titulo, descripcion, cardExtra = "";

if (diferencia < 0) {
  titulo = "El objetivo gana";
  descripcion = `<strong>${target.name}</strong> resiste. La lakuna no puede atacar al mismo objetivo el siguiente turno.`;

} else if (diferencia === 0) {
  const r = new Roll("1d6");
  await r.evaluate();
  titulo = "Empate";
  descripcion = `<strong>${target.name}</strong> pierde un fragmento menor de su identidad (nombre, oficio…) durante <strong>${r.total} turno${r.total > 1 ? "s" : ""}</strong>.`;

} else if (diferencia < 10) {
  titulo = "La lakuna gana";
  descripcion = `<strong>${target.name}</strong> pierde <strong>2 PV</strong> y olvida quién es hasta que alguien la ayude activamente a recordar (un turno completo + tirada de Encanto o Persuadir Dif. 10).`;

} else {
  // Victoria crítica (diferencia ≥ 10)
  const datosCritico = await DialogV2.wait({
    window: { title: "Victoria crítica — condiciones" },
    content: `<div style="display:flex;flex-direction:column;gap:10px;padding:4px 0">
      <div>
        <label><strong>Otras lakunas alimentándose del mismo objetivo:</strong></label><br>
        <input type="number" name="otras_lakunas" value="0" min="0" style="width:60px;margin-top:4px"/>
      </div>
      <label style="display:flex;align-items:center;gap:6px">
        <input type="checkbox" name="identidad_danada"/>
        El objetivo ya tenía la identidad dañada
      </label>
    </div>`,
    rejectClose: false,
    buttons: [{
      action: "confirmar",
      label: "Confirmar",
      default: true,
      callback: (_ev, btn) => {
        const c = btn.form.elements;
        return {
          otrasLakunas: parseInt(c.otras_lakunas?.value) || 0,
          identidadDanada: c.identidad_danada?.checked ?? false
        };
      }
    }]
  });
  if (!datosCritico) return;

  const { otrasLakunas, identidadDanada } = datosCritico;
  titulo = "Victoria crítica (diferencia ≥ 10)";
  descripcion = `<strong>${target.name}</strong> pierde <strong>2 PV</strong> y olvida quién es.`;

  if (otrasLakunas > 0 || identidadDanada) {
    const modMuerte = otrasLakunas > 0
      ? [{ label: `${otrasLakunas} lakuna${otrasLakunas > 1 ? "s" : ""} adicional${otrasLakunas > 1 ? "es" : ""}`, valor: -otrasLakunas, signo: "−", valorAbs: otrasLakunas }]
      : null;

    descripcion += ` <strong>¡Riesgo de muerte!</strong> Debe superar una tirada de Espíritu (Dif. 10${otrasLakunas > 0 ? `, −${otrasLakunas} por lakunas adicionales` : ""}).`;

    const resMuerte = await TQRoll.dialogoTirada(
      `Espíritu (muerte) — ${target.name}`,
      espirituObj,
      { dificultadPorDefecto: 10, actor: target, modDesglose: modMuerte }
    );
    if (resMuerte) {
      const sobrevive = resMuerte.exitos >= 0 || resMuerte.autoExito;
      cardExtra = sobrevive
        ? `<p><strong>${target.name}</strong> supera la tirada de muerte. Sobrevive, pero olvida quién es.</p>`
        : `<p><strong>${target.name}</strong> falla la tirada de muerte. <strong>Muere</strong> mientras su identidad es borrada por completo.</p>`;
    }
  }
}

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  content: `<div class="tq-result-card complicacion">
    <p><strong>Contacto — ${titulo}</strong></p>
    <p style="font-size:0.85em;opacity:0.75">${actor.name} ${totalLakuna} vs ${target.name} ${totalObjetivo} (diferencia ${diferencia >= 0 ? "+" : ""}${diferencia})</p>
    <hr>
    <p>${descripcion}</p>
    ${cardExtra}
  </div>`,
  ...TQRoll._rollModeData()
});
