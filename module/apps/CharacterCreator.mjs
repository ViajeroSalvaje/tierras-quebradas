const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const GRUPOS_HABILIDADES = [
  { id: "agilidad", label: "Agilidad (AGI)", habs: [
    { clave: "atletismo", label: "Atletismo" }, { clave: "esquivar", label: "Esquivar" }, { clave: "nadar", label: "Nadar (E)" }, { clave: "sigilo", label: "Sigilo" }, { clave: "trepar", label: "Trepar" }
  ]}, { id: "comunicacion", label: "Comunicación (COM)", habs: [
    { clave: "actuacion", label: "Actuación (E)" }, { clave: "callejeo", label: "Callejeo" }, { clave: "disfrazarse", label: "Disfrazarse" }, { clave: "encanto", label: "Encanto" }, { clave: "imponerse", label: "Imponerse" }, { clave: "instruir", label: "Instruir" }, { clave: "manipulacion", label: "Manipular" }, { clave: "oratoria", label: "Oratoria" }, { clave: "tratarAnimales", label: "Tratar animales" }
  ]}, { id: "cultura", label: "Cultura (CUL)", habs: [
    { clave: "academia", label: "Academia (E)" }, { clave: "conocimientoMagico", label: "Conocimiento mágico (E)" }, { clave: "estrategia", label: "Estrategia (E)" }, { clave: "idioma2", label: "Idioma 2 (E)" }, { clave: "idioma3", label: "Idioma 3 (E)" }, { clave: "leyendas", label: "Leyendas" }, { clave: "medicina", label: "Medicina (E)" }, { clave: "memorizar", label: "Memorizar" }, { clave: "multiverso", label: "Multiverso (E)" }, { clave: "naturaleza", label: "Naturaleza" }, { clave: "navegacion", label: "Navegación (E)" }, { clave: "pociones", label: "Pociones (E)" }, { clave: "sueños", label: "Sueños (E)" }, { clave: "tierrasQuebradas", label: "Tierras Quebradas" }
  ]}, { id: "percepcion", label: "Percepción (PER)", habs: [
    { clave: "buscar", label: "Buscar" }, { clave: "documentacion", label: "Documentación" }, { clave: "juego", label: "Juego" }, { clave: "percatarse", label: "Percatarse" }, { clave: "perspicacia", label: "Perspicacia" }, { clave: "rastrear", label: "Rastrear" }, { clave: "seguir", label: "Seguir" }
  ]}, { id: "tecnica", label: "Técnica (TEC)", habs: [
    { clave: "arco", label: "Arco (E)" }, { clave: "ballesta", label: "Ballesta" }, { clave: "canonDeMano", label: "Disparo" }, { clave: "honda", label: "Honda (E)" }, { clave: "artesania", label: "Artesanía (E)" }, { clave: "forzarCerraduras", label: "Forzar cerraduras (E)" }, { clave: "hurtar", label: "Hurtar" }, { clave: "manejarCarros", label: "Manejar carros" }, { clave: "ocultar", label: "Ocultar" }, { clave: "primerosAuxilios", label: "Primeros auxilios (E)" }
  ]}, { id: "vigor", label: "Vigor (VIG)", habs: [
    { clave: "armasAsta", label: "Asta" }, { clave: "escudo", label: "Escudo" }, { clave: "armasEspada", label: "Espada" }, { clave: "armasMangos", label: "Mango" }, { clave: "armasPunhal", label: "Puñal" }, { clave: "lanzar", label: "Lanzar" }, { clave: "manejarBotes", label: "Manejar botes (E)" }, { clave: "montar", label: "Montar" }, { clave: "pelea", label: "Pelea" }
  ]}
];

const FONDOS_INICIALES = [
  { id: "indigente", label: "Indigente", mb: 10, desc: "Mendigos y nómadas" }, { id: "pobre", label: "Pobre", mb: 50, desc: "Campesinos, cazadores, marineros y mineros" }, { id: "frugal", label: "Frugal", mb: 100, desc: "Artesanos, bandidos, criados, chamanes, soldados y piratas" }, { id: "acomodado", label: "Acomodado", mb: 500, desc: "Asesinos, artistas, espías, ladrones y mensajeros" }, { id: "prospero", label: "Próspero", mb: 1000, desc: "Hechiceros, sabios, sacerdotes y guerreros de élite" }, { id: "rico", label: "Rico", mb: 3000, desc: "Mercaderes y nobles cortesanos" }
];

export const EDADES = {
  nino: { label: "Niño", rango: "10–15 años", ppBonus: 8, puntosHab: 0, puntosCaract: 17, maxCuerpo: 7, maxTamanyo: 2, aleatorioCuerpo: -1, aleatorioMente: -1 }, joven: { label: "Joven", rango: "16–20 años", ppBonus: 4, puntosHab: 5, puntosCaract: 18, maxCuerpo: 9, maxTamanyo: null, aleatorioCuerpo: 0, aleatorioMente: -1 }, adulto: { label: "Adulto", rango: "21–35 años", ppBonus: 0, puntosHab: 10, puntosCaract: 19, maxCuerpo: 9, maxTamanyo: null, aleatorioCuerpo: 0, aleatorioMente: 0 }, mayor: { label: "Mayor", rango: "36–49 años", ppBonus: 2, puntosHab: 15, puntosCaract: 18, maxCuerpo: 8, maxTamanyo: null, aleatorioCuerpo: -1, aleatorioMente: 0 }, viejo: { label: "Viejo", rango: "50–64 años", ppBonus: 4, puntosHab: 20, puntosCaract: 17, maxCuerpo: 7, maxTamanyo: null, aleatorioCuerpo: -2, aleatorioMente: 0 }, anciano: { label: "Anciano", rango: "+65 años", ppBonus: 8, puntosHab: 30, puntosCaract: 15, maxCuerpo: 6, maxTamanyo: 2, aleatorioCuerpo: -3, aleatorioMente: -1 }
};

const ESPECIES = [
  {
    id: "__humano__", name: "Humano", costePP: 0, bonusPuntos: 0, bonusMente: 0, bonusEspiritu: 0, descripcion: "Los humanos son la especie de referencia. No presentan modificaciones a las características y no cuestan Puntos de Personaje."
  }, {
    id: "__mereni__", name: "Merení", costePP: 6, bonusPuntos: 2, bonusMente: 1, bonusEspiritu: 1, descripcion: "Especie homínida esbelta y estilizada, de mayor sensibilidad e inteligencia. Cuando conviven con humanos asumen el liderazgo."
  }, {
    id: "__mestizo__", name: "Mestizo", costePP: 3, bonusPuntos: 1, bonusMente: 0, bonusEspiritu: 1, descripcion: "Mezcla estéril de humano y merení. Retienen la esbeltez merení pero son mentalmente más humanos, aunque de mayor fuerza espiritual."
  }
];

const IDEOLOGIAS = [
  { id: "ley", label: "La Ley", desc: "Orden, civilización y progreso (Patriarcado / Tres Valles)" }, { id: "caos", label: "El Caos", desc: "Cambio, libertad y fuerza (Excelsa / Merendrak)" }, { id: "equilibrio", label: "El Equilibrio Cósmico", desc: "Punto medio entre Orden y Entropía. Sin devoción ni promesas." }, { id: "elementales", label: "Los Señores Elementales", desc: "Adoración a las fuerzas de la naturaleza" }, { id: "antepasados", label: "Los Antepasados", desc: "Culto a los ancestros de los Caídos (Imanguk, Jungla)" }, { id: "sincretismo", label: "Sincretismo", desc: "Adoración conjunta de dioses de la Ley y el Caos (isla de Templanza)" }, { id: "sinReligion", label: "Sin Religión", desc: "Sin lealtad a ningún panteón. Nunca puede alinearse.", ppBonus: 1 }
];

