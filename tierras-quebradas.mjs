// Core
import { TQRoll } from "./module/rolls/TQRoll.mjs";
import { TQActor } from "./module/actors/TQActor.mjs";
import { TQItem } from "./module/items/TQItem.mjs";
import { TQCombat } from "./module/combat/TQCombat.mjs";

// Actor sheets
import { PJSheet } from "./module/actors/sheets/PJSheet.mjs";
import { PNJSheet } from "./module/actors/sheets/PNJSheet.mjs";
import { CriaturaSheet } from "./module/actors/sheets/CriaturaSheet.mjs";
import { DemonioSheet } from "./module/actors/sheets/DemonioSheet.mjs";

// Item sheets
import { ArmaSheet } from "./module/items/sheets/ArmaSheet.mjs";
import { ArmaduraSheet } from "./module/items/sheets/ArmaduraSheet.mjs";
import { HechizoSheet } from "./module/items/sheets/HechizoSheet.mjs";
import { VentajaSheet } from "./module/items/sheets/VentajaSheet.mjs";
import { RasgoSheet } from "./module/items/sheets/RasgoSheet.mjs";
import { PactoSheet } from "./module/items/sheets/PactoSheet.mjs";
import { BendicionSheet } from "./module/items/sheets/BendicionSheet.mjs";
import { EspecieSheet } from "./module/items/sheets/EspecieSheet.mjs";
import { EntornoSheet } from "./module/items/sheets/EntornoSheet.mjs";
import { OrigenSheet } from "./module/items/sheets/OrigenSheet.mjs";
import { ProfesionSheet } from "./module/items/sheets/ProfesionSheet.mjs";
import { IdiomaSheet } from "./module/items/sheets/IdiomaSheet.mjs";
import { ObjetoSheet } from "./module/items/sheets/ObjetoSheet.mjs";
import { ObjetoMagicoSheet } from "./module/items/sheets/ObjetoMagicoSheet.mjs";
import { ConsumibleSheet } from "./module/items/sheets/ConsumibleSheet.mjs";
import { HabilidadSheet } from "./module/items/sheets/HabilidadSheet.mjs";
import { DeidadSheet } from "./module/items/sheets/DeidadSheet.mjs";

// Helpers y apps
import { registerHandlebarsHelpers } from "./module/helpers/handlebars.mjs";
import { CharacterCreator } from "./module/apps/CharacterCreator.mjs";
import { PNJImporter } from "./module/apps/PNJImporter.mjs";
import { DemonioImporter } from "./module/apps/DemonioImporter.mjs";
import { CriaturaImporter } from "./module/apps/CriaturaImporter.mjs";
import { DirectorWidget } from "./module/apps/DirectorWidget.mjs";
import { TQLinkCreator } from "./module/apps/TQLinkCreator.mjs";
import { ModoTrey } from "./module/apps/ModoTrey.mjs";

const { Actors, Items } = foundry.documents.collections;
const { loadTemplates } = foundry.applications.handlebars;

