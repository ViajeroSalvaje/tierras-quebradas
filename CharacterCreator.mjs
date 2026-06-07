const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const GRUPOS_HABILIDADES = [
  { id: "combateCC", label: "Combate CC", habs: [
    { clave: "armasPunhal", label: "Armas de Puñal" },
    { clave: "armasEspada", label: "Armas de Espada" },
    { clave: "armasAsta",   label: "Armas de Asta" },
    { clave: "armasMangos", label: "Armas de Mango" },
    { clave: "pelea",       label: "Pelea" },
    { clave: "escudo",      label: "Escudo" }
  ]},
  { id: "combateDist", label: "Combate a Distancia", habs: [
    { clave: "arco",        label: "Arco" },
    { clave: "ballesta",    label: "Ballesta" },
    { clave: "canonDeMano", label: "Cañón de Mano" },
    { clave: "honda",       label: "Honda" },
    { clave: "lanzar",      label: "Lanzar" }
  ]},
  { id: "fisico", label: "Físico", habs: [
    { clave: "atletismo", label: "Atletismo" },
    { clave: "nadar",     label: "Nadar" },
    { clave: "trepar",    label: "Trepar" },
    { clave: "montar",    label: "Montar" },
    { clave: "esquivar",  label: "Esquivar" }
  ]},
  { id: "furtivo", label: "Furtivo", habs: [
    { clave: "sigilo",      label: "Sigilo" },
    { clave: "ocultar",     label: "Ocultar" },
    { clave: "hurtar",      label: "Hurtar" },
    { clave: "disfrazarse", label: "Disfrazarse" },
    { clave: "callejeo",    label: "Callejeo" },
    { clave: "seguir",      label: "Seguir" },
    { clave: "buscar",      label: "Buscar" },
    { clave: "percatarse",  label: "Percatarse" },
    { clave: "perspicacia", label: "Perspicacia" },
    { clave: "rastrear",    label: "Rastrear" }
  ]},
  { id: "social", label: "Social", habs: [
    { clave: "encanto",      label: "Encanto" },
    { clave: "manipulacion", label: "Manipulación" },
    { clave: "imponerse",    label: "Imponerse" },
    { clave: "oratoria",     label: "Oratoria" },
    { clave: "actuacion",    label: "Actuación" },
    { clave: "instruir",     label: "Instruir" },
    { clave: "juego",        label: "Juego" }
  ]},
  { id: "saber", label: "Saber", habs: [
    { clave: "academia",           label: "Academia" },
    { clave: "estrategia",         label: "Estrategia" },
    { clave: "leyendas",           label: "Leyendas" },
    { clave: "medicina",           label: "Medicina" },
    { clave: "naturaleza",         label: "Naturaleza" },
    { clave: "memorizar",          label: "Memorizar" },
    { clave: "navegacion",         label: "Navegación" },
    { clave: "conocimientoMagico", label: "Conocimiento Mágico" },
    { clave: "multiverso",         label: "Multiverso" },
    { clave: "sueños",             label: "Sueños" },
    { clave: "pociones",           label: "Pociones" },
    { clave: "documentacion",      label: "Documentación" },
    { clave: "tierrasQuebradas",   label: "Tierras Quebradas" }
  ]},
  { id: "tecnico", label: "Técnico", habs: [
    { clave: "artesania",       label: "Artesanía" },
    { clave: "forzarCerraduras",label: "Forzar Cerraduras" },
    { clave: "manejarBotes",    label: "Manejar Botes" },
    { clave: "manejarCarros",   label: "Manejar Carros" },
    { clave: "primerosAuxilios",label: "Primeros Auxilios" },
    { clave: "tratarAnimales",  label: "Tratar Animales" }
  ]},
  { id: "idiomas", label: "Idiomas", habs: [
    { clave: "idioma1", label: "Idioma 1 (nativo)" },
    { clave: "idioma2", label: "Idioma 2" },
    { clave: "idioma3", label: "Idioma 3" }
  ]}
];

const FONDOS_INICIALES = [
  { id: "indigente", label: "Indigente", mb: 10,   desc: "Mendigos y nómadas" },
  { id: "pobre",     label: "Pobre",     mb: 50,   desc: "Campesinos, cazadores, marineros y mineros" },
  { id: "frugal",    label: "Frugal",    mb: 100,  desc: "Artesanos, bandidos, criados, chamanes, soldados y piratas" },
  { id: "acomodado", label: "Acomodado", mb: 500,  desc: "Asesinos, artistas, espías, ladrones y mensajeros" },
  { id: "prospero",  label: "Próspero",  mb: 1000, desc: "Hechiceros, sabios, sacerdotes y guerreros de élite" },
  { id: "rico",      label: "Rico",      mb: 3000, desc: "Mercaderes y nobles cortesanos" }
];

export const EDADES = {
  nino: { label: "Niño",    rango: "10–15 años", ppBonus: 8,  puntosHab: 0,  puntosCaract: 17, maxCuerpo: 7, maxTamanyo: 2,    aleatorioCuerpo: -1, aleatorioMente: -1 },
  joven: { label: "Joven",   rango: "16–20 años", ppBonus: 4,  puntosHab: 5,  puntosCaract: 18, maxCuerpo: 9, maxTamanyo: null, aleatorioCuerpo: 0, aleatorioMente: -1 },
  adulto: { label: "Adulto",  rango: "21–35 años", ppBonus: 0,  puntosHab: 10, puntosCaract: 19, maxCuerpo: 9, maxTamanyo: null, aleatorioCuerpo: 0, aleatorioMente: 0 },
  mayor: { label: "Mayor",   rango: "36–49 años", ppBonus: 2,  puntosHab: 15, puntosCaract: 18, maxCuerpo: 8, maxTamanyo: null, aleatorioCuerpo: -1, aleatorioMente: 0 },
  viejo: { label: "Viejo",   rango: "50–64 años", ppBonus: 4,  puntosHab: 20, puntosCaract: 17, maxCuerpo: 7, maxTamanyo: null, aleatorioCuerpo: -2, aleatorioMente: 0 },
  anciano: { label: "Anciano", rango: "+65 años",   ppBonus: 8,  puntosHab: 30, puntosCaract: 15, maxCuerpo: 6, maxTamanyo: 2,    aleatorioCuerpo: -3, aleatorioMente: -1 }
};

