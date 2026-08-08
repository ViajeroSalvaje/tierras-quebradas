import { ARMA_A_HABILIDAD_PNJ, HABILIDADES_OPCIONES } from "./habilidades.mjs";

const _norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// Compara ignorando plural: "mangos" === "mango", "escudos" === "escudo"
const _sinPlural = s => _norm(s).replace(/s$/, "");

// Busca si el nombre coincide con el sufijo (parte tras " - ") o última palabra de algún valor de ARMA_A_HABILIDAD_PNJ
const _buscarPorSufijo = (nombre) => {
  const n = _sinPlural(nombre);
  return Object.values(ARMA_A_HABILIDAD_PNJ).find(h => {
    const idx = h.indexOf(" - ");
    const sufijo = idx !== -1 ? h.slice(idx + 3) : h;
    return _sinPlural(sufijo) === n || _sinPlural(sufijo.split(" ").pop()) === n;
  }) ?? null;
};

const _buscarEnCatalogo = (catalogo, nombre) => {
  const buscar = _norm(nombre);
  const primeraPalabra = buscar.split(" ")[0];
  const exactos = catalogo.filter(d => {
    const nd = _norm(d.name);
    return nd === buscar || nd.split("-").pop().trim() === buscar;
  });
  if (exactos.length) return exactos;
  return catalogo.filter(d => {
    const nd = _norm(d.name);
    return nd === primeraPalabra || nd.split("-").pop().trim() === primeraPalabra;
  });
};

const _skillsUnicas = (docs) => {
  const vistas = new Set();
  return docs
    .map(d => ARMA_A_HABILIDAD_PNJ[d.system.habilidad])
    .filter(h => h && !vistas.has(h) && vistas.add(h))
    .map(h => ({ habNombre: h }));
};

// Detecta nombres de arma en datos.habilidades y en datos.armas sin catálogo.
// Devuelve un Map norm(weaponName) → habNombre, o null si el usuario cancela el modal.
export async function resolverHabilidadesArma(datos, getCatalogo) {
  const { DialogV2 } = foundry.applications.api;
  const catalogo = await getCatalogo();

  const armaAHab = new Map();
  const pendientes = [];

  for (const [nombre, nivel] of Object.entries(datos.habilidades)) {
    // Prioridad 1: coincidencia en catálogo de armas
    const docs = _buscarEnCatalogo(catalogo, nombre);
    if (docs.length) {
      const opciones = _skillsUnicas(docs);
      if (opciones.length === 1) {
        armaAHab.set(_norm(nombre), opciones[0].habNombre);
      } else if (opciones.length > 1) {
        pendientes.push({ nombre, nivel, opciones });
      }
      continue;
    }
    // Prioridad 2: abreviatura/sufijo de habilidad estándar (ej. "Mangos" → "Armas de Mango")
    const porSufijo = _buscarPorSufijo(nombre);
    if (porSufijo && porSufijo !== nombre) {
      armaAHab.set(_norm(nombre), porSufijo);
    }
  }

  for (const a of datos.armas) {
    const buscar = _norm(a.nombre);
    if (armaAHab.has(buscar)) continue;
    if (pendientes.some(p => _norm(p.nombre) === buscar)) continue;
    if (_buscarEnCatalogo(catalogo, a.nombre).length) continue;
    if (a.nivel) {
      const opciones = [
        { habNombre: a.nombre },
        ...Object.values(ARMA_A_HABILIDAD_PNJ).map(h => ({ habNombre: h }))
      ];
      pendientes.push({ nombre: a.nombre, nivel: a.nivel, opciones });
    }
  }

  if (!pendientes.length) return armaAHab;

  const filas = pendientes.map((p, i) => `
    <tr>
      <td style="padding:4px 8px;font-weight:bold;">${p.nombre} <span style="color:#888;font-weight:normal;">(${p.nivel})</span></td>
      <td style="padding:4px 8px;">
        <select name="a${i}" style="width:100%;">
          ${p.opciones.map(o => `<option value="${o.habNombre}">${o.habNombre}</option>`).join("")}
        </select>
      </td>
    </tr>`).join("");

  const html = `
    <p style="margin:0 0 8px;font-size:13px;color:#555;">
      Elige la habilidad de combate correspondiente para cada arma.
    </p>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ccc;">Arma</th>
        <th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ccc;">Habilidad</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;

  const resultado = await DialogV2.prompt({
    window: { title: "Habilidades de armas", resizable: true },
    position: { width: 460 },
    content: html,
    ok: {
      label: "Aceptar",
      callback: (_ev, button) => {
        const form = button.form;
        return Object.fromEntries(pendientes.map((p, i) => [p.nombre, form.elements[`a${i}`]?.value ?? ""]));
      }
    }
  }).catch(() => null);

  if (resultado === null) return null;

  for (const [nombre, habNombre] of Object.entries(resultado)) {
    if (habNombre) armaAHab.set(_norm(nombre), habNombre);
  }

  return armaAHab;
}

// Normaliza los nombres de habilidades al canónico del sistema (usando i18n como fuente de verdad).
// Ej: "Manejar botes" → "Manejar Botes", "Conocimiento mágico" → "Conocimiento Mágico".
export function normalizarHabilidades(datos) {
  const mapa = new Map();
  for (const { clave, label } of HABILIDADES_OPCIONES) {
    const canonical = game.i18n.localize(`TQ.Habilidades.${clave}`);
    mapa.set(_norm(label), canonical);
    mapa.set(_norm(canonical), canonical);
  }
  for (const nombre of [...Object.keys(datos.habilidades)]) {
    const canonical = mapa.get(_norm(nombre));
    if (!canonical || canonical === nombre) continue;
    const nivel = datos.habilidades[nombre];
    delete datos.habilidades[nombre];
    if (!(canonical in datos.habilidades)) datos.habilidades[canonical] = nivel;
  }
}

// Aplica el mapa armaAHab sobre datos.habilidades: reemplaza claves de arma por habilidad estándar.
export function aplicarResolucionesArma(datos, armaAHab) {
  for (const nombre of [...Object.keys(datos.habilidades)]) {
    const resuelto = armaAHab.get(_norm(nombre));
    if (!resuelto) continue;
    const nivel = datos.habilidades[nombre];
    delete datos.habilidades[nombre];
    if (!(resuelto in datos.habilidades)) datos.habilidades[resuelto] = nivel;
  }
}