Hooks.once("init", () => {
  console.log("Tierras Quebradas | Inicializando sistema");

  game.settings.register("tierras-quebradas", "infortunio", {
    scope: "world", config: false, type: Number, default: 0
  });

  game.settings.register("tierras-quebradas", "pxAventura", {
    scope: "world", config: false, type: Number, default: 3
  });

  const reRenderPJSheets = () => {
    for (const actor of game.actors?.filter(a => a.type === "pj") ?? []) {
      for (const app of Object.values(actor.apps)) app.render(true);
    }
  };

  game.settings.register("tierras-quebradas", "blindRollHabilidades", {
    name: "Activar tiradas ciegas", hint: "Buscar, Disfrazarse, Documentación, Imponerse, Manipular, Ocultar, Percatarse, Perspicacia, Rastrear y Sigilo se lanzan automáticamente en modo tirada ciega cuando las hacen los jugadores.", scope: "world", config: true, type: Boolean, default: false
  });

  game.settings.register("tierras-quebradas", "mostrarSimboloLealtad", {
    name: "Lealtad en ficha (general)", hint: "Muestra el símbolo de la lealtad dominante del personaje en la cabecera de su ficha.", scope: "world", config: true, type: Boolean, default: true, onChange: reRenderPJSheets
  });

  game.settings.register("tierras-quebradas", "mostrarSimboloLealtadJugador", {
    name: "Lealtad en ficha (personal)", hint: "Activa o desactiva el símbolo de lealtad en las fichas para el jugador.", scope: "client", config: true, type: Boolean, default: true, onChange: reRenderPJSheets
  });

  game.settings.register("tierras-quebradas", "lealtadesEnTexto", {
    name: "Lealtades en texto", hint: "Muestra las lealtades con etiquetas de texto y valores en círculo, en lugar de los iconos por defecto.", scope: "client", config: true, type: Boolean, default: false, onChange: reRenderPJSheets
  });

  game.settings.register("tierras-quebradas", "modoTrey", {
    name: "Activar modo Trey",
    hint: "Muestra una zona de lanzamiento de dados en la esquina inferior izquierda. Añade un botón en los controles para lanzar D6+D8+D10.",
    scope: "client", config: true, type: Boolean, default: false,
    onChange: value => value ? ModoTrey.activar() : ModoTrey.desactivar()
  });

  CONFIG.TQ = {
    dificultades: {
      10: "TQ.Tirada.Facil", 15: "TQ.Tirada.Normal", 20: "TQ.Tirada.Dificil", 25: "TQ.Tirada.MuyDificil"
    }
  };

  CONFIG.Combat.initiative = {
    formula: "@caracteristicas.mente.valor", decimals: 0
  };

  // Estados de combate
  CONFIG.statusEffects = [
    { id: "debilitado", name: "TQ.Salud.debilitado", icon: "icons/svg/downgrade.svg" }, { id: "incapacitado", name: "TQ.Salud.incapacitado", icon: "icons/svg/daze.svg" }, { id: "sanando", name: "TQ.Salud.sanando", icon: "icons/svg/regen.svg" }, { id: "desangre", name: "TQ.Salud.desangre", icon: "icons/svg/blood.svg" }, { id: "dolorExtremo", name: "TQ.Salud.dolorExtremo", icon: "icons/svg/paralysis.svg" }, { id: "piernaInutilizada", name: "TQ.Salud.piernaInutilizada", icon: "icons/svg/falling.svg" }, { id: "brazoInutilizado", name: "TQ.Salud.brazoInutilizado", icon: "icons/svg/arm.svg" }, { id: "agonia", name: "TQ.Salud.agonia", icon: "icons/svg/stoned.svg" }, { id: "dead", name: "TQ.Salud.muerto", icon: "icons/svg/skull.svg" }
  ];

  CONFIG.Actor.documentClass = TQActor;
  CONFIG.Item.documentClass = TQItem;
  CONFIG.Combat.documentClass = TQCombat;

  Actors.registerSheet("tierras-quebradas", PJSheet, { types: ["pj"], makeDefault: true, label: "TQ.Actor.Types.pj" });
  Actors.registerSheet("tierras-quebradas", PNJSheet, { types: ["pnj"], makeDefault: true, label: "TQ.Actor.Types.pnj" });
  Actors.registerSheet("tierras-quebradas", CriaturaSheet, { types: ["criatura"], makeDefault: true, label: "TQ.Actor.Types.criatura" });
  Actors.registerSheet("tierras-quebradas", DemonioSheet, { types: ["demonio"], makeDefault: true, label: "TQ.Actor.Types.demonio" });

  Items.registerSheet("tierras-quebradas", ArmaSheet, { types: ["arma"], makeDefault: true, label: "TQ.Item.Types.arma" });
  Items.registerSheet("tierras-quebradas", ArmaduraSheet, { types: ["armadura"], makeDefault: true, label: "TQ.Item.Types.armadura" });
  Items.registerSheet("tierras-quebradas", HechizoSheet, { types: ["hechizo"], makeDefault: true, label: "TQ.Item.Types.hechizo" });
  Items.registerSheet("tierras-quebradas", VentajaSheet, { types: ["ventaja"], makeDefault: true, label: "TQ.Item.Types.ventaja" });
  Items.registerSheet("tierras-quebradas", RasgoSheet, { types: ["rasgo"], makeDefault: true, label: "TQ.Item.Types.rasgo" });
  Items.registerSheet("tierras-quebradas", PactoSheet, { types: ["pacto"], makeDefault: true, label: "TQ.Item.Types.pacto" });
  Items.registerSheet("tierras-quebradas", BendicionSheet, { types: ["bendicion"], makeDefault: true, label: "TQ.Item.Types.bendicion" });
  Items.registerSheet("tierras-quebradas", EspecieSheet, { types: ["especie"], makeDefault: true, label: "TQ.Item.Types.especie" });
  Items.registerSheet("tierras-quebradas", EntornoSheet, { types: ["entorno"], makeDefault: true, label: "TQ.Item.Types.entorno" });
  Items.registerSheet("tierras-quebradas", OrigenSheet, { types: ["origen"], makeDefault: true, label: "TQ.Item.Types.origen" });
  Items.registerSheet("tierras-quebradas", ProfesionSheet, { types: ["profesion"], makeDefault: true, label: "TQ.Item.Types.profesion" });
  Items.registerSheet("tierras-quebradas", IdiomaSheet, { types: ["idioma"], makeDefault: true, label: "TQ.Item.Types.idioma" });
  Items.registerSheet("tierras-quebradas", ObjetoSheet, { types: ["objeto"], makeDefault: true, label: "TQ.Item.Types.objeto" });
  Items.registerSheet("tierras-quebradas", ObjetoMagicoSheet, { types: ["objetoMagico"], makeDefault: true, label: "TQ.Item.Types.objetoMagico" });
  Items.registerSheet("tierras-quebradas", ConsumibleSheet, { types: ["consumible"], makeDefault: true, label: "TQ.Item.Types.consumible" });
  Items.registerSheet("tierras-quebradas", HabilidadSheet, { types: ["habilidad"], makeDefault: true, label: "TQ.Item.Types.habilidad" });
  Items.registerSheet("tierras-quebradas", DeidadSheet, { types: ["deidad"], makeDefault: true, label: "TQ.Item.Types.deidad" });

  registerHandlebarsHelpers();

  loadTemplates([
    // Partials
    "systems/tierras-quebradas/templates/partials/_tab-combate-magia.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-caracteristicas.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-edad.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-origen.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-especie.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-entorno.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-profesion.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-ventajas.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-rasgos.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-equipo.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-habilidades.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-religion.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-magia.hbs", // Apps
    "systems/tierras-quebradas/templates/apps/character-creator.hbs", "systems/tierras-quebradas/templates/apps/pnj-importer.hbs", "systems/tierras-quebradas/templates/apps/demonio-importer.hbs", "systems/tierras-quebradas/templates/apps/criatura-importer.hbs", "systems/tierras-quebradas/templates/apps/director-widget.hbs", "systems/tierras-quebradas/templates/apps/tq-link-creator.hbs", // Actors
    "systems/tierras-quebradas/templates/actors/pj-sheet.hbs", "systems/tierras-quebradas/templates/actors/pnj-sheet.hbs", "systems/tierras-quebradas/templates/actors/criatura-sheet.hbs", "systems/tierras-quebradas/templates/actors/demonio-sheet.hbs", // Items
    "systems/tierras-quebradas/templates/items/objeto-magico-sheet.hbs", "systems/tierras-quebradas/templates/items/deidad-sheet.hbs", "systems/tierras-quebradas/templates/items/arma-sheet.hbs", "systems/tierras-quebradas/templates/items/armadura-sheet.hbs", "systems/tierras-quebradas/templates/items/hechizo-sheet.hbs", "systems/tierras-quebradas/templates/items/ventaja-sheet.hbs", "systems/tierras-quebradas/templates/items/rasgo-sheet.hbs", "systems/tierras-quebradas/templates/items/especie-sheet.hbs", "systems/tierras-quebradas/templates/items/idioma-sheet.hbs", "systems/tierras-quebradas/templates/items/objeto-sheet.hbs", "systems/tierras-quebradas/templates/items/consumible-sheet.hbs", "systems/tierras-quebradas/templates/items/habilidad-sheet.hbs", "systems/tierras-quebradas/templates/items/entorno-sheet.hbs", "systems/tierras-quebradas/templates/items/origen-sheet.hbs", "systems/tierras-quebradas/templates/items/profesion-sheet.hbs", // Dialogs
    "systems/tierras-quebradas/templates/dialogs/tirada-dialogo.hbs", "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion.hbs", "systems/tierras-quebradas/templates/dialogs/tablas-melee.hbs", "systems/tierras-quebradas/templates/dialogs/fortuna-dialogo.hbs"
  ]);
});

Hooks.once("ready", async () => {
  console.log("Tierras Quebradas | Sistema listo");
  if (game.settings.get("tierras-quebradas", "modoTrey")) ModoTrey.activar();
  if (!game.user.isGM) return;
  for (const pack of game.packs.filter(p => p.metadata.system === "tierras-quebradas")) {
    if (pack.locked) await pack.configure({ locked: false });
  }
  game.tq = game.tq ?? {};
  game.tq.directorWidget = new DirectorWidget();
  game.tq.directorWidget.render(true);
  game.tq.linkCreator = new TQLinkCreator();
  await _poblarHabilidades();
  await _poblarDeidades();
});

