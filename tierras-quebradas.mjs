import { TQActor } from "./module/actors/TQActor.mjs";
import { TQItem } from "./module/items/TQItem.mjs";
import { TQCombat } from "./module/combat/TQCombat.mjs";
import { PJSheet } from "./module/actors/sheets/PJSheet.mjs";
import { PNJSheet } from "./module/actors/sheets/PNJSheet.mjs";
import { CriaturaSheet } from "./module/actors/sheets/CriaturaSheet.mjs";
import { DemonioSheet } from "./module/actors/sheets/DemonioSheet.mjs";
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
import { registerHandlebarsHelpers } from "./module/helpers/handlebars.mjs";
import { CharacterCreator } from "./module/apps/CharacterCreator.mjs";
import { PNJImporter } from "./module/apps/PNJImporter.mjs";
import { DirectorWidget } from "./module/apps/DirectorWidget.mjs";

const { Actors, Items } = foundry.documents.collections;
const { loadTemplates } = foundry.applications.handlebars;

Hooks.once("init", () => {
  console.log("Tierras Quebradas | Inicializando sistema");

  game.settings.register("tierras-quebradas", "infortunio", {
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  CONFIG.TQ = {
    dificultades: {
      10: "TQ.Tirada.Facil",
      15: "TQ.Tirada.Normal",
      20: "TQ.Tirada.Dificil",
      25: "TQ.Tirada.MuyDificil"
    }
  };

  // Iniciativa: Agilidad − Estorbo (valor plano, sin dados)
  CONFIG.Combat.initiative = {
    formula: "@caracteristicas.mente.valor",
    decimals: 0
  };

  // Estados de combate
  CONFIG.statusEffects = [
    { id: "debilitado",       name: "TQ.Salud.debilitado",       icon: "icons/svg/downgrade.svg"  },
    { id: "incapacitado",     name: "TQ.Salud.incapacitado",     icon: "icons/svg/daze.svg"       },
    { id: "sanando",          name: "TQ.Salud.sanando",          icon: "icons/svg/regen.svg"      },
    { id: "desangre",         name: "TQ.Salud.desangre",         icon: "icons/svg/blood.svg"      },
    { id: "dolorExtremo",     name: "TQ.Salud.dolorExtremo",     icon: "icons/svg/paralysis.svg"  },
    { id: "piernaInutilizada",name: "TQ.Salud.piernaInutilizada",icon: "icons/svg/falling.svg"    },
    { id: "brazoInutilizado", name: "TQ.Salud.brazoInutilizado", icon: "icons/svg/arm.svg"        },
    { id: "agonia",           name: "TQ.Salud.agonia",           icon: "icons/svg/stoned.svg"     },
    { id: "dead",             name: "TQ.Salud.muerto",           icon: "icons/svg/skull.svg"      }
  ];

  CONFIG.Actor.documentClass = TQActor;
  CONFIG.Item.documentClass = TQItem;
  CONFIG.Combat.documentClass = TQCombat;

  Actors.registerSheet("tierras-quebradas", PJSheet, {
    types: ["pj"],
    makeDefault: true,
    label: "TQ.Actor.Types.pj"
  });
  Actors.registerSheet("tierras-quebradas", PNJSheet, {
    types: ["pnj"],
    makeDefault: true,
    label: "TQ.Actor.Types.pnj"
  });
  Actors.registerSheet("tierras-quebradas", CriaturaSheet, {
    types: ["criatura"],
    makeDefault: true,
    label: "TQ.Actor.Types.criatura"
  });
  Actors.registerSheet("tierras-quebradas", DemonioSheet, {
    types: ["demonio"],
    makeDefault: true,
    label: "TQ.Actor.Types.demonio"
  });

  Items.registerSheet("tierras-quebradas", ArmaSheet, {
    types: ["arma"],
    makeDefault: true,
    label: "TQ.Item.Types.arma"
  });
  Items.registerSheet("tierras-quebradas", ArmaduraSheet, {
    types: ["armadura"],
    makeDefault: true,
    label: "TQ.Item.Types.armadura"
  });
  Items.registerSheet("tierras-quebradas", HechizoSheet, {
    types: ["hechizo"],
    makeDefault: true,
    label: "TQ.Item.Types.hechizo"
  });
  Items.registerSheet("tierras-quebradas", VentajaSheet, {
    types: ["ventaja", "rasgo"],
    makeDefault: true,
    label: "TQ.Item.Types.ventaja"
  });
  Items.registerSheet("tierras-quebradas", PactoSheet, {
    types: ["pacto"],
    makeDefault: true,
    label: "TQ.Item.Types.pacto"
  });
  Items.registerSheet("tierras-quebradas", BendicionSheet, {
    types: ["bendicion"],
    makeDefault: true,
    label: "TQ.Item.Types.bendicion"
  });
  Items.registerSheet("tierras-quebradas", EspecieSheet, {
    types: ["especie"],
    makeDefault: true,
    label: "TQ.Item.Types.especie"
  });
  Items.registerSheet("tierras-quebradas", EntornoSheet, {
    types: ["entorno"],
    makeDefault: true,
    label: "TQ.Item.Types.entorno"
  });
  Items.registerSheet("tierras-quebradas", OrigenSheet, {
    types: ["origen"],
    makeDefault: true,
    label: "TQ.Item.Types.origen"
  });
  Items.registerSheet("tierras-quebradas", ProfesionSheet, {
    types: ["profesion"],
    makeDefault: true,
    label: "TQ.Item.Types.profesion"
  });
  Items.registerSheet("tierras-quebradas", IdiomaSheet, {
    types: ["idioma"],
    makeDefault: true,
    label: "TQ.Item.Types.idioma"
  });

  registerHandlebarsHelpers();

  loadTemplates([
    "systems/tierras-quebradas/templates/apps/character-creator.hbs",
    "systems/tierras-quebradas/templates/apps/pnj-importer.hbs",
    "systems/tierras-quebradas/templates/apps/director-widget.hbs",
    "systems/tierras-quebradas/templates/items/entorno-sheet.hbs",
    "systems/tierras-quebradas/templates/items/origen-sheet.hbs",
    "systems/tierras-quebradas/templates/items/profesion-sheet.hbs",
    "systems/tierras-quebradas/templates/actors/pj-sheet.hbs",
    "systems/tierras-quebradas/templates/actors/pnj-sheet.hbs",
    "systems/tierras-quebradas/templates/actors/criatura-sheet.hbs",
    "systems/tierras-quebradas/templates/actors/demonio-sheet.hbs",
    "systems/tierras-quebradas/templates/items/arma-sheet.hbs",
    "systems/tierras-quebradas/templates/items/armadura-sheet.hbs",
    "systems/tierras-quebradas/templates/items/hechizo-sheet.hbs",
    "systems/tierras-quebradas/templates/items/ventaja-sheet.hbs",
    "systems/tierras-quebradas/templates/items/especie-sheet.hbs",
    "systems/tierras-quebradas/templates/items/idioma-sheet.hbs",
    "systems/tierras-quebradas/templates/dialogs/tirada-dialogo.hbs",
    "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs"
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
});

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

// Botón importar PNJ en la barra lateral de actores
Hooks.on("renderActorDirectory", (_app, html) => {
  const actions = html.querySelector(".action-buttons");
  if (!actions) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = "Importar PNJ desde texto";
  btn.innerHTML = '<i class="fas fa-file-import"></i> Importar PNJ';
  btn.addEventListener("click", () => PNJImporter.open());
  actions.appendChild(btn);
});

// Interceptar creación de PJ para mostrar diálogo de elección
Hooks.on("preCreateActor", (actor, data, options, userId) => {
  if (game.userId !== userId) return;
  if (data.type !== "pj") return;
  if (options.tqWizard || options.tqBlank) return;

  const { DialogV2 } = foundry.applications.api;
  setTimeout(async () => {
    const choice = await DialogV2.wait({
      window: { title: "Nuevo Personaje Jugador" },
      content: `<p style="padding:6px 0;">¿Cómo quieres crear el personaje?</p>`,
      rejectClose: false,
      buttons: [
        { action: "wizard", label: "Creador de Personaje", default: true },
        { action: "blank",  label: "Ficha en Blanco" }
      ]
    });
    if (choice === "wizard") {
      CharacterCreator.open(data.name ?? "");
    } else if (choice === "blank") {
      Actor.create({
        name: data.name ?? "Personaje",
        type: "pj",
        img:  "icons/svg/mystery-man.svg"
      }, { tqBlank: true });
    }
  }, 0);
  return false;
});

// Especie: aplicar mecánicas al añadir al actor
Hooks.on("createItem", async (item, _options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "especie") return;
  if (_options.tqWizard) return; // El wizard ya aplicó las mecánicas manualmente
  const actor = item.parent;
  if (!actor) return;
  // Si ya había otra especie, revertirla y eliminarla primero
  const anterior = actor.items.find(i => i.type === "especie" && i.id !== item.id);
  if (anterior) {
    await actor._revertirEspecie(anterior);
    await anterior.delete({ tqRevertido: true });
  }
  await actor._aplicarEspecie(item);
});

// Especie: revertir mecánicas al retirar del actor
Hooks.on("deleteItem", async (item, _options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "especie") return;
  if (_options.tqRevertido) return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirEspecie(item);
});

// Entorno: aplicar mecánicas al añadir al actor
Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "entorno") return;
  if (options.tqWizard) return;
  const actor = item.parent;
  if (!actor) return;
  const anterior = actor.items.find(i => i.type === "entorno" && i.id !== item.id);
  if (anterior) { await actor._revertirEntorno(anterior); await anterior.delete(); }
  await actor._aplicarEntorno(item);
});

