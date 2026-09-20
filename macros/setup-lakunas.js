// Macro de setup: crea las macros de lakuna en el compendio y vincula las armas
// Ejecutar una sola vez con el actor de la lakuna ya creado en el mundo.
// Si hay varias lakunas, ejecutar una vez por cada una seleccionando su token.

const PACK_ID = "tierras-quebras-tres-secretos.tres-secretos-macros";
const NOMBRE_ACTOR = "Lakuna"; // Cambia este nombre si tu actor se llama diferente

// Carga el código de los archivos .js del sistema
const [roceCode, contactoCode] = await Promise.all([
  fetch("systems/tierras-quebradas/macros/lakuna-roce.js").then(r => r.text()),
  fetch("systems/tierras-quebradas/macros/lakuna-contacto.js").then(r => r.text())
]);

const pack = game.packs.get(PACK_ID);
if (!pack) { ui.notifications.error("Pack no encontrado: " + PACK_ID); return; }

await pack.configure({ locked: false });

// Elimina versiones anteriores si existen
for (const entry of pack.index) {
  if (entry.name === "Lakuna - Roce" || entry.name === "Lakuna - Contacto") {
    const doc = await pack.getDocument(entry._id);
    await doc.delete();
  }
}

// Crea las macros en el compendio
await Macro.create(
  { name: "Lakuna - Roce", type: "script", command: roceCode, img: "icons/magic/unholy/beam-impact-purple.webp" },
  { pack: pack.collection }
);
await Macro.create(
  { name: "Lakuna - Contacto", type: "script", command: contactoCode, img: "icons/magic/unholy/beam-impact-purple.webp" },
  { pack: pack.collection }
);

await pack.configure({ locked: true });
ui.notifications.info("Macros creadas en el compendio.");

// Vincula las armas del actor
const actor = game.actors.find(a => a.name === NOMBRE_ACTOR);
if (!actor) {
  ui.notifications.warn(`Actor "${NOMBRE_ACTOR}" no encontrado. Vincula las armas manualmente con setFlag.`);
  return;
}

const armaRoce = actor.items.find(i => i.name.toLowerCase().includes("roce") && (i.type === "arma" || i.type === "objetoMagico"));
const armaContacto = actor.items.find(i => i.name.toLowerCase().includes("contacto") && (i.type === "arma" || i.type === "objetoMagico"));

if (armaRoce) await armaRoce.setFlag("tierras-quebradas", "macroNombre", "Lakuna - Roce");
if (armaContacto) await armaContacto.setFlag("tierras-quebradas", "macroNombre", "Lakuna - Contacto");

const vinculadas = [armaRoce?.name, armaContacto?.name].filter(Boolean).join(", ");
ui.notifications.info(`Armas vinculadas: ${vinculadas || "ninguna encontrada — revisa los nombres"}.`);
