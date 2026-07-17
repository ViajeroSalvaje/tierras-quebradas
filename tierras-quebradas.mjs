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
import { PactoSheet } from "./module/items/sheets/PactoSheet.mjs";
import { BendicionSheet } from "./module/items/sheets/BendicionSheet.mjs";
import { EspecieSheet } from "./module/items/sheets/EspecieSheet.mjs";
import { EntornoSheet } from "./module/items/sheets/EntornoSheet.mjs";
import { OrigenSheet } from "./module/items/sheets/OrigenSheet.mjs";
import { ProfesionSheet } from "./module/items/sheets/ProfesionSheet.mjs";
import { IdiomaSheet } from "./module/items/sheets/IdiomaSheet.mjs";
import { ObjetoSheet } from "./module/items/sheets/ObjetoSheet.mjs";
import { ConsumibleSheet } from "./module/items/sheets/ConsumibleSheet.mjs";
import { HabilidadSheet } from "./module/items/sheets/HabilidadSheet.mjs";

// Helpers y apps
import { registerHandlebarsHelpers } from "./module/helpers/handlebars.mjs";
import { CharacterCreator } from "./module/apps/CharacterCreator.mjs";
import { PNJImporter } from "./module/apps/PNJImporter.mjs";
import { DemonioImporter } from "./module/apps/DemonioImporter.mjs";
import { CriaturaImporter } from "./module/apps/CriaturaImporter.mjs";
import { DirectorWidget } from "./module/apps/DirectorWidget.mjs";

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
  Items.registerSheet("tierras-quebradas", VentajaSheet, { types: ["ventaja", "rasgo"], makeDefault: true, label: "TQ.Item.Types.ventaja" });
  Items.registerSheet("tierras-quebradas", PactoSheet, { types: ["pacto"], makeDefault: true, label: "TQ.Item.Types.pacto" });
  Items.registerSheet("tierras-quebradas", BendicionSheet, { types: ["bendicion"], makeDefault: true, label: "TQ.Item.Types.bendicion" });
  Items.registerSheet("tierras-quebradas", EspecieSheet, { types: ["especie"], makeDefault: true, label: "TQ.Item.Types.especie" });
  Items.registerSheet("tierras-quebradas", EntornoSheet, { types: ["entorno"], makeDefault: true, label: "TQ.Item.Types.entorno" });
  Items.registerSheet("tierras-quebradas", OrigenSheet, { types: ["origen"], makeDefault: true, label: "TQ.Item.Types.origen" });
  Items.registerSheet("tierras-quebradas", ProfesionSheet, { types: ["profesion"], makeDefault: true, label: "TQ.Item.Types.profesion" });
  Items.registerSheet("tierras-quebradas", IdiomaSheet, { types: ["idioma"], makeDefault: true, label: "TQ.Item.Types.idioma" });
  Items.registerSheet("tierras-quebradas", ObjetoSheet, { types: ["objeto"], makeDefault: true, label: "TQ.Item.Types.objeto" });
  Items.registerSheet("tierras-quebradas", ConsumibleSheet, { types: ["consumible"], makeDefault: true, label: "TQ.Item.Types.consumible" });
  Items.registerSheet("tierras-quebradas", HabilidadSheet, { types: ["habilidad"], makeDefault: true, label: "TQ.Item.Types.habilidad" });

  registerHandlebarsHelpers();

  loadTemplates([
    // Partials
    "systems/tierras-quebradas/templates/partials/_tab-combate-magia.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-caracteristicas.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-edad.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-origen.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-especie.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-entorno.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-profesion.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-ventajas.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-rasgos.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-equipo.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-habilidades.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-religion.hbs", "systems/tierras-quebradas/templates/partials/cc/_cc-paso-magia.hbs", // Apps
    "systems/tierras-quebradas/templates/apps/character-creator.hbs", "systems/tierras-quebradas/templates/apps/pnj-importer.hbs", "systems/tierras-quebradas/templates/apps/demonio-importer.hbs", "systems/tierras-quebradas/templates/apps/criatura-importer.hbs", "systems/tierras-quebradas/templates/apps/director-widget.hbs", // Actors
    "systems/tierras-quebradas/templates/actors/pj-sheet.hbs", "systems/tierras-quebradas/templates/actors/pnj-sheet.hbs", "systems/tierras-quebradas/templates/actors/criatura-sheet.hbs", "systems/tierras-quebradas/templates/actors/demonio-sheet.hbs", // Items
    "systems/tierras-quebradas/templates/items/arma-sheet.hbs", "systems/tierras-quebradas/templates/items/armadura-sheet.hbs", "systems/tierras-quebradas/templates/items/hechizo-sheet.hbs", "systems/tierras-quebradas/templates/items/ventaja-sheet.hbs", "systems/tierras-quebradas/templates/items/especie-sheet.hbs", "systems/tierras-quebradas/templates/items/idioma-sheet.hbs", "systems/tierras-quebradas/templates/items/objeto-sheet.hbs", "systems/tierras-quebradas/templates/items/consumible-sheet.hbs", "systems/tierras-quebradas/templates/items/habilidad-sheet.hbs", "systems/tierras-quebradas/templates/items/entorno-sheet.hbs", "systems/tierras-quebradas/templates/items/origen-sheet.hbs", "systems/tierras-quebradas/templates/items/profesion-sheet.hbs", // Dialogs
    "systems/tierras-quebradas/templates/dialogs/tirada-dialogo.hbs", "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion.hbs", "systems/tierras-quebradas/templates/dialogs/tablas-melee.hbs"
  ]);
});

Hooks.once("ready", async () => {
  console.log("Tierras Quebradas | Sistema listo");
  if (!game.user.isGM) return;
  for (const pack of game.packs.filter(p => p.metadata.system === "tierras-quebradas")) {
    if (pack.locked) await pack.configure({ locked: false });
  }
  game.tq = game.tq ?? {};
  game.tq.directorWidget = new DirectorWidget();
  game.tq.directorWidget.render(true);
  await _poblarHabilidades();
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

Hooks.on("renderSceneControls", (_app, html) => {
  if (!game.user.isGM) return;
  const el = (html instanceof HTMLElement) ? html : html[0];
  if (!el?.querySelector) return;
  if (el.querySelector("#tq-director-toggle")) return;

  const menu = el.querySelector("#scene-controls-layers") ?? el.querySelector("menu");
  if (!menu) return;

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
  if (options.tqWizard || options.tqBlank) return;

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

Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "arma") return;
  if (!item.system.tieneProteccion) return;
  if (options.tqFromArma) return;
  const actor = item.parent;
  if (!actor) return;
  const arm = await Item.create({ name: item.name, type: "armadura", system: { proteccion: item.system.proteccionValor ?? 0, tipo: "dura", zona: "Escudo", carga: 0 } }, { parent: actor, tqFromArma: true });
  if (arm) await arm.setFlag("tierras-quebradas", "fromArmaId", item.id);
});

Hooks.on("deleteItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "arma") return;
  if (!item.system.tieneProteccion) return;
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
    btnFortuna.addEventListener("click", () => TQRoll.repetirConFortuna(message.id));
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
    btn.addEventListener("click", () => TQRoll.elegirResultadoFortuna(message.id, btn.dataset.eleccion));
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