async function _poblarHabilidades() {
  const pack = game.packs.get("tierras-quebradas.habilidades");
  if (!pack) return;
  const existentes = await pack.getDocuments();
  if (existentes.length > 0) return;

  const HABILIDADES = [
    { name: "Academia", system: { clave: "academia", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Actuación", system: { clave: "actuacion", base: "comunicacion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Arco", system: { clave: "arco", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Armas de Asta", system: { clave: "armasAsta", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Armas de Espada", system: { clave: "armasEspada", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Armas de Mango", system: { clave: "armasMangos", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Armas de Puñal", system: { clave: "armasPunhal", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Artesanía", system: { clave: "artesania", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Atletismo", system: { clave: "atletismo", base: "agilidad", puntosFijos: 2, estorbo: 1, especializada: false } }, { name: "Ballesta", system: { clave: "ballesta", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Buscar", system: { clave: "buscar", base: "percepcion", puntosFijos: 1, estorbo: 0, especializada: false } }, { name: "Callejeo", system: { clave: "callejeo", base: "comunicacion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Cañón de Mano", system: { clave: "canonDeMano", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Conocimiento Mágico", system: { clave: "conocimientoMagico",base: "cultura", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Disfrazarse", system: { clave: "disfrazarse", base: "comunicacion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Documentación", system: { clave: "documentacion", base: "percepcion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Encanto", system: { clave: "encanto", base: "comunicacion", puntosFijos: 2, estorbo: 0, especializada: false } }, { name: "Escudo", system: { clave: "escudo", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Esquivar", system: { clave: "esquivar", base: "agilidad", puntosFijos: 1, estorbo: 1, especializada: false } }, { name: "Estrategia", system: { clave: "estrategia", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Forzar Cerraduras", system: { clave: "forzarCerraduras", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Honda", system: { clave: "honda", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Hurtar", system: { clave: "hurtar", base: "tecnica", puntosFijos: 0, estorbo: 1, especializada: false } }, { name: "Idioma 1 (nativo)", system: { clave: "idioma1", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Idioma 2", system: { clave: "idioma2", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Idioma 3", system: { clave: "idioma3", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Imponerse", system: { clave: "imponerse", base: "comunicacion", puntosFijos: 1, estorbo: 0, especializada: false } }, { name: "Instruir", system: { clave: "instruir", base: "comunicacion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Juego", system: { clave: "juego", base: "percepcion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Lanzar", system: { clave: "lanzar", base: "vigor", puntosFijos: 2, estorbo: 0, especializada: false } }, { name: "Leyendas", system: { clave: "leyendas", base: "cultura", puntosFijos: 2, estorbo: 0, especializada: false } }, { name: "Manejar Botes", system: { clave: "manejarBotes", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Manejar Carros", system: { clave: "manejarCarros", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Manipulación", system: { clave: "manipulacion", base: "comunicacion", puntosFijos: 2, estorbo: 0, especializada: false } }, { name: "Medicina", system: { clave: "medicina", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Memorizar", system: { clave: "memorizar", base: "cultura", puntosFijos: 1, estorbo: 0, especializada: false } }, { name: "Montar", system: { clave: "montar", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Multiverso", system: { clave: "multiverso", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Nadar", system: { clave: "nadar", base: "agilidad", puntosFijos: 0, estorbo: 2, especializada: false } }, { name: "Naturaleza", system: { clave: "naturaleza", base: "cultura", puntosFijos: 1, estorbo: 0, especializada: false } }, { name: "Navegación", system: { clave: "navegacion", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Ocultar", system: { clave: "ocultar", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Oratoria", system: { clave: "oratoria", base: "comunicacion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Pelea", system: { clave: "pelea", base: "vigor", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Percatarse", system: { clave: "percatarse", base: "percepcion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Perspicacia", system: { clave: "perspicacia", base: "percepcion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Pociones", system: { clave: "pociones", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Primeros Auxilios", system: { clave: "primerosAuxilios", base: "tecnica", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Rastrear", system: { clave: "rastrear", base: "percepcion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Seguir", system: { clave: "seguir", base: "percepcion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Sigilo", system: { clave: "sigilo", base: "agilidad", puntosFijos: 1, estorbo: 1, especializada: false } }, { name: "Sueños", system: { clave: "sueños", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: true } }, { name: "Tierras Quebradas", system: { clave: "tierrasQuebradas", base: "cultura", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Tratar Animales", system: { clave: "tratarAnimales", base: "comunicacion", puntosFijos: 0, estorbo: 0, especializada: false } }, { name: "Trepar", system: { clave: "trepar", base: "agilidad", puntosFijos: 0, estorbo: 1, especializada: false } }
  ];

  for (const h of HABILIDADES) {
    await Item.create({ ...h, type: "habilidad" }, { pack: pack.collection });
  }
  console.log("Tierras Quebradas | Compendio de habilidades poblado.");
}

async function _poblarDeidades() {
  const pack = game.packs.get("tierras-quebradas.deidades");
  if (!pack) return;
  const existentes = await pack.getDocuments();
  if (existentes.length > 0) return;

  const DEIDADES = [
    // Panteón del Patriarcado (Ley, principales)
    { name: "El Artista", system: { tipo: "ley", principal: true, descripcion: "Dios de las artes y la belleza. Enseñó a dar forma y proporción a las creaciones humanas, tranquilizando el espíritu mediante la armonía visual. Sus sacerdotes visten de color celeste." } },
    { name: "El Comerciante", system: { tipo: "ley", principal: true, descripcion: "Dios del comercio y el dinero. Inspiró la invención de la moneda y los sistemas de intercambio racional y justo entre los hombres. Se le representa con una bolsa de monedas y su color es el amarillo." } },
    { name: "La Destructora", system: { tipo: "ley", principal: true, descripcion: "Conocida como la \"Enemiga de la vida\". Diosa de la Ley que, en su ansia de perfección absoluta, enloqueció y ahora busca aniquilar todo rastro de imperfección y, en última instancia, toda forma de vida (ya que lo vivo siempre cambia y contiene una semilla de Caos). Es temida incluso por otros cultos legales." } },
    { name: "El Escriba", system: { tipo: "ley", principal: true, descripcion: "Patrón del conocimiento y la palabra escrita. Gracias a su don, la humanidad puede atesorar el saber a través de los siglos sin las deformaciones de la tradición oral. Su color simbólico es el morado." } },
    { name: "El Guerrero", system: { tipo: "ley", principal: true, descripcion: "Señor de la guerra y la estrategia. Instruyó a los hombres en el manejo de las armas para combatir físicamente el mal, siempre bajo una responsabilidad y nobleza que limiten el uso de la fuerza. Sus sacerdotes visten de rojo." } },
    { name: "El Juez", system: { tipo: "ley", principal: true, descripcion: "Patrón de la justicia y las normas. Considerado por muchos como el líder o portavoz del panteón. Inspiró la creación de leyes y las Doce Marcas de la Razón." } },
    { name: "El Labrador", system: { tipo: "ley", principal: true, descripcion: "Dios de la fertilidad agrícola y ganadera. A diferencia de las deidades elementales, el Labrador enseña a dominar la tierra mediante técnicas racionales de riego y administración. Su color es el naranja." } },
    { name: "La Madre", system: { tipo: "ley", principal: true, descripcion: "Protectora de la familia y los ciclos vitales. Rige sobre los nacimientos, los matrimonios, los funerales y las normas morales que mantienen la cohesión social." } },
    { name: "El Navegante", system: { tipo: "ley", principal: true, descripcion: "Dios de la navegación. Enseñó a los hombres a construir navíos, orientarse por las estrellas y conquistar el mar. Su color representativo es el azul marino." } },
    { name: "El Sabio", system: { tipo: "ley", principal: true, descripcion: "Dios de la ciencia y la experimentación. Enseña a comprender las leyes naturales mediante la observación, rechazando el misticismo y la magia. Su color es el verde." } },
    { name: "El Sanador", system: { tipo: "ley", principal: true, descripcion: "Dios de la medicina. Instruyó a los humanos en la prevención de la muerte, la elaboración de antídotos y el tratamiento de heridas y enfermedades. Su color asociado es el blanco." } },
    // Deidades duales y figuras divinizadas (Ley, no principales)
    { name: "Baaler (El Bufón)", system: { tipo: "ley", principal: false, descripcion: "Dios inusitado que pertenece tanto a la corte de la Ley como a la del Caos. Como dios de la Ley, representa el ingenio, la crítica incisiva y el humor que permite corregir los errores y mejorar la sociedad. Es el patrón del pueblo errante." } },
    { name: "Adelfos", system: { tipo: "ley", principal: false, descripcion: "Iluminado y profeta local de la ciudad de Ludópolis. Se le rinde culto en el Templo Blanco y Negro, donde se le considera una figura venerable que une las enseñanzas del Sabio con el estudio lógico de los juegos y la realidad." } },
    { name: "Braulio el Misericordioso", system: { tipo: "ley", principal: false, descripcion: "Antiguo campeón de la Ley en la Tierra de Nadie que, tras ser traicionado y asesinado, ha pasado a ser un espíritu deificado. Desde el Plano de los Benditos, vigila la región y busca agentes que continúen su misión contra el Caos." } },
    { name: "Juld el Apestoso", system: { tipo: "ley", principal: false, descripcion: "Técnicamente un \"dios caído\" del panteón de los plenh, pero sus poderes son de luz, verdad y fuego, lo que lo aleja del Caos y lo sitúa en una esfera de influencia solar y purificadora similar a la de algunas deidades del Orden." } },
    // Señores del Caos principales
    { name: "Aniria (La Amante)", system: { tipo: "caos", principal: true, descripcion: "Diosa de la pasión sexual entendida como un arte y una vía de autoconocimiento espiritual. Su culto es central en el Imperio Escarlata, donde sus sacerdotes actúan también como prostitutos en templos-burdeles." } },
    { name: "Ayrok (El Heraldo de las Tinieblas)", system: { tipo: "caos", principal: true, descripcion: "Dios del cambio y la traición. Su voz incita a los mortales a romper vínculos con el pasado y sus seres queridos, ya sea para liberarse o para cometer actos fatídicos. Se le asocia con el crecimiento del Bosque Podrido y la Flor de Ayrok en la Tierra de Nadie." } },
    { name: "Íkor (La Dama Azul)", system: { tipo: "caos", principal: true, descripcion: "Deidad que domina la realidad más allá de la tundra ártica. Es la patrona de los apinamies y busca expandir el Caos debilitando a los pueblos del norte, como los esteparios. Se le dedica un templo subterráneo en el Bosque Hondo conocido como La Forja." } },
    { name: "Mashak (El Tirano)", system: { tipo: "caos", principal: true, descripcion: "Dios que alienta el rencor de los marginados y explotados contra los ricos y bellos. Se le asocia con la tiranía y posee un plano propio llamado el Infierno Rojo, que utiliza como una suerte de \"despensa\" de almas." } },
    { name: "Meibel (El Sin Rostro)", system: { tipo: "caos", principal: true, descripcion: "Dios de la guerra, el combate y las transformaciones que estos conllevan. Representa tanto la brutalidad ciega del guerrero anónimo como el progreso social que puede surgir tras un conflicto. Sus sacerdotes forman una poderosa élite militar." } },
    { name: "Melk (El Observador)", system: { tipo: "caos", principal: true, descripcion: "Dios de los espías y la observación. Su símbolo es el ojo y sus seguidores, los Observadores, actúan como recolectores de información por todas las Tierras Quebradas." } },
    { name: "Nariaj (El Miserable)", system: { tipo: "caos", principal: true, descripcion: "Deidad que inspira a los desposeídos para que humillen y destruyan a los que lo tienen todo. Es una figura recurrente en las intrigas políticas del Imperio Escarlata." } },
    { name: "Shador (El Segador)", system: { tipo: "caos", principal: true, descripcion: "Dios de la muerte y la nigromancia. Representa la permeabilidad entre el mundo de los vivos y el de los muertos, enseñando a sus fieles a explorar el más allá y violar las reglas de la existencia." } },
    { name: "Shonbark (El Patrón)", system: { tipo: "caos", principal: true, descripcion: "Patrona del Imperio Escarlata. Sus sacerdotes son individuos hermafroditas y su clero es el más influyente en la isla Pluviosa, alentando activamente el odio contra la Ley." } },
    { name: "Slodar (El Indulgente)", system: { tipo: "caos", principal: true, descripcion: "Dios del hedonismo extremo, los vicios y las drogas. Mientras que en algunas regiones se le adora de forma mística, en el Imperio Escarlata su culto incluye facetas siniestras como la tortura y el sadomasoquismo." } },
    { name: "Tesh-Chan (El Creador)", system: { tipo: "caos", principal: true, descripcion: "Dios de la creatividad y el arte. Su filosofía se basa en que el Caos no crea de la nada, sino que combina elementos existentes de formas novedosas e inusitadas. Sus templos suelen ser escuelas de artes o talleres." } },
    { name: "Vesh-Anh (El Loco)", system: { tipo: "caos", principal: true, descripcion: "Personifica el azar, lo impredecible y los impulsos irracionales. Es el patrón de los juegos de azar y se cree que la verdadera sabiduría reside en la locura. Su culto es popular en Ludópolis y Leonis." } },
    { name: "Yarói (El Horror Tentacular)", system: { tipo: "caos", principal: true, descripcion: "Deidad marina que habita en las profundidades tenebrosas y comanda a krákens y tritones. Es el señor de los peligros del mar y sus sueños inspiran a piratas y saqueadores." } },
    // Figuras ambivalentes y menores del Caos
    { name: "Baaler (El Bufón)", system: { tipo: "caos", principal: false, descripcion: "Entidad ambigua que pertenece tanto al Caos como a la Ley. En su faceta caótica, representa la risa irreverente que ridiculiza a los poderosos y ensalza al humilde. Es el patrón del pueblo errante y se le considera el \"comodín de la baraja\"." } },
    { name: "Dulen-Thur (El Rey Olvidado)", system: { tipo: "caos", principal: false, descripcion: "Semidiós maldito con forma de hombre-escarabajo que sirve a los designios del Caos desde un plano pantanoso conocido como el Infierno Musgoso." } },
    { name: "Meira (La Dama Meira)", system: { tipo: "caos", principal: false, descripcion: "Antigua consorte de Yarói, capitana de la Octava Hueste, que fue expulsada de la corte del Caos tras un escándalo." } },
    { name: "Yogah de Yag", system: { tipo: "caos", principal: false, descripcion: "Ser de carne y hueso pero de naturaleza distinta a la humana, torturado y aprisionado por un hechicero en una torre, esperando su liberación para volver a ser una entidad rutilante." } },
    // Cuatro Monarcas Elementales
    { name: "Kamin (Señora de la Tierra)", system: { tipo: "elementos", principal: true, descripcion: "Gobierna sobre la arcilla, la piedra, los metales y las gemas. Es la madre tierra, una deidad bondadosa pero irascible que provee alimento y refugio, pero exige que todo lo que sale de sus dominios retorne finalmente a ella (por lo que sus fieles entierran a sus muertos y sus tesoros). Se la representa como una mujer rolliza o una giganta de arcilla y raíces, y su símbolo es el cuadrado." } },
    { name: "Tepel (Señor del Fuego)", system: { tipo: "elementos", principal: true, descripcion: "Representa el sol, la luz y el calor, pero también la capacidad destructora de las llamas. Es el patrón de los herreros y fundidores, pues con su aliento se transforman los metales. Es descrito como malévolo, caprichoso y hambriento, manifestándose a menudo como un gigante ígneo con una espada flamígera. Su señal es el sol o una espada en llamas." } },
    { name: "Vodar (Señor del Agua)", system: { tipo: "elementos", principal: true, descripcion: "Rige sobre los mares, océanos, ríos y la lluvia que fecunda la tierra. Es el amante de Kamin, y su relación es apasionada y violenta, visible en el choque de las olas contra los acantilados. Es venerado por pescadores y marineros, y se le imagina como un hombre voluminoso con barba de algas y piel verdosa." } },
    { name: "Visdu (Señora del Aire)", system: { tipo: "elementos", principal: true, descripcion: "Gobierna el viento, el sonido y la luna. Es la más voluble e impredecible de los cuatro, capaz de enviar brisas frescas o vendavales mortales. Es la patrona de las aves y de las artes como la música y la oratoria. Se la representa como una guerrera incorpórea y translúcida, y sus símbolos son la luna o la espiral." } },
    // Deidades menores y semidioses elementales
    { name: "Bakeno", system: { tipo: "elementos", principal: false, descripcion: "Semidiós hijo de la unión entre Kamin y Vodar. Representa el lodo y el barro, y es adorado de forma central en la ciudad de Kaminoris, donde se encuentra el Templo del Foso. Es un ser hosco y simple que habita en lagunas de lodo subterráneas." } },
    { name: "Asidey (La Dama de la Foresta)", system: { tipo: "elementos", principal: false, descripcion: "Una de las trece hijas de Kamin nacidas de su unión con Vodar. Representa el sotobosque y personifica la dualidad de la naturaleza: la capacidad de envenenar y la de sanar simultáneamente. Es objeto de peregrinaje en la provincia de Comarcas, donde se le atribuye el \"mal de la foresta\" y su posterior cura mediante promesas." } },
    { name: "Hern", system: { tipo: "elementos", principal: false, descripcion: "Hijo de Kamin, es el dios de la caza y de aquellos que dependen de las bestias salvajes para subsistir. Enseñó a la humanidad a cazar y es honrado especialmente en bosques sagrados, aunque algunos de sus dominios han sido profanados por fuerzas del Caos." } },
    // Antepasados
    { name: "Braulio el Misericordioso", system: { tipo: "antepasados", principal: false, descripcion: "El ejemplo más reciente de un mortal ascendiendo a la divinidad. Antiguo campeón de la Ley en la Tierra de Nadie, tras su traición y muerte su espíritu se revuelve inquieto en la ultratumba. La veneración popular le ha permitido ser invocado como un dios, poseyendo su propio Plano de los Benditos donde otros héroes de la historia aguardan su ascenso." } },
    { name: "Orbiol", system: { tipo: "antepasados", principal: false, descripcion: "Ser cuasi divino que, según los mitos de los gigantes de los Montes Ardientes, pidió a la Ley un ejército para luchar contra el Caos. Algunos estudiosos creen que fue un rey o sumo sacerdote de los Caídos cuyo ejército dispersado dio origen a la especie de los gigantes." } },
    { name: "Yogah de Yag", system: { tipo: "antepasados", principal: false, descripcion: "Ser alienígena del planeta Yag, venerado como un dios por una antigua tribu de las selvas de Imanguk durante siglos tras la caída de sus compañeros." } },
    { name: "Espíritus de la Tierra de Nadie", system: { tipo: "antepasados", principal: false, descripcion: "Antepasados ilustres cuyos recuerdos y cabezas son retenidos por el octocéfalo —demonio guardián de la Flor de Ayrok— para alimentarla. Entre ellos se cuentan Laura la espía, Panthos el consejero y Nero el clarividente." } }
  ];

  for (const d of DEIDADES) {
    await Item.create({ ...d, type: "deidad" }, { pack: pack.collection });
  }
  console.log("Tierras Quebradas | Compendio de deidades poblado.");
}

Hooks.on("renderSceneControls", (_app, html) => {
  const el = (html instanceof HTMLElement) ? html : html[0];
  if (!el?.querySelector) return;

  const menu = el.querySelector("#scene-controls-layers") ?? el.querySelector("menu");
  if (!menu) return;

  if (game.user.isGM) {
    if (!el.querySelector("#tq-director-toggle")) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "tq-director-toggle";
      btn.className = "control ui-control layer icon fa-solid fa-crown";
      btn.setAttribute("data-tooltip", "Widget del Director");
      btn.setAttribute("aria-label", "Widget del Director");
      btn.addEventListener("click", () => {
        const w = game.tq?.directorWidget;
        if (!w) return;
        if (w.rendered) w.close();
        else w.render(true);
      });
      li.appendChild(btn);
      menu.appendChild(li);
    }

    if (!el.querySelector("#tq-link-creator-toggle")) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "tq-link-creator-toggle";
      btn.className = "control ui-control layer icon fa-solid fa-link";
      btn.setAttribute("data-tooltip", game.i18n.localize("TQ.LinkCreator.Titulo"));
      btn.setAttribute("aria-label", game.i18n.localize("TQ.LinkCreator.Titulo"));
      btn.addEventListener("click", () => {
        const w = game.tq?.linkCreator;
        if (!w) return;
        if (w.rendered) w.close();
        else w.render(true);
      });
      li.appendChild(btn);
      menu.appendChild(li);
    }
  }

  if (game.settings.get("tierras-quebradas", "modoTrey") && !el.querySelector("#tq-modo-trey-lanzar")) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "tq-modo-trey-lanzar";
    btn.className = "control ui-control layer icon fa-solid fa-dice";
    btn.setAttribute("data-tooltip", "Modo Trey — Lanzar D6+D8+D10");
    btn.setAttribute("aria-label", "Modo Trey — Lanzar D6+D8+D10");
    btn.addEventListener("click", () => ModoTrey.lanzar());
    li.appendChild(btn);
    menu.appendChild(li);
  }
});

// Botones en la barra lateral de actores
Hooks.on("renderActorDirectory", (_app, html) => {
  const actions = html.querySelector(".action-buttons");
  if (!actions) return;

  if (game.user.isGM) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "grid-column: 1 / -1; display: flex; flex-direction: column; gap: 4px;";

    for (const [label, title, Class] of [
      ["PNJ", "Importar PNJ desde texto", PNJImporter], ["Criatura", "Importar Criatura desde texto", CriaturaImporter], ["Demonio", "Importar Demonio desde texto", DemonioImporter]
    ]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = title;
      btn.innerHTML = `Importar ${label}`;
      btn.addEventListener("click", () => Class.open());
      wrapper.appendChild(btn);
    }

    actions.appendChild(wrapper);
  } else {
    const btnWizard = document.createElement("button");
    btnWizard.type = "button";
    btnWizard.style.cssText = "grid-column: 1 / -1;";
    btnWizard.textContent = "Creador de Personaje";
    btnWizard.addEventListener("click", () => CharacterCreator.open(""));
    actions.appendChild(btnWizard);
  }
});

// Interceptar creación de PJ para mostrar diálogo de elección
Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if (game.userId !== userId) return;
  if (data.type !== "pj") return;
  if (options.tqWizard || options.tqBlank || options.keepId || options.fromCompendium) return;

  const { DialogV2 } = foundry.applications.api;
  setTimeout(async () => {
    const choice = await DialogV2.wait({
      window: { title: "Nuevo Personaje Jugador" }, content: `<p style="padding:6px 0;">¿Cómo quieres crear el personaje?</p>`, rejectClose: false, buttons: [
        { action: "wizard", label: "Creador de Personaje", default: true }, { action: "blank", label: "Ficha en Blanco" }
      ]
    });
    if (choice === "wizard") {
      CharacterCreator.open(data.name ?? "");
    } else if (choice === "blank") {
      Actor.create({
        name: data.name ?? "Personaje", type: "pj", img: "icons/svg/mystery-man.svg"
      }, { tqBlank: true });
    }
  }, 0);
  return false;
});

Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "especie") return;
  if (options.tqWizard) return;
  const actor = item.parent;
  if (!actor) return;
  const anterior = actor.items.find(i => i.type === "especie" && i.id !== item.id);
  if (anterior) {
    await actor._revertirEspecie(anterior);
    await anterior.delete({ tqRevertido: true });
  }
  await actor._aplicarEspecie(item);
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "especie") return;
  if (options.tqRevertido) return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirEspecie(item);
});

Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "entorno") return;
  if (options.tqWizard) return;
  const actor = item.parent;
  if (!actor) return;
  const anterior = actor.items.find(i => i.type === "entorno" && i.id !== item.id);
  if (anterior) {
    await actor._revertirEntorno(anterior);
    await anterior.delete();
  }
  await actor._aplicarEntorno(item);
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "entorno") return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirEntorno(item);
});

Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "profesion") return;
  if (options.tqWizard) return;
  const actor = item.parent;
  if (!actor) return;
  const anterior = actor.items.find(i => i.type === "profesion" && i.id !== item.id);
  if (anterior) {
    await actor._revertirProfesion(anterior);
    await anterior.delete();
  }
  await actor._aplicarProfesion(item);
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "profesion") return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirProfesion(item);
});

Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "origen") return;
  if (options.tqWizard) return;
  const actor = item.parent;
  if (!actor) return;
  const anterior = actor.items.find(i => i.type === "origen" && i.id !== item.id);
  if (anterior) {
    await actor._revertirOrigen(anterior);
    await anterior.delete();
  }
  await actor._aplicarOrigen(item);
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "origen") return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirOrigen(item);
});

