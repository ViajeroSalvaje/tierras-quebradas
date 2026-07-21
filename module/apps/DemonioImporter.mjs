import { ARMA_A_HABILIDAD_PNJ } from "../helpers/habilidades.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class DemonioImporter extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-demonio-importer", classes: ["tierras-quebradas", "pnj-importer"], position: { width: 560, height: 520 }, window: { title: "Importar Demonio", resizable: true }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/demonio-importer.hbs" }
  };

  get title() { return game.i18n.localize("TQ.Importer.TituloDemonio"); }

  static EJEMPLO = `Comadreja arco-iris DEMONIO
Conocidas como comadrejas arco-iris a falta de un nombre mejor.
CUE: 8 ATR: -3 PV: 21 | 10 | 5
MEN: 12 FUE: 11 Mod al Daño: +4/+5
ESP: 8 TAM: +3 Al impacto: 0
Protección: 1 (blanda).
Armas:
Mordisco 11. Daño 2+4. Presa.
Habilidades: Atletismo 11, Conocimiento mágico 19, Esquivar 13, Pelea 11.
Poderes:
◆ Presencia desconcertante: -2 a todas las acciones contra ella.
Movimiento: Correr, rápido.`;

  static open() {
    return new DemonioImporter().render(true);
  }

  async _prepareContext(options) {
    return { ejemploTexto: DemonioImporter.EJEMPLO };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(".demonio-import-btn")?.addEventListener("click", () => {
      const texto = this.element.querySelector(".pnj-raw-text")?.value ?? "";
      this._importar(texto.trim());
    });
  }

  async _importar(raw) {
    if (!raw) return ui.notifications.warn(game.i18n.localize("TQ.Importer.WarnPegaDemonio"));
    const datos = DemonioImporter._parsear(raw);
    if (!datos.nombre) return ui.notifications.warn(game.i18n.localize("TQ.Importer.WarnNombreDemonio"));

    const actor = await Actor.create({
      name: datos.nombre, type: "demonio", img: "icons/svg/mystery-man.svg", system: {
        caracteristicas: {
          cuerpo: { valor: datos.cuerpo }, mente: { valor: datos.mente }, espiritu: { valor: datos.espiritu }, atractivo: { valor: datos.atractivo }, tamano: { valor: datos.tamanyo }
        }, derivadas: {
          fuerza: { valor: datos.fuerza }, mDano1m: { valor: datos.mDano1m }, mDano2m: { valor: datos.mDano2m }
        }, salud: {
          pvMax: { valor: datos.pvMax }, pvActual: { valor: datos.pvMax }, pvGrave: { valor: datos.pvGrave }, pvLeve: { valor: datos.pvLeve }
        }, proteccion: { valor: datos.proteccion, tipo: datos.proteccionTipo }, alImpacto: datos.alImpacto, pm: datos.pm, movimiento: datos.movimiento, poderes: datos.poderes, debilidades: datos.debilidades, notas: datos.notas
      }
    });
    if (!actor) return;

    if (datos.proteccion > 0) {
      await Item.create({
        name: "Protección", type: "armadura", system: { proteccion: datos.proteccion, tipo: datos.proteccionTipo }
      }, { parent: actor });
    }

    if (Object.keys(datos.habilidades).length) {
      const upd = {};
      for (const [nombre, valor] of Object.entries(datos.habilidades)) {
        upd[`system.habilidades.${nombre}`] = valor;
      }
      await actor.update(upd);
    }

    const packNombres = [
      "tierras-quebradas.armamento-armas-cuerpo-a-cuerpo", "tierras-quebradas.armamento-armas-proyectiles", "tierras-quebradas.armamento-armas-arrojadizas", "tierras-quebradas.armamento-armas-improvisadas"
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
        const habMatch = datos.habilidades[a.nombre] ?? 0;
        const nivelFinal = a.nivel || habMatch;
        await Item.create({
          name: a.nombre, type: "arma", system: { habilidad: a.nombre, danoArma: a.dano, propiedades: a.propiedades }
        }, { parent: actor });
        if (nivelFinal) {
          await actor.update({ [`system.habilidades.${a.nombre}`]: nivelFinal });
        }
      }
    }

    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    const packRasgos = game.packs.get("tierras-quebradas.rasgos");
    const catalogoRasgos = packRasgos ? await packRasgos.getDocuments() : [];

    for (const p of datos.poderesItems) {
      const doc = catalogoRasgos.find(d => norm(d.name) === norm(p.nombre));
      if (doc) {
        await Item.create(doc.toObject(), { parent: actor });
      } else {
        await Item.create({ name: p.nombre, type: "rasgo", system: { tipo: "rasgoSobrenatural", efecto: p.efecto } }, { parent: actor });
      }
    }

    for (const d of datos.debilidadesItems) {
      const doc = catalogoRasgos.find(d2 => norm(d2.name) === norm(d.nombre));
      if (doc) {
        await Item.create(doc.toObject(), { parent: actor });
      } else {
        await Item.create({ name: d.nombre, type: "rasgo", system: { tipo: "debilidad", efecto: d.efecto } }, { parent: actor });
      }
    }

    ui.notifications.info(game.i18n.format("TQ.Importer.InfoDemonio", { nombre: datos.nombre }));
    this.close();
    actor.sheet.render(true);
  }

  static _parsear(raw) {
    const texto = raw.replace(/-\n\s*/g, "-").replace(/\n/g, " ").replace(/\s{2,}/g, " ");
    const lineas = raw.split("\n").map(l => l.trim()).filter(Boolean);

    const nombre = lineas[0].replace(/\s*DEMONIO\s*$/i, "").trim();

    const esCaract = (l) => /CUE:|MEN:|ESP:/i.test(l);
    const caractIdx = lineas.findIndex(esCaract);
    const desc = lineas.slice(1, caractIdx > 1 ? caractIdx : 1).join(" ");

    const int = (re, t = texto) => parseInt(t.match(re)?.[1]) || 0;
    const intSig = (re, t = texto) => { const m = t.match(re); return m ? (parseInt(m[1]) || 0) : 0; };

    const cuerpo = int(/CUE:\s*(\d+)/i);
    const mente = int(/MEN:\s*(\d+)/i);
    const espiritu = int(/ESP:\s*(\d+)/i);
    const atractivo = intSig(/ATR:\s*([+-]?\d+)/i);
    const tamanyo = intSig(/TAM:\s*([+-]?\d+)/i);
    const fuerza = int(/FUE:\s*(\d+)/i);
    const pm        = int(/PM:\s*(\d+)/i);
    const alImpacto = intSig(/Al\s+impacto:\s*([+-]?\d+)/i);

    const protLine = lineas.find(l => /protecc/i.test(l)) ?? "";
    const protMatch = protLine.normalize("NFC").match(/Protecci[oó]n:?\s*(\d+)\s*(?:\(([^)]+)\))?/i)
      ?? texto.normalize("NFC").match(/Protecci[oó]n:?\s*(\d+)\s*(?:\(([^)]+)\))?/i);
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

    // Secciones — extracción por líneas para evitar falsos positivos ("Habilidades: Armas: X")
    const sec = {};
    let secKey = null;
    for (const l of lineas) {
      const m = l.match(/^(Habilidades|Armas|Poderes|Debilidades):/i);
      if (m) {
        secKey = m[1].toLowerCase();
        sec[secKey] = (sec[secKey] ?? "") + l.slice(m[0].length).trim();
      } else if (secKey) {
        sec[secKey] += " " + l;
      }
    }

    // Habilidades: "Nombre valor, Nombre valor" — el nombre puede contener ":" (ej. "Armas: astas")
    const habilidades = {};
    if (sec.habilidades) {
      const limpio = sec.habilidades.replace(/Movimiento:.*/i, "").replace(/\.$/, "");
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ: ]*?)\s+(\d+)/g;
      let m;
      while ((m = re.exec(limpio)) !== null) {
        const nombreHab = m[1].trim();
        if (nombreHab) habilidades[nombreHab] = parseInt(m[2]);
      }
    }

    // Armas: "Nombre nivel. Daño valor. Propiedades."
    const armas = [];
    if (sec.armas) {
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*?)\s+(?:[12]M\s+)?(\d+)\.\s*Da[ñn]o:?\s*([^.]+)\.\s*([^A-Z]*?(?=[A-ZÁÉÍÓÚÑ]|$))?/g;
      let m;
      while ((m = re.exec(sec.armas)) !== null) {
        armas.push({
          nombre: m[1].trim(), nivel: parseInt(m[2]), dano: m[3].trim(), propiedades: m[4]?.trim() ?? ""
        });
      }
    }

    const poderes     = sec.poderes     ? sec.poderes.replace(/Movimiento:.*/i, "").trim()     : "";
    const debilidades = sec.debilidades ? sec.debilidades.replace(/Movimiento:.*/i, "").trim() : "";

    // Parsear entradas individuales de poderes y debilidades
    const parsearEntradas = (texto) => {
      if (!texto) return [];
      return texto.split(/◆|•|\n/).map(s => s.trim()).filter(Boolean).map(entrada => {
        const sep = entrada.indexOf(":");
        if (sep > 0 && sep < 60) {
          return { nombre: entrada.slice(0, sep).trim(), efecto: entrada.slice(sep + 1).trim() };
        }
        return { nombre: entrada, efecto: "" };
      });
    };
    const poderesItems     = parsearEntradas(poderes);
    const debilidadesItems = parsearEntradas(debilidades);

    const notasParts = [];
    if (desc) notasParts.push(desc);
    const notas = notasParts.join("\n");

    return { nombre, cuerpo, mente, espiritu, atractivo, tamanyo, fuerza, pvMax, pvGrave, pvLeve, proteccion, proteccionTipo, mDano1m, mDano2m, pm, alImpacto, movimiento, habilidades, armas, poderes, debilidades, poderesItems, debilidadesItems, notas };
  }
}
