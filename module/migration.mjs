export async function migrarSuenhos() {
  console.log("Tierras Quebradas | Migración 2.5.0: renombrando clave 'sueños' → 'suenhos'");
  let count = 0;

  for (const actor of game.actors) {
    const habs = actor.system.habilidades ?? {};
    if (!("sueños" in habs)) continue;
    const valor = habs["sueños"];
    await actor.update({
      "system.habilidades.suenhos": valor,
      "system.habilidades.-=sueños": null
    });
    count++;
  }

  // Actualizar el compendio de habilidades
  const pack = game.packs.get("tierras-quebradas.habilidades");
  if (pack) {
    const docs = await pack.getDocuments();
    const suenos = docs.find(d => d.system.clave === "sueños");
    if (suenos) await suenos.update({ "system.clave": "suenhos" });
  }

  console.log(`Tierras Quebradas | Migración 2.5.0 completada. Actores migrados: ${count}`);
}