Hooks.on("deleteItem", async (item, _options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "entorno") return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirEntorno(item);
});

// Profesión: aplicar mecánicas al añadir al actor
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

Hooks.on("deleteItem", async (item, _options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "profesion") return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirProfesion(item);
});

// Origen: aplicar mecánicas al añadir al actor
Hooks.on("createItem", async (item, options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "origen") return;
  if (options.tqWizard) return;
  const actor = item.parent;
  if (!actor) return;
  // Si ya había un origen anterior, revertirlo primero
  const anterior = actor.items.find(i => i.type === "origen" && i.id !== item.id);
  if (anterior) {
    await actor._revertirOrigen(anterior);
    await anterior.delete();
  }
  await actor._aplicarOrigen(item);
});

// Origen: revertir mecánicas al retirar del actor
Hooks.on("deleteItem", async (item, _options, userId) => {
  if (game.userId !== userId) return;
  if (item.type !== "origen") return;
  const actor = item.parent;
  if (!actor) return;
  await actor._revertirOrigen(item);
});


// Retrato del actor + color del jugador en la cabecera de mensajes TQ
Hooks.on("renderChatMessageHTML", (message, html) => {
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

// Desangre: −1 PV al inicio de cada ronda para todos los actores con desangre
Hooks.on("updateCombat", async (combat, changes) => {
  if (!game.user.isGM) return;
  if (changes.round === undefined) return; // solo al cambiar de ronda
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor?.system?.salud?.desangre) continue;
    const pvActual = actor.system.salud.pvActual?.valor ?? 0;
    await actor.update({ "system.salud.pvActual.valor": pvActual - 1 });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong> pierde 1 PV por <em>Desangre</em> (total: ${pvActual - 1} PV).</p>`
    });
  }
});


// Dolor Extremo: se limpia al terminar el combate
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
