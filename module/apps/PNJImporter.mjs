import { ARMA_A_HABILIDAD_PNJ } from "../helpers/habilidades.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class PNJImporter extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-pnj-importer", classes: ["tierras-quebradas", "pnj-importer"], position: { width: 560, height: 520 }, window: { title: "Importar PNJ", resizable: true }
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
Hechizos:
Bendiciones:
Escudo de Fe (ESP: 1) Mano Sanadora (ESP: 2, PM: 3)
Ventajas: Sangre Fría (2 PP), Reflejos Rápidos (1 PP)
Desventajas: Codicioso (1 PP)
Rasgos: Intimidante, Ágil`;

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

    let updHabilidades = null;
    if (Object.keys(datos.habilidades).length) {
      updHabilidades = await PNJImporter._elegirHabilidadCorrecta(datos);
      if (updHabilidades === null) return;
    }

    const actor = await Actor.create({
      name: datos.nombre, type: "pnj", img: "icons/svg/mystery-man.svg", system: {
        caracteristicas: {
          cuerpo: { valor: datos.cuerpo }, mente: { valor: datos.mente }, espiritu: { valor: datos.espiritu }, atractivo: { valor: datos.atractivo }, tamano: { valor: datos.tamano }
        }, derivadas: {
          mDano1m: { valor: datos.mDano1m }, mDano2m: { valor: datos.mDano2m }
        }, salud: {
          pvMax: { valor: datos.pvMax }, pvActual: { valor: datos.pvMax }, pvGrave: { valor: datos.pvGrave }, pvLeve: { valor: datos.pvLeve }
        }, pm: datos.pm, notas: datos.notas
      }
    });
    if (!actor) return;

    if (updHabilidades && Object.keys(updHabilidades).length) {
      await actor.update(updHabilidades);
    }

    if (datos.proteccion > 0) {
      await Item.create({
        name: "Protección", type: "armadura", system: { proteccion: datos.proteccion, tipo: "blanda" }
      }, { parent: actor });
    }

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
        const habMatch = Object.entries(datos.habilidades).find(([h]) => norm(h) === norm(a.nombre));
        const nivel = habMatch ? habMatch[1] : a.nivel;
        await Item.create({
          name: a.nombre, type: "arma", system: { danoArma: a.dano, habilidad: a.nombre }
        }, { parent: actor });
        if (nivel) {
          await actor.update({ [`system.habilidades.${a.nombre}`]: nivel });
        }
      }
    }

    const packHechizos = game.packs.get("tierras-quebradas.hechizos");
    const catalogoHechizos = packHechizos ? await packHechizos.getDocuments() : [];

    for (const h of datos.hechizos) {
      const doc = catalogoHechizos.find(d => norm(d.name) === norm(h.nombre));
      if (doc) {
        const itemData = doc.toObject();
        itemData.system.nivelLanzamiento = h.nivel;
        await Item.create(itemData, { parent: actor });
      } else {
        await Item.create({
          name: h.nombre, type: "hechizo", system: { dificultad: h.dificultad, pmCoste: h.pmCoste, pmMax: h.pmMax, nivelLanzamiento: h.nivel }
        }, { parent: actor });
      }
    }

    const packBendiciones = game.packs.get("tierras-quebradas.bendiciones");
    const catalogoBendiciones = packBendiciones ? await packBendiciones.getDocuments() : [];

    for (const b of datos.bendiciones) {
      const doc = catalogoBendiciones.find(d => norm(d.name) === norm(b.nombre));
      if (doc) {
        await Item.create(doc.toObject(), { parent: actor });
      } else {
        await Item.create({
          name: b.nombre, type: "bendicion", system: { coste: b.coste, pmCoste: b.pmCoste, tipo: b.pmCoste > 0 ? "activa" : "pasiva" }
        }, { parent: actor });
      }
    }

    const packVentajas = game.packs.get("tierras-quebradas.ventajas");
    const catalogoVentajas = packVentajas ? await packVentajas.getDocuments() : [];

    for (const v of datos.ventajas) {
      const doc = catalogoVentajas.find(d => norm(d.name) === norm(v.nombre));
      if (doc) {
        await Item.create(doc.toObject(), { parent: actor });
      } else {
        await Item.create({ name: v.nombre, type: "ventaja", system: { coste: v.coste, tipo: v.tipo } }, { parent: actor });
      }
    }

    const packRasgos = game.packs.get("tierras-quebradas.rasgos");
    const catalogoRasgos = packRasgos ? await packRasgos.getDocuments() : [];

    for (const r of datos.rasgos) {
      const doc = catalogoRasgos.find(d => norm(d.name) === norm(r.nombre));
      if (doc) {
        await Item.create(doc.toObject(), { parent: actor });
      } else {
        await Item.create({ name: r.nombre, type: "rasgo" }, { parent: actor });
      }
    }

    ui.notifications.info(`PNJ "${datos.nombre}" importado.`);
    this.close();
    actor.sheet.render(true);
  }

  static async _elegirHabilidadCorrecta(datos) {
    const { DialogV2 } = foundry.applications.api;
    const cue = datos.cuerpo, men = datos.mente, esp = datos.espiritu;
    const atr = datos.atractivo, tam = datos.tamano;
    const bases = {
      agilidad: cue - tam, comunicacion: esp + atr, cultura: men, hechiceria: Math.round((men + esp) / 3), percepcion: Math.floor((men + esp) / 2), vigor: cue, tecnica: Math.floor((men + cue) / 2)
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
        window: { title: "Resolver habilidades", resizable: true }, position: { width: 500 }, content: html, ok: { label: "Importar", callback: (_ev, button) => {
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
        base: habItem.system.base, nivel: Math.max(0, total - baseValor), estorbo: habItem.system.estorbo ?? 0
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
    const secRe = /(Bendiciones[^:]*:|Hechizos:|Habilidades\s+m[áa]gicas:|Habilidades:|Armas:|Ventajas:|Desventajas:|Rasgos:)/gi;
    const partes = texto.split(secRe);
    const sec = {};
    for (let i = 1; i < partes.length; i += 2) {
      let clave = partes[i].toLowerCase().replace(/\s+/g, "_").replace(/[áa]/, "a").replace(":", "");
      if (clave.startsWith("bendiciones")) clave = "bendiciones";
      sec[clave] = partes[i + 1] ?? "";
    }

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

    // Hechizos: "Nombre [nivel] (Dif. X, PM Y)" o "(Dif. X | PM Y-Z)"
    const hechizos = [];
    if (sec.hechizos) {
      const re = /([A-Za-záéíóúñÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ\s]*?)(?:\s+(\d+))?\s*\(Dif\.\s*(\d+)[,|]\s*PM\s*(\d+)(?:-(\d+))?/g;
      let m;
      while ((m = re.exec(sec.hechizos)) !== null) {
        const nombreHechizo = m[1].trim().replace(/,\s*$/, "");
        if (!nombreHechizo) continue;
        hechizos.push({
          nombre: nombreHechizo, nivel: parseInt(m[2]) || 0, dificultad: parseInt(m[3]) || 15, pmCoste: parseInt(m[4]) || 1, pmMax: parseInt(m[5]) || 0
        });
      }
    }

    // Bendiciones: "Nombre (ESP: 1, PM: 3)" o simplemente "Nombre", separadas por comas o puntos
    const bendiciones = [];
    if (sec.bendiciones) {
      const entradas = sec.bendiciones.split(/[,.]/).map(s => s.trim()).filter(Boolean);
      for (const entrada of entradas) {
        const mEsp = entrada.match(/\(ESP:\s*(\d+)(?:,\s*PM:\s*(\d+))?\)/);
        const nombre = entrada.replace(/\(.*?\)/, "").trim();
        if (!nombre) continue;
        bendiciones.push({ nombre, coste: parseInt(mEsp?.[1]) || 0, pmCoste: parseInt(mEsp?.[2]) || 0 });
      }
    }

    // Ventajas / Desventajas: "Nombre (3 PP), Nombre2"
    const parsearVentajasDesventajas = (t, tipo) => {
      return t.split(/[,.]/).map(s => s.trim()).filter(Boolean).map(entrada => {
        const mCoste = entrada.match(/\((\d+)\s*PP\)/i);
        const nombre = entrada.replace(/\(.*?\)/, "").trim();
        return nombre ? { nombre, coste: parseInt(mCoste?.[1]) || 0, tipo } : null;
      }).filter(Boolean);
    };
    const ventajas = [
      ...parsearVentajasDesventajas(sec.ventajas ?? "", "ventaja"),
      ...parsearVentajasDesventajas(sec.desventajas ?? "", "desventaja")
    ];

    // Rasgos: "Nombre, Nombre2"
    const rasgos = (sec.rasgos ?? "").split(/[,.]/).map(s => s.trim()).filter(Boolean).map(nombre => ({ nombre }));

    // Notas: descripción + datos sin campo propio
    const notasParts = [];
    if (desc) notasParts.push(desc);
    if (fuerza) notasParts.push(`FUE: ${fuerza}`);
    if (modDanoStr) notasParts.push(`Mod. al Daño: ${modDanoStr}`);
    const notas = notasParts.join("\n");

    return { nombre, cuerpo, mente, espiritu, atractivo, tamano, pvMax, pvGrave, pvLeve, proteccion, mDano1m, mDano2m, pm, habilidades, armas, hechizos, bendiciones, ventajas, rasgos, notas };
  }
}
