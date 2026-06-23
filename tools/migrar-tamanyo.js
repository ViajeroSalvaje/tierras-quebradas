// Macro de migración: renombra tamanyo → tamano en compendios de criaturas y demonios.
// Ejecutar una sola vez desde Foundry: Macro → Nuevo → pegar este contenido → Ejecutar.

const packIds = ["tierras-quebradas.criaturas", "tierras-quebradas.demonios"];

for (const packId of packIds) {
  const pack = game.packs.get(packId);
  if (!pack) { ui.notifications.warn(`Pack no encontrado: ${packId}`); continue; }

  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  const docs = await pack.getDocuments();
  let count = 0;

  for (const doc of docs) {
    const tamanyo = doc.system?.caracteristicas?.tamanyo;
    if (tamanyo === undefined) continue;

    await doc.update({
      "system.caracteristicas.tamano.valor": tamanyo.valor ?? 0,
      "system.caracteristicas.-=tamanyo": null
    });
    count++;
    console.log(`[migración] ${doc.name}: tamanyo=${tamanyo.valor} → tamano`);
  }

  if (wasLocked) await pack.configure({ locked: true });
  ui.notifications.info(`${packId}: ${count} actores migrados.`);
}
