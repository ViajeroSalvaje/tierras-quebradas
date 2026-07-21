// Macro de ejecución única: actualiza el img de cada habilidad del compendio.
// Pegar en una macro de Foundry (tipo Script) y ejecutar una vez.

const ICONOS = {
  academia:           "systems/tierras-quebradas/images/iconos/academia.svg",
  actuacion:          "systems/tierras-quebradas/images/iconos/actuacion.svg",
  artesania:          "systems/tierras-quebradas/images/iconos/artesania.svg",
  atletismo:          "systems/tierras-quebradas/images/iconos/atletismo.svg",
  buscar:             "systems/tierras-quebradas/images/iconos/buscar.svg",
  callejeo:           "systems/tierras-quebradas/images/iconos/callejeo.svg",
  conocimientoMagico: "systems/tierras-quebradas/images/iconos/conocimientoMagico.svg",
  disfrazarse:        "systems/tierras-quebradas/images/iconos/disfrazarse.svg",
  documentacion:      "systems/tierras-quebradas/images/iconos/documentacion.svg",
  encanto:            "systems/tierras-quebradas/images/iconos/encanto.svg",
  esquivar:           "systems/tierras-quebradas/images/iconos/esquivar.svg",
  estrategia:         "systems/tierras-quebradas/images/iconos/estrategia.svg",
  forzarCerraduras:   "systems/tierras-quebradas/images/iconos/forzarCerraduras.svg",
  hurtar:             "systems/tierras-quebradas/images/iconos/hurtar.svg",
  imponerse:          "systems/tierras-quebradas/images/iconos/imponerse.svg",
  instruir:           "systems/tierras-quebradas/images/iconos/instruir.svg",
  juego:              "systems/tierras-quebradas/images/iconos/juego.svg",
  lanzar:             "systems/tierras-quebradas/images/iconos/lanzar.svg",
  leyendas:           "systems/tierras-quebradas/images/iconos/leyendas.svg",
  manejarBotes:       "systems/tierras-quebradas/images/iconos/manejarBotes.svg",
  manejarCarros:      "systems/tierras-quebradas/images/iconos/manejarCarros.svg",
  manipulacion:       "systems/tierras-quebradas/images/iconos/manipulacion.svg",
  medicina:           "systems/tierras-quebradas/images/iconos/medicina.svg",
  memorizar:          "systems/tierras-quebradas/images/iconos/memorizar.svg",
  montar:             "systems/tierras-quebradas/images/iconos/montar.svg",
  multiverso:         "systems/tierras-quebradas/images/iconos/multiverso.svg",
  nadar:              "systems/tierras-quebradas/images/iconos/nadar.svg",
  naturaleza:         "systems/tierras-quebradas/images/iconos/naturaleza.svg",
  navegacion:         "systems/tierras-quebradas/images/iconos/navegacion.svg",
  ocultar:            "systems/tierras-quebradas/images/iconos/ocultar.svg",
  oratoria:           "systems/tierras-quebradas/images/iconos/oratoria.svg",
  pelea:              "systems/tierras-quebradas/images/iconos/pelea.svg",
  percatarse:         "systems/tierras-quebradas/images/iconos/percatarse.svg",
  perspicacia:        "systems/tierras-quebradas/images/iconos/perspicacia.svg",
  pociones:           "systems/tierras-quebradas/images/iconos/pociones.svg",
  primerosAuxilios:   "systems/tierras-quebradas/images/iconos/primerosAuxilios.svg",
  rastrear:           "systems/tierras-quebradas/images/iconos/rastrear.svg",
  seguir:             "systems/tierras-quebradas/images/iconos/seguir.svg",
  sigilo:             "systems/tierras-quebradas/images/iconos/sigilo.svg",
  sueños:             "systems/tierras-quebradas/images/iconos/sueños.svg",
  tierrasQuebradas:   "systems/tierras-quebradas/images/iconos/tierrasQuebradas.svg",
  tratarAnimales:     "systems/tierras-quebradas/images/iconos/tratarAnimales.svg",
  trepar:             "systems/tierras-quebradas/images/iconos/trepar.svg",
  idioma1:            "systems/tierras-quebradas/images/iconos/idioma1.svg",
  idioma2:            "systems/tierras-quebradas/images/iconos/idioma2.svg",
  idioma3:            "systems/tierras-quebradas/images/iconos/idioma3.svg",
  armasAsta:          "systems/tierras-quebradas/images/iconos/armasAsta.svg",
  escudo:             "systems/tierras-quebradas/images/iconos/escudo.svg",
  armasEspada:        "systems/tierras-quebradas/images/iconos/armasEspada.svg",
  armasMangos:        "systems/tierras-quebradas/images/iconos/armasMangos.svg",
  armasPunhal:        "systems/tierras-quebradas/images/iconos/armasPunhal.svg",
  arco:               "systems/tierras-quebradas/images/iconos/arco.svg",
  ballesta:           "systems/tierras-quebradas/images/iconos/ballesta.svg",
  canonDeMano:        "systems/tierras-quebradas/images/iconos/canonDeMano.svg",
  honda:              "systems/tierras-quebradas/images/iconos/honda.svg",
};

const pack = game.packs.get("tierras-quebradas.habilidades");
if (!pack) { ui.notifications.error("Compendio no encontrado"); return; }

await pack.configure({ locked: false });
const items = await pack.getDocuments();
let actualizados = 0;

for (const item of items) {
  const clave = item.system?.clave;
  const ruta = ICONOS[clave];
  if (ruta && item.img !== ruta) {
    await item.update({ img: ruta });
    actualizados++;
  }
}

await pack.configure({ locked: true });
ui.notifications.info(`Iconos actualizados: ${actualizados} habilidades.`);