const DEIDADES_POR_IDEOLOGIA = {
  ley: ["El Guerrero", "El Comerciante", "El Juez", "El Sabio", "El Escriba", "El Sanador", "La Madre", "El Labrador", "El Artista", "La Destructora", "Baaler"], caos: ["Aniria", "Ayrok", "Íkor", "Mashak", "Meibel", "Melk", "Nariaj", "Shador", "Shonbark", "Slodar", "Tesh-Chan", "Vesh-Anh", "Yarói", "Baaler"], elementales: ["Kamin (Tierra)", "Tepel (Fuego)", "Vodar (Agua)", "Visdu (Aire)"], antepasados: [], equilibrio: [], sincretismo: ["El Guerrero", "El Comerciante", "El Juez", "El Sabio", "El Escriba", "El Sanador", "La Madre", "El Labrador", "El Artista", "La Destructora", "Aniria", "Ayrok", "Íkor", "Mashak", "Meibel", "Melk", "Nariaj", "Shador", "Shonbark", "Slodar", "Tesh-Chan", "Vesh-Anh", "Yarói", "Baaler"], sinReligion: []
};

const ACTITUDES = [
  { id: "servicial", label: "Servicial", desc: "Entiende la superioridad absoluta de los dioses y los sirve lealmente" }, { id: "atemorizado", label: "Atemorizado", desc: "Cumple con la religión por miedo al castigo divino" }, { id: "pragmatico", label: "Pragmático", desc: "Ve su servicio como un intercambio por poder y beneficios" }, { id: "rebelde", label: "Rebelde", desc: "Siente rencor hacia los dioses y busca un mundo libre de su influencia" }, { id: "indiferente", label: "Indiferente", desc: "Intenta permanecer ajeno a las disputas divinas" }
];

// Mapeo de ideología a clave de lealtad en el schema del actor
const IDEOLOGIA_A_LEALTAD = {
  ley: "ley", caos: "caos", elementales: "elementos", antepasados: "antepasados"
};

const LABELS_PL = { ley: "Ley", caos: "Caos", elementos: "Elementales", antepasados: "Antepasados" };

const VERBOS_MAGIA = [
  { key: "aumentar", label: "Aumentar" }, { key: "conocer", label: "Conocer" }, { key: "disminuir", label: "Disminuir" }, { key: "dirigir", label: "Dirigir" }, { key: "inhibir", label: "Inhibir" }, { key: "invocar", label: "Invocar" }, { key: "modificar", label: "Modificar" }, { key: "transformar", label: "Transformar" }
];

const ESFERAS_MAGIA = [
  { key: "agua", label: "Agua" }, { key: "aire", label: "Aire" }, { key: "caos", label: "Caos" }, { key: "cuerpo", label: "Cuerpo" }, { key: "espiritu", label: "Espíritu" }, { key: "fuego", label: "Fuego" }, { key: "ley", label: "Ley" }, { key: "mente", label: "Mente" }, { key: "planta", label: "Planta" }, { key: "tierra", label: "Tierra" }
];

const HECHIZOS_POR_EDAD = { nino: 3, joven: 4, adulto: 5, mayor: 6, viejo: 7, anciano: 8 };
const PROFESIONES_MAGICAS = ["hechicero", "chamán", "chaman"];
const ESFERAS_ORDEN = ["Agua","Aire","Caos","Cuerpo","Espíritu","Fuego","Ley","Mente","Planta","Tierra"];

