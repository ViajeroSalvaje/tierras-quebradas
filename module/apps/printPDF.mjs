async function ensureScript(url) {
  if (document.querySelector(`script[src="${url}"]`)) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function printActorPDF(actor, data) {
  await ensureScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await ensureScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  const el = document.createElement("div");
  el.style.cssText = [
    "position:absolute", "left:-9999px", "top:0",
    "width:794px", "background:#FEFCF7",
    "padding:36px 38px", "box-sizing:border-box",
    "font-family:Arial,Helvetica,sans-serif",
    "font-size:12px", "color:#1A1008",
  ].join(";");
  el.innerHTML = actor.type === "pj" ? buildHTMLPJ(actor, data) : buildHTML(actor, data);
  document.body.appendChild(el);

  await new Promise(r => setTimeout(r, 100));

  const canvas = await window.html2canvas(el, {
    scale: 2,
    backgroundColor: "#FEFCF7",
    useCORS: false,
    logging: false,
    width: 794,
  });
  document.body.removeChild(el);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // A4 en px a escala 2: 794*2 × 1123*2
  const PAGE_H_PX = Math.round(canvas.width * (297 / 210));
  const pages = Math.ceil(canvas.height / PAGE_H_PX);

  for (let p = 0; p < pages; p++) {
    if (p > 0) pdf.addPage();
    const sliceH = Math.min(PAGE_H_PX, canvas.height - p * PAGE_H_PX);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    slice.getContext("2d").drawImage(canvas, 0, -p * PAGE_H_PX);
    const imgH = 297 * sliceH / PAGE_H_PX;
    pdf.addImage(slice.toDataURL("image/png"), "PNG", 0, 0, 210, imgH);
  }

  pdf.save(`${actor.name}.pdf`);
}

// Construcción del HTML

function buildHTML(actor, data) {
  const s   = data.system;
  const T   = "#1C6473";
  const INK = "#1A1008";
  const DIM = "#5C4838";

  const sign = v => (v >= 0 ? "+" : "") + v;
  const esc  = t => String(t ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const sh  = t => `<div style="font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:${T};font-weight:bold;margin:7px 0 3px;padding-bottom:4px;border-bottom:1px solid ${T};">${t}</div>`;
  const lbl = t => `<span style="font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:0.7px;color:${DIM};">${t}: </span>`;
  const p   = t => `<p style="margin:0 0 3px;font-size:10.5px;line-height:1.5;font-family:Georgia,serif;">${t}</p>`;
  const ps  = t => `<p style="margin:7px 0 3px;font-size:10.5px;line-height:1.5;font-family:Georgia,serif;">${t}</p>`;

  // Filiación / deidades
  let filiaStr = "";
  if (s.filiacion) {
    filiaStr = s.filiacion.charAt(0).toUpperCase() + s.filiacion.slice(1);
    if (s.deidad)  filiaStr += " · " + s.deidad;
    if (s.deidad2) filiaStr += " / " + s.deidad2;
  }

  // Estados de salud
  const estados = [];
  const nleves = [s.salud.heridasLeves1,s.salud.heridasLeves2,s.salud.heridasLeves3,s.salud.heridasLeves4].filter(Boolean).length;
  const ngraves = [s.salud.heridasGraves1,s.salud.heridasGraves2].filter(Boolean).length;
  if (nleves)            estados.push(nleves + " HL");
  if (ngraves)           estados.push(ngraves + " HG");
  if (s.salud.debilitado)   estados.push("Deb.");
  if (s.salud.incapacitado) estados.push("Inc.");
  const estadoStr = estados.length ? ` <span style="color:#7A1515;font-weight:bold;">(${estados.join(", ")})</span>` : "";

  // Bases como texto compacto
  const basesStr = [
    ["VIG", s.bases.vigor.valor], ["AGI", s.bases.agilidad.valor],
    ["COM", s.bases.comunicacion.valor], ["CUL", s.bases.cultura.valor],
    ["PER", s.bases.percepcion.valor], ["TEC", s.bases.tecnica.valor],
    ["HEC", s.bases.hechiceria.valor],
  ].map(([l,v]) => `${l} ${v}`).join("  ");

  // Mapa de habilidades para consulta por armas
  const habMap = {};
  for (const h of data.habilidades) habMap[h.nombre.toLowerCase()] = h.total;

  // Protecciones como texto
  let protStr = "";
  if (data.armaduras?.length) {
    const lineas = data.armaduras.map(a => {
      const zona = a.zona && a.zona !== "cuerpo" ? ` (${a.zona})` : "";
      return `${esc(a.name)}, ARM ${a.proteccion}${a.tipo ? ", " + a.tipo : ""}${zona}`;
    });
    lineas.push(`<strong>Total equipado: ARM ${data.proteccionTotal ?? 0}, Carga ${data.cargaProteccionTotal ?? 0}</strong>`);
    protStr = lineas.join("<br>");
  }

  // Armas como líneas de texto
  let armasHtml = "";
  if (data.armas?.length) {
    armasHtml = data.armas.map(a => {
      const habKey = (a.habilidad ?? "").toLowerCase();
      const habTotal = habMap[habKey] ? ` ${habMap[habKey]}` : "";
      const partes = [`<strong>${esc(a.name)}${habTotal}</strong>`];
      if (a.dano) partes.push(`Daño: ${a.dano}`);
      if (a.alcance && a.alcance !== "contacto") partes.push(`Alcance: ${a.alcance}`);
      return partes.join(". ") + ".";
    }).join("<br>");
  }

  // Habilidades como lista de texto
  const habStr = data.habilidades.map(h =>
    `${esc(h.nombre)}${h.tieneEstorbo ? "*" : ""} ${h.total}`
  ).join(", ");

  // Hechizos como texto
  let hechizosHtml = "";
  if (data.hechizos?.length) {
    hechizosHtml = data.hechizos.map(h => {
      const meta = [h.system.verbo, h.system.esfera].filter(Boolean).join(" ");
      const pm = h.system.pmCoste + (h.system.pmMax > h.system.pmCoste ? "–" + h.system.pmMax : "");
      return `<strong>${esc(h.name)}</strong>${meta ? ", " + meta : ""}, DIF ${h.system.dificultad}, PM ${pm}`;
    }).join("; ");
  }

  // Rasgos / ventajas como texto
  const rasgosStr   = data.rasgos?.map(r => `<strong>${esc(r.name)}</strong>${r.coste ? ` (${r.coste} PP)` : ""}`).join("; ") ?? "";
  const ventajasStr = data.ventajas?.map(v => `<strong>${esc(v.name)}</strong>`).join("; ") ?? "";

  // Equipo combinado
  const equipoItems = [
    ...(data.objetos ?? []).map(o => `${esc(o.name)}${o.categoria ? ` (${o.categoria})` : ""}`),
    ...(data.consumibles ?? []).map(c => `${esc(c.name)} ×${c.dosis}${c.efecto ? " — " + esc(c.efecto) : ""}`),
    ...(data.objetosMagicos ?? []).map(o => `✦ ${esc(o.name)}${o.system.espiritu ? " [ESP " + o.system.espiritu + " · PM " + o.system.pmActual + "]" : ""}`),
  ];
  const equipoStr = equipoItems.join("; ");

  // Heridas activas
  const heridasData = Array.isArray(s.heridas) ? s.heridas : Object.values(s.heridas ?? {});
  const heridasStr  = heridasData.map(h =>
    `${esc(h.tipo)}: ${esc(h.descripcion)}${h.dano ? " (" + h.dano + ")" : ""}${h.sanando ? " [sanando]" : ""}`
  ).join("; ");

  return `
    <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px;padding-bottom:9px;border-bottom:2px solid ${T};">
      <span style="font-size:21px;font-weight:bold;font-family:Georgia,serif;">${esc(actor.name)}</span>
      ${filiaStr ? `<span style="font-size:9.5px;text-transform:uppercase;letter-spacing:1px;color:${DIM};">${esc(filiaStr)}</span>` : ""}
      <span style="margin-left:auto;font-size:8.5px;color:${DIM};text-transform:uppercase;letter-spacing:1px;">PNJ</span>
    </div>

    ${s.notas ? `<div style="font-size:10.5px;line-height:1.55;margin-bottom:8px;font-family:Georgia,serif;">${esc(s.notas).replace(/\n/g,"<br>")}</div>` : ""}

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px 20px;margin-bottom:4px;padding:6px 0 9px;border-top:1px solid #ccc;border-bottom:1px solid #ccc;font-size:11px;">
      <div>${lbl("CUE")}${s.caracteristicas.cuerpo.valor}</div>
      <div>${lbl("ATR")}${sign(s.caracteristicas.atractivo.valor)}</div>
      <div>${lbl("PV")}${s.salud.pvActual.valor} / ${s.salud.pvMax.valor}${estadoStr}</div>
      <div>${lbl("MEN")}${s.caracteristicas.mente.valor}</div>
      <div>${lbl("FUE")}${s.derivadas.fuerza.valor}</div>
      <div>${lbl("MD")}${sign(s.derivadas.mDano1m.valor)} / ${sign(s.derivadas.mDano2m.valor)}</div>
      <div>${lbl("ESP")}${s.caracteristicas.espiritu.valor}</div>
      <div>${lbl("TAM")}${sign(s.caracteristicas.tamano.valor)}</div>
      <div style="font-size:9px;color:${DIM};padding-top:1px;">${basesStr}</div>
    </div>

    ${protStr ? `${sh("Protección")}<div style="font-size:10.5px;line-height:1.6;font-family:Georgia,serif;">${protStr}</div>` : ""}

    ${armasHtml ? `${sh("Armas")}<div style="font-size:10.5px;line-height:1.6;font-family:Georgia,serif;">${armasHtml}</div>` : ""}

    ${habStr ? `${sh("Habilidades")}${p(habStr)}` : ""}

    ${hechizosHtml ? `${sh("Hechizos")}${(s.pm || data.espirituConsagrado) ? p(`${lbl("Magia")}PM: ${s.pm ?? 0}  ·  ESP. Cons.: ${data.espirituConsagrado} / ${s.caracteristicas.espiritu.valor}`) : ""}${p(hechizosHtml)}` : ""}

    ${(rasgosStr || ventajasStr || equipoStr || heridasStr) ? `
      ${sh("Otros")}
      ${rasgosStr   ? p(`${lbl("Rasgos")}${rasgosStr}`) : ""}
      ${ventajasStr ? p(`${lbl("Ventajas")}${ventajasStr}`) : ""}
      ${equipoStr   ? p(`${lbl("Equipo")}${equipoStr}`) : ""}
      ${heridasStr  ? p(`${lbl("Heridas")}${heridasStr}`) : ""}
    ` : ""}
  `;
}

function buildHTMLPJ(actor, data) {
  const s = data.system;
  const T = "#1C6473";
  const CR = "#F5F0E8";
  const INK = "#1A1008";
  const DIM = "#5C4838";
  const BRD = "#C8BAA0";

  const sign = v => (v >= 0 ? "+" : "") + v;
  const esc = t => String(t ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const BASE_ABREV = { vigor:"VIG", agilidad:"AGI", comunicacion:"COM", cultura:"CUL", percepcion:"PER", tecnica:"TEC", hechiceria:"HEC" };
  const VERBOS_ORDEN = ["aumentar","conocer","disminuir","dirigir","inhibir","invocar","modificar","transformar"];
  const ESFERAS_ORDEN = ["agua","aire","fuego","tierra","cuerpo","espiritu","mente","planta","caos","ley"];

  const caract = s.caracteristicas;
  const bases = s.bases;
  const deriv = s.derivadas;
  const hec = s.hechiceria ?? {};
  const sal = s.salud;
  const fort = s.fortuna ?? {};
  const dest = s.destino ?? {};
  const leal = s.lealtad ?? {};

  const nleves = [sal.heridasLeves1, sal.heridasLeves2, sal.heridasLeves3, sal.heridasLeves4].filter(Boolean).length;
  const ngraves = [sal.heridasGraves1, sal.heridasGraves2].filter(Boolean).length;

  const todasHabs = Object.entries(s.habilidades ?? {}).map(([clave, h]) => {
    const nombre = h.nombre || game.i18n.localize("TQ.Habilidades." + clave) || clave;
    const nivel = (h.nivel ?? 0) + (h.puntosFijos ?? 0);
    const baseVal = bases[h.base]?.valor ?? 0;
    const baseAbr = BASE_ABREV[h.base] ?? (h.base ?? "").slice(0,3).toUpperCase();
    return { nombre, nivel, total: baseVal + nivel, baseAbr, esEsp: h.especializada ?? false, estorbo: h.estorbo ?? 0, activa: nivel > 0 };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const todasArmas = [...(data.items?.armas ?? []), ...(data.items?.armasMagicas ?? [])].filter(a => a.equipped !== false);
  const armaduras = data.items?.armaduras ?? [];
  const hechizos = data.items?.hechizos ?? [];
  const rasgos = data.items?.rasgos ?? [];
  const ventajas = data.items?.ventajas ?? [];
  const objetos = [...(data.items?.objetos ?? []), ...(data.items?.consumibles ?? []), ...(data.items?.objetosMagicos ?? [])];
  const heridasList = Object.values(s.heridas ?? {}).filter(h => h.descripcion || h.tipo);
  const protTotal = data.items?.proteccionTotal ?? 0;

  const secHdr = (txt, fz="7.5px") =>
    `<div style="background:${T};color:white;font-size:${fz};font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:2.5px 7px;margin-bottom:4px;">${txt}</div>`;

  const secLine = (txt) =>
    `<div style="display:flex;align-items:center;gap:5px;margin:8px 0 4px;">
      <div style="flex:1;height:1.5px;background:${T};"></div>
      <div style="color:${T};font-size:7px;font-weight:bold;letter-spacing:2px;white-space:nowrap;">${txt}</div>
      <div style="flex:1;height:1.5px;background:${T};"></div>
    </div>`;

  const diamante = (valor, label, sz=54) => {
    const h = sz / 2;
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
      <svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}">
        <polygon points="${h},2 ${sz-2},${h} ${h},${sz-2} 2,${h}" fill="none" stroke="${T}" stroke-width="2.5"/>
        <text x="${h}" y="${h+5}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${INK}">${valor}</text>
      </svg>
      <div style="font-size:6.5px;font-weight:bold;letter-spacing:1.5px;color:${T};text-transform:uppercase;">${label}</div>
    </div>`;
  };

  const diamSmall = (valor, label) => {
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <polygon points="22,2 42,22 22,42 2,22" fill="none" stroke="${DIM}" stroke-width="2"/>
        <text x="22" y="27" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="${INK}">${valor}</text>
      </svg>
      <div style="font-size:6px;font-weight:bold;letter-spacing:1px;color:${DIM};text-transform:uppercase;">${label}</div>
    </div>`;
  };

  const circulo = (filled) =>
    `<svg width="9" height="9" viewBox="0 0 9 9"><circle cx="4.5" cy="4.5" r="3.8" fill="${filled ? T : "none"}" stroke="${T}" stroke-width="1.2"/></svg>`;

  const check = (filled) =>
    `<svg width="9" height="9" viewBox="0 0 9 9"><rect x="0.5" y="0.5" width="8" height="8" fill="${filled ? T : "none"}" stroke="${T}" stroke-width="1.5"/></svg>`;

  const basesTabla = [
    ["Agilidad","CUE-TAM",bases.agilidad.valor],
    ["Comunicación","ESP+ATR",bases.comunicacion.valor],
    ["Cultura","MEN",bases.cultura.valor],
    ["Hechicería","(MEN+ESP)/3",bases.hechiceria.valor],
    ["Percepción","(MEN+ESP)/2",bases.percepcion.valor],
    ["Técnica","(MEN+CUE)/2",bases.tecnica.valor],
    ["Vigor","CUE",bases.vigor.valor],
  ].map(([n,f,v]) =>
    `<tr>
      <td style="font-size:8.5px;padding:1px 2px;">${n}</td>
      <td style="font-size:7px;color:${T};padding:1px 3px;">${f}</td>
      <td style="font-size:10px;font-weight:bold;text-align:right;padding:1px 2px;">${v}</td>
    </tr>`
  ).join("");

  const habsHtml = todasHabs.map(h => {
    const esStr = h.esEsp ? ` <span style="font-size:6.5px;color:${DIM};">E</span>` : "";
    const eStr = h.estorbo > 0 ? `<span style="color:#7A1515;">*</span>` : "";
    return `<div style="display:flex;align-items:center;gap:2px;padding:1.5px 0;border-bottom:1px solid ${BRD};">
      ${circulo(h.activa)}
      <span style="flex:1;font-size:8px;overflow:hidden;white-space:nowrap;">${esc(h.nombre)}${esStr}${eStr}</span>
      <span style="font-size:7px;color:${DIM};margin-right:1px;">${h.baseAbr}+</span>
      <span style="font-size:8.5px;font-weight:bold;min-width:16px;text-align:right;">${h.activa ? h.total : ""}</span>
    </div>`;
  }).join("");

  const armasFilas = todasArmas.map(a =>
    `<tr style="border-bottom:1px solid ${BRD};">
      <td style="padding:2px 3px;font-size:8px;">${esc(a.item.name)} <b>${a.habTotal ?? ""}</b></td>
      <td style="padding:2px 3px;font-size:8px;text-align:center;">${esc(a.item.system.danoArma ?? "")}${a.mdStr ? " "+a.mdStr : ""}</td>
      <td style="padding:2px 3px;font-size:8px;text-align:center;">${esc(a.item.system.tipoArma ?? "")}</td>
      <td style="padding:2px 3px;font-size:8px;text-align:center;">${esc(a.item.system.alcance ?? "")}</td>
    </tr>`
  ).join("") + Array(Math.max(0, 7 - todasArmas.length)).fill(
    `<tr style="border-bottom:1px solid ${BRD};"><td style="padding:3.5px;"> </td><td></td><td></td><td></td></tr>`
  ).join("");

  const armFilas = armaduras.map(a => {
    const sys = a.system;
    const zona = sys.zona && sys.zona !== "cuerpo" ? ` (${esc(sys.zona)})` : "";
    return `<tr style="border-bottom:1px solid ${BRD};">
      <td style="padding:2px 3px;font-size:8px;">${esc(a.name)}${zona}</td>
      <td style="padding:2px 3px;font-size:8px;text-align:center;">${esc(sys.tipo || "")}</td>
      <td style="padding:2px 3px;font-size:8.5px;font-weight:bold;text-align:center;">${sys.proteccion ?? 0}</td>
    </tr>`;
  }).join("") + Array(Math.max(0, 2 - armaduras.length)).fill(
    `<tr style="border-bottom:1px solid ${BRD};"><td style="padding:3.5px;"> </td><td></td><td></td></tr>`
  ).join("");

  const heridasFilas = heridasList.slice(0,5).map(h =>
    `<tr>
      <td style="font-size:7.5px;padding:1px 2px;border-bottom:1px solid ${BRD};">${esc(h.descripcion || h.tipo || "")}</td>
      <td style="font-size:7.5px;text-align:center;padding:1px 2px;">${h.dano || ""}</td>
      <td style="text-align:center;padding:1px 2px;">${circulo(h.sanando)}</td>
    </tr>`
  ).join("") + Array(Math.max(0, 5 - heridasList.length)).fill(
    `<tr>
      <td style="padding:2px;border-bottom:1px solid ${BRD};font-size:7px;"> </td>
      <td></td><td style="text-align:center;">${circulo(false)}</td>
    </tr>`
  ).join("");

  const footer = (n) =>
    `<div style="display:flex;align-items:center;margin-top:16px;border-top:1px solid ${T};gap:0;font-size:7px;">
      <div style="background:${T};color:white;padding:2px 8px;font-weight:bold;">&copy; 2024 Ediciones t&t</div>
      <div style="flex:1;text-align:center;font-weight:bold;letter-spacing:2px;color:${T};text-transform:uppercase;">TIERRAS QUEBRADAS &bull; HOJA DE PERSONAJE ${n}/2</div>
      <div style="background:${T};color:white;padding:2px 8px;">v. Junio 2024</div>
    </div>`;

  const pg1 = `
    <div style="padding-bottom:24px;">

      <!-- CABECERA -->
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">

        <!-- Izq: logo + nombre + características -->
        <div style="flex:2.2;display:flex;flex-direction:column;gap:5px;">
          <div style="font-size:14px;font-weight:bold;letter-spacing:2px;color:${T};line-height:1.1;">TIERRAS<br>QUEBRADAS</div>
          <div style="font-size:7.5px;color:${DIM};">Jugador/a</div>
          <div style="border:2px solid ${T};padding:3px 8px;display:flex;align-items:center;gap:6px;">
            <svg width="8" height="16" viewBox="0 0 8 16"><polygon points="8,0 0,8 8,16" fill="${T}"/></svg>
            <span style="font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">${esc(actor.name)}</span>
            <svg width="8" height="16" viewBox="0 0 8 16" style="margin-left:auto;"><polygon points="0,0 8,8 0,16" fill="${T}"/></svg>
          </div>
          <div style="display:flex;gap:8px;justify-content:space-around;padding:4px 0;">
            ${diamante(caract.cuerpo.valor,   "CUERPO")}
            ${diamante(caract.mente.valor,    "MENTE")}
            ${diamante(caract.espiritu.valor, "ESPÍRITU")}
          </div>
          <div style="display:flex;gap:8px;justify-content:space-around;padding:2px 0;">
            ${diamSmall(sign(caract.atractivo.valor), "ATRACTIVO")}
            ${diamSmall(deriv.fuerza.valor,            "FUERZA")}
            ${diamSmall(sign(caract.tamano.valor),     "TAMAÑO")}
          </div>
          <div style="font-size:7px;color:${DIM};text-align:center;">CUE + TAM</div>
        </div>

        <!-- Centro: imagen -->
        <div style="flex:1.2;display:flex;justify-content:center;align-items:flex-start;">
          <div style="border:2px solid ${T};overflow:hidden;width:100px;height:128px;">
            <img src="${actor.img}" style="width:100px;height:128px;object-fit:cover;" crossorigin="anonymous"/>
          </div>
        </div>

        <!-- Der: bases + destino -->
        <div style="flex:2.2;display:flex;flex-direction:column;gap:8px;">
          ${secHdr("BASES DE HABILIDADES")}
          <table style="width:100%;border-collapse:collapse;">${basesTabla}</table>
          <div style="border:2px solid ${T};overflow:hidden;">
            <div style="background:${T};color:white;font-size:7.5px;font-weight:bold;letter-spacing:2px;text-align:center;padding:2.5px;">DESTINO</div>
            <div style="padding:5px 7px;font-size:8px;display:grid;grid-template-columns:1fr 1fr;gap:3px;">
              <div>Objeto</div><div>Persona</div>
              <div>Secreto</div><div>Escenario</div>
            </div>
            <div style="padding:3px 7px 5px;font-size:8px;border-top:1px solid ${BRD};">
              Total gastado _____ &nbsp; Actual <b style="color:${T};">${dest.actual ?? 0}</b> / ${dest.max ?? 0}
            </div>
          </div>
        </div>

      </div>

      <!-- HABILIDADES -->
      <div style="margin-bottom:10px;">
        ${secHdr("HABILIDADES")}
        <div style="font-size:7px;color:${DIM};margin-bottom:3px;">* Se resta el Estorbo &nbsp;&nbsp; E Especializada, no se puede tirar con nivel 0</div>
        <div style="column-count:3;column-gap:8px;">${habsHtml}</div>
      </div>

      <!-- FILA INFERIOR -->
      <div style="display:flex;gap:10px;align-items:flex-start;">

        <!-- PV -->
        <div style="min-width:168px;border:2px solid ${T};overflow:hidden;">
          <div style="background:${T};color:white;font-size:7.5px;font-weight:bold;letter-spacing:1.5px;text-align:center;padding:2.5px;">PUNTOS DE VIDA</div>
          <div style="padding:6px 8px;font-size:8.5px;">
            <div style="margin-bottom:5px;">Máx. <b style="font-size:13px;">${sal.pvMax.valor}</b></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Rasguño</span><span>___ – ___</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;"><span>Herida leve</span><span><b>${nleves}</b> – 4</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>Herida grave</span><span><b>${ngraves}</b> – 2</span></div>
            <div style="display:flex;justify-content:space-between;font-size:7.5px;color:${DIM};padding-bottom:2px;border-bottom:1px solid ${BRD};">
              <b>Heridas</b><b>PD</b><b>Sanando</b>
            </div>
            <table style="width:100%;border-collapse:collapse;">${heridasFilas}</table>
            <div style="display:flex;gap:6px;margin-top:6px;font-size:7.5px;">
              <span>${check(sal.debilitado)} DEB.</span>
              <span>${check(sal.incapacitado)} INCAP.</span>
            </div>
          </div>
          <div style="font-size:7px;color:${DIM};text-align:center;padding:2px;border-top:1px solid ${BRD};">Cuerpo + Tamaño + 10</div>
        </div>

        <!-- ARMAS -->
        <div style="flex:1;">
          ${secHdr("ARMAS")}
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="font-size:7px;color:${DIM};border-bottom:1.5px solid ${T};">
              <th style="padding:1px 3px;text-align:left;font-weight:bold;">HABILIDAD</th>
              <th style="padding:1px 3px;font-weight:bold;">DAÑO+MD</th>
              <th style="padding:1px 3px;font-weight:bold;">TIPO</th>
              <th style="padding:1px 3px;font-weight:bold;">ALCANCE</th>
            </tr></thead>
            <tbody>${armasFilas}</tbody>
          </table>
        </div>

        <!-- PROTECCIÓN + MD + FORTUNA -->
        <div style="min-width:176px;display:flex;flex-direction:column;gap:7px;">
          <div>
            ${secHdr("PROTECCIÓN")}
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="font-size:7px;color:${DIM};border-bottom:1px solid ${BRD};">
                <th style="padding:1px 3px;text-align:left;font-weight:bold;">ARMADURA</th>
                <th style="padding:1px 3px;font-weight:bold;">TIPO</th>
                <th style="padding:1px 3px;font-weight:bold;">TOTAL</th>
              </tr></thead>
              <tbody>${armFilas}</tbody>
            </table>
            <div style="display:flex;justify-content:space-between;font-size:8px;padding:2px 3px;border-top:1px solid ${BRD};">
              <span>Casco/Yelmo ___</span><span>Escudo ___</span>
            </div>
            <div style="font-size:8px;padding:2px 3px;">
              TOTAL ARM: <b style="color:${T};font-size:12px;">${protTotal}</b>
            </div>
          </div>
          <div style="display:flex;gap:7px;">
            <div style="flex:1;border:2px solid ${T};overflow:hidden;">
              <div style="background:${T};color:white;font-size:6.5px;font-weight:bold;letter-spacing:0.5px;text-align:center;padding:2px;">MOD. AL DAÑO</div>
              <div style="padding:5px 6px;font-size:8px;">
                <div>1M <b>${sign(deriv.mDano1m.valor)}</b></div>
                <div>2M <b>${sign(deriv.mDano2m.valor)}</b></div>
                <div style="font-size:6.5px;color:${DIM};margin-top:2px;">Fuerza/3</div>
              </div>
            </div>
            <div style="flex:1;border:2px solid ${T};overflow:hidden;">
              <div style="background:${T};color:white;font-size:7px;font-weight:bold;letter-spacing:1px;text-align:center;padding:2px;">FORTUNA</div>
              <div style="padding:5px 6px;text-align:center;">
                <div style="font-size:16px;font-weight:bold;color:${T};">${fort.actual ?? 0}</div>
                <div style="font-size:7px;color:${DIM};">Máx. ${fort.max ?? 0}</div>
                <div style="font-size:7px;color:${DIM};">Espíritu</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      ${footer(1)}
    </div>
  `;

  const verbosHtml = VERBOS_ORDEN.map(v => {
    const val = hec.verbos?.[v] ?? 0;
    return `<div style="display:flex;align-items:center;gap:2px;padding:1.5px 0;border-bottom:1px solid ${BRD};">
      ${circulo(val > 0)}
      <span style="flex:1;font-size:8px;text-transform:capitalize;">${v}</span>
      <span style="font-size:7px;color:${DIM};">HEC+</span>
      <span style="font-size:8.5px;font-weight:bold;min-width:16px;text-align:right;">${val > 0 ? bases.hechiceria.valor + val : ""}</span>
    </div>`;
  }).join("");

  const esferasHtml = ESFERAS_ORDEN.map(e => {
    const val = hec.esferas?.[e] ?? 0;
    return `<div style="display:flex;align-items:center;gap:2px;padding:1.5px 0;border-bottom:1px solid ${BRD};">
      ${circulo(val > 0)}
      <span style="flex:1;font-size:8px;text-transform:capitalize;">${e}</span>
      <span style="font-size:7px;color:${DIM};">HEC+</span>
      <span style="font-size:8.5px;font-weight:bold;min-width:16px;text-align:right;">${val > 0 ? bases.hechiceria.valor + val : ""}</span>
    </div>`;
  }).join("");

  const hechizosHtml2 = hechizos.slice(0,10).map(h => {
    const sintaxis = esc(h.system.sintaxis || "");
    const dif = h.system.dificultad ?? "___";
    const pm = h.system.pmCoste ?? "___";
    return `<div style="padding:2px 0;border-bottom:1px solid ${BRD};">
      <div style="display:flex;align-items:center;gap:3px;">
        <svg width="8" height="8" viewBox="0 0 8 8"><rect x="0" y="0" width="8" height="8" fill="${T}"/></svg>
        <b style="font-size:8.5px;">${esc(h.name)}</b>
      </div>
      <div style="font-size:7.5px;color:${DIM};padding-left:11px;">Sintaxis ${sintaxis} &nbsp; Dif. ${dif} &nbsp; PM ${pm}</div>
    </div>`;
  }).join("") + Array(Math.max(0, 6 - hechizos.length)).fill(
    `<div style="padding:4px 0;border-bottom:1px solid ${BRD};">
      <div style="display:flex;gap:3px;align-items:center;">
        <svg width="8" height="8" viewBox="0 0 8 8"><rect x="0" y="0" width="8" height="8" fill="${BRD}"/></svg>
        <span style="font-size:8px;color:${BRD};">——————————</span>
      </div>
      <div style="font-size:7.5px;color:${BRD};padding-left:11px;">Sintaxis ___ &nbsp; Dif. ___ &nbsp; PM ___</div>
    </div>`
  ).join("");

  const equipoHtml = objetos.map(o =>
    `<div style="display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px solid ${BRD};">
      <span style="font-size:8px;">${esc(o.name)}</span>
      <span style="font-size:8px;min-width:24px;text-align:right;">${o.system?.carga ?? ""}</span>
    </div>`
  ).join("") + Array(Math.max(0, 8 - objetos.length)).fill(
    `<div style="padding:3px 0;border-bottom:1px solid ${BRD};font-size:8px;"> </div>`
  ).join("");

  const rasgosHtml = [...rasgos, ...ventajas].map(r =>
    `<div style="display:flex;justify-content:space-between;padding:1.5px 0;border-bottom:1px solid ${BRD};">
      <span style="font-size:8px;">${esc(r.name)}</span>
      <span style="font-size:8px;font-weight:bold;min-width:24px;text-align:right;">${r.system?.coste ?? ""}</span>
    </div>`
  ).join("") + Array(Math.max(0, 5 - rasgos.length - ventajas.length)).fill(
    `<div style="padding:3px 0;border-bottom:1px solid ${BRD};font-size:8px;"> </div>`
  ).join("");

  const pg2 = `
    <div style="border-top:4px solid ${T};padding-top:24px;padding-bottom:24px;">

      <!-- CABECERA P2 -->
      <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:12px;">

        <!-- Info Personal -->
        <div style="flex:2.2;display:flex;flex-direction:column;gap:5px;">
          <div style="border:2px solid ${T};padding:3px 8px;display:flex;align-items:center;gap:6px;">
            <svg width="8" height="16" viewBox="0 0 8 16"><polygon points="8,0 0,8 8,16" fill="${T}"/></svg>
            <b style="font-size:13px;text-transform:uppercase;">${esc(actor.name)}</b>
            <svg width="8" height="16" viewBox="0 0 8 16" style="margin-left:auto;"><polygon points="0,0 8,8 0,16" fill="${T}"/></svg>
          </div>
          ${secHdr("INFORMACIÓN PERSONAL")}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;font-size:8.5px;">
            <div>Edad <b>${esc(s.edad ?? "")}</b></div>
            <div>Origen <b>${esc(s.origen ?? "")}</b></div>
            <div>Profesión <b>${esc(s.profesion ?? "")}</b></div>
            <div>Entorno <b>${esc(s.entorno ?? "")}</b></div>
          </div>
          <div style="font-size:8.5px;">Religión <b>${esc(s.religion ?? "")}</b></div>
          <div style="font-size:8.5px;">Idioma nativo <b>${esc(s.idiomaNativo ?? "")}</b></div>
          <div style="font-size:7.5px;color:${DIM};">Descripción física</div>
          <div style="border:1px solid ${BRD};min-height:38px;padding:4px;font-size:8px;">${esc(s.descripcionFisica ?? "").replace(/\n/g,"<br>")}&nbsp;</div>
          <div style="font-size:7.5px;color:${DIM};">Historia personal</div>
          <div style="border:1px solid ${BRD};min-height:52px;padding:4px;font-size:8px;">${esc(s.historiaPersonal ?? "").replace(/\n/g,"<br>")}&nbsp;</div>
        </div>

        <!-- Lealtad + Pactos + EC -->
        <div style="flex:1.8;display:flex;flex-direction:column;gap:7px;">
          <div style="border:2px solid ${T};overflow:hidden;">
            <div style="background:${T};color:white;font-size:7.5px;font-weight:bold;letter-spacing:2px;text-align:center;padding:2.5px;">LEALTAD</div>
            <div style="display:flex;justify-content:space-around;padding:7px 4px;">
              ${["caos","ley","elementos","antepasados"].map(l => {
                const v = leal[l] ?? 0;
                const icon = {caos:"◉",ley:"✦",elementos:"▲",antepasados:"☽"}[l];
                return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;opacity:${v > 0 ? 1 : 0.35};">
                  <div style="font-size:16px;color:${T};">${icon}</div>
                  <div style="font-size:7px;font-weight:bold;color:${T};">${v > 0 ? v : ""}</div>
                </div>`;
              }).join("")}
            </div>
            <div style="padding:4px 7px;font-size:8px;border-top:1px solid ${BRD};">
              Actitud ante lo divino<br>
              <div style="border-bottom:1px solid ${BRD};min-height:14px;margin-top:2px;font-size:8px;">${esc(s.actitudDivina ?? "")}</div>
            </div>
          </div>
          <div>
            ${secHdr("PACTOS")}
            <div style="font-size:8px;min-height:36px;">${esc(s.pactos ?? "").replace(/\n/g,"<br>")}&nbsp;</div>
          </div>
          <div>
            ${secHdr("ESPÍRITU CONSAGRADO")}
            <div style="font-size:8px;">PM: <b>${hec.espirituConsagrado ?? 0}</b> / ${caract.espiritu.valor}</div>
          </div>
        </div>

        <!-- Verbos + Esferas -->
        <div style="flex:2;display:flex;flex-direction:column;gap:0;">
          <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px;">
            <div style="background:${T};color:white;font-size:7.5px;font-weight:bold;letter-spacing:2px;padding:2.5px 7px;">HECHICERÍA</div>
            <b style="font-size:13px;color:${T};">${bases.hechiceria.valor}</b>
          </div>
          ${secHdr("VERBOS","7px")}
          ${verbosHtml}
          <div style="margin-top:7px;">
            ${secHdr("ESFERAS","7px")}
            ${esferasHtml}
          </div>
        </div>

      </div>

      <!-- FILA INFERIOR P2 -->
      <div style="display:flex;gap:10px;align-items:flex-start;">

        <!-- Guías + Rasgos -->
        <div style="flex:2;display:flex;flex-direction:column;gap:4px;">
          ${secHdr("GUÍAS INTERPRETATIVAS")}
          <div style="display:flex;align-items:center;gap:3px;font-size:8.5px;">${circulo(!!s.motivacion)} Motivación</div>
          <div style="border-bottom:1px solid ${BRD};min-height:14px;font-size:8px;padding:1px 2px;">${esc(s.motivacion ?? "")}</div>
          <div style="display:flex;align-items:center;gap:3px;font-size:8.5px;margin-top:4px;">${circulo(false)} Tu mentira</div>
          <div style="border-bottom:1px solid ${BRD};min-height:14px;"></div>
          <div style="font-size:8px;color:${DIM};margin-top:4px;font-weight:bold;">Pasiones</div>
          <div style="font-size:8px;display:flex;align-items:center;gap:3px;">${circulo(!!s.pasionAmor)} AMOR ${esc(s.pasionAmor ?? "")}</div>
          <div style="border-bottom:1px solid ${BRD};height:12px;"></div>
          <div style="font-size:8px;display:flex;align-items:center;gap:3px;">${circulo(!!s.pasionOdio)} ODIO ${esc(s.pasionOdio ?? "")}</div>
          <div style="border-bottom:1px solid ${BRD};height:12px;"></div>
          <div style="font-size:8px;color:${DIM};margin-top:4px;">Personalidad. Rasgos Positivos</div>
          <div style="font-size:8px;display:flex;align-items:center;gap:3px;">${circulo(!!s.rasgoPos1)} ${esc(s.rasgoPos1 ?? "")}</div>
          <div style="border-bottom:1px solid ${BRD};height:12px;"></div>
          <div style="font-size:8px;display:flex;align-items:center;gap:3px;">${circulo(!!s.rasgoPos2)} ${esc(s.rasgoPos2 ?? "")}</div>
          <div style="border-bottom:1px solid ${BRD};height:12px;"></div>
          <div style="font-size:8px;color:${DIM};margin-top:4px;">Personalidad. Rasgos Negativos</div>
          <div style="font-size:8px;display:flex;align-items:center;gap:3px;">${circulo(!!s.rasgoNeg1)} ${esc(s.rasgoNeg1 ?? "")}</div>
          <div style="border-bottom:1px solid ${BRD};height:12px;"></div>
          <div style="font-size:8px;display:flex;align-items:center;gap:3px;">${circulo(!!s.rasgoNeg2)} ${esc(s.rasgoNeg2 ?? "")}</div>
          <div style="border-bottom:1px solid ${BRD};height:12px;"></div>
          ${secLine("RASGOS PP")}
          ${rasgosHtml}
        </div>

        <!-- Equipamiento -->
        <div style="flex:2;display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;align-items:baseline;justify-content:space-between;">
            ${secHdr("EQUIPAMIENTO")}
            <span style="font-size:7.5px;font-weight:bold;color:${DIM};">Carga</span>
          </div>
          ${equipoHtml}
          <div style="margin-top:5px;padding-top:4px;border-top:1px solid ${BRD};font-size:8.5px;">
            Dinero <b>${esc(s.dinero ?? "_____")}</b>
          </div>
          <div style="font-size:8.5px;display:flex;justify-content:space-between;">
            <span>Estorbo <b>${esc(s.estorboTotal ?? "___")}</b></span>
            <span>Total <b style="color:${T};font-size:12px;">${esc(s.cargaTotal ?? "___")}</b></span>
          </div>
          ${secLine("NOTAS")}
          <div style="flex:1;border:1px solid ${BRD};padding:6px;font-size:8px;min-height:80px;">${esc(s.notas ?? "").replace(/\n/g,"<br>")}&nbsp;</div>
        </div>

        <!-- Hechizos + PM -->
        <div style="flex:2.5;display:flex;flex-direction:column;gap:3px;">
          ${secHdr("HECHIZOS")}
          ${hechizosHtml2}
          <div style="border:2px solid ${T};overflow:hidden;margin-top:8px;">
            <div style="background:${T};color:white;font-size:7.5px;font-weight:bold;letter-spacing:1.5px;text-align:center;padding:2.5px;">PUNTOS DE MAGIA</div>
            <div style="padding:8px;text-align:center;">
              <div style="font-size:22px;font-weight:bold;color:${T};">${hec.pmActual ?? 0}</div>
              <div style="font-size:8px;">Máx. <b>${hec.pmMax ?? 0}</b></div>
              <div style="font-size:7px;color:${DIM};">Espíritu x2</div>
            </div>
          </div>
        </div>

      </div>

      ${footer(2)}
    </div>
  `;

  return pg1 + pg2;
}
