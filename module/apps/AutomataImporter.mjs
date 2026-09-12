import { ARMA_A_HABILIDAD_PNJ } from "../helpers/habilidades.mjs";
import { resolverHabilidadesArma, aplicarResolucionesArma, normalizarHabilidades } from "../helpers/importerArmaResolver.mjs";
import { tqRound } from "../helpers/utils.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class AutomataImporter extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-automata-importer", classes: ["tierras-quebradas", "pnj-importer"], position: { width: 560, height: 520 }, window: { title: "Importar Autómata", resizable: true }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/apps/automata-importer.hbs" }
  };

  get title() { return game.i18n.localize("TQ.Importer.TituloAutomata"); }

  static EJEMPLO = `LA ARAÑA DE BRONCE
La araña, del tamaño de un toro, está formada por piezas articuladas recubiertas de un exoesqueleto de bronce.
La araña puede convertirse en un ser inmaterial gastando 3 PM.
CUE: 10 ATR: - PV: 24 | 12 | 6
MEN: 2 FUE: 14 Mod al Daño: +5/+7
ESP: 8 TAM: +4 Al impacto: 0
Protección: 5 (dura).
Armas:
Mordisco 17. Daño 3+5. Puede agarrar. Inyecta un veneno paralizante de Potencia 10.
Habilidades: Atletismo 11, Esquivar 14, Pelea 17, Percatarse 7, Trepar 11.
Rasgos y poderes: Mordisco (1 VM), Veneno (1 VM), Volverse inmaterial (3 VM).
Movimiento: Caminar, medio.`;

  static open() {
    return new AutomataImporter().render(true);
  }

  async _prepareContext(options) {
    return { ejemploTexto: AutomataImporter.EJEMPLO };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(".automata-import-btn")?.addEventListener("click", () => {
      const texto = this.element.querySelector(".pnj-raw-text")?.value ?? "";
      this._importar(texto.trim());
    });
  }

  async _importar(raw) {
    if (!raw) return ui.notifications.warn(game.i18n.localize("TQ.Importer.WarnPegaAutomata"));
    const datos = AutomataImporter._parsear(raw);
    if (!datos.nombre) return ui.notifications.warn(game.i18n.localize("TQ.Importer.WarnNombreAutomata"));

    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
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

    normalizarHabilidades(datos);
    const armaAHab = await resolverHabilidadesArma(datos, getCatalogo);
    if (armaAHab === null) return;
    aplicarResolucionesArma(datos, armaAHab);

    let updHabilidades = null;
    if (Object.keys(datos.habilidades).length) {
      updHabilidades = await AutomataImporter._elegirHabilidadCorrecta(datos);
      if (updHabilidades === null) return;
    }

    const actor = await Actor.create({
      name: datos.nombre, type: "automata", img: "icons/svg/mystery-man.svg", system: {
        caracteristicas: {
          cuerpo: { valor: datos.cuerpo }, mente: { valor: datos.mente }, espiritu: { valor: datos.espiritu }, atractivo: { valor: datos.atractivo }, tamano: { valor: datos.tamano }
        },
        derivadas: {
          fuerza: { valor: datos.fuerza }, mDano1m: { valor: datos.mDano1m }, mDano2m: { valor: datos.mDano2m }
        },
        salud: {
          pvMax: { valor: datos.pvMax }, pvActual: { valor: datos.pvMax }, pvGrave: { valor: datos.pvGrave }, pvLeve: { valor: datos.pvLeve }
        },
        proteccion: { valor: datos.proteccion, tipo: datos.proteccionTipo },
        alImpacto: datos.alImpacto,
        valorMagico: datos.valorMagico,
        coste: datos.valorMagico * 1000,
        movimiento: datos.movimiento,
        notas: datos.notas
      }
    });
    if (!actor) return;

    if (updHabilidades && Object.keys(updHabilidades).length) {
      await actor.update(updHabilidades);
    }

    if (datos.proteccion > 0) {
      await Item.create({
        name: "Protección", type: "armadura", system: { proteccion: datos.proteccion, tipo: datos.proteccionTipo }
      }, { parent: actor });
    }

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
        const habNombreResuelto = armaAHab.get(norm(a.nombre)) ?? a.nombre;
        const habMatch = datos.habilidades[habNombreResuelto] ?? 0;
        const nivelFinal = a.nivel || habMatch;
        await Item.create({
          name: a.nombre, type: "arma", system: { habilidad: habNombreResuelto, danoArma: a.dano, propiedades: a.propiedades }
        }, { parent: actor });
        if (nivelFinal) {
          await actor.update({ [`system.habilidades.${habNombreResuelto}`]: nivelFinal });
        }
      }
    }

    const packBestiario = game.packs.get("tierras-quebradas.rasgos-bestiario");
    const catalogoBestiario = packBestiario ? await packBestiario.getDocuments() : [];

    for (const p of datos.poderesItems) {
      const doc = catalogoBestiario.find(d => norm(d.name) === norm(p.nombre));
      if (doc) await Item.create(doc.toObject(), { parent: actor });
      else await Item.create({ name: p.nombre, type: "caracteristicaBestiario", system: { tipo: "rasgo", vm: p.vm, dano: p.dano ?? "", descripcion: p.descripcion ?? "" } }, { parent: actor });
    }

    for (const d of datos.debilidadesItems) {
      const doc = catalogoBestiario.find(dd => norm(dd.name) === norm(d.nombre));
      if (doc) await Item.create(doc.toObject(), { parent: actor });
      else await Item.create({ name: d.nombre, type: "caracteristicaBestiario", system: { tipo: "debilidad" } }, { parent: actor });
    }

    ui.notifications.info(game.i18n.format("TQ.Importer.InfoAutomata", { nombre: datos.nombre }));
    this.close();
    actor.sheet.render(true);
  }

  static _parsear(raw) {
    const texto = raw.replace(/-\n\s*/g, "-").replace(/\n/g, " ").replace(/\s{2,}/g, " ");
    const lineas = raw.split("\n").map(l => l.trim()).filter(Boolean);

    // Nombre en mayúsculas (primera línea), convertir a título
    const nombreRaw = lineas[0] ?? "";
    const nombre = nombreRaw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    const esCaract = (l) => /CUE:|MEN:|ESP:/i.test(l);
    const caractIdx = lineas.findIndex(esCaract);
    const descLineas = lineas.slice(1, caractIdx > 1 ? caractIdx : 1);
    const notas = descLineas.join("\n");

    const int = (re, t = texto) => parseInt(t.match(re)?.[1]) || 0;
    const intSig = (re, t = texto) => { const m = t.match(re); return m ? (parseInt(m[1]) || 0) : 0; };

    const cuerpo = int(/CUE:\s*(\d+)/i);
    const mente = int(/MEN:\s*(\d+)/i);
    const espiritu = int(/ESP:\s*(\d+)/i);
    const atrRaw = texto.match(/ATR:\s*([+-]?\d+|-)/i)?.[1] ?? "0";
    const atractivo = atrRaw === "-" ? 0 : (parseInt(atrRaw) || 0);
    const tamano = intSig(/TAM:\s*([+-]?\d+)/i);
    const fuerza = int(/FUE:\s*(\d+)/i);
    const alImpacto = intSig(/Al\s+impacto:\s*([+-]?\d+)/i);

    const protMatch = texto.normalize("NFC").match(/Protecci[oó]n:?\s*(\d+)\s*(?:\(([^)]+)\))?/i);
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

    // Secciones por líneas
    const SEC_MAP = { "habilidades": "habilidades", "armas": "armas", "rasgosy poderes": "poderesRaw", "rasgos y poderes": "poderesRaw", "poderes": "poderesRaw", "debilidades": "debilidadesRaw", "movimiento": "_fin" };
    const sec = {};
    let secKey = null;
    for (const l of lineas) {
      const m = l.match(/^(Rasgos\s+y\s+poderes|Poderes|Habilidades|Armas|Debilidades|Movimiento):/i);
      if (m) {
        const clave = m[1].toLowerCase().replace(/\s+/g, " ");
        secKey = SEC_MAP[clave] ?? clave;
        sec[secKey] = (sec[secKey] ?? "") + l.slice(m[0].length).trim();
      } else if (secKey) {
        sec[secKey] += " " + l;
      }
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
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*?)\s+(?:[12]M\s+)?(\d+)\.\s*Da[ñn]o:?\s*([^.]+)\.\s*([^A-Z]*?(?=[A-ZÁÉÍÓÚÑ]|$))?/g;
      let m;
      while ((m = re.exec(sec.armas)) !== null) {
        armas.push({ nombre: m[1].trim(), nivel: parseInt(m[2]), dano: m[3].trim(), propiedades: m[4]?.trim() ?? "" });
      }
    }

    const poderesItems = [];
    let valorMagico = 0;
    const poderesTexto = sec.poderesRaw ?? "";
    if (poderesTexto) {
      // ◆ Nombre: descripción — items inventados para este autómata
      const reRombo = /◆\s*([^:◆]+):\s*([^◆]*)/g;
      let mr;
      while ((mr = reRombo.exec(poderesTexto)) !== null) {
        const nombre = mr[1].trim();
        const descripcion = mr[2].trim();
        if (nombre) poderesItems.push({ nombre, vm: 0, descripcion });
      }
      // Resto del texto sin los bloques ◆
      const sinRombos = poderesTexto.replace(/◆[^◆]*/g, "").trim();
      if (sinRombos) {
        // Formato "Nombre (N VM)"
        const reVM = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*?)\s*\((\d+)\s*VM\)/g;
        let hayVM = false;
        let mv;
        while ((mv = reVM.exec(sinRombos)) !== null) {
          const vm = parseInt(mv[2]) || 0;
          valorMagico += vm;
          poderesItems.push({ nombre: mv[1].trim(), vm });
          hayVM = true;
        }
        // Sin VM: nombres simples separados por coma (ej: "Cavar [p. 262]", "Estallar (5d6) [p. 263]")
        if (!hayVM) {
          for (const parte of sinRombos.split(",")) {
            const danoMatch = parte.match(/\((\d+d\d+[^)]*)\)/i);
            const dano = danoMatch?.[1]?.trim() ?? "";
            const nombre = parte
              .replace(/\[p\.\s*\d+\]/g, "")
              .replace(/\([^)]*\)/g, "")
              .replace(/[.;]/g, "")
              .trim();
            if (nombre) poderesItems.push({ nombre, vm: 0, dano });
          }
        }
      }
    }
    const debilidadesItems = [];
    const debilidadesTexto = sec.debilidadesRaw ?? "";
    if (debilidadesTexto) {
      for (const parte of debilidadesTexto.split(",")) {
        const nombre = parte.split(":")[0].trim();
        if (nombre) debilidadesItems.push({ nombre });
      }
    }

    return { nombre, cuerpo, mente, espiritu, atractivo, tamano, fuerza, pvMax, pvGrave, pvLeve, proteccion, proteccionTipo, mDano1m, mDano2m, alImpacto, valorMagico, movimiento, habilidades, armas, poderesItems, debilidadesItems, notas };
  }

  static async _elegirHabilidadCorrecta(datos) {
    const { DialogV2 } = foundry.applications.api;
    const cue = datos.cuerpo, men = datos.mente, esp = datos.espiritu;
    const atr = datos.atractivo, tam = datos.tamano;
    const bases = {
      agilidad: cue - tam, comunicacion: esp + atr, cultura: men, hechiceria: Math.round((men + esp) / 3), percepcion: tqRound((men + esp) / 2), vigor: cue, tecnica: tqRound((men + cue) / 2)
    };

    const packHabs = game.packs.get("tierras-quebradas.habilidades");
    const catalogoHabs = packHabs ? await packHabs.getDocuments() : [];
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    const palabras = s => norm(s).split(/\s+/).filter(w => w.length > 2);

    const exactas = {};
    const sinMatch = {};

    for (const [nombre, total] of Object.entries(datos.habilidades)) {
      const habItem = catalogoHabs.find(d => norm(d.name) === norm(nombre));
      if (habItem) exactas[nombre] = { total, habItem };
      else sinMatch[nombre] = total;
    }

    const conCandidatos = {};
    for (const [nombre, total] of Object.entries(sinMatch)) {
      const pals = new Set(palabras(nombre));
      const candidatos = catalogoHabs
        .map(d => ({ d, score: palabras(d.name).filter(w => pals.has(w)).length }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(x => x.d);
      conCandidatos[nombre] = { total, candidatos };
    }

    const necesitaDialogo = Object.values(conCandidatos).some(v => v.candidatos.length > 0);

    let resoluciones = {};
    if (necesitaDialogo) {
      const entradas = Object.entries(conCandidatos).filter(([, v]) => v.candidatos.length > 0);
      const filas = entradas.map(([nombre, { total, candidatos }], i) => `
        <tr>
          <td style="padding:4px 8px;font-weight:bold;">${nombre} <span style="color:#888;font-weight:normal;">(${total})</span></td>
          <td style="padding:4px 8px;">
            <select name="h${i}" style="width:100%;">
              <option value="">— Valor numérico —</option>
              ${candidatos.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
            </select>
          </td>
        </tr>`).join("");

      const html = `
        <p style="margin:0 0 8px;font-size:13px;color:#555;">
          Estas habilidades no coinciden exactamente con el compendio. Elige a cuál corresponde cada una, o déjala como valor numérico.
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ccc;">Texto</th>
            <th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ccc;">Habilidad del compendio</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>`;

      const resultado = await DialogV2.prompt({
        window: { title: game.i18n.localize("TQ.Importer.ResolverHabilidades"), resizable: true }, position: { width: 500 }, content: html, ok: { label: game.i18n.localize("TQ.Botones.Importar"), callback: (_ev, button) => {
          const form = button.form;
          return Object.fromEntries(entradas.map(([nombre], i) => [nombre, form.elements[`h${i}`]?.value ?? ""]));
        }}
      }).catch(() => null);

      if (resultado === null) return null;
      resoluciones = resultado;
    }

    const upd = {};

    const aplicar = (nombre, total, habItem) => {
      const baseValor = bases[habItem.system.base] ?? 0;
      upd[`system.habilidades.${nombre}`] = {
        base: habItem.system.base, nivel: Math.max(0, total - baseValor), puntosFijos: habItem.system.puntosFijos ?? 0, estorbo: habItem.system.estorbo ?? 0
      };
    };

    for (const [nombre, { total, habItem }] of Object.entries(exactas)) {
      aplicar(nombre, total, habItem);
    }

    for (const [nombre, { total, candidatos }] of Object.entries(conCandidatos)) {
      const seleccion = resoluciones[nombre] ?? "";
      if (seleccion) {
        const habItem = catalogoHabs.find(d => d.name === seleccion);
        if (habItem) { aplicar(nombre, total, habItem); continue; }
      }
      upd[`system.habilidades.${nombre}`] = total;
    }

    for (const [nombre, total] of Object.entries(sinMatch)) {
      if (conCandidatos[nombre]) continue;
      upd[`system.habilidades.${nombre}`] = total;
    }

    return upd;
  }
}