export class CharacterCreator extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "tq-character-creator", classes: ["tierras-quebradas", "character-creator"], position: { width: 740, height: 660 }, window: { title: "Crear Personaje", resizable: true }
  };

  static PARTS = {
    form: {
      template: "systems/tierras-quebradas/templates/apps/character-creator.hbs", scrollable: [".cc-content"]
    }
  };

  static ARMA_LABELS = {
    armasEspada: "Espada", armasAsta: "Arma de asta", armasMangos: "Arma de mango", armasPunhal: "Puñal", escudo: "Escudo", pelea: "Pelea", arco: "Arco", ballesta: "Ballesta", honda: "Honda", lanzar: "Lanzar", canonDeMano: "Cañón de mano"
  };

  static PASOS =[
    { id: "caracteristicas", label: "Características", short: "Caract." }, { id: "edad", label: "Edad", short: "Edad" }, { id: "especie", label: "Especie", short: "Especie" }, { id: "origen", label: "Origen", short: "Origen" }, { id: "entorno", label: "Entorno", short: "Entorno" }, { id: "profesion", label: "Profesión", short: "Profesión" }, { id: "ventajas", label: "Ventajas", short: "Ventajas" }, { id: "rasgos", label: "Rasgos", short: "Rasgos" }, { id: "equipo", label: "Equipo", short: "Equipo" }, { id: "habilidades", label: "Habilidades", short: "Hab." }, { id: "religion", label: "Religión", short: "Rel." }, { id: "magia", label: "Magia", short: "Magia" }
  ];

  _pasoIndex = 0;

  _charData = {
    nombre: "", // Características
    metodoCaract: "distribuir", cuerpo: 7, mente: 6, espiritu: 6, atractivo: 0, tamano: 0, tiradaAleatoria: null, tiradaBruta: null, cuerpoRolled: null, menteRolled: null, espirituRolled: null, // Edad
    edadCategoria: "adulto", edadNumero: 25, puntosHab: 10, // Especie
    especieId: "__humano__", especieCostePP: 0, especieBonusMente: 0, especieBonusEsp: 0, especieBonusPuntos: 0, // Entorno
    entornoId: null, entornoNombre: "", entornoHabilidades: [], // Origen
    origenId: null, origenNombre: "", origenPPBonus: 0, origenIdioma: "", origenReligion: "", origenHabilidades: [], origenElecciones: {}, // Profesión
    profesionId: null, profesionNombre: "", profesionHabilidades: [], profesionVentajas: [], // Elecciones de arma
    profesionElecciones: {}, entornoElecciones: {}, // Especialización de profesión
    especializacionIdx: null, especializacionHabilidades: [], // Ventajas elegidas
    ventajasElegidas: [], // Rasgos sobrenaturales/sociales elegidos
    rasgosElegidos: [], // Rasgos de personalidad
    rasgosPos: ["", ""], rasgosNeg: ["", ""], // Equipo
    nivelAdquisitivo: null, fondosIniciales: 0, armaduraSeleccionadas: [], armasCaCSeleccionadas: [], armasProySeleccionadas: [], armasArrSeleccionadas: [], // Paso habilidades: puntos libres gastados por clave
    habilidadesLibres: {}, // Religión
    ideologiaReligion: null, deidad: "", actitudDivina: "indiferente", plRepartidos: { ley: 0, caos: 0, elementos: 0, antepasados: 0 }, // Magia
    tipoMagia: null, tipoMagiaAuto: false, hechizosElegidos: [], magiaLibres: {}
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
  _hechizosCache = null;

  static async open(nombre = "") {
    const app = new CharacterCreator();
    app._charData.nombre = nombre;
    return app.render(true);
  }

  // Cálculos de PP

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
      .reduce((acc, v) => acc + (v.coste ?? 0) * (v.cantidad ?? 1), 0);
    const sinReligionBonus = this._charData.ideologiaReligion === "sinReligion" ? 1 : 0;
    return this._calcPP() + sum + sinReligionBonus + this._calcCosteMagia() + this._calcHechizosExtraCost();
  }

  _esProfesionMagica() {
    const prof = this._charData.profesionNombre.toLowerCase();
    return PROFESIONES_MAGICAS.some(p => prof.includes(p));
  }

  _magiaDeRasgo() {
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    for (const r of this._charData.rasgosElegidos) {
      const nombreNorm = norm(r.nombre);
      if (nombreNorm.includes("hechiceria")) return { tipo: "hechiceria", nombre: r.nombre };
      if (nombreNorm.includes("teurgia"))    return { tipo: "teurgia", nombre: r.nombre };
      if (nombreNorm.includes("don de la magia")) return { tipo: "don", nombre: r.nombre };
    }
    return null;
  }

  _calcCosteMagia(tipo) {
    tipo = tipo ?? this._charData.tipoMagia;
    if (!tipo || tipo === "sin") return 0;
    const rasgoMagia = this._magiaDeRasgo();
    if (tipo === "don" && rasgoMagia?.tipo === "don") return 0;
    if (tipo === "don") return -1;
    if (this._esProfesionMagica() && tipo === "hechiceria") return 0;
    if (rasgoMagia?.tipo === tipo) return 0;
    const prof = this._charData.profesionNombre.toLowerCase();
    const esMereni = ["__mereni__", "__mestizo__"].includes(this._charData.especieId);
    const esSacerdote = prof.includes("sacerdote");
    const esNoble = prof.includes("noble");
    const esSabio = prof.includes("sabio");
    if (tipo === "hechiceria") {
      if (esMereni || esSacerdote) return -3;
      if (esNoble || esSabio) return -4;
      return -5;
    }
    if (tipo === "teurgia") {
      if (esMereni || esSacerdote) return -2;
      if (esNoble || esSabio) return -3;
      return -4;
    }
    return 0;
  }

  _calcCosteStr(tipo) {
    if (this._esProfesionMagica() && tipo === "hechiceria") return "(incluido)";
    if (this._magiaDeRasgo()?.tipo === tipo) return "(incluido en rasgo)";
    const costeMagia = this._calcCosteMagia(tipo);
    return costeMagia === 0 ? "0 PP" : costeMagia + " PP";
  }

  _calcHechizosBase() {
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const bonusHechizos = [...this._charData.ventajasElegidas, ...this._charData.rasgosElegidos]
      .filter(v => norm(v.nombre) === "hechizos")
      .reduce((acc, v) => acc + (v.cantidad ?? 1), 0);
    if (this._charData.tipoMagia === "teurgia") {
      const edad = this._charData.edadCategoria;
      return ((edad === "viejo" || edad === "anciano") ? 4 : 3) + bonusHechizos;
    }
    return (HECHIZOS_POR_EDAD[this._charData.edadCategoria] ?? 5) + bonusHechizos;
  }

  _calcHechizosExtraCost() {
    if (!["hechiceria", "teurgia"].includes(this._charData.tipoMagia)) return 0;
    const base = this._calcHechizosBase();
    const extras = Math.max(0, this._charData.hechizosElegidos.length - base);
    return -extras;
  }

  _puntosHabRestantesMagia() {
    const total = this._charData.puntosHab + this._calcPPConVentajas() * 3;
    const gastadosHab = Object.values(this._charData.habilidadesLibres).reduce((a, b) => a + b, 0);
    const gastadosMagia = Object.values(this._charData.magiaLibres).reduce((a, b) => a + b, 0);
    return total - gastadosHab - gastadosMagia;
  }

  // Dados al aleatorio

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

  // Especies

  _getEspecies() {
    return ESPECIES;
  }

  async _getEntornos() {
    if (this._entornosCache) return this._entornosCache;
    const pack = game.packs.get("tierras-quebradas.entornos");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._entornosCache = docs.map(d => ({
      id: d.id, name: d.name, descripcion: d.system.descripcion ?? "", habilidades: d.system.habilidades ?? [], habStr: (d.system.habilidades ?? []).map(h => `${h.nombre ?? h.clave} +${h.bonus}`).join(", ")
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._entornosCache;
  }

  async _getProfesiones() {
    if (this._profesionesCache) return this._profesionesCache;
    const pack = game.packs.get("tierras-quebradas.profesiones");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._profesionesCache = docs.map(d => ({
      id: d.id, name: d.name, descripcion: d.system.descripcion ?? "", habilidades: d.system.habilidades ?? [], ventajas: d.system.ventajas ?? [], especializaciones: d.system.especializaciones ?? [], habStr: (d.system.habilidades ?? []).map(h => `${h.nombre ?? h.clave} +${h.bonus}`).join(", ")
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._profesionesCache;
  }

  async _getVentajas() {
    if (this._ventajasCache) return this._ventajasCache;
    const pack = game.packs.get("tierras-quebradas.ventajas");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._ventajasCache = docs.map(d => ({
      id: d.id, name: d.name, coste: d.system.coste ?? 0, tipo: d.system.tipo ?? "ventaja", efecto: d.system.efecto ?? ""
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._ventajasCache;
  }

  async _getArmaduras() {
    if (this._armaduraCache) return this._armaduraCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armaduras");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armaduraCache = docs.map(d => ({
      id: d.id, name: d.name, precio: d.system.precio ?? 0, carga: d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armaduraCache;
  }

  async _getArmasCaC() {
    if (this._armasCaCCache) return this._armasCaCCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armas-cuerpo-a-cuerpo");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armasCaCCache = docs.map(d => ({
      id: d.id, name: d.name, precio: d.system.precio ?? 0, carga: d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armasCaCCache;
  }

  async _getArmasProy() {
    if (this._armasProyCache) return this._armasProyCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armas-proyectiles");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armasProyCache = docs.map(d => ({
      id: d.id, name: d.name, precio: d.system.precio ?? 0, carga: d.system.carga  ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._armasProyCache;
  }

  async _getArmasArr() {
    if (this._armasArrCache) return this._armasArrCache;
    const pack = game.packs.get("tierras-quebradas.armamento-armas-arrojadizas");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._armasArrCache = docs.map(d => ({
      id: d.id, name: d.name, precio: d.system.precio ?? 0, carga: d.system.carga  ?? 0
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

  async _getHechizos() {
    if (this._hechizosCache) return this._hechizosCache;
    const pack = game.packs.get("tierras-quebradas.hechizos");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._hechizosCache = docs.map(d => ({
      id: d.id, name: d.name, verbo: d.system.verbo ?? "", esfera: d.system.esfera ?? "", dificultad: d.system.dificultad ?? 0, pmCoste: d.system.pmCoste ?? 1, pmMax: d.system.pmMax ?? 0
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._hechizosCache;
  }

  async _getRasgos() {
    if (this._rasgosCache) return this._rasgosCache;
    const pack = game.packs.get("tierras-quebradas.rasgos");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._rasgosCache = docs.map(d => ({
      id: d.id, name: d.name, coste: d.system.coste ?? 0, tipo: d.system.tipo ?? "rasgoSobrenatural", efecto: d.system.efecto ?? "", habilidades: d.system.habilidades ?? []
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._rasgosCache;
  }

  async _getOrigenes() {
    if (this._origenesCache) return this._origenesCache;
    const pack = game.packs.get("tierras-quebradas.origenes");
    if (!pack) return [];
    const docs = await pack.getDocuments();
    this._origenesCache = docs.map(d => ({
      id: d.id, name: d.name, descripcion: d.system.descripcion ?? "", idiomaNoativo: d.system.idiomaNoativo ?? "", religion: d.system.religion ?? "", ppBonus: d.system.ppBonus ?? 0, habilidades: d.system.habilidades ?? [], ppStr: d.system.ppBonus > 0 ? "+" + d.system.ppBonus + " PP"
                 : d.system.ppBonus < 0 ? d.system.ppBonus + " PP" : null
    })).sort((a, b) => a.name.localeCompare(b.name));
    return this._origenesCache;
  }

  // Contexto

  async _prepareContext(options) {
    const pasoId = CharacterCreator.PASOS[this._pasoIndex].id;
    const pasoLabel = CharacterCreator.PASOS[this._pasoIndex].label;
    const edad = this._edadActual;

    const pasos = CharacterCreator.PASOS.map((s, i) => ({
      ...s, num: i + 1, active: i === this._pasoIndex, done: i < this._pasoIndex
    }));

    const edades = Object.entries(EDADES).map(([k, v]) => ({
      key: k, ...v, selected: k === this._charData.edadCategoria, ppStr: (v.ppBonus >= 0 ? "+" : "") + v.ppBonus + " PP"
    }));

    // Datos específicos de características
    const { cuerpo, mente, espiritu, atractivo, tamano } = this._charData;
    const sumCaract = cuerpo + mente + espiritu;
    const poolDistr = this._edadActual.puntosCaract + this._charData.especieBonusPuntos;
    const ptsRestantes = poolDistr - sumCaract;
    const ppAtractivo = this._ppAtractivo();
    let ppAtrStr;
    if (ppAtractivo === 0) ppAtrStr = "0 PP";
    else if (ppAtractivo > 0) ppAtrStr = "+" + ppAtractivo + " PP";
    else ppAtrStr = ppAtractivo + " PP";

    // Listas procesadas para el template (evitan lógica compleja en HBS)
    const caractLista = [
      { key: "cuerpo", label: "Cuerpo", valor: cuerpo, min: 3, max: 9 }, { key: "mente", label: "Mente", valor: mente, min: 3, max: 9 }, { key: "espiritu", label: "Espíritu", valor: espiritu, min: 3, max: 9 }
    ];
    const atrTamLista = [
      { key: "atractivo", label: "Atractivo", valor: atractivo, min: -3, max: 3, ppStr: ppAtrStr, ppMod: ppAtractivo }, { key: "tamano", label: "Tamaño", valor: tamano, min: -3, max: 3, ppStr: null, ppMod: 0 }
    ];
    const rolledMap = { cuerpo: this._charData.cuerpoRolled, mente: this._charData.menteRolled, espiritu: this._charData.espirituRolled };
    const asignacionAleatoria = this._charData.tiradaAleatoria
      ? caractLista.map(c => ({
          ...c, valor: rolledMap[c.key] ?? c.valor, opciones: this._charData.tiradaAleatoria.map(v => ({ valor: v, seleccionado: v === (rolledMap[c.key] ?? c.valor) }))
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
          { label: "Cuerpo", base: this._charData.cuerpoRolled, mod: edad.aleatorioCuerpo, final: cuerpo   }, { label: "Mente", base: this._charData.menteRolled, mod: edad.aleatorioMente, final: mente    }
        ].filter(r => r.mod !== 0)
      : null;

    // Datos de entorno
    let entornosData = null;
    let eleccionesEntorno = null;
    if (pasoId === "entorno") {
      const lista = await this._getEntornos();
      entornosData = lista.map(e => ({ ...e, selected: e.id === this._charData.entornoId }));
      const ent = this._entornosCache?.find(e => e.id === this._charData.entornoId);
      if (ent) {
        const conOpciones = (ent.habilidades ?? [])
          .map((h, i) => ({ ...h, idx: i })).filter(h => h.opciones?.length);
        if (conOpciones.length) {
          eleccionesEntorno = conOpciones.map(h => ({
            idx: h.idx, nombre: h.nombre ?? h.clave, bonus: h.bonus, opciones: h.opciones.map(op => ({
              clave: op, label: CharacterCreator.ARMA_LABELS[op] ?? op, selected: (this._charData.entornoElecciones[h.idx] ?? h.clave) === op
            }))
          }));
        }
      }
    }

    // Datos de profesión
    let profesionesData = null;
    let eleccionesProfesion = null;
    let especializaciones = null;
    if (pasoId === "profesion") {
      const lista = await this._getProfesiones();
      profesionesData = lista.map(p => ({
        ...p, selected: p.id === this._charData.profesionId
      }));
      const prof = this._profesionesCache?.find(p => p.id === this._charData.profesionId);
      if (prof) {
        const conOpciones = (prof.habilidades ?? [])
          .map((h, i) => ({ ...h, idx: i })).filter(h => h.opciones?.length);
        if (conOpciones.length) {
          eleccionesProfesion = conOpciones.map(h => ({
            idx: h.idx, nombre: h.nombre ?? h.clave, bonus: h.bonus, opciones: h.opciones.map(op => ({
              clave: op, label: CharacterCreator.ARMA_LABELS[op] ?? op, selected: (this._charData.profesionElecciones[h.idx] ?? h.clave) === op
            }))
          }));
        }
        if (prof.especializaciones?.length) {
          especializaciones = prof.especializaciones.map((e, idx) => ({
            idx, nombre: e.nombre,
            habStr: (e.habilidades ?? []).map(h => `${h.nombre ?? h.clave} +${h.bonus}`).join(", "),
            selected: idx === this._charData.especializacionIdx
          }));
        }
      }
    }

    // Datos de origen
    let origenesData = null;
    let eleccionesIdiomaOrigen = null;
    if (pasoId === "origen") {
      const lista = await this._getOrigenes();
      origenesData = lista.map(o => ({
        ...o, selected: o.id === this._charData.origenId, habStr: (o.habilidades ?? [])
          .map(h => `${h.nombre ? h.nombre : h.clave} +${h.bonus}`)
          .join(", ")
      }));
      if (this._charData.origenId) {
        const origen = this._origenesCache?.find(x => x.id === this._charData.origenId);
        if (origen) {
          const conIdioma = (origen.habilidades ?? [])
            .map((h, i) => ({ ...h, idx: i }))
            .filter(h => h.clave?.startsWith("idioma") && !h.nombre);
          if (conIdioma.length) {
            const idiomas = await this._getIdiomas();
            eleccionesIdiomaOrigen = conIdioma.map(h => ({
              idx: h.idx, bonus: h.bonus, opciones: idiomas.map(id => ({
                nombre: id.name, selected: (this._charData.origenElecciones[h.idx] ?? "") === id.name
              }))
            }));
          }
        }
      }
    }

    // Datos de especie
    let especiesData = null;
    if (pasoId === "especie") {
      especiesData = this._getEspecies().map(e => ({
        ...e, selected: e.id === this._charData.especieId, ppCostStr: e.costePP > 0 ? "−" + e.costePP + " PP" : "0 PP", bonusPuntosStr: e.bonusPuntos > 0 ? "+" + e.bonusPuntos + " pts. a distribuir" : null, bonusCaract: this._formatBonusCaract(e)
      }));
    }

    // Datos de ventajas
    let ventajasLista = null;
    let desventajasLista = null;
    const ventajasConteo = this._charData.ventajasElegidas.length;
    if (pasoId === "ventajas") {
      const lista = await this._getVentajas();
      const elegidos = new Set(this._charData.ventajasElegidas.map(v => v.id));
      const ppActual = this._calcPPConVentajas();
      const maxReach = ventajasConteo >= 4;
      const mapV = v => ({
        ...v, selected: elegidos.has(v.id), deshabilitada: !elegidos.has(v.id) && (
          maxReach || (v.tipo === "ventaja" && ppActual + v.coste < 0)
        ), costeBadge: v.coste < 0 ? v.coste + " PP" : "+" + v.coste + " PP"
      });
      ventajasLista = lista.filter(v => v.tipo === "ventaja").map(mapV);
      desventajasLista = lista.filter(v => v.tipo === "desventaja").map(mapV);
    }

    // Datos de rasgos (sobrenaturales/sociales + personalidad)
    let rasgosItemsData = null;
    let rasgosData = null;
    if (pasoId === "rasgos") {
      // Seleccionables del compendio
      const lista = await this._getRasgos();
      const normH = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const elegidosMap = new Map(this._charData.rasgosElegidos.map(r => [r.id, r]));
      const ppActual = this._calcPPConVentajas();
      const mapR = r => {
        const elegidoEntry = elegidosMap.get(r.id);
        const esHechizos = normH(r.name ?? "") === "hechizos";
        return {
          ...r, selected: elegidosMap.has(r.id), deshabilitada: !elegidosMap.has(r.id) && r.coste < 0 && ppActual + r.coste < 0, costeBadge: r.coste < 0 ? r.coste + " PP" : "+" + r.coste + " PP", esHechizos, cantidad: esHechizos && elegidoEntry ? (elegidoEntry.cantidad ?? 1) : undefined
        };
      };
      rasgosItemsData = {
        sobrenaturales: lista.filter(r => r.tipo === "rasgoSobrenatural").map(mapR), sociales: lista.filter(r => r.tipo === "rasgoSocial").map(mapR)
      };
      // Rasgos de personalidad
      const { pos, neg } = this._calcNumRasgos();
      while (this._charData.rasgosPos.length < pos) this._charData.rasgosPos.push("");
      while (this._charData.rasgosNeg.length < neg) this._charData.rasgosNeg.push("");
      rasgosData = {
        positivos: this._charData.rasgosPos.slice(0, pos).map((v, i) => ({ idx: i, valor: v, label: `Rasgo positivo ${i + 1}` })), negativos: this._charData.rasgosNeg.slice(0, neg).map((v, i) => ({ idx: i, valor: v, label: `Rasgo negativo ${i + 1}` }))
      };
    }

    const fuerza = Math.max(3, this._charData.cuerpo + this._charData.tamano);
    const nivelFondos = FONDOS_INICIALES.find(n => n.id === this._charData.nivelAdquisitivo) ?? null;
    const mbGastado = [
      ...this._charData.armaduraSeleccionadas, ...this._charData.armasCaCSeleccionadas, ...this._charData.armasProySeleccionadas, ...this._charData.armasArrSeleccionadas
    ].reduce((s, a) => s + a.precio, 0);
    const mbRestantes = this._charData.fondosIniciales - mbGastado;
    const equipoData = {
      niveles: FONDOS_INICIALES.map(n => ({ ...n, selected: n.id === this._charData.nivelAdquisitivo })), nivelFondos, fuerza, cargaNormal: fuerza, cargaMucha: fuerza * 2, cargaDebilita: fuerza * 3, cargaMaxima: fuerza * 4, mbGastado, mbRestantes, mbNegativo: mbRestantes < 0
    };

    let armadurasData = null;
    let armasCaCData = null;
    let armasProyData = null;
    let armasArrData = null;
    if (pasoId === "equipo") {
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

    let religionData = null;
    if (pasoId === "religion") {
      const plBase = this._charData.espiritu * 3;
      const ideologia = this._charData.ideologiaReligion;
      const lealtadClave = IDEOLOGIA_A_LEALTAD[ideologia] ?? null;
      const pl = this._charData.plRepartidos;

      const esSacerdote = this._charData.profesionNombre.toLowerCase().includes("sacerdote");
      const tieneDevocion = this._charData.ventajasElegidas.some(v => v.nombre === "Devoción");
      const esPuritano = this._charData.origenNombre === "Puritano";

      const bonusAuto = { ley: 0, caos: 0, elementos: 0, antepasados: 0 };
      if (lealtadClave) {
        if (esSacerdote) bonusAuto[lealtadClave] += 10;
        if (tieneDevocion) bonusAuto[lealtadClave] += 5;
      }
      if (esPuritano) bonusAuto.ley += 5;

      const plTotal = {
        ley: pl.ley + bonusAuto.ley, caos: pl.caos + bonusAuto.caos, elementos: pl.elementos + bonusAuto.elementos, antepasados: pl.antepasados + bonusAuto.antepasados
      };
      const plGastado = pl.ley + pl.caos + pl.elementos + pl.antepasados;
      const plRestante = plBase - plGastado;

      const alineado = { ley: false, caos: false, elementos: false, antepasados: false };
      if (ideologia && ideologia !== "sinReligion") {
        if (ideologia === "equilibrio" || ideologia === "sincretismo") {
          const otrasMax = Math.max(plTotal.elementos, plTotal.antepasados);
          alineado.ley = plTotal.ley - otrasMax >= 10;
          alineado.caos = plTotal.caos - otrasMax >= 10;
        } else {
          for (const [k, v] of Object.entries(plTotal)) {
            const otrasMax = Math.max(...Object.entries(plTotal).filter(([ok]) => ok !== k).map(([, ov]) => ov));
            alineado[k] = v - otrasMax >= 10;
          }
        }
      }

      const soloRebIndi = ideologia === "equilibrio" || ideologia === "sinReligion";
      const actitudesFiltradas = soloRebIndi
        ? ACTITUDES.filter(a => a.id === "rebelde" || a.id === "indiferente")
        : ACTITUDES;

      const deidades = ideologia ? (DEIDADES_POR_IDEOLOGIA[ideologia] ?? []) : [];

      const plFilas = ["ley", "caos", "elementos", "antepasados"].map(k => ({
        key: k, label: LABELS_PL[k], repartidos: pl[k], bonus: bonusAuto[k], total: plTotal[k], alineado: alineado[k], puedeSubir: plRestante > 0, puedeBajar: pl[k] > 0
      }));

      religionData = {
        ideologias: IDEOLOGIAS.map(i => ({ ...i, selected: i.id === ideologia })), deidades: deidades.map(d => ({ nombre: d, selected: d === this._charData.deidad })), hayDeidades: deidades.length > 0, actitudes: actitudesFiltradas.map(a => ({ ...a, selected: a.id === this._charData.actitudDivina })), plBase, plGastado, plRestante, plFilas, hayBonus: esSacerdote || tieneDevocion || esPuritano, esSacerdote, tieneDevocion, esPuritano, lealtadClave, ideologiaActiva: ideologia
      };
    }

    // Datos de magia
    let magiaData = null;
    if (pasoId === "magia") {
      const esProfMagica = this._esProfesionMagica();
      const rasgoMagia = this._magiaDeRasgo();
      const accesoForzado = esProfMagica || !!rasgoMagia;
      const tipoForzado = rasgoMagia?.tipo || (esProfMagica ? "hechiceria" : null);
      if (accesoForzado && tipoForzado) {
        if (this._charData.tipoMagia !== tipoForzado) {
          if (!["hechiceria", "teurgia"].includes(tipoForzado)) {
            this._charData.hechizosElegidos = [];
            this._charData.magiaLibres = {};
          }
          this._charData.tipoMagia = tipoForzado;
        }
        this._charData.tipoMagiaAuto = true;
      } else if (!accesoForzado && this._charData.tipoMagiaAuto) {
        this._charData.tipoMagia = null;
        this._charData.tipoMagiaAuto = false;
      }
      const tipoActual = this._charData.tipoMagia;
      const tieneHechizos = ["hechiceria", "teurgia"].includes(tipoActual);
      const esTeurgia = tipoActual === "teurgia";
      const baseHechizos = this._calcHechizosBase();
      const baseHechiceria = Math.floor((this._charData.mente + this._charData.espiritu) / 3);
      const puntosRestantes = this._puntosHabRestantesMagia();
      const espirituConsagrado = this._charData.hechizosElegidos
        .filter(h => h.permanent).reduce((s, h) => s + (h.pmCoste || 1), 0);
      const extrasCount = Math.max(0, this._charData.hechizosElegidos.length - baseHechizos);

      const opcTipos = [
        { id: "sin", label: "Sin magia", costeStr: "0 PP", desc: "Sin capacidad mágica." }, { id: "don", label: "Don de la magia", costeStr: "−1 PP", desc: "Potencial innato sin entrenamiento. No empieza con hechizos." }, { id: "hechiceria", label: "Hechicería", costeStr: this._calcCosteStr("hechiceria"), desc: "Mago entrenado con hechizos, verbos y esferas." }, { id: "teurgia", label: "Teúrgia", costeStr: this._calcCosteStr("teurgia"), desc: "Magia blanca ligada a la Ley. Solo hechizos de Esfera Ley (máx. 3 ó 4)." }
      ].map(o => ({ ...o, selected: o.id === tipoActual }));

      let listaHechizosAgrupada = [];
      if (tieneHechizos) {
        const todos = await this._getHechizos();
        const esfFiltradas = esTeurgia ? ["Ley"] : ESFERAS_ORDEN;
        const atMax = this._charData.hechizosElegidos.length >= baseHechizos;
        listaHechizosAgrupada = esfFiltradas.map(esfera => ({
          label: esfera, hechizos: todos.filter(h => h.esfera === esfera).map(h => {
            const sel = this._charData.hechizosElegidos.find(x => x.id === h.id);
            return {
              ...h, selected: !!sel, permanent: sel?.permanent ?? false, bloqueado: h.dificultad >= 25 || (!sel && atMax), pmStr: h.pmMax ? `${h.pmCoste}–${h.pmMax}` : `${h.pmCoste}`
            };
          })
        })).filter(g => g.hechizos.length > 0);
      }

      const mapHabilidad = (key, label) => {
        const libre = this._charData.magiaLibres[key] ?? 0;
        const total = baseHechiceria + libre;
        return {
          key, label, base: baseHechiceria, libre, total, puedeSubir: total < 8 && puntosRestantes > 0, puedeBajar: libre > 0
        };
      };

      magiaData = {
        esProfMagica, rasgoMagia, accesoForzado, profesionNombre: this._charData.profesionNombre, tipoActual, opcTipos, tieneHechizos, esTeurgia, baseHechizos, elegidosCount: this._charData.hechizosElegidos.length, extrasCount, extrasCost: extrasCount, listaHechizosAgrupada, verbos: VERBOS_MAGIA.map(v => mapHabilidad(v.key, v.label)), esferas: ESFERAS_MAGIA.map(e => mapHabilidad(e.key, e.label)), baseHechiceria, puntosRestantes, pmMax: this._charData.espiritu * 2, espiritu: this._charData.espiritu, espirituConsagrado, espirituLibre: this._charData.espiritu - espirituConsagrado
      };
    }

    const implementados = new Set(["caracteristicas", "edad", "especie", "origen", "entorno", "profesion", "ventajas", "rasgos", "equipo", "habilidades"]);

    let habilidadesData = null;
    if (pasoId === "habilidades") {
      const habBase = this._getHabilidadesBase();
      const puntosTotal = this._charData.puntosHab + this._calcPPConVentajas() * 3;
      const puntosGastados = Object.values(this._charData.habilidadesLibres).reduce((a, b) => a + b, 0);
      const puntosRestantes = puntosTotal - puntosGastados;
      habilidadesData = {
        puntosTotal, puntosRestantes, grupos: GRUPOS_HABILIDADES.map(g => ({
          ...g, habs: g.habs.map(h => {
            const base = habBase[h.clave] ?? 0;
            const libre = this._charData.habilidadesLibres[h.clave] ?? 0;
            const total = base + libre;
            return { ...h, base, libre, total, puedeSubir: total < 8 && puntosRestantes > 0, puedeBajar: libre > 0 };
          })
        }))
      };
    }

    return {
      pasoId, pasoLabel, pasoIndex: this._pasoIndex, pasos, data: { ...this._charData }, // Edad
      edades, edad, // Características
      ptsRestantes, ppAtractivo, ppAtrStr, sumCaract, caractLista, atrTamLista, asignacionAleatoria, tiradaBruta: this._charData.tiradaBruta, // Conflicto
      hayConflicto, ptsExceso, conflictoCuerpo, reduccionesAleatorias, // Entorno
      entornos: entornosData, eleccionesEntorno, // Profesión
      profesiones: profesionesData, eleccionesProfesion, especializaciones, // Origen
      origenes: origenesData, eleccionesIdiomaOrigen, // Especie
      especies: especiesData, // Ventajas
      ventajasLista, desventajasLista, ventajasConteo, // Rasgos
      rasgosItemsData, rasgosData, // Equipo
      equipoData, armadurasData, armasCaCData, armasProyData, armasArrData, // Habilidades
      habilidadesData, // Religión
      religionData, // Magia
      magiaData, // Global
      ppTotal: this._calcPPConVentajas(), puntosHab: this._charData.puntosHab, esUltimoPaso: this._pasoIndex === CharacterCreator.PASOS.length - 1, mostrarCrear: this._pasoIndex > 0, hayAnterior: this._pasoIndex > 0
    };
  }

  _getHabilidadesBase() {
    const base = {};
    const sumar = (lista, elecciones) => {
      for (const [i, h] of (lista ?? []).entries()) {
        const clave = elecciones?.[i] ?? h.clave;
        if (!clave || !h.bonus) continue;
        base[clave] = (base[clave] ?? 0) + h.bonus;
      }
    };
    sumar(this._charData.entornoHabilidades, this._charData.entornoElecciones);
    sumar(this._charData.origenHabilidades, this._charData.origenElecciones);
    sumar(this._charData.profesionHabilidades, this._charData.profesionElecciones);
    sumar(this._charData.especializacionHabilidades, null);
    for (const r of (this._charData.rasgosElegidos ?? [])) {
      for (const h of (r.habilidades ?? [])) {
        if (!h.clave || !h.bonus) continue;
        base[h.clave] = (base[h.clave] ?? 0) + h.bonus;
      }
    }
    return base;
  }

  _formatBonusCaract(e) {
    const bonos = [];
    if (e.bonusCuerpo)    bonos.push("CUE " + (e.bonusCuerpo   > 0 ? "+" : "") + e.bonusCuerpo);
    if (e.bonusMente)     bonos.push("MEN " + (e.bonusMente    > 0 ? "+" : "") + e.bonusMente);
    if (e.bonusEspiritu)  bonos.push("ESP " + (e.bonusEspiritu > 0 ? "+" : "") + e.bonusEspiritu);
    return bonos.join(" · ") || null;
  }

  // Eventos

  _onRender(context, options) {
    super._onRender(context, options);
    const el = this.element;

    // Actualizar barra de características directamente (fiable entre pasos)
    for (const caract of ["cuerpo", "mente", "espiritu", "atractivo", "tamano"]) {
      const span = el.querySelector(`.cc-caract-bar-val[data-caract="${caract}"]`);
      if (span) span.textContent = this._charData[caract] ?? 0;
    }

    // Características
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

    // Edad
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

    // Entorno
    el.querySelectorAll(".entorno-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.entornoId;
        const entorno = this._entornosCache?.find(x => x.id === id);
        if (!entorno) return;
        this._charData.entornoId = id;
        this._charData.entornoNombre = entorno.name;
        this._charData.entornoHabilidades = entorno.habilidades ?? [];
        this._charData.entornoElecciones = {};
        this.render();
      });
    });

    // Profesión
    el.querySelectorAll(".profesion-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.profesionId;
        const profesion = this._profesionesCache?.find(x => x.id === id);
        if (!profesion) return;
        this._charData.profesionId = id;
        this._charData.profesionNombre = profesion.name;
        this._charData.profesionHabilidades = profesion.habilidades ?? [];
        this._charData.profesionVentajas = profesion.ventajas ?? [];
        this._charData.profesionElecciones = {};
        this._charData.especializacionIdx = null;
        this._charData.especializacionHabilidades = [];
        this.render();
      });
    });

    // Especialización de profesión
    el.querySelectorAll(".cc-especializacion-card").forEach(card => {
      card.addEventListener("click", () => {
        const idx = parseInt(card.dataset.idx);
        const prof = this._profesionesCache?.find(p => p.id === this._charData.profesionId);
        const esp = prof?.especializaciones?.[idx];
        if (!esp) return;
        this._charData.especializacionIdx = idx;
        this._charData.especializacionHabilidades = esp.habilidades ?? [];
        this.render();
      });
    });

    // Elecciones de arma
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

    // Origen
    el.querySelectorAll(".origen-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.origenId;
        const origen = this._origenesCache?.find(x => x.id === id);
        if (!origen) return;
        this._charData.origenId = id;
        this._charData.origenNombre = origen.name;
        this._charData.origenPPBonus = origen.ppBonus ?? 0;
        this._charData.origenIdioma = origen.idiomaNoativo ?? "";
        this._charData.origenReligion = origen.religion ?? "";
        this._charData.origenHabilidades = origen.habilidades ?? [];
        this.render();
      });
    });

    // Origen: idioma
    el.querySelectorAll(".cc-idioma-origen-select").forEach(sel => {
      sel.addEventListener("change", ev => {
        const idx = parseInt(ev.target.dataset.idx);
        this._charData.origenElecciones[idx] = ev.target.value;
      });
    });

    // Especie
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

    // Ventajas
    el.querySelectorAll(".ventaja-card").forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("disabled")) return;
        const id = card.dataset.ventajaId;
        const idx = this._charData.ventajasElegidas.findIndex(v => v.id === id);
        if (idx >= 0) {
          this._charData.ventajasElegidas.splice(idx, 1);
        } else {
          const ventaja = this._ventajasCache?.find(x => x.id === id);
          if (ventaja) this._charData.ventajasElegidas.push(
            { id: ventaja.id, nombre: ventaja.name, coste: ventaja.coste, tipo: ventaja.tipo, efecto: ventaja.efecto }
          );
        }
        this.render();
      });
    });

    // Rasgos
    const normR = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    el.querySelectorAll(".rasgo-card").forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("disabled")) return;
        const id = card.dataset.rasgoId;
        const rasgo = this._rasgosCache?.find(x => x.id === id);
        if (!rasgo) return;
        const esHechizos = normR(rasgo.name ?? "") === "hechizos";
        const idx = this._charData.rasgosElegidos.findIndex(e => e.id === id);
        if (esHechizos) {
          if (idx >= 0) {
            const entry = this._charData.rasgosElegidos[idx];
            if (this._calcPPConVentajas() + rasgo.coste >= 0)
              entry.cantidad = (entry.cantidad ?? 1) + 1;
          } else {
            this._charData.rasgosElegidos.push(
              { id: rasgo.id, nombre: rasgo.name, coste: rasgo.coste, tipo: rasgo.tipo, efecto: rasgo.efecto, habilidades: rasgo.habilidades, cantidad: 1 }
            );
          }
        } else {
          if (idx >= 0) {
            this._charData.rasgosElegidos.splice(idx, 1);
          } else {
            this._charData.rasgosElegidos.push(
              { id: rasgo.id, nombre: rasgo.name, coste: rasgo.coste, tipo: rasgo.tipo, efecto: rasgo.efecto, habilidades: rasgo.habilidades }
            );
          }
        }
        this.render();
      });
    });
    el.querySelectorAll(".rasgo-menos").forEach(btn => {
      btn.addEventListener("click", ev => {
        ev.stopPropagation();
        const id = btn.closest(".rasgo-card").dataset.rasgoId;
        const idx = this._charData.rasgosElegidos.findIndex(r => r.id === id);
        if (idx < 0) return;
        const entry = this._charData.rasgosElegidos[idx];
        if ((entry.cantidad ?? 1) <= 1) {
          this._charData.rasgosElegidos.splice(idx, 1);
        } else {
          entry.cantidad--;
        }
        this.render();
      });
    });

    // Rasgos de personalidad
    el.querySelectorAll(".cc-rasgo-input").forEach(inp => {
      inp.addEventListener("input", ev => {
        const tipo = ev.target.dataset.tipo;
        const idx = parseInt(ev.target.dataset.idx);
        if (tipo === "pos") this._charData.rasgosPos[idx] = ev.target.value;
        else                this._charData.rasgosNeg[idx] = ev.target.value;
      });
    });

    // Habilidades
    el.querySelectorAll(".cc-hab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const clave = btn.dataset.clave;
        const delta = parseInt(btn.dataset.delta);
        const libre = this._charData.habilidadesLibres[clave] ?? 0;
        this._charData.habilidadesLibres[clave] = libre + delta;
        this.render();
      });
    });

    // Religión
    el.querySelectorAll(".cc-ideologia-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.ideologiaId;
        this._charData.ideologiaReligion = id;
        this._charData.deidad = "";
        if ((id === "equilibrio" || id === "sinReligion") &&
            !["rebelde", "indiferente"].includes(this._charData.actitudDivina)) {
          this._charData.actitudDivina = "indiferente";
        }
        this.render();
      });
    });

    el.querySelector(".cc-deidad-select")?.addEventListener("change", ev => {
      this._charData.deidad = ev.target.value;
    });

    el.querySelectorAll(".cc-actitud-card").forEach(card => {
      card.addEventListener("click", () => {
        this._charData.actitudDivina = card.dataset.actitudId;
        this.render();
      });
    });

    el.querySelectorAll(".cc-pl-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const rel = btn.dataset.religion;
        const delta = parseInt(btn.dataset.delta);
        const pl = this._charData.plRepartidos;
        const plBase = this._charData.espiritu * 3;
        const plGastado = pl.ley + pl.caos + pl.elementos + pl.antepasados;
        if (delta > 0 && plGastado >= plBase) return;
        if (delta < 0 && pl[rel] <= 0) return;
        pl[rel] = pl[rel] + delta;
        this.render();
      });
    });

    // Magia
    el.querySelectorAll(".cc-magia-tipo-card").forEach(card => {
      card.addEventListener("click", () => {
        const tipo = card.dataset.tipo;
        this._charData.tipoMagia = tipo;
        this._charData.tipoMagiaAuto = false;
        if (!["hechiceria", "teurgia"].includes(tipo)) {
          this._charData.hechizosElegidos = [];
          this._charData.magiaLibres = {};
        } else if (tipo === "teurgia") {
          this._charData.hechizosElegidos = this._charData.hechizosElegidos
            .filter(h => h.esfera === "Ley")
            .slice(0, this._calcHechizosBase());
        }
        this.render();
      });
    });

    el.querySelectorAll(".cc-hechizo-card").forEach(card => {
      card.addEventListener("click", ev => {
        if (ev.target.closest(".cc-hechizo-perm-fila")) return;
        if (card.classList.contains("bloqueado")) return;
        const id = card.dataset.hechizoId;
        const idx = this._charData.hechizosElegidos.findIndex(h => h.id === id);
        if (idx >= 0) {
          this._charData.hechizosElegidos.splice(idx, 1);
        } else {
          const hechizo = this._hechizosCache?.find(x => x.id === id);
          if (hechizo) this._charData.hechizosElegidos.push(
            { id: hechizo.id, name: hechizo.name, pmCoste: hechizo.pmCoste, dificultad: hechizo.dificultad, esfera: hechizo.esfera, verbo: hechizo.verbo, permanent: false }
          );
        }
        this.render();
      });
    });

    el.querySelectorAll(".cc-hechizo-perm").forEach(cb => {
      cb.addEventListener("click", ev => {
        ev.stopPropagation();
        const id = ev.currentTarget.dataset.hechizoId;
        const hechizo = this._charData.hechizosElegidos.find(x => x.id === id);
        if (hechizo) hechizo.permanent = !hechizo.permanent;
        this.render();
      });
    });

    el.querySelectorAll(".cc-magia-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const hab = btn.dataset.hab;
        const delta = parseInt(btn.dataset.delta);
        const libre = this._charData.magiaLibres[hab] ?? 0;
        this._charData.magiaLibres[hab] = Math.max(0, libre + delta);
        this.render();
      });
    });

    // Navegación
    el.querySelector(".cc-btn-anterior")?.addEventListener("click", () => {
      this._pasoIndex--;
      this.render();
    });
    // equipo: armaduras
    el.querySelectorAll(".cc-armadura-check").forEach(circle => {
      circle.addEventListener("click", ev => {
        const t      = ev.currentTarget;
        const id     = t.dataset.armaduraId;
        const nombre = t.dataset.nombre;
        const precio = parseInt(t.dataset.precio)  || 0;
        const carga  = parseFloat(t.dataset.carga) || 0;
        if (!t.classList.contains("marcado")) {
          this._charData.armaduraSeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armaduraSeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armaduraSeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: armas arrojadizas
    el.querySelectorAll(".cc-armaArr-check").forEach(circle => {
      circle.addEventListener("click", ev => {
        const t      = ev.currentTarget;
        const id     = t.dataset.armaId;
        const nombre = t.dataset.nombre;
        const precio = parseInt(t.dataset.precio)  || 0;
        const carga  = parseFloat(t.dataset.carga) || 0;
        if (!t.classList.contains("marcado")) {
          this._charData.armasArrSeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armasArrSeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armasArrSeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: armas de proyectiles
    el.querySelectorAll(".cc-armaproy-check").forEach(circle => {
      circle.addEventListener("click", ev => {
        const t      = ev.currentTarget;
        const id     = t.dataset.armaId;
        const nombre = t.dataset.nombre;
        const precio = parseInt(t.dataset.precio)  || 0;
        const carga  = parseFloat(t.dataset.carga) || 0;
        if (!t.classList.contains("marcado")) {
          this._charData.armasProySeleccionadas.push({ id, nombre, precio, carga });
        } else {
          const idx = this._charData.armasProySeleccionadas.findIndex(a => a.id === id);
          if (idx >= 0) this._charData.armasProySeleccionadas.splice(idx, 1);
        }
        this.render();
      });
    });

    // equipo: armas cuerpo a cuerpo
    el.querySelectorAll(".cc-armacac-check").forEach(circle => {
      circle.addEventListener("click", ev => {
        const t      = ev.currentTarget;
        const id     = t.dataset.armaId;
        const nombre = t.dataset.nombre;
        const precio = parseInt(t.dataset.precio)  || 0;
        const carga  = parseFloat(t.dataset.carga) || 0;
        if (!t.classList.contains("marcado")) {
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
      if (this._validarPaso()) { this._pasoIndex++; this.render(); }
    });
    el.querySelector(".cc-btn-crear")?.addEventListener("click", () => {
      if (this._validarPaso()) this._crearActor();
    });
  }

  // Validación

  _validarPaso() {
    const id = CharacterCreator.PASOS[this._pasoIndex].id;

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

    if (id === "profesion") {
      if (!this._charData.profesionId) {
        ui.notifications.warn("Selecciona una profesión antes de continuar.");
        return false;
      }
      const prof = this._profesionesCache?.find(p => p.id === this._charData.profesionId);
      if (prof?.especializaciones?.length && this._charData.especializacionIdx === null) {
        ui.notifications.warn("Selecciona una especialización antes de continuar.");
        return false;
      }
    }

    if (id === "religion") {
      if (!this._charData.ideologiaReligion) {
        ui.notifications.warn("Selecciona una ideología religiosa.");
        return false;
      }
      const plBase = this._charData.espiritu * 3;
      const pl = this._charData.plRepartidos;
      const plGastado = pl.ley + pl.caos + pl.elementos + pl.antepasados;
      if (plGastado !== plBase) {
        const diff = Math.abs(plBase - plGastado);
        ui.notifications.warn(`Debes repartir exactamente ${plBase} PL (${plGastado > plBase ? "sobran" : "faltan"} ${diff}).`);
        return false;
      }
      const lealtadClave = IDEOLOGIA_A_LEALTAD[this._charData.ideologiaReligion];
      if (lealtadClave) {
        const miPL = pl[lealtadClave];
        const otroMax = Math.max(...Object.entries(pl).filter(([k]) => k !== lealtadClave).map(([, v]) => v));
        if (miPL < otroMax) {
          ui.notifications.warn("La religión elegida debe tener más PL que cualquier otra.");
          return false;
        }
      }
    }

    if (id === "magia") {
      const espConsa = this._charData.hechizosElegidos
        .filter(h => h.permanent).reduce((s, h) => s + (h.pmCoste || 1), 0);
      if (espConsa > this._charData.espiritu) {
        ui.notifications.warn(`El Espíritu Consagrado (${espConsa}) supera el Espíritu del personaje (${this._charData.espiritu}).`);
        return false;
      }
      if (this._calcPPConVentajas() < 0) {
        ui.notifications.warn("Los PP están en negativo. Reduce hechizos extra o revisa tus ventajas.");
        return false;
      }
      return true;
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

  // Crear actor

  async _crearActor() {
    const { cuerpo, mente, espiritu } = this._charData;

    const actor = await Actor.create({
      name: this._charData.nombre.trim(), type: "pj", img: "icons/svg/mystery-man.svg", system: {
        edad: this._charData.edadNumero, puntosPP: this._calcPPConVentajas(), puntosHab: this._charData.puntosHab, caracteristicas: {
          cuerpo: { valor: cuerpo    }, mente: { valor: mente     }, espiritu: { valor: espiritu  }, atractivo: { valor: this._charData.atractivo }, tamano: { valor: this._charData.tamano   }
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
      for (const h of (this._charData.especializacionHabilidades ?? [])) {
        if (!h.clave || !h.bonus) continue;
        const curr = actor.system.habilidades?.[h.clave]?.nivel ?? 0;
        const existing = habProf[`system.habilidades.${h.clave}.nivel`] ?? curr;
        habProf[`system.habilidades.${h.clave}.nivel`] = existing + h.bonus;
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
          name: v.nombre, type: "ventaja", system: { coste: v.coste ?? 0, tipo: v.tipo ?? "ventaja", efecto: v.efecto ?? "", fuente: "profesion" }
        }, { parent: actor });
      }
    }

    // Añadir ítem de especie para mostrarlo en la ficha
    // tqWizard: true → el hook createItem salta _aplicarEspecie (ya aplicado por el wizard)
    if (this._charData.especieId !== "__humano__") {
      const especie = ESPECIES.find(e => e.id === this._charData.especieId);
      if (especie) {
        await Item.create({
          name: especie.name, type: "especie", system: {
            costePP: especie.costePP, bonusPuntos: especie.bonusPuntos, bonusCuerpo: 0, bonusMente: especie.bonusMente, bonusEspiritu: especie.bonusEspiritu, tamanoMin: -3, tamanoMax: 3, atractivoMin: -3, atractivoMax: 3, descripcion: especie.descripcion
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
        name: r.nombre, type: "rasgo", system: { coste: r.coste, tipo: r.tipo, efecto: r.efecto ?? "", habilidades: r.habilidades ?? [], fuente: "creacion" }
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
        name: v.nombre, type: "ventaja", system: { coste: v.coste, tipo: v.tipo, efecto: v.efecto ?? "", fuente: "creacion" }
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

    // Habilidades libres (puntos repartidos en el paso habilidades)
    const habLibres = this._charData.habilidadesLibres ?? {};
    if (Object.keys(habLibres).length) {
      const libresUpdate = {};
      for (const [clave, puntos] of Object.entries(habLibres)) {
        if (!puntos) continue;
        const curr = actor.system.habilidades?.[clave]?.nivel ?? 0;
        libresUpdate[`system.habilidades.${clave}.nivel`] = curr + puntos;
      }
      if (Object.keys(libresUpdate).length) await actor.update(libresUpdate);
    }

    // Aplicar religión y lealtad
    if (this._charData.ideologiaReligion) {
      const pl = { ...this._charData.plRepartidos };
      const lealtadClave = IDEOLOGIA_A_LEALTAD[this._charData.ideologiaReligion] ?? null;
      const esSacerdote = this._charData.profesionNombre.toLowerCase().includes("sacerdote");
      const tieneDevocion = this._charData.ventajasElegidas.some(v => v.nombre === "Devoción");
      const esPuritano = this._charData.origenNombre === "Puritano";
      if (lealtadClave) {
        if (esSacerdote) pl[lealtadClave] += 10;
        if (tieneDevocion) pl[lealtadClave] += 5;
      }
      if (esPuritano) pl.ley += 5;
      await actor.update({
        "system.lealtad.ley": pl.ley, "system.lealtad.caos": pl.caos, "system.lealtad.elementos": pl.elementos, "system.lealtad.antepasados": pl.antepasados, "system.actitudDivina": this._charData.actitudDivina
      });
    }

    // Magia
    const tieneHechiceria = this._esProfesionMagica() || this._charData.tipoMagia === "hechiceria";
    const tieneTeurgia = this._charData.tipoMagia === "teurgia";
    if (tieneHechiceria || tieneTeurgia) {
      const espConsa = this._charData.hechizosElegidos
        .filter(h => h.permanent).reduce((s, h) => s + (h.pmCoste || 1), 0);
      const magiaUpd = {
        "system.hechiceria.pmMax": this._charData.espiritu * 2, "system.hechiceria.pmActual": this._charData.espiritu * 2, "system.hechiceria.espirituConsagrado": espConsa
      };
      for (const [k, v] of Object.entries(this._charData.magiaLibres)) {
        if (!v) continue;
        if (VERBOS_MAGIA.some(x => x.key === k)) magiaUpd[`system.hechiceria.verbos.${k}`] = v;
        else magiaUpd[`system.hechiceria.esferas.${k}`] = v;
      }
      await actor.update(magiaUpd);

      const packHech = game.packs.get("tierras-quebradas.hechizos");
      if (packHech) {
        for (const h of this._charData.hechizosElegidos) {
          const doc = await packHech.getDocument(h.id);
          if (doc) {
            const itemData = doc.toObject();
            if (h.permanent) itemData.system.permanent = true;
            await Item.create(itemData, { parent: actor });
          }
        }
      }
    }
    if (this._charData.tipoMagia === "don") {
      await Item.create({
        name: "Don de la magia", type: "ventaja", system: { coste: -1, tipo: "ventaja", efecto: "El personaje tiene potencial mágico innato pero no ha sido entrenado. Puede aprender hechizos durante el juego.", fuente: "creacion" }
      }, { parent: actor });
    }

    // Dinero restante tras compras
    const mbGastadoTotal = [
      ...this._charData.armaduraSeleccionadas, ...this._charData.armasCaCSeleccionadas, ...this._charData.armasProySeleccionadas, ...this._charData.armasArrSeleccionadas
    ].reduce((s, a) => s + a.precio, 0);
    if (this._charData.fondosIniciales > 0) {
      await actor.update({ "system.dinero": Math.max(0, this._charData.fondosIniciales - mbGastadoTotal) });
    }

    this.close();
    actor.sheet.render(true);
  }
}
