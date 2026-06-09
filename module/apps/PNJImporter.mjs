import { ARMA_A_HABILIDAD_PNJ } from "../helpers/habilidades.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class PNJImporter extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-pnj-importer",
    classes: ["tierras-quebradas", "pnj-importer"],
    position: { width: 560, height: 520 },
    window: { title: "Importar PNJ", resizable: true }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/pnj-importer.hbs" }
  };

  static EJEMPLO = `Bandido de Caminos
Mercenario sin escrúpulos que asalta viajeros en los senderos del reino.
CUE: 8 MEN: 5 ESP: 4 ATR: -1 TAM: 0
PV: 14 | 7 | 4
FUE: 8 Mod. al Daño: 1/2
PM: 4 Protección: 2
Habilidades:
Pelea 8 Sigilo 7 Percatarse 6 Buscar 5 Atletismo 7 Esquivar 6
Armas:
Espada 10. Daño: 2+2.
Cuchillo 8. Daño: 1+1.
Hechizos:`;

  static open() {
    return new PNJImporter().render(true);
  }

  async _prepareContext(options) {
    return { ejemploTexto: PNJImporter.EJEMPLO };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(".pnj-import-btn")?.addEventListener("click", () => {
      const texto = this.element.querySelector(".pnj-raw-text")?.value ?? "";
      this._importar(texto.trim());
    });
  }

  async _importar(raw) {
    if (!raw) return ui.notifications.warn("Pega primero el texto del PNJ.");
    const datos = PNJImporter._parsear(raw);
    if (!datos.nombre) return ui.notifications.warn("No se pudo detectar el nombre del PNJ.");

    const actor = await Actor.create({
      name: datos.nombre,
      type: "pnj",
      img: "icons/svg/mystery-man.svg",
      system: {
        caracteristicas: {
          cuerpo: { valor: datos.cuerpo },
          mente: { valor: datos.mente },
          espiritu: { valor: datos.espiritu },
          atractivo: { valor: datos.atractivo },
          tamano: { valor: datos.tamano }
        },
        derivadas: {
          mDano1m: { valor: datos.mDano1m },
          mDano2m: { valor: datos.mDano2m }
        },
        salud: {
          pvMax: { valor: datos.pvMax },
          pvActual: { valor: datos.pvMax },
          pvGrave: { valor: datos.pvGrave },
          pvLeve: { valor: datos.pvLeve }
        },
        notas: datos.notas
      }
    });
    if (!actor) return;

    if (Object.keys(datos.habilidades).length) {
      const upd = {};
      for (const [nombre, valor] of Object.entries(datos.habilidades)) {
        upd[`system.habilidades.${nombre}`] = valor;
      }
      await actor.update(upd);
    }

    if (datos.proteccion > 0) {
      await Item.create({
        name: "Protección",
        type: "armadura",
        system: { proteccion: datos.proteccion, tipo: "blanda" }
      }, { parent: actor });
    }

    const packNombres = [
      "tierras-quebradas.armamento-armas-cuerpo-a-cuerpo",
      "tierras-quebradas.armamento-armas-proyectiles",
      "tierras-quebradas.armamento-armas-arrojadizas",
      "tierras-quebradas.armamento-armas-improvisadas"
    ];
    let catalogoArmas = null;
    const getCatalogo = async () => {
      if (catalogoArmas) return catalogoArmas;
      catalogoArmas = [];
      for (const nombre of packNombres) {
        const pack = game.packs.get(nombre);
        if (!pack) continue;
        const docs = await pack.getDocuments();
        catalogoArmas.push(...docs);
      }
      return catalogoArmas;
    };

    for (const a of datos.armas) {
      const catalogo = await getCatalogo();
      const buscar = a.nombre.toLowerCase();
      const primeraPalabra = buscar.split(" ")[0];
      const doc = catalogo.find(d => {
        const n = d.name.toLowerCase();
        return n === buscar || n.split("-").pop().trim() === buscar;
      }) ?? catalogo.find(d => {
        const n = d.name.toLowerCase();
        return n === primeraPalabra || n.split("-").pop().trim() === primeraPalabra;
      });

      if (doc) {
        await Item.create(doc.toObject(), { parent: actor });
        if (a.nivel) {
          const habClave = doc.system.habilidad;
          const habNombre = ARMA_A_HABILIDAD_PNJ[habClave] ?? habClave;
          await actor.update({ [`system.habilidades.${habNombre}`]: a.nivel });
        }
      } else {
        await Item.create({
          name: a.nombre,
          type: "arma",
          system: { danoArma: a.dano }
        }, { parent: actor });
        if (a.nivel) {
          await actor.update({ [`system.habilidades.${a.nombre}`]: a.nivel });
        }
      }
    }

    for (const h of datos.hechizos) {
      await Item.create({
        name: h.nombre,
        type: "hechizo",
        system: { dificultad: h.dificultad, pmCoste: h.pmCoste }
      }, { parent: actor });
    }

    ui.notifications.info(`PNJ "${datos.nombre}" importado.`);
    this.close();
    actor.sheet.render(true);
  }

  static _parsear(raw) {
    // Reunir líneas; eliminar cortes de palabra con guión al final de línea
    const texto = raw.replace(/-\n\s*/g, "-").replace(/\n/g, " ").replace(/\s{2,}/g, " ");
    const lineas = raw.split("\n").map(l => l.trim()).filter(Boolean);

    const nombre = lineas[0] ?? "";

    // La descripción es la segunda línea si no contiene "CUE:" ni números seguidos de ":"
    const esCaract = (l) => /CUE:|MEN:|ESP:/i.test(l);
    const caractIdx = lineas.findIndex(esCaract);
    const desc = lineas.slice(1, caractIdx > 1 ? caractIdx : 1).join(" ");

    const int = (re, t = texto) => parseInt(t.match(re)?.[1]) || 0;
    const intSig = (re, t = texto) => parseInt(t.match(re)?.[1]) ?? 0;

    const cuerpo = int(/CUE:\s*(\d+)/i);
    const mente = int(/MEN:\s*(\d+)/i);
    const espiritu = int(/ESP:\s*(\d+)/i);
    const atractivo = intSig(/ATR:\s*([+-]?\d+)/i);
    const tamano = intSig(/TAM:\s*([+-]?\d+)/i);
    const fuerza = int(/FUE:\s*(\d+)/i);
    const pm = int(/PM:\s*(\d+)/i);
    const proteccion = int(/Protecci[oó]n:\s*(\d+)/i);
    const modDanoStr = texto.match(/Mod\.\s*al\s*Da[ñn]o:\s*([^\s,]+)/i)?.[1] ?? "";
    const modDanoParts = modDanoStr.split("/");
    const mDano1m = parseInt(modDanoParts[0]) || 0;
    const mDano2m = modDanoParts[1] ? (parseInt(modDanoParts[1]) || 0) : mDano1m;

    const pvMatch = texto.match(/PV:\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/);
    const pvMax = parseInt(pvMatch?.[1]) || 10;
    const pvGrave = parseInt(pvMatch?.[2]) || Math.ceil(pvMax / 2);
    const pvLeve = parseInt(pvMatch?.[3]) || Math.ceil(pvMax / 4);

    // Dividir en secciones
    const secRe = /(Hechizos:|Habilidades\s+m[áa]gicas:|Habilidades:|Armas:)/gi;
    const partes = texto.split(secRe);
    const sec = {};
    for (let i = 1; i < partes.length; i += 2) {
      const clave = partes[i].toLowerCase().replace(/\s+/g, "_").replace(/[áa]/, "a").replace(":", "");
      sec[clave] = partes[i + 1] ?? "";
    }

    // Mapa inverso: "puñal" → "Armas CC - Puñal", para normalizar nombres de armas en habilidades
    const sufijoAHabPNJ = {};
    for (const nombre of Object.values(ARMA_A_HABILIDAD_PNJ)) {
      const idx = nombre.indexOf(" - ");
      if (idx !== -1) sufijoAHabPNJ[nombre.slice(idx + 3).toLowerCase()] = nombre;
    }

    // Habilidades (normales y mágicas) → { "Nombre": valor }
    const habilidades = {};
    const parsearHabs = (t) => {
      const limpio = t.replace(/[A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*:/g, " ");
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ ]*?)\s+(\d+)/g;
      let m;
      while ((m = re.exec(limpio)) !== null) {
        const nombre = m[1].trim();
        if (!nombre) continue;
        const clave = sufijoAHabPNJ[nombre.toLowerCase()] ?? nombre;
        habilidades[clave] = parseInt(m[2]);
      }
    };
    if (sec.habilidades) parsearHabs(sec.habilidades);
    if (sec.habilidades_magicas) parsearHabs(sec.habilidades_magicas);

    // Armas: "Cuchillo 11. Daño: 2+2."
    const armas = [];
    if (sec.armas) {
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*?)\s+(\d+)\.\s*Da[ñn]o:?\s*([^.]+)\./g;
      let m;
      while ((m = re.exec(sec.armas)) !== null) {
        armas.push({ nombre: m[1].trim(), nivel: parseInt(m[2]), dano: m[3].trim() });
      }
    }

    // Hechizos: "Nombre [nivel] (Dif. X | PM Y)"
    const hechizos = [];
    if (sec.hechizos) {
      const re = /(.+?)(?:\s+(\d+))?\s*\(Dif\.\s*(\d+)\s*[|]\s*PM\s*([\d]+)/g;
      let m;
      while ((m = re.exec(sec.hechizos)) !== null) {
        const nombreHechizo = m[1].trim().replace(/,\s*$/, "").replace(/^[^A-Za-záéíóúñÁÉÍÓÚÑ]+/, "");
        if (!nombreHechizo) continue;
        hechizos.push({
          nombre: nombreHechizo,
          nivel: parseInt(m[2]) || 0,
          dificultad: parseInt(m[3]) || 15,
          pmCoste: parseInt(m[4]) || 1
        });
      }
    }

    // Notas: descripción + datos sin campo propio
    const notasParts = [];
    if (desc) notasParts.push(desc);
    if (pm) notasParts.push(`PM: ${pm}`);
    if (fuerza) notasParts.push(`FUE: ${fuerza}`);
    if (modDanoStr) notasParts.push(`Mod. al Daño: ${modDanoStr}`);
    const notas = notasParts.join("\n");

    return { nombre, cuerpo, mente, espiritu, atractivo, tamano, pvMax, pvGrave, pvLeve, proteccion, mDano1m, mDano2m, habilidades, armas, hechizos, notas };
  }
}
