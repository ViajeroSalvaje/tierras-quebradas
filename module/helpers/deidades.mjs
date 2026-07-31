async function _cargar() {
  const pack = game.packs.get("tierras-quebradas.deidades");
  const docs = pack ? await pack.getDocuments() : [];
  const g = { ley: [], caos: [], elementos: [], antepasados: [] };
  for (const d of docs.sort((a, b) => a.name.localeCompare(b.name, "es"))) {
    g[d.system.tipo]?.push(d.name);
  }
  return g;
}

export async function getDeidadesGrupos() {
  const g = await _cargar();
  return [
    { nombre: game.i18n.localize("TQ.Lealtad.ley"),         deidades: g.ley },
    { nombre: game.i18n.localize("TQ.Lealtad.caos"),        deidades: g.caos },
    { nombre: game.i18n.localize("TQ.Lealtad.elementos"),   deidades: g.elementos },
    { nombre: game.i18n.localize("TQ.Lealtad.antepasados"), deidades: g.antepasados }
  ];
}

export async function getDeidadesPorIdeologia() {
  const g = await _cargar();
  const todas = [...new Set([...g.ley, ...g.caos, ...g.elementos, ...g.antepasados])]
    .sort((a, b) => a.localeCompare(b, "es"));
  return {
    ley: g.ley,
    caos: g.caos,
    elementales: g.elementos,
    antepasados: g.antepasados,
    sincretismo: todas,
    equilibrio: [],
    sinReligion: []
  };
}