function _esArmaConPosibleProteccion(item) {
  return item.type === "arma" || (item.type === "objetoMagico" && item.system.tipoObjeto === "arma");
}

Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (!_esArmaConPosibleProteccion(item)) return;
  if (!item.system.tieneProteccion) return;
  if (options.tqFromArma) return;
  const actor = item.parent;
  if (!actor) return;
  const arm = await Item.create({ name: item.name, type: "armadura", system: { proteccion: item.system.proteccionValor ?? 0, tipo: "dura", zona: "Escudo", carga: 0, equipped: item.system.equipped !== false } }, { parent: actor, tqFromArma: true });
  if (arm) await arm.setFlag("tierras-quebradas", "fromArmaId", item.id);
});

Hooks.on("updateItem", async (item, changes, options, userId) => {
  if (game.userId !== userId) return;
  if (options.tqFromArma) return;
  const actor = item.parent;
  if (!actor) return;

  // Armadura vinculada → sincronizar equipped de vuelta al arma fuente
  const fromArmaId = item.getFlag("tierras-quebradas", "fromArmaId");
  if (fromArmaId && changes.system?.equipped !== undefined) {
    const armaFuente = actor.items.get(fromArmaId);
    if (armaFuente) await armaFuente.update({ "system.equipped": changes.system.equipped }, { tqFromArma: true });
    return;
  }

  if (!_esArmaConPosibleProteccion(item)) return;
  const armaduraVinculada = actor.items.find(i => i.type === "armadura" && i.getFlag("tierras-quebradas", "fromArmaId") === item.id);
  const tieneProteccion = item.system.tieneProteccion;
  if (tieneProteccion && !armaduraVinculada) {
    const arm = await Item.create({ name: item.name, type: "armadura", system: { proteccion: item.system.proteccionValor ?? 0, tipo: "dura", zona: "Escudo", carga: 0, equipped: item.system.equipped !== false } }, { parent: actor, tqFromArma: true });
    if (arm) await arm.setFlag("tierras-quebradas", "fromArmaId", item.id);
  } else if (!tieneProteccion && armaduraVinculada) {
    await armaduraVinculada.delete({ tqFromArma: true });
  } else if (tieneProteccion && armaduraVinculada) {
    const upd = { "system.proteccion": item.system.proteccionValor ?? 0 };
    if (changes.system?.equipped !== undefined) upd["system.equipped"] = changes.system.equipped;
    await armaduraVinculada.update(upd, { tqFromArma: true });
  }
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (!_esArmaConPosibleProteccion(item)) return;
  if (options.tqFromArma) return;
  const actor = item.parent;
  if (!actor) return;
  const armadura = actor.items.find(i => i.type === "armadura" && i.getFlag("tierras-quebradas", "fromArmaId") === item.id);
  if (armadura) await armadura.delete({ tqFromArma: true });
});