const ESPECIES = [
  {
    id: "__humano__",
    name: "Humano",
    costePP: 0, bonusPuntos: 0, bonusMente: 0, bonusEspiritu: 0,
    descripcion: "Los humanos son la especie de referencia. No presentan modificaciones a las características y no cuestan Puntos de Personaje."
  },
  {
    id: "__mereni__",
    name: "Merení",
    costePP: 6, bonusPuntos: 2, bonusMente: 1, bonusEspiritu: 1,
    descripcion: "Especie homínida esbelta y estilizada, de mayor sensibilidad e inteligencia. Cuando conviven con humanos asumen el liderazgo."
  },
  {
    id: "__mestizo__",
    name: "Mestizo",
    costePP: 3, bonusPuntos: 1, bonusMente: 0, bonusEspiritu: 1,
    descripcion: "Mezcla estéril de humano y merení. Retienen la esbeltez merení pero son mentalmente más humanos, aunque de mayor fuerza espiritual."
  }
];

export class CharacterCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-character-creator",
    classes: ["tierras-quebradas", "character-creator"],
    position: { width: 740, height: 660 },
    window: { title: "Crear Personaje", resizable: true }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/apps/character-creator.hbs",
      scrollable: [".cc-content"]
    }
  };

  static ARMA_LABELS = {
    armasEspada: "Espada",     armasAsta: "Arma de asta",
    armasMangos: "Arma de mango", armasPunhal: "Puñal",
    escudo: "Escudo",     pelea: "Pelea",
    arco: "Arco",       ballesta: "Ballesta",
    honda: "Honda",      lanzar: "Lanzar",
    canonDeMano: "Cañón de mano"
  };

  static STEPS = [
    { id: "caracteristicas", label: "Características", short: "Caract."  },
    { id: "edad",            label: "Edad",            short: "Edad"      },
    { id: "especie",         label: "Especie",          short: "Especie"  },
    { id: "origen",          label: "Origen",           short: "Origen"   },
    { id: "entorno",         label: "Entorno",          short: "Entorno"  },
    { id: "profesion",       label: "Profesión",        short: "Profesión"},
    { id: "ventajas",        label: "Ventajas",         short: "Ventajas" },
    { id: "rasgos",          label: "Rasgos",           short: "Rasgos"   },
    { id: "equipo",          label: "Equipo",           short: "Equipo"   },
    { id: "habilidades",     label: "Habilidades",      short: "Hab."     }
  ];

  _stepIndex = 0;

  _charData = {
    nombre: "",
    // Características
    metodoCaract: "distribuir",
    cuerpo: 7,
    mente: 6,
    espiritu: 6,
    atractivo: 0,
    tamano: 0,
    tiradaAleatoria:     null,     // [v1, v2, v3] tras tirar
    tiradaBruta:    null,     // los 4 resultados originales antes de descartar
    cuerpoRolled:   null,     // valores rodados antes de reducción por edad
    menteRolled:    null,
    espirituRolled: null,
    // Edad
    edadCategoria:  "adulto",
    edadNumero:     25,
    puntosHab: 10,       // puntos de habilidad libres (acumulados por pasos)
    // Especie
    especieId:          "__humano__",
    especieCostePP:     0,
    especieBonusMente:  0,
    especieBonusEsp:    0,
    especieBonusPuntos: 0,
    // Entorno
    entornoId:          null,
    entornoNombre:      "",
    entornoHabilidades: [],
    // Origen
    origenId:           null,
    origenNombre:       "",
    origenPPBonus:      0,
    origenIdioma:       "",
    origenReligion:     "",
    origenHabilidades:  [],
    origenElecciones:   {},
    // Profesión
    profesionId:        null,
    profesionNombre:    "",
    profesionHabilidades: [],
    profesionVentajas:  [],
    // Elecciones de arma
    profesionElecciones: {},
    entornoElecciones:   {},
    // Ventajas elegidas
    ventajasElegidas: [],
    // Rasgos sobrenaturales/sociales elegidos
    rasgosElegidos: [],
    // Rasgos de personalidad
    rasgosPos: ["", ""],
    rasgosNeg: ["", ""],
    // Equipo
    nivelAdquisitivo: null,
    fondosIniciales:  0,
    armaduraSeleccionadas: [],
    armasCaCSeleccionadas: [],
    armasProySeleccionadas: [],
    armasArrSeleccionadas: []
  };

  _origenesCache = null;
  _entornosCache = null;
  _profesionesCache = null;
  _ventajasCache = null;
  _rasgosCache = null;
  _armaduraCache = null;
  _armasCaCCache = null;
  _armasProyCache = null;
  _armasArrCache = null;
  _idiomasCache = null;

  static async open(nombre = "") {
    const app = new CharacterCreator();
    app._charData.nombre = nombre;
    return app.render(true);
  }

  // ─── Cálculos de PP ──────────────────────────────────────────────

  get _edadActual() { return EDADES[this._charData.edadCategoria] ?? EDADES.adulto; }

  _ppAtractivo()  { return -(this._charData.atractivo * 2); }

  /** PP que se guardan en el actor (antes de descontar especie, que lo hace el hook) */
  _calcPPBase() {
    return 10 + this._edadActual.ppBonus + this._ppAtractivo();
  }

  /** PP de display: incluye todo lo decidido hasta ahora */
  _calcPP() {
    return this._calcPPBase() - this._charData.especieCostePP + this._charData.origenPPBonus;
  }

  /** Número de rasgos positivos/negativos según ventajas elegidas */
  _calcNumRasgos() {
    const nombres = this._charData.ventajasElegidas.map(v => v.nombre);
    if (nombres.includes("Personalidad compleja")) return { pos: 3, neg: 3 };
    if (nombres.includes("Personalidad simple"))   return { pos: 1, neg: 1 };
    return { pos: 2, neg: 2 };
  }

  /** PP incluyendo ventajas, desventajas y rasgos elegidos */
  _calcPPConVentajas() {
    const sum = [...this._charData.ventajasElegidas, ...this._charData.rasgosElegidos]
      .reduce((acc, v) => acc + (v.coste ?? 0), 0);
    return this._calcPP() + sum;
  }

  // ─── Dados al aleatorio ───────────────────────────────────────────────

  _tirarCaracteristicasAleatorio() {
    const rolls = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6) + 3);
    rolls.sort((a, b) => a - b);
    const kept = [rolls[0], rolls[2], rolls[3]];
    const desc = [...kept].sort((a, b) => b - a);
    this._charData.tiradaBruta = rolls.map((v, i) => ({ valor: v, descartado: i === 1 })).reverse();
    this._charData.tiradaAleatoria = kept;
    this._charData.cuerpoRolled = desc[0];
    this._charData.menteRolled = desc[1];
    this._charData.espirituRolled = desc[2];
    this._aplicarEdadAleatorio();
    this.render();
  }

  /** Aplica modificadores de edad y especie (aleatorio) a los valores rodados */
  _aplicarEdadAleatorio() {
    if (this._charData.metodoCaract !== "aleatorio" || !this._charData.tiradaAleatoria) return;
    const edad = this._edadActual;
    this._charData.cuerpo = Math.max(3, this._charData.cuerpoRolled   + edad.aleatorioCuerpo);
    this._charData.mente = Math.min(9, Math.max(3, this._charData.menteRolled    + edad.aleatorioMente  + this._charData.especieBonusMente));
    this._charData.espiritu = Math.min(9, Math.max(3, this._charData.espirituRolled + this._charData.especieBonusEsp));
  }

  // ─── Especies ────────────────────────────────────────────────────

  _getEspecies() {
    return ESPECIES;
  }

  async _getEntornos() {
    if (this._entornosCache) return this._entornosCache;
    const pack = game.packs.get("tierras-quebradas.entornos");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._entornosCache = docs.map(d => ({
      id:          d.id,
      name:        d.name,
      descripcion: d.system.descripcion ?? "",
      habilidades: d.system.habilidades ?? [],
      habStr: (d.system.habilidades ?? []).map(h => `${h.nombre ?? h.clave} +${h.bonus}`).join(", ")
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._entornosCache;
  }

  async _getProfesiones() {
    if (this._profesionesCache) return this._profesionesCache;
    const pack = game.packs.get("tierras-quebradas.profesiones");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._profesionesCache = docs.map(d => ({
      id:          d.id,
      name:        d.name,
      descripcion: d.system.descripcion ?? "",
      habilidades: d.system.habilidades ?? [],
      ventajas:    d.system.ventajas ?? [],
      habStr: (d.system.habilidades ?? []).map(h => `${h.nombre ?? h.clave} +${h.bonus}`).join(", ")
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._profesionesCache;
  }

  async _getVentajas() {
    if (this._ventajasCache) return this._ventajasCache;
    const pack = game.packs.get("tierras-quebradas.ventajas");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._ventajasCache = docs.map(d => ({
      id:     d.id,
      name:   d.name,
      coste:  d.system.coste ?? 0,
      tipo:   d.system.tipo ?? "ventaja",
      efecto: d.system.efecto ?? ""
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._ventajasCache;
  }

  async _getArmaduras() {
    if (this._armaduraCache) return this._armaduraCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armaduras");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armaduraCache = docs.map(d => ({
      id:     d.id,
      name:   d.name,
      precio: d.system.precio ?? 0,
      carga:  d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armaduraCache;
  }

  async _getArmasCaC() {
    if (this._armasCaCCache) return this._armasCaCCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armas-cuerpo-a-cuerpo");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armasCaCCache = docs.map(d => ({
      id:     d.id,
      name:   d.name,
      precio: d.system.precio ?? 0,
      carga:  d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armasCaCCache;
  }

  async _getArmasProy() {
    if (this._armasProyCache) return this._armasProyCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armas-proyectiles");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armasProyCache = docs.map(d => ({
      id:     d.id,
      name:   d.name,
      precio: d.system.precio ?? 0,
      carga:  d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armasProyCache;
  }

  async _getArmasArr() {
    if (this._armasArrCache) return this._armasArrCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armas-arrojadizas");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armasArrCache = docs.map(d => ({
      id:     d.id,
      name:   d.name,
      precio: d.system.precio ?? 0,
      carga:  d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armasArrCache;
  }

  async _getIdiomas() {
    if (this._idiomasCache) return this._idiomasCache;
    const pack = game.packs.get("tierras-quebradas.idiomas");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._idiomasCache = docs.map(d => ({ id: d.id, name: d.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return this._idiomasCache;
  }

  async _getRasgos() {
    if (this._rasgosCache) return this._rasgosCache;
    const pack = game.packs.get("tierras-quebradas.rasgos");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._rasgosCache = docs.map(d => ({
      id:          d.id,
      name:        d.name,
      coste:       d.system.coste ?? 0,
      tipo:        d.system.tipo ?? "rasgoSobrenatural",
      efecto:      d.system.efecto ?? "",
      habilidades: d.system.habilidades ?? []
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._rasgosCache;
  }

  async _getOrigenes() {
    if (this._origenesCache) return this._origenesCache;
    const pack = game.packs.get("tierras-quebradas.origenes");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._origenesCache = docs.map(d => ({
      id:          d.id,
      name:        d.name,
      descripcion: d.system.descripcion ?? "",
      idiomaNoativo: d.system.idiomaNoativo ?? "",
      religion:    d.system.religion ?? "",
      ppBonus:     d.system.ppBonus ?? 0,
      habilidades: d.system.habilidades ?? [],
      ppStr:       d.system.ppBonus > 0 ? "+" + d.system.ppBonus + " PP"
                 : d.system.ppBonus < 0 ? d.system.ppBonus + " PP" : null
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._origenesCache;
  }

  // ─── Contexto ────────────────────────────────────────────────────

  async _prepareContext(options) {
    const stepId = CharacterCreator.STEPS[this._stepIndex].id;
    const stepLabel = CharacterCreator.STEPS[this._stepIndex].label;
    const edad = this._edadActual;

    const steps = CharacterCreator.STEPS.map((s, i) => ({
      ...s, num: i + 1,
      active: i === this._stepIndex,
      done:   i < this._stepIndex
    }));

    const edades = Object.entries(EDADES).map(([k, v]) => ({
      key: k, ...v,
      selected: k === this._charData.edadCategoria,
      ppStr: (v.ppBonus >= 0 ? "+" : "") + v.ppBonus + " PP"
    }));

    // Datos específicos de características
    const { cuerpo, mente, espiritu, atractivo, tamano } = this._charData;
    const sumCaract = cuerpo + mente + espiritu;
    const poolDistr = this._edadActual.puntosCaract + this._charData.especieBonusPuntos;
    const ptsRestantes = poolDistr - sumCaract;
    const ppAtractivo = this._ppAtractivo();
    const ppAtrStr = ppAtractivo === 0 ? "0 PP" : (ppAtractivo > 0 ? "+" + ppAtractivo : ppAtractivo) + " PP";

    // Listas procesadas para el template (evitan lógica compleja en HBS)
    const caractLista = [
      { key: "cuerpo",   label: "Cuerpo",   valor: cuerpo,   min: 3, max: 9 },
      { key: "mente",    label: "Mente",    valor: mente,    min: 3, max: 9 },
      { key: "espiritu", label: "Espíritu", valor: espiritu, min: 3, max: 9 }
    ];
    const atrTamLista = [
      { key: "atractivo", label: "Atractivo", valor: atractivo, min: -3, max: 3, ppStr: ppAtrStr, ppMod: ppAtractivo },
      { key: "tamano",   label: "Tamaño",    valor: tamano,   min: -3, max: 3, ppStr: null,     ppMod: 0 }
    ];
    const rolledMap = { cuerpo: this._charData.cuerpoRolled, mente: this._charData.menteRolled, espiritu: this._charData.espirituRolled };
    const asignacionAleatoria = this._charData.tiradaAleatoria
      ? caractLista.map(c => ({
          ...c,
          valor: rolledMap[c.key] ?? c.valor,
          opciones: this._charData.tiradaAleatoria.map(v => ({ valor: v, seleccionado: v === (rolledMap[c.key] ?? c.valor) }))
        }))
      : null;

    // Conflicto edad ↔ características (solo para distribución)
    const ptsExceso = sumCaract - poolDistr;
    const conflictoCuerpo = cuerpo > edad.maxCuerpo;
    const hayConflicto = this._charData.metodoCaract === "distribuir"
                            && (ptsExceso > 0 || conflictoCuerpo);

    // Preview reducciones aleatorio (muestra rolled → final)
    const reduccionesAleatorias = (this._charData.metodoCaract === "aleatorio" && this._charData.tiradaAleatoria)
      ? [
          { label: "Cuerpo",   base: this._charData.cuerpoRolled,   mod: edad.aleatorioCuerpo, final: cuerpo   },
          { label: "Mente",    base: this._charData.menteRolled,    mod: edad.aleatorioMente,  final: mente    }
        ].filter(r => r.mod !== 0)
      : null;

    // Datos de entorno
    let entornosData = null;
    let eleccionesEntorno = null;
    if (stepId === "entorno") {
      const lista = await this._getEntornos();
      entornosData = lista.map(e => ({ ...e, selected: e.id === this._charData.entornoId }));
      const ent = this._entornosCache?.find(e => e.id === this._charData.entornoId);
      if (ent) {
        const conOpciones = (ent.habilidades ?? [])
          .map((h, i) => ({ ...h, idx: i })).filter(h => h.opciones?.length);
        if (conOpciones.length) {
          eleccionesEntorno = conOpciones.map(h => ({
            idx:     h.idx,
            nombre: h.nombre ?? h.clave,
            bonus:   h.bonus,
            opciones: h.opciones.map(op => ({
              clave: op,
              label: CharacterCreator.ARMA_LABELS[op] ?? op,
              selected: (this._charData.entornoElecciones[h.idx] ?? h.clave) === op
            }))
          }));
        }
      }
    }

    // Datos de profesión
    let profesionesData = null;
    let eleccionesProfesion = null;
    if (stepId === "profesion") {
      const lista = await this._getProfesiones();
      profesionesData = lista.map(p => ({
        ...p,
        selected: p.id === this._charData.profesionId
      }));
      const prof = this._profesionesCache?.find(p => p.id === this._charData.profesionId);
      if (prof) {
        const conOpciones = (prof.habilidades ?? [])
          .map((h, i) => ({ ...h, idx: i })).filter(h => h.opciones?.length);
        if (conOpciones.length) {
          eleccionesProfesion = conOpciones.map(h => ({
            idx:     h.idx,
            nombre: h.nombre ?? h.clave,
            bonus:   h.bonus,
            opciones: h.opciones.map(op => ({
              clave: op,
              label: CharacterCreator.ARMA_LABELS[op] ?? op,
              selected: (this._charData.profesionElecciones[h.idx] ?? h.clave) === op
            }))
          }));
        }
      }
    }

    // Datos de origen
    let origenesData = null;
    let eleccionesIdiomaOrigen = null;
    if (stepId === "origen") {
      const lista = await this._getOrigenes();
      origenesData = lista.map(o => ({
        ...o,
        selected: o.id === this._charData.origenId,
        habStr: (o.habilidades ?? [])
          .map(h => `${h.nombre ? h.nombre : h.clave} +${h.bonus}`)
          .join(", ")
      }));
      if (this._charData.origenId) {
        const o = this._origenesCache?.find(x => x.id === this._charData.origenId);
        if (o) {
          const conIdioma = (o.habilidades ?? [])
            .map((h, i) => ({ ...h, idx: i }))
            .filter(h => h.clave?.startsWith("idioma") && !h.nombre);
          if (conIdioma.length) {
            const idiomas = await this._getIdiomas();
            eleccionesIdiomaOrigen = conIdioma.map(h => ({
              idx:     h.idx,
              bonus:   h.bonus,
              opciones: idiomas.map(id => ({
                nombre:   id.name,
                selected: (this._charData.origenElecciones[h.idx] ?? "") === id.name
              }))
            }));
          }
        }
      }
    }

    // Datos de especie
    let especiesData = null;
    if (stepId === "especie") {
      especiesData = this._getEspecies().map(e => ({
        ...e,
        selected:       e.id === this._charData.especieId,
        ppCostStr:      e.costePP > 0 ? "−" + e.costePP + " PP" : "0 PP",
        bonusPuntosStr: e.bonusPuntos > 0 ? "+" + e.bonusPuntos + " pts. a distribuir" : null,
        bonusCaract:    this._formatBonusCaract(e)
      }));
    }

    // Datos de ventajas
    let ventajasLista = null;
    let desventajasLista = null;
    const ventajasConteo = this._charData.ventajasElegidas.length;
    if (stepId === "ventajas") {
      const lista = await this._getVentajas();
      const elegidos = new Set(this._charData.ventajasElegidas.map(v => v.id));
      const ppActual = this._calcPPConVentajas();
      const maxReach = ventajasConteo >= 4;
      const mapV = v => ({
        ...v,
        selected:     elegidos.has(v.id),
        deshabilitada: !elegidos.has(v.id) && (
          maxReach || (v.tipo === "ventaja" && ppActual + v.coste < 0)
        ),
        costeBadge: v.coste < 0 ? v.coste + " PP" : "+" + v.coste + " PP"
      });
      ventajasLista = lista.filter(v => v.tipo === "ventaja").map(mapV);
      desventajasLista = lista.filter(v => v.tipo === "desventaja").map(mapV);
    }

    // Datos de rasgos (sobrenaturales/sociales + personalidad)
    let rasgosItemsData = null;
    let rasgosData = null;
    if (stepId === "rasgos") {
      // Seleccionables del compendio
      const lista = await this._getRasgos();
      const elegidos = new Set(this._charData.rasgosElegidos.map(r => r.id));
      const ppActual = this._calcPPConVentajas();
      const mapR = r => ({
        ...r,
        selected:     elegidos.has(r.id),
        deshabilitada: !elegidos.has(r.id) && r.coste < 0 && ppActual + r.coste < 0,
        costeBadge:   r.coste < 0 ? r.coste + " PP" : "+" + r.coste + " PP"
      });
      rasgosItemsData = {
        sobrenaturales: lista.filter(r => r.tipo === "rasgoSobrenatural").map(mapR),
        sociales:       lista.filter(r => r.tipo === "rasgoSocial").map(mapR)
      };
      // Rasgos de personalidad
      const { pos, neg } = this._calcNumRasgos();
      while (this._charData.rasgosPos.length < pos) this._charData.rasgosPos.push("");
      while (this._charData.rasgosNeg.length < neg) this._charData.rasgosNeg.push("");
      rasgosData = {
        positivos: this._charData.rasgosPos.slice(0, pos).map((v, i) => ({ idx: i, valor: v, label: `Rasgo positivo ${i + 1}` })),
        negativos: this._charData.rasgosNeg.slice(0, neg).map((v, i) => ({ idx: i, valor: v, label: `Rasgo negativo ${i + 1}` }))
      };
    }

    // fuerza mínima 3 aunque las características sean bajas
    const fuerza = Math.max(3, this._charData.cuerpo + this._charData.tamano);
    const nivelFondos = FONDOS_INICIALES.find(n => n.id === this._charData.nivelAdquisitivo) ?? null;
    const mbGastado = [
      ...this._charData.armaduraSeleccionadas,
      ...this._charData.armasCaCSeleccionadas,
      ...this._charData.armasProySeleccionadas,
      ...this._charData.armasArrSeleccionadas
    ].reduce((s, a) => s + a.precio, 0);
    const mbRestantes = this._charData.fondosIniciales - mbGastado;
    const equipoData = {
      niveles: FONDOS_INICIALES.map(n => ({ ...n, selected: n.id === this._charData.nivelAdquisitivo })),
      nivelFondos,
      fuerza,
      cargaNormal: fuerza,
      cargaMucha: fuerza * 2,
      cargaDebilita: fuerza * 3,
      cargaMaxima: fuerza * 4,
      mbGastado,
      mbRestantes,
      mbNegativo: mbRestantes < 0
    };

    let armadurasData = null;
    let armasCaCData = null;
    let armasProyData = null;
    let armasArrData = null;
    if (stepId === "equipo") {
      const listaArm = await this._getArmaduras();
      const selArm = new Set(this._charData.armaduraSeleccionadas.map(a => a.id));
      armadurasData = listaArm.map(a => ({ ...a, selected: selArm.has(a.id) }));

      const listaCaC = await this._getArmasCaC();
      const selCaC = new Set(this._charData.armasCaCSeleccionadas.map(a => a.id));
      armasCaCData = listaCaC.map(a => ({ ...a, selected: selCaC.has(a.id) }));

      const listaProy = await this._getArmasProy();
      const selProy = new Set(this._charData.armasProySeleccionadas.map(a => a.id));
      armasProyData = listaProy.map(a => ({ ...a, selected: selProy.has(a.id) }));

      const listaArr = await this._getArmasArr();
      const selArr = new Set(this._charData.armasArrSeleccionadas.map(a => a.id));
      armasArrData = listaArr.map(a => ({ ...a, selected: selArr.has(a.id) }));
    }

    const implementados = new Set(["caracteristicas", "edad", "especie", "origen", "entorno", "profesion", "ventajas", "rasgos", "equipo"]);

    return {
      stepId, stepLabel, stepIndex: this._stepIndex,
      steps,
      data: { ...this._charData },
      // Edad
      edades, edad,
      // Características
      ptsRestantes, ppAtractivo, ppAtrStr, sumCaract,
      caractLista, atrTamLista, asignacionAleatoria, tiradaBruta: this._charData.tiradaBruta,
      // Conflicto
      hayConflicto, ptsExceso, conflictoCuerpo, reduccionesAleatorias,
      // Entorno
      entornos: entornosData,
      eleccionesEntorno,
      // Profesión
      profesiones: profesionesData,
      eleccionesProfesion,
      // Origen
      origenes: origenesData,
      eleccionesIdiomaOrigen,
      // Especie
      especies: especiesData,
      // Ventajas
      ventajasLista, desventajasLista, ventajasConteo,
      // Rasgos
      rasgosItemsData, rasgosData,
      // Equipo
      equipoData,
      armadurasData,
      armasCaCData,
      armasProyData,
      armasArrData,
      // Global
      ppTotal:       this._calcPPConVentajas(),
      puntosHab:     this._charData.puntosHab,
      esUltimoPaso:  this._stepIndex === CharacterCreator.STEPS.length - 1,
      mostrarCrear:  this._stepIndex > 0,
      hayAnterior:   this._stepIndex > 0
    };
  }

  _formatBonusCaract(e) {
    const p = [];
    if (e.bonusCuerpo)    p.push("CUE " + (e.bonusCuerpo   > 0 ? "+" : "") + e.bonusCuerpo);
    if (e.bonusMente)     p.push("MEN " + (e.bonusMente    > 0 ? "+" : "") + e.bonusMente);
    if (e.bonusEspiritu)  p.push("ESP " + (e.bonusEspiritu > 0 ? "+" : "") + e.bonusEspiritu);
    return p.join(" · ") || null;
  }

  // ─── Eventos ─────────────────────────────────────────────────────

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    // Actualizar barra de características directamente (fiable entre pasos)
    for (const caract of ["cuerpo", "mente", "espiritu", "atractivo", "tamano"]) {
      const span = el.querySelector(`.cc-caract-bar-val[data-caract="${caract}"]`);
      if (span) span.textContent = this._charData[caract] ?? 0;
    }

    // ── Paso: Características ──
    el.querySelectorAll(".cc-metodo-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this._charData.metodoCaract = btn.dataset.metodo;
        if (btn.dataset.metodo === "distribuir") {
          this._charData.tiradaAleatoria = null;
          this._charData.cuerpo = 7;
          this._charData.mente = 6;
          this._charData.espiritu = 6;
        }
        this.render();
      });
    });

    el.querySelector(".cc-tirar-aleatorio")?.addEventListener("click", () => {
      this._tirarCaracteristicasAleatorio();
    });

    // Spinners de características (distribuir y resolución conflicto en edad)
    el.querySelectorAll(".cc-caract-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const caract = btn.dataset.caract;
        const delta = parseInt(btn.dataset.delta);
        const actual = this._charData[caract] ?? 0;
        const min = (caract === "atractivo" || caract === "tamano") ? -3 : 3;
        const max = (caract === "atractivo" || caract === "tamano") ? 3  : 9;
        this._charData[caract] = Math.max(min, Math.min(max, actual + delta));
        this.render();
      });
    });

    // Select aleatorio
    el.querySelectorAll(".cc-aleatorio-select").forEach(sel => {
      sel.addEventListener("change", ev => {
        const caract = ev.target.dataset.caract;
        this._charData[caract + "Rolled"] = parseInt(ev.target.value);
        this._aplicarEdadAleatorio();
        this.render();
      });
    });

    // ── Paso: Edad ──
    el.querySelector("#cc-nombre")?.addEventListener("input", ev => {
      this._charData.nombre = ev.target.value;
    });
    el.querySelector("#cc-edad-num")?.addEventListener("input", ev => {
      this._charData.edadNumero = parseInt(ev.target.value) || 0;
    });
    el.querySelectorAll(".edad-card").forEach(card => {
      card.addEventListener("click", () => {
        this._charData.edadCategoria = card.dataset.edad;
        this._charData.puntosHab = EDADES[card.dataset.edad]?.puntosHab ?? 0;
        this._aplicarEdadAleatorio();
        this.render();
      });
    });

    // ── Paso: Entorno ──
    el.querySelectorAll(".entorno-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.entornoId;
        const e = this._entornosCache?.find(x => x.id === id);
        if (!e) return;
        this._charData.entornoId = id;
        this._charData.entornoNombre = e.name;
        this._charData.entornoHabilidades = e.habilidades ?? [];
        this._charData.entornoElecciones = {};
        this.render();
      });
    });

    // ── Paso: Profesión ──
    el.querySelectorAll(".profesion-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.profesionId;
        const p = this._profesionesCache?.find(x => x.id === id);
        if (!p) return;
        this._charData.profesionId = id;
        this._charData.profesionNombre = p.name;
        this._charData.profesionHabilidades = p.habilidades ?? [];
        this._charData.profesionVentajas = p.ventajas ?? [];
        this._charData.profesionElecciones = {};
        this.render();
      });
    });

    // ── Elecciones de arma ──
    el.querySelectorAll(".cc-arma-select").forEach(sel => {
      sel.addEventListener("change", ev => {
        const idx = parseInt(ev.target.dataset.idx);
        const tipo = ev.target.dataset.tipo;
        if (tipo === "profesion") {
          this._charData.profesionElecciones[idx] = ev.target.value;
        } else {
          this._charData.entornoElecciones[idx] = ev.target.value;
        }
      });
    });

    // ── Paso: Origen ──
    el.querySelectorAll(".origen-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.origenId;
        const o = this._origenesCache?.find(x => x.id === id);
        if (!o) return;
        this._charData.origenId = id;
        this._charData.origenNombre = o.name;
        this._charData.origenPPBonus = o.ppBonus ?? 0;
        this._charData.origenIdioma = o.idiomaNoativo ?? "";
        this._charData.origenReligion = o.religion ?? "";
        this._charData.origenHabilidades = o.habilidades ?? [];
        this.render();
      });
    });

    // ── Origen: idioma elección ──
    el.querySelectorAll(".cc-idioma-origen-select").forEach(sel => {
      sel.addEventListener("change", ev => {
        const idx = parseInt(ev.target.dataset.idx);
        this._charData.origenElecciones[idx] = ev.target.value;
      });
    });

    // ── Paso: Especie ──
    el.querySelectorAll(".especie-card").forEach(card => {
      card.addEventListener("click", () => {
        this._charData.especieId = card.dataset.especieId;
        this._charData.especieCostePP = parseInt(card.dataset.costePp)    || 0;
        this._charData.especieBonusMente = parseInt(card.dataset.bonusMente) || 0;
        this._charData.especieBonusEsp = parseInt(card.dataset.bonusEsp)   || 0;
        this._charData.especieBonusPuntos = parseInt(card.dataset.bonusPuntos)|| 0;
        this._aplicarEdadAleatorio();
        this.render();
      });
    });

    // ── Paso: Ventajas ──
    el.querySelectorAll(".ventaja-card").forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("disabled")) return;
        const id = card.dataset.ventajaId;
        const idx = this._charData.ventajasElegidas.findIndex(v => v.id === id);
        if (idx >= 0) {
          this._charData.ventajasElegidas.splice(idx, 1);
        } else {
          const v = this._ventajasCache?.find(x => x.id === id);
          if (v) this._charData.ventajasElegidas.push(
            { id: v.id, nombre: v.name, coste: v.coste, tipo: v.tipo, efecto: v.efecto }
          );
        }
        this.render();
      });
    });

    // ── Paso: Rasgos — selección de ítems ──
    el.querySelectorAll(".rasgo-card").forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("disabled")) return;
        const id = card.dataset.rasgoId;
        const idx = this._charData.rasgosElegidos.findIndex(r => r.id === id);
        if (idx >= 0) {
          this._charData.rasgosElegidos.splice(idx, 1);
        } else {
          const r = this._rasgosCache?.find(x => x.id === id);
          if (r) this._charData.rasgosElegidos.push(
            { id: r.id, nombre: r.name, coste: r.coste, tipo: r.tipo, efecto: r.efecto, habilidades: r.habilidades }
          );
        }
        this.render();
      });
    });

    // ── Paso: Rasgos — personalidad ──
    el.querySelectorAll(".cc-rasgo-input").forEach(inp => {
      inp.addEventListener("input", ev => {
        const tipo = ev.target.dataset.tipo;
        const idx = parseInt(ev.target.dataset.idx);
        if (tipo === "pos") this._charData.rasgosPos[idx] = ev.target.value;
        else                this._charData.rasgosNeg[idx] = ev.target.value;
      });
    });

    // ── Navegación ──
    el.querySelector(".cc-btn-anterior")?.addEventListener("click", () => {
      this._stepIndex--;
      this.render();
    });
    // equipo: armaduras
    el.querySelectorAll(".cc-armadura-check").forEach(cb => {
      cb.addEventListener("change", ev => {
        const id     = ev.target.dataset.armaduraId;
        const nombre = ev.target.dataset.nombre;
        const precio = parseInt(ev.target.dataset.precio)  || 0;
        const carga  = parseFloat(ev.target.dataset.carga) || 0;
        if (ev.target.checked) {
          this._charData.armaduraSeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armaduraSeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armaduraSeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: armas arrojadizas
    el.querySelectorAll(".cc-armaArr-check").forEach(cb => {
      cb.addEventListener("change", ev => {
        const id     = ev.target.dataset.armaId;
        const nombre = ev.target.dataset.nombre;
        const precio = parseInt(ev.target.dataset.precio)  || 0;
        const carga  = parseFloat(ev.target.dataset.carga) || 0;
        if (ev.target.checked) {
          this._charData.armasArrSeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armasArrSeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armasArrSeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: armas de proyectiles
    el.querySelectorAll(".cc-armaproy-check").forEach(cb => {
      cb.addEventListener("change", ev => {
        const id     = ev.target.dataset.armaId;
        const nombre = ev.target.dataset.nombre;
        const precio = parseInt(ev.target.dataset.precio)  || 0;
        const carga  = parseFloat(ev.target.dataset.carga) || 0;
        if (ev.target.checked) {
          this._charData.armasProySeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armasProySeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armasProySeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: armas cuerpo a cuerpo
    el.querySelectorAll(".cc-armacac-check").forEach(cb => {
      cb.addEventListener("change", ev => {
        const id     = ev.target.dataset.armaId;
        const nombre = ev.target.dataset.nombre;
        const precio = parseInt(ev.target.dataset.precio)  || 0;
        const carga  = parseFloat(ev.target.dataset.carga) || 0;
        if (ev.target.checked) {
          this._charData.armasCaCSeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armasCaCSeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armasCaCSeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: nivel adquisitivo
    el.querySelectorAll(".cc-nivel-adquisitivo-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.nivelId;
        if (this._charData.nivelAdquisitivo === id) {
          this._charData.nivelAdquisitivo = null;
          this._charData.fondosIniciales = 0;
        } else {
          const nivel = FONDOS_INICIALES.find(n => n.id === id);
          this._charData.nivelAdquisitivo = id;
          this._charData.fondosIniciales = nivel?.mb ?? 0;
        }
        this.render();
      });
    });

    el.querySelector(".cc-btn-siguiente")?.addEventListener("click", () => {
      if (this._validarPaso()) { this._stepIndex++; this.render(); }
    });
    el.querySelector(".cc-btn-crear")?.addEventListener("click", () => {
      if (this._validarPaso()) this._crearActor();
    });
  }

  // ─── Validación ──────────────────────────────────────────────────

  _validarPaso() {
    const id = CharacterCreator.STEPS[this._stepIndex].id;

    if (id === "caracteristicas") {
      const { metodoCaract, cuerpo, mente, espiritu, tiradaAleatoria } = this._charData;
      if (metodoCaract === "aleatorio" && !tiradaAleatoria) {
        ui.notifications.warn("Tira los dados antes de continuar.");
        return false;
      }
      // La validación del pool exacto se hace en el paso de Especie
    }

    if (id === "especie" && this._charData.metodoCaract === "distribuir") {
      const pool = this._edadActual.puntosCaract + this._charData.especieBonusPuntos;
      const total = this._charData.cuerpo + this._charData.mente + this._charData.espiritu;
      if (total !== pool) {
        ui.notifications.warn(`Debes repartir exactamente ${pool} puntos de características (${total > pool ? "sobran" : "faltan"} ${Math.abs(pool - total)}).`);
        return false;
      }
    }

    if (id === "entorno" && !this._charData.entornoId) {
      ui.notifications.warn("Selecciona un entorno antes de continuar.");
      return false;
    }

    if (id === "origen" && !this._charData.origenId) {
      ui.notifications.warn("Selecciona un origen étnico antes de continuar.");
      return false;
    }

    if (id === "profesion" && !this._charData.profesionId) {
      ui.notifications.warn("Selecciona una profesión antes de continuar.");
      return false;
    }

    if (id === "edad") {
      if (!this._charData.nombre?.trim()) {
        ui.notifications.warn("Introduce un nombre para el personaje.");
        return false;
      }
      if (this._charData.metodoCaract === "distribuir") {
        const edad = this._edadActual;
        const pool = edad.puntosCaract + this._charData.especieBonusPuntos;
        const sum = this._charData.cuerpo + this._charData.mente + this._charData.espiritu;
        if (sum > pool) {
          ui.notifications.warn(`Debes reducir ${sum - pool} punto(s) de las características para esta categoría de edad y especie.`);
          return false;
        }
        if (this._charData.cuerpo > edad.maxCuerpo) {
          ui.notifications.warn(`Cuerpo no puede superar ${edad.maxCuerpo} con esta categoría de edad.`);
          return false;
        }
      }
    }

    return true;
  }

  // ─── Crear actor ─────────────────────────────────────────────────

  async _crearActor() {
    const { cuerpo, mente, espiritu } = this._charData;

    const actor = await Actor.create({
      name:   this._charData.nombre.trim(),
      type:   "pj",
      img:    "icons/svg/mystery-man.svg",
      system: {
        edad:      this._charData.edadNumero,
        puntosPP:  this._calcPPConVentajas(),
        puntosHab: this._charData.puntosHab,
        caracteristicas: {
          cuerpo: { valor: cuerpo    },
          mente: { valor: mente     },
          espiritu: { valor: espiritu  },
          atractivo: { valor: this._charData.atractivo },
          tamano: { valor: this._charData.tamano   }
        }
      }
    }, { tqWizard: true });

    if (!actor) return;

    // Aplicar entorno
    if (this._charData.entornoId) {
      const habEnt = {};
      for (const [i, h] of (this._charData.entornoHabilidades ?? []).entries()) {
        const clave = this._charData.entornoElecciones[i] ?? h.clave;
        if (!clave || !h.bonus) continue;
        const curr = actor.system.habilidades?.[clave]?.nivel ?? 0;
        habEnt[`system.habilidades.${clave}.nivel`] = curr + h.bonus;
      }
      if (Object.keys(habEnt).length) await actor.update(habEnt);

      const packEnt = game.packs.get("tierras-quebradas.entornos");
      if (packEnt) {
        await packEnt.getIndex();
        const entry = [...packEnt.index.values()].find(e => e._id === this._charData.entornoId);
        if (entry) {
          const doc = await packEnt.getDocument(entry._id);
          if (doc) await Item.create(doc.toObject(), { parent: actor, tqWizard: true });
        }
      }
    }

    // Aplicar origen: idioma, religión y bonos de habilidad
    if (this._charData.origenId) {
      const habUpdates = {};
      if (this._charData.origenIdioma) {
        habUpdates["system.idiomaNoativo"] = this._charData.origenIdioma;
        habUpdates["system.habilidades.idioma1.nombre"] = this._charData.origenIdioma;
      }
      if (this._charData.origenReligion) {
        habUpdates["system.religion"] = this._charData.origenReligion;
      }
      for (const [i, { clave, bonus, nombre }] of (this._charData.origenHabilidades ?? []).entries()) {
        if (!clave || !bonus) continue;
        const curr = actor.system.habilidades?.[clave]?.nivel ?? 0;
        habUpdates[`system.habilidades.${clave}.nivel`] = curr + bonus;
        if (clave.startsWith("idioma")) {
          const nombreFinal = nombre || this._charData.origenElecciones[i] || "";
          if (nombreFinal) habUpdates[`system.habilidades.${clave}.nombre`] = nombreFinal;
        }
      }
      if (Object.keys(habUpdates).length) await actor.update(habUpdates);

      // Añadir ítem de origen para mostrarlo en la ficha
      const pack = game.packs.get("tierras-quebradas.origenes");
      if (pack) {
        await pack.getIndex();
        const entry = [...pack.index.values()].find(e => e._id === this._charData.origenId);
        if (entry) {
          const doc = await pack.getDocument(entry._id);
          if (doc) await Item.create(doc.toObject(), { parent: actor, tqWizard: true });
        }
      }
    }

    // Aplicar profesión
    if (this._charData.profesionId) {
      const habProf = {};
      habProf["system.profesion"] = this._charData.profesionNombre;
      for (const [i, h] of (this._charData.profesionHabilidades ?? []).entries()) {
        const clave = this._charData.profesionElecciones[i] ?? h.clave;
        if (!clave || !h.bonus) continue;
        const curr = actor.system.habilidades?.[clave]?.nivel ?? 0;
        habProf[`system.habilidades.${clave}.nivel`] = curr + h.bonus;
      }
      await actor.update(habProf);

      // Ítem profesión (tqWizard: omite _aplicarProfesion)
      const packProf = game.packs.get("tierras-quebradas.profesiones");
      if (packProf) {
        await packProf.getIndex();
        const entry = [...packProf.index.values()].find(e => e._id === this._charData.profesionId);
        if (entry) {
          const doc = await packProf.getDocument(entry._id);
          if (doc) await Item.create(doc.toObject(), { parent: actor, tqWizard: true });
        }
      }

      // Ventajas de la profesión
      for (const v of (this._charData.profesionVentajas ?? [])) {
        await Item.create({
          name: v.nombre, type: "ventaja",
          system: { coste: v.coste ?? 0, tipo: v.tipo ?? "ventaja", efecto: v.efecto ?? "", fuente: "profesion" }
        }, { parent: actor });
      }
    }

    // Añadir ítem de especie para mostrarlo en la ficha
    // tqWizard: true → el hook createItem salta _aplicarEspecie (ya aplicado por el wizard)
    if (this._charData.especieId !== "__humano__") {
      const especie = ESPECIES.find(e => e.id === this._charData.especieId);
      if (especie) {
        await Item.create({
          name: especie.name,
          type: "especie",
          system: {
            costePP:       especie.costePP,
            bonusPuntos:   especie.bonusPuntos,
            bonusCuerpo:   0,
            bonusMente:    especie.bonusMente,
            bonusEspiritu: especie.bonusEspiritu,
            tamanoMin:    -3, tamanoMax: 3,
            atractivoMin:  -3, atractivoMax: 3,
            descripcion:   especie.descripcion
          }
        }, { parent: actor, tqWizard: true });
      }
    }

    // Rasgos de personalidad
    const rasgoKeys = ["rasgoPos1","rasgoPos2","rasgoPos3","rasgoNeg1","rasgoNeg2","rasgoNeg3"];
    const rasgoUpdates = {};
    this._charData.rasgosPos.forEach((v, i) => { rasgoUpdates[`system.rasgoPos${i+1}`] = v; });
    this._charData.rasgosNeg.forEach((v, i) => { rasgoUpdates[`system.rasgoNeg${i+1}`] = v; });
    if (Object.keys(rasgoUpdates).length) await actor.update(rasgoUpdates);

    // Rasgos sobrenaturales/sociales elegidos
    const habRasgos = {};
    for (const r of this._charData.rasgosElegidos) {
      await Item.create({
        name: r.nombre, type: "rasgo",
        system: { coste: r.coste, tipo: r.tipo, efecto: r.efecto ?? "", habilidades: r.habilidades ?? [], fuente: "creacion" }
      }, { parent: actor });
      for (const h of (r.habilidades ?? [])) {
        if (!h.clave || !h.bonus) continue;
        const curr = actor.system.habilidades?.[h.clave]?.nivel ?? 0;
        habRasgos[`system.habilidades.${h.clave}.nivel`] =
          (habRasgos[`system.habilidades.${h.clave}.nivel`] ?? curr) + h.bonus;
      }
    }
    if (Object.keys(habRasgos).length) await actor.update(habRasgos);

    // Ventajas y desventajas elegidas
    for (const v of this._charData.ventajasElegidas) {
      await Item.create({
        name: v.nombre, type: "ventaja",
        system: { coste: v.coste, tipo: v.tipo, efecto: v.efecto ?? "", fuente: "creacion" }
      }, { parent: actor });
    }

    // Armaduras seleccionadas
    const packArm = game.packs.get("tierras-quebradas.armamento-armaduras");
    if (packArm) {
      for (const a of this._charData.armaduraSeleccionadas) {
        const doc = await packArm.getDocument(a.id);
        if (doc) await Item.create(doc.toObject(), { parent: actor });
      }
    }

    // Armas cuerpo a cuerpo seleccionadas
    const packCaC = game.packs.get("tierras-quebradas.armamento-armas-cuerpo-a-cuerpo");
    if (packCaC) {
      for (const a of this._charData.armasCaCSeleccionadas) {
        const doc = await packCaC.getDocument(a.id);
        if (doc) await Item.create(doc.toObject(), { parent: actor });
      }
    }

    // Armas de proyectiles seleccionadas
    const packProy = game.packs.get("tierras-quebradas.armamento-armas-proyectiles");
    if (packProy) {
      for (const a of this._charData.armasProySeleccionadas) {
        const doc = await packProy.getDocument(a.id);
        if (doc) await Item.create(doc.toObject(), { parent: actor });
      }
    }

    // Armas arrojadizas seleccionadas
    const packArr = game.packs.get("tierras-quebradas.armamento-armas-arrojadizas");
    if (packArr) {
      for (const a of this._charData.armasArrSeleccionadas) {
        const doc = await packArr.getDocument(a.id);
        if (doc) await Item.create(doc.toObject(), { parent: actor });
      }
    }

    // Dinero restante tras compras
    const mbGastadoTotal = [
      ...this._charData.armaduraSeleccionadas,
      ...this._charData.armasCaCSeleccionadas,
      ...this._charData.armasProySeleccionadas,
      ...this._charData.armasArrSeleccionadas
    ].reduce((s, a) => s + a.precio, 0);
    if (this._charData.fondosIniciales > 0) {
      await actor.update({ "system.dinero": Math.max(0, this._charData.fondosIniciales - mbGastadoTotal) });
    }

    this.close();
    actor.sheet.render(true);
  }
}
