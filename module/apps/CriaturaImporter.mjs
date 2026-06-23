import { ARMA_A_HABILIDAD_PNJ } from "../helpers/habilidades.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class CriaturaImporter extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-criatura-importer",
    classes: ["tierras-quebradas", "pnj-importer"],
    position: { width: 560, height: 520 },
    window: { title: "Importar Criatura", resizable: true }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/criatura-importer.hbs" }
  };

  static EJEMPLO = `Gólem de hierro AUTÓMATA
El gólem de hierro es un hombre metálico articulado de cráneo tachonado en hierro.
CUE: 10 ATR: - PV: 24 | 12 | 6
MEN: 3 FUE: 14 Mod al Daño: +5/+7
ESP: 6 TAM: +4 Al impacto: 0
Protección: 5 (dura).
Armas:
Púas 14. Daño 2+5.
Habilidades: Atletismo 12, Esquivar 10, Pelea 14.
Movimiento: Correr, medio.`;

  static open() {
    return new CriaturaImporter().render(true);
  }

  async _prepareContext(options) {
    return { ejemploTexto: CriaturaImporter.EJEMPLO };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(".criatura-import-btn")?.addEventListener("click", () => {
      const texto = this.element.querySelector(".pnj-raw-text")?.value ?? "";
      this._importar(texto.trim());
    });
  }

  async _importar(raw) {
    if (!raw) return ui.notifications.warn("Pega primero el texto de la criatura.");
    const datos = CriaturaImporter._parsear(raw);
    if (!datos.nombre) return ui.notifications.warn("No se pudo detectar el nombre de la criatura.");

    const actor = await Actor.create({
      name: datos.nombre,
      type: "criatura",
      img: "icons/svg/mystery-man.svg",
      system: {
        tipo: datos.tipo,
        caracteristicas: {
          cuerpo: { valor: datos.cuerpo },
          mente: { valor: datos.mente },
          espiritu: { valor: datos.espiritu },
          atractivo: { valor: datos.atractivo },
          tamanyo: { valor: datos.tamanyo }
        },
        derivadas: {
          fuerza: { valor: datos.fuerza },
          mDano1m: { valor: datos.mDano1m },
          mDano2m: { valor: datos.mDano2m }
        },
        salud: {
          pvMax: { valor: datos.pvMax },
          pvActual: { valor: datos.pvMax },
          pvGrave: { valor: datos.pvGrave },
          pvLeve: { valor: datos.pvLeve }
        },
        proteccion: { valor: datos.proteccion, tipo: datos.proteccionTipo },
        alImpacto: datos.alImpacto,
        pm: datos.pm,
        movimiento: datos.movimiento,
        poderes: datos.poderes,
        debilidades: datos.debilidades,
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
        catalogoArmas.push(...await pack.getDocuments());
      }
      return catalogoArmas;
    };

    for (const a of datos.armas) {
      const catalogo = await getCatalogo();
      const buscar = a.nombre.toLowerCase();
      const primeraPalabra = buscar.split(" ")[0];
      const doc = catalogo.find(d => {
        const nombreDoc = d.name.toLowerCase();
        return nombreDoc === buscar || nombreDoc.split("-").pop().trim() === buscar;
      }) ?? catalogo.find(d => {
        const nombreDoc = d.name.toLowerCase();
        return nombreDoc === primeraPalabra || nombreDoc.split("-").pop().trim() === primeraPalabra;
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
          system: { danoArma: a.dano, propiedades: a.propiedades }
        }, { parent: actor });
        if (a.nivel) {
          await actor.update({ [`system.habilidades.${a.nombre}`]: a.nivel });
        }
      }
    }

    ui.notifications.info(`Criatura "${datos.nombre}" importada.`);
    this.close();
    actor.sheet.render(true);
  }

  static _parsear(raw) {
    const texto = raw.replace(/-\n\s*/g, "-").replace(/\n/g, " ").replace(/\s{2,}/g, " ");
    const lineas = raw.split("\n").map(l => l.trim()).filter(Boolean);

    // Extraer tipo: última(s) palabra(s) en mayúsculas al final de la primera línea
    const palabras = lineas[0].split(/\s+/);
    const tipoWords = [];
    while (palabras.length > 0 && /^[A-ZÁÉÍÓÚÑ]+$/.test(palabras[palabras.length - 1])) {
      tipoWords.unshift(palabras.pop());
    }
    const nombre = palabras.join(" ").trim();
    const tipo = tipoWords.join(" ");

    const esCaract = (l) => /CUE:|MEN:|ESP:/i.test(l);
    const caractIdx = lineas.findIndex(esCaract);
    const desc = lineas.slice(1, caractIdx > 1 ? caractIdx : 1).join(" ");

    const int = (re, t = texto) => parseInt(t.match(re)?.[1]) || 0;
    const intSig = (re, t = texto) => { const m = t.match(re); return m ? (parseInt(m[1]) || 0) : 0; };

    const cuerpo = int(/CUE:\s*(\d+)/i);
    const mente = int(/MEN:\s*(\d+)/i);
    const espiritu = int(/ESP:\s*(\d+)/i);
    const atrRaw = texto.match(/ATR:\s*([+-]?\d+|-)/i)?.[1] ?? "0";
    const atractivo = atrRaw === "-" ? 0 : (parseInt(atrRaw) || 0);
    const tamanyo = intSig(/TAM:\s*([+-]?\d+)/i);
    const fuerza = int(/FUE:\s*(\d+)/i);
    const pm        = int(/PM:\s*(\d+)/i);
    const alImpacto = intSig(/Al\s+impacto:\s*([+-]?\d+)/i);

    const protMatch = texto.match(/Protecci[oó]n:\s*(\d+)\s*(?:\(([^)]+)\))?/i);
    const proteccion = parseInt(protMatch?.[1]) || 0;
    const proteccionTipo = protMatch?.[2]?.toLowerCase().includes("dura") ? "dura" : "blanda";

    const modDanoStr = texto.match(/Mod\.?\s+al\s+Da[ñn]o:\s*([^\s,;]+)/i)?.[1] ?? "";
    const modDanoParts = modDanoStr.split("/");
    const mDano1m = parseInt(modDanoParts[0]) || 0;
    const mDano2m = modDanoParts[1] ? (parseInt(modDanoParts[1]) || 0) : mDano1m;

    const pvMatch = texto.match(/PV:\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)/);
    const pvMax = parseInt(pvMatch?.[1]) || 10;
    const pvGrave = parseInt(pvMatch?.[2]) || Math.ceil(pvMax / 2);
    const pvLeve = parseInt(pvMatch?.[3]) || Math.ceil(pvMax / 4);

    const movimientoMatch = texto.match(/Movimiento:\s*([^.]+\.?)/i);
    const movimiento = movimientoMatch?.[1]?.trim() ?? "";

    const secRe = /(Habilidades:|Armas:|Poderes:|Debilidades:)/gi;
    const partes = texto.split(secRe);
    const sec = {};
    for (let i = 1; i < partes.length; i += 2) {
      const clave = partes[i].toLowerCase().replace(":", "").trim();
      sec[clave] = partes[i + 1] ?? "";
    }

    const habilidades = {};
    if (sec.habilidades) {
      const limpio = sec.habilidades.replace(/Movimiento:.*/i, "").replace(/\.$/, "");
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ ]*?)\s+(\d+)/g;
      let m;
      while ((m = re.exec(limpio)) !== null) {
        const nombreHab = m[1].trim();
        if (nombreHab) habilidades[nombreHab] = parseInt(m[2]);
      }
    }

    const armas = [];
    if (sec.armas) {
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*?)\s+(\d+)\.\s*Da[ñn]o:?\s*([^.]+)\.\s*([^A-Z]*?(?=[A-ZÁÉÍÓÚÑ]|$))?/g;
      let m;
      while ((m = re.exec(sec.armas)) !== null) {
        armas.push({
          nombre: m[1].trim(),
          nivel: parseInt(m[2]),
          dano: m[3].trim(),
          propiedades: m[4]?.trim() ?? ""
        });
      }
    }

    const poderes     = sec.poderes     ? sec.poderes.replace(/Movimiento:.*/i, "").trim()     : "";
    const debilidades = sec.debilidades ? sec.debilidades.replace(/Movimiento:.*/i, "").trim() : "";

    return { nombre, tipo, cuerpo, mente, espiritu, atractivo, tamanyo, fuerza, pvMax, pvGrave, pvLeve, proteccion, proteccionTipo, mDano1m, mDano2m, pm, alImpacto, movimiento, habilidades, armas, poderes, debilidades, notas: desc };
  }
}