// Retrato del actor + color del jugador en la cabecera de mensajes TQ
Hooks.on("renderChatMessageHTML", (message, html) => {
  if (message.blind && !game.user.isGM) {
    const resultado = html.querySelector(".tq-tirada-resultado");
    if (resultado) {
      const header = resultado.querySelector(".tq-chat-header");
      resultado.innerHTML = "";
      if (header) resultado.appendChild(header);
      const oculto = document.createElement("div");
      oculto.className = "tq-blind-oculto";
      oculto.textContent = "???";
      resultado.appendChild(oculto);
    }
    return;
  }
  // Botón "Aplicar Pasión" visible solo para el GM
  const btnAplicar = html.querySelector(".tq-aplicar-pasion");
  if (btnAplicar && game.user.isGM) {
    btnAplicar.style.display = "";
    btnAplicar.addEventListener("click", async () => {
      const actor = game.actors.get(btnAplicar.dataset.actorId);
      if (!actor) return;
      await actor.forzarPasion(btnAplicar.dataset.pasionTipo);
      btnAplicar.disabled = true;
      btnAplicar.textContent = "Pasión aplicada";
    });
  }

  const btnFortuna = html.querySelector(".tq-fortuna-repetir");
  if (btnFortuna) {
    const actor = game.actors.get(btnFortuna.dataset.actorId);
    if (!actor || (actor.system.fortuna?.actual ?? 0) <= 0) btnFortuna.disabled = true;
    const flagsMsg = message.flags?.["tierras-quebradas"] ?? {};
    btnFortuna.addEventListener("click", () => {
      if (flagsMsg.esEnfrentadaFortuna) return TQRoll.repetirConFortunaEnfrentada(message.id);
      return TQRoll.repetirConFortuna(message.id);
    });
  }

  const btnAplicarDanho = html.querySelector(".tq-aplicar-danho");
  if (btnAplicarDanho) {
    btnAplicarDanho.addEventListener("click", async () => {
      const targetActor = game.actors.get(btnAplicarDanho.dataset.targetId);
      if (!targetActor) return;
      const danhoNeto = parseInt(btnAplicarDanho.dataset.danhoNeto);
      const danhoBruto = parseInt(btnAplicarDanho.dataset.danhoBruto);
      await targetActor.recibirDanho(danhoNeto, danhoBruto);
      btnAplicarDanho.disabled = true;
      btnAplicarDanho.textContent = game.i18n.localize("TQ.Botones.DanhoAplicado");
    });
  }

  const btnRecuperarPM = html.querySelector(".tq-aplicar-recuperacion-pm");
  if (btnRecuperarPM) {
    btnRecuperarPM.addEventListener("click", async () => {
      const actor = game.actors.get(btnRecuperarPM.dataset.actorId);
      if (!actor) return;
      const pmRecuperado = parseInt(btnRecuperarPM.dataset.pmRecuperado);
      const pmActual = actor.system.hechiceria?.pmActual ?? 0;
      const pmMax = actor.system.hechiceria?.pmMax ?? 0;
      await actor.update({ "system.hechiceria.pmActual": Math.min(pmActual + pmRecuperado, pmMax) });
      btnRecuperarPM.disabled = true;
      btnRecuperarPM.textContent = game.i18n.localize("TQ.Botones.RecuperacionAplicada");
    });
  }

  const btnRezo = html.querySelector(".tq-aplicar-rezo");
  if (btnRezo) {
    btnRezo.addEventListener("click", async () => {
      const actor = game.actors.get(btnRezo.dataset.actorId);
      if (!actor) return;
      const exitos = parseInt(btnRezo.dataset.exitos) ?? 0;
      btnRezo.disabled = true;
      if (exitos < 0) {
        await actor.abrirReduccionLealtad();
      } else {
        await actor.abrirConversionLealtad(exitos);
      }
    });
  }

  const btnResultado = html.querySelector(".tq-aplicar-resultado");
  if (btnResultado) {
    btnResultado.addEventListener("click", async () => {
      const actor = game.actors.get(btnResultado.dataset.actorId);
      if (!actor) return;

      let bonusEspiritu = 0;
      const exitos = parseInt(btnResultado.dataset.exitos) || 0;

      if (exitos >= 10) {
        const beneficio = await foundry.applications.api.DialogV2.wait({
          window: { title: "¡Éxito crítico! — Elige beneficio", width: 360 },
          content: `<p style="margin-bottom:8px;">Has obtenido <strong>${exitos} puntos de éxito</strong>. Elige un beneficio:</p>
            <select name="beneficio" style="width:100%;font-size:12px;">
              <option value="ahorrar">Ahorrarse 1 PM</option>
              <option value="blanco">Añadir un blanco extra gratis</option>
              <option value="potencia">Aumentar potencia o duración</option>
              <option value="espiritu">+2 a la Lucha de Espíritu</option>
            </select>`,
          rejectClose: false,
          buttons: [{ action: "elegir", label: "Confirmar", default: true, callback: (_ev, b) => b.form.elements.beneficio.value }]
        });
        if (beneficio === "ahorrar") {
          const esPJ = actor.type === "pj";
          const campo = esPJ ? "system.hechiceria.pmActual" : "system.pm";
          const pmActual = esPJ ? (actor.system.hechiceria?.pmActual ?? 0) : (actor.system.pm ?? 0);
          const pmMax = esPJ ? (actor.system.hechiceria?.pmMax ?? pmActual) : (actor.system.pmMax ?? pmActual);
          await actor.update({ [campo]: Math.min(pmActual + 1, pmMax) });
        }
        if (beneficio === "espiritu") bonusEspiritu = 2;
      }

      if (btnResultado.dataset.requiereEspiritu === "true")
        await actor._luchaDeEspiritu(btnResultado.dataset.etiqueta ?? "", bonusEspiritu);
      btnResultado.disabled = true;
      btnResultado.textContent = game.i18n.localize("TQ.Botones.ResultadoAplicado");
    });
  }

  const btnDanhoRival = html.querySelector(".tq-aplicar-danho-rival");
  if (btnDanhoRival) {
    btnDanhoRival.addEventListener("click", async () => {
      const actor = game.actors.get(btnDanhoRival.dataset.actorId);
      if (!actor) return;
      await actor.recibirDanho(parseInt(btnDanhoRival.dataset.danhoNeto), parseInt(btnDanhoRival.dataset.danhoBruto));
      btnDanhoRival.disabled = true;
      btnDanhoRival.textContent = game.i18n.localize("TQ.Botones.DanhoAplicado");
    });
  }

  const flags = message.flags?.["tierras-quebradas"] ?? {};
  if (flags.esEnfrentadaPendiente) {
    const btnNormal = html.querySelector(".tq-enfrentada-normal");
    const btnFortunaEnfr = html.querySelector(".tq-enfrentada-fortuna");
    if (flags.enfrentadaCompletada) {
      if (btnNormal) btnNormal.disabled = true;
      if (btnFortunaEnfr) btnFortunaEnfr.disabled = true;
    } else {
      if (btnNormal) btnNormal.addEventListener("click", () => TQRoll.completarEnfrentada(message.id, false));
      if (btnFortunaEnfr) btnFortunaEnfr.addEventListener("click", () => TQRoll.completarEnfrentada(message.id, true));
    }
  }

  const btnFuegoAmigo = html.querySelector(".tq-fuego-amigo-aplicar");
  if (btnFuegoAmigo) {
    btnFuegoAmigo.addEventListener("click", async () => {
      const actor = game.actors.get(btnFuegoAmigo.dataset.actorId);
      if (!actor) return;
      const danho = parseInt(btnFuegoAmigo.dataset.danho);
      const danhoBruto = parseInt(btnFuegoAmigo.dataset.danhoBruto);
      await actor.recibirDanho(danho, danhoBruto);
      btnFuegoAmigo.disabled = true;
      btnFuegoAmigo.textContent = "Daño aplicado";
      btnFuegoAmigo.style.display = "block";
      btnFuegoAmigo.style.textAlign = "center";
    });
  }

  const tablasBtns = html.querySelectorAll(".tq-tablas-btn");
  if (tablasBtns.length) {
    tablasBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        await TQRoll.resolverTablas(message.id, btn.dataset.resolucion);
        tablasBtns.forEach(b => { b.disabled = true; b.textContent = "Resuelto"; });
      });
    });
  }

  html.querySelectorAll(".tq-fortuna-elegir").forEach(btn => {
    const flagsMsg2 = message.flags?.["tierras-quebradas"] ?? {};
    btn.addEventListener("click", () => {
      if (flagsMsg2.esEleccionFortunaEnfrentada) return TQRoll.elegirResultadoFortunaEnfrentada(message.id, btn.dataset.eleccion);
      return TQRoll.elegirResultadoFortuna(message.id, btn.dataset.eleccion);
    });
  });

  html.querySelectorAll(".tq-roll-link").forEach(link => {
    link.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const { tipo, valor, dificultad: difStr, modificador: modLinkStr, rollmode } = link.dataset;
      const actor = game.user.character ?? canvas.tokens?.controlled?.[0]?.actor ?? null;
      if (!actor) {
        ui.notifications.warn(game.i18n.localize("TQ.LinkCreator.SinPersonaje"));
        return;
      }

      const { puntuacion, etiqueta } = TQLinkCreator.resolveValue(actor, tipo, valor);
      const dificultad = parseInt(difStr);
      const modEnlace = parseInt(modLinkStr) || 0;
      const fortunaActual = actor.system.fortuna?.actual ?? 0;
      const dosFortDisponible = fortunaActual >= 2;
      const autoExitoDisponible = puntuacion + modEnlace - dificultad >= -1;
      const modEnlaceStr = modEnlace !== 0 ? ` (${modEnlace > 0 ? "+" : ""}${modEnlace})` : "";

      const { DialogV2 } = foundry.applications.api;
      const eleccion = await DialogV2.wait({
        window: { title: etiqueta, width: 300 },
        classes: ["tq-link-roll-modal", ...(!dosFortDisponible ? ["tq-fort-insuf"] : []), ...(!autoExitoDisponible ? ["tq-sin-exito-auto"] : [])],
        content: `<div class="tq-link-roll-dialog">
          <div class="tq-link-roll-info">
            <span class="tq-lri-label">${game.i18n.localize("TQ.LinkCreator.DialogTirada")}</span>
            <span class="tq-lri-value"><strong>${etiqueta}</strong></span>
            <span class="tq-lri-label">${game.i18n.localize("TQ.LinkCreator.DialogValor")}</span>
            <span class="tq-lri-value">${puntuacion}</span>
            <span class="tq-lri-label">${game.i18n.localize("TQ.LinkCreator.DialogDificultad")}</span>
            <span class="tq-lri-value">${dificultad}</span>
            <span class="tq-lri-label">${game.i18n.localize("TQ.LinkCreator.DialogModificador")}</span>
            <span class="tq-lri-value">${modEnlace > 0 ? "+" : ""}${modEnlace}</span>
          </div>
          <div class="tq-link-roll-mod">
            <label>${game.i18n.localize("TQ.LinkCreator.DialogModExtra")}</label>
            <input type="number" name="mod_extra" value="0">
          </div>
        </div>`,
        rejectClose: false,
        buttons: [
          {
            action: "tirar",
            label: game.i18n.localize("TQ.Botones.Lanzar"),
            default: true,
            callback: (_ev, btn) => ({ modExtra: parseInt(btn.form.elements.mod_extra.value) || 0 })
          },
          {
            action: "fortuna",
            label: game.i18n.localize("TQ.Botones.UsarDosFortuna"),
            callback: (_ev, btn) => ({ modExtra: parseInt(btn.form.elements.mod_extra.value) || 0, dosFortuna: true })
          },
          {
            action: "auto",
            label: game.i18n.localize("TQ.Botones.ExitoAutomatico"),
            callback: (_ev, btn) => ({ modExtra: parseInt(btn.form.elements.mod_extra.value) || 0, autoExito: true })
          },
          {
            action: "cancelar",
            label: game.i18n.localize("TQ.Botones.Cancelar")
          }
        ]
      });

      if (!eleccion || typeof eleccion !== "object") return;

      if (eleccion.autoExito) {
        const margen = puntuacion + modEnlace + (eleccion.modExtra ?? 0) - dificultad;
        if (margen < -1) {
          ui.notifications.warn(game.i18n.format("TQ.Warn.ExitoAutoNoDisponible", { margen }));
          return;
        }
      }

      await TQRoll.tirar(etiqueta, puntuacion, dificultad, {
        actor,
        bonificador: modEnlace + (eleccion.modExtra ?? 0),
        rollMode: rollmode,
        dosFortuna: eleccion.dosFortuna ?? false,
        autoExito: eleccion.autoExito ?? false
      });
    });
  });

  if (!html.querySelector(".tq-tirada-resultado")) return;
  const header = html.querySelector(".message-header");
  if (!header) return;

  // Color del jugador autor del mensaje
  const color = message.author?.color;
  if (color) html.style.setProperty("--tq-player-color", color.css ?? String(color));

  // Retrato del actor
  const actor = message.speaker?.actor ? game.actors?.get(message.speaker.actor) : null;
  if (!actor?.img) return;
  const img = document.createElement("img");
  img.src = actor.img;
  img.title = actor.name;
  img.className = "tq-actor-avatar";
  header.insertBefore(img, header.firstChild);
});

