export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("concat", function (...args) {
    args.pop(); // remove options object
    return args.join("");
  });

  Handlebars.registerHelper("tq-base-valor", function (bases, baseNombre) {
    return bases?.[baseNombre]?.valor ?? 0;
  });

  Handlebars.registerHelper("tq-habilidad-total", function (habilidad, bases, estorbo) {
    if (!habilidad || !bases) return 0;
    const base = bases[habilidad.base]?.valor ?? 0;
    const nivel = habilidad.nivel ?? 0;
    const fijos = habilidad.puntosFijos ?? 0;
    const multiplicacionEstorbo = habilidad.estorbo ?? 0;
    const penalizacionEstorbo = multiplicacionEstorbo * (estorbo ?? 0);
    return base + nivel + fijos - penalizacionEstorbo;
  });

  Handlebars.registerHelper("tq-base-abrev", function (base) {
    const map = {
      agilidad: "AGI", comunicacion: "COM", cultura: "CUL", hechiceria: "HEC", percepcion: "PER", tecnica: "TEC", vigor: "VIG"
    };
    return map[base] ?? (base ?? "").substring(0, 3).toUpperCase();
  });

  Handlebars.registerHelper("tq-eq", function (a, b) {
    return a === b;
  });

  Handlebars.registerHelper("tq-gt", function (a, b) {
    return a > b;
  });

  Handlebars.registerHelper("tq-add", function (...args) {
    args.pop();
    return args.reduce((s, v) => s + (Number(v) || 0), 0);
  });

  Handlebars.registerHelper("tq-localizar", function (key) {
    return game.i18n.localize(key);
  });

  Handlebars.registerHelper("tq-pv-estado", function (pvActual, pvMax) {
    const pct = pvMax > 0 ? pvActual / pvMax : 0;
    if (pct <= 0) return "muerto";
    if (pct <= 0.25) return "grave";
    if (pct <= 0.5) return "leve";
    return "sano";
  });

  Handlebars.registerHelper("tq-rango", function (inicio, fin, opts) {
    let out = "";
    for (let i = inicio; i <= fin; i++) out += opts.fn(i);
    return out;
  });

  // Compatibility fallbacks for helpers Foundry may or may not provide
  if (!Handlebars.helpers["checked"]) {
    Handlebars.registerHelper("checked", function (value) {
      return value ? "checked" : "";
    });
  }

  // Crea un array literal: {{#each (array "a" "b" "c")}}
  if (!Handlebars.helpers["array"]) {
    Handlebars.registerHelper("array", function (...args) {
      args.pop(); // remove options object
      return args;
    });
  }

  if (!Handlebars.helpers["selected"]) {
    Handlebars.registerHelper("selected", function (value, compare) {
      return value === compare ? "selected" : "";
    });
  }

  Handlebars.registerHelper("tq-verbos", function () {
    return ["Aumentar", "Conocer", "Disminuir", "Dirigir", "Inhibir", "Invocar", "Modificar", "Transformar"];
  });

  Handlebars.registerHelper("tq-esferas", function () {
    return ["Agua", "Aire", "Caos", "Cuerpo", "Espíritu", "Fuego", "Ley", "Mente", "Planta", "Tierra"];
  });
}