Hooks.on("updateCombat", async (combat, changes) => {
  if (!game.user.isGM) return;
  if (changes.round === undefined) return; // solo al cambiar de ronda
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor?.system?.salud?.desangre) continue;
    const pvActual = actor.system.salud.pvActual?.valor ?? 0;
    await actor.update({ "system.salud.pvActual.valor": pvActual - 1 });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${actor.name}</strong> pierde 1 PV por <em>Desangre</em> (total: ${pvActual - 1} PV).</p>`
    });
  }
});


Hooks.on("deleteCombat", async (combat) => {
  if (!game.user.isGM) return;
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (actor?.system?.salud?.dolorExtremo) {
      await actor.update({ "system.salud.dolorExtremo": false });
    }
  }
});

// Añadir PV al Combat Tracker
Hooks.on("renderCombatTracker", (_app, html) => {
  const combat = game.combat;
  if (!combat) return;
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor?.system?.salud) continue;
    const pvActual = actor.system.salud.pvActual?.valor ?? "?";
    const pvMax    = actor.system.salud.pvMax?.valor    ?? "?";
    const li = html.querySelector(`[data-combatant-id="${combatant.id}"]`);
    if (!li) continue;
    // Insertar PV junto al nombre si no está ya
    const nombre = li.querySelector(".token-name");
    if (nombre && !li.querySelector(".tq-tracker-pv")) {
      const span = document.createElement("span");
      span.className = "tq-tracker-pv";
      span.textContent = `${pvActual}/${pvMax}`;
      nombre.after(span);
    }
  }
});
