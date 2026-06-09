export class TQActor extends Actor {
  // Habilidades especializadas
  static HABILIDADES_ESPECIALIZADAS = new Set([
    "academia", "conocimientoMagico", "estrategia", "multiverso", "pociones", "sueños",
    "artesania", "forzarCerraduras",
    "arco", "honda",
    "nadar", "navegacion", "manejarBotes",
    "actuacion", "idioma1", "idioma2", "idioma3"
  ]);
  prepareDerivedData() {
    super.prepareDerivedData();
    try {
  
      if (this.system.caracteristicas) {
        this.updateFuerza();
        this.calcBases();
        this.updateSalud();
        this.calcMD();
        this._calcularEstorbo();
      }
      if (this.system.hechiceria)          this.updatePM();
      if (this.system.fortuna !== undefined) this._calcularFortuna();
    } catch(e) {
      console.error("TQ | prepareDerivedData error:", e);
    }
  }

  updateFuerza() {
    const cuerpo = this.system.caracteristicas.cuerpo?.valor ?? 5;
    const tamano = this.system.caracteristicas.tamano?.valor ?? 0;
    this.system.derivadas.fuerza.valor = Math.max(3, cuerpo + tamano);    // Mínimo 3
  }

  calcBases() {
    const c = this.system.caracteristicas.cuerpo?.valor ?? 5;
    const m = this.system.caracteristicas.mente?.valor ?? 5;
    const e = this.system.caracteristicas.espiritu?.valor ?? 5;
    const a = this.system.caracteristicas.atractivo?.valor ?? 0;
    const t = this.system.caracteristicas.tamano?.valor ?? 0;

    this.system.bases.agilidad.valor = c - t;
    this.system.bases.comunicacion.valor = e + a;
    this.system.bases.cultura.valor = m;
    this.system.bases.hechiceria.valor = Math.round((m + e) / 3); // si uso floor los personajes normales salen con base 3, muy bajo
    this.system.bases.percepcion.valor = Math.floor((m + e) / 2);
    this.system.bases.vigor.valor = c;
    this.system.bases.tecnica.valor = Math.floor((m + c) / 2); // igual que percepcion pero con cuerpo en vez de espiritu
  }

  updateSalud() {
    const cuerpo = this.system.caracteristicas.cuerpo?.valor ?? 5;
    const tamano = this.system.caracteristicas.tamano?.valor ?? 0;
    const pvMax = cuerpo + tamano + 10;
    this.system.salud.pvMax.valor = pvMax;
    this.system.salud.pvRagunos.valor = Math.round(pvMax / 5);     // Umbrales de herida
    this.system.salud.pvLeve.valor = Math.round(pvMax * 2 / 5);
    this.system.salud.pvGrave.valor = pvMax - 1;
  }

  calcMD() {
    const fuerza = this.system.derivadas.fuerza.valor ?? 3;
    const md1m = Math.round(fuerza / 3);
    let md2m;
    if (md1m >= 10) {
      md2m = md1m + 3;
    } else if (md1m >= 5) {
      md2m = md1m + 2;
    } else {
      md2m = md1m + 1;
    }
    this.system.derivadas.mDano1m.valor = md1m;
    this.system.derivadas.mDano2m.valor = md2m;
  }

  _calcularEstorbo() {
      const carga = this.items.reduce((total, item) => {
      const c = item.system.carga ?? 0;
      return total + (c >= 0.3 ? c : 0); // Carga menor de 0.3 no cuenta
    }, 0);
    this.system.carga.valor = Math.round(carga * 10) / 10;

    const fuerza = this.system.derivadas.fuerza.valor ?? 3;
       if      (carga <= fuerza)     this.system.estorbo.valor = 0;
    else if (carga <= fuerza * 2) this.system.estorbo.valor = 2;
    else                          this.system.estorbo.valor = 4;

    if (carga > fuerza * 3) this.system.salud.debilitado = true;
    if (carga > fuerza * 4) this.system.salud.incapacitado = true;
  }

  updatePM() {   
    const espiritu = this.system.caracteristicas?.espiritu?.valor ?? 5;
    this.system.hechiceria.pmMax = espiritu * 2;
  }

  _calcularFortuna() {   
    const espiritu = this.system.caracteristicas?.espiritu?.valor ?? 5;
    this.system.fortuna.max = espiritu;
  }

  // Habillidad de Primeros Auxilios. Tiene distinto diálogo que otras habilidades
  async tirarHabilidad(clave) {
    if (clave === "primerosAuxilios") return this.intentarPrimerosAuxilios();
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const habilidad = this.system.habilidades?.[clave];
    if (!habilidad) return;


    if (TQActor.HABILIDADES_ESPECIALIZADAS.has(clave) && (habilidad.nivel ?? 0) === 0) {  //  Examinar que pasa con las que no me lo muestra
           const etiqueta = habilidad.nombre && clave.startsWith("idioma")
        ? habilidad.nombre
        : (game.i18n.localize(`TQ.Habilidades.${clave}`) || clave);
      return ui.notifications.warn(`${etiqueta} es una habilidad especializada (E). Necesitas al menos Nivel 1 para intentarla.`);
    }

    const base = this.system.bases[habilidad.base]?.valor ?? 0;
    const multiplicacionEstorbo = habilidad.estorbo ?? 0;
    const penalizacionEstorbo = (this.system.estorbo?.valor ?? 0) * multiplicacionEstorbo;
    const total = base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) - penalizacionEstorbo;
    const etiqueta = (habilidad.nombre && clave.startsWith("idioma"))
      ? habilidad.nombre
      : game.i18n.localize(`TQ.Habilidades.${clave}`);


    const resultado = await TQRoll.dialogoTirada(etiqueta, total, { actor: this, habClave: clave });
    // solo marca una vez por sesión
    if (resultado && resultado.exitos >= 0 && !habilidad.exito) {
      await this.update({ [`system.habilidades.${clave}.exito`]: true });
    }
    return resultado;
  }

  async alternarExitoHabilidad(clave) {   /** Ojo. Sin esto no se pueden marcar/desmarcar manualmente */
    const habilidad = this.system.habilidades?.[clave];
    if (!habilidad) return;
    await this.update({ [`system.habilidades.${clave}.exito`]: !habilidad.exito });
  }

  async tirarCaracteristica(clave) {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const valor = this.system.caracteristicas[clave]?.valor
 ?? this.system.derivadas[clave]?.valor ?? 0;
    const etiqueta = game.i18n.localize(`TQ.Caracteristicas.${clave}`);
    return TQRoll.dialogoTirada(etiqueta, valor, { actor: this });
  }

  async tirarArma(itemId) {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const arma = this.items.get(itemId);
    if (!arma) return;

    const habClave = arma.system.habilidad;
    const habilidad = this.system.habilidades?.[habClave];
    const manos = arma.system.manos ?? "1m";

    const modo = (arma.system.alcance === "contacto") ? "melee" : "distancia";
    const sumaMD = arma.system.alcance === "contacto" || arma.system.alcance === "arrojadiza";
    const md = !sumaMD ? 0
      : (manos === "2m") ? (this.system.derivadas?.mDano2m?.valor ?? 0)
      : (this.system.derivadas?.mDano1m?.valor ?? 0);

    let puntuacion = 0;
    if (habilidad) {
      const base = this.system.bases[habilidad.base]?.valor ?? 0;
      const multiplicacionEstorbo = habilidad.estorbo ?? 0;
      puntuacion = base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) - (this.system.estorbo?.valor ?? 0) * multiplicacionEstorbo;
    }

    if (TQActor.HABILIDADES_ESPECIALIZADAS.has(habClave) && (habilidad?.nivel ?? 0) === 0) {
      return ui.notifications.warn(`${arma.name} es una habilidad especializada (E). Necesitas al menos Nivel 1 para usarla.`);
    }

    const targetActor = game.user.targets.first()?.actor ?? null;

    const resultado = await TQRoll.dialogoTirada(arma.name, puntuacion, {
      actor: this,
      targetActor,
      modo,
      esCombate: true,
      longitudArma: arma.system.longitud ?? "media",
      habClave,
      extraTopes: arma.system.alcance === "arrojadiza" ? ["lanzar"] : [],
      danho: {
        danoArma: arma.system.danoArma ?? "0",
        tipo: arma.system.tipo ?? "cortante",
        md,
        manos,
        noLetal: arma.system.noLetal ?? false
      }
    });

    // El éxito en la tirada con el arma es como el éxito en la tirada de la habilidad relacionada
    if (resultado && resultado.exitos >= 0 && habilidad && !habilidad.exito) {
      await this.update({ [`system.habilidades.${habClave}.exito`]: true });
    }

    return resultado;
  }

  async intentarIntervencionDivina(itemId) {
    const pacto = this.items.get(itemId);
    if (!pacto) return;
    const puntuacion = pacto.system.espirituConsagrado ?? 0;
    const religion = pacto.system.religion ?? "caos";
    const plealtad = this.system.lealtad?.[religion] ?? 0;
    let dificultad = 18;
    if (plealtad >= 75) dificultad = 9;
    else if (plealtad >= 50) dificultad = 12;
    else if (plealtad >= 25) dificultad = 15;

    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const resultado = await TQRoll.dialogoTirada(`Intervención: ${pacto.name}`, puntuacion, { dificultadFija: dificultad });
    if (!resultado) return;

    const exito = resultado.exitos > 0;
    const coste = exito ? 20 : 10;
    const nuevoPL = Math.max(0, plealtad - coste);
    await this.update({ [`system.lealtad.${religion}`]: nuevoPL });
    ui.notifications.info(`Intervención ${exito ? "exitosa" : "fallida"}: −${coste} PL en ${religion} (quedan ${nuevoPL}).`);
  }

  async aplicarFinSesion() { // Los efectos de fin de sesión ¿sea plican así?
    const actitud = this.system.actitudDivina;
    const lealtad = this.system.lealtad ?? {};
    const religiones = ["caos", "ley", "elementos", "antepasados"];
        const mayorReligion = religiones.reduce((a, b) => (lealtad[a] ?? 0) >= (lealtad[b] ?? 0) ? a : b);
    const plActual = lealtad[mayorReligion] ?? 0;

    if (actitud === "servicial") {
      await this.update({ [`system.lealtad.${mayorReligion}`]: plActual + 2 });
      ui.notifications.info(`Servicial: +2 PL en ${mayorReligion} (total: ${plActual + 2}).`);

    } else if (actitud === "atemorizado") {
      const fortuna = this.system.fortuna;
      const { DialogV2 } = foundry.applications.api;
      const dir = await DialogV2.confirm({
        window: { title: "Atemorizado — Fin de sesión" },
        content: `<p>¿Canjear 3 PL por 1 Fortuna, o 1 Fortuna por 3 PL?</p>`,
        yes: { label: "3 PL → 1 Fortuna", icon: "" },
        no:  { label: "1 Fortuna → 3 PL", icon: "" }
      });
      if (dir === true && plActual >= 3) {
        await this.update({
          [`system.lealtad.${mayorReligion}`]: plActual - 3,
          "system.fortuna.actual": Math.min(fortuna.actual + 1, fortuna.max)
        });
        ui.notifications.info("Atemorizado: −3 PL, +1 Fortuna.");
      } else if (dir === false && fortuna.actual >= 1) {
        await this.update({
          [`system.lealtad.${mayorReligion}`]: plActual + 3,
          "system.fortuna.actual": fortuna.actual - 1
        });
        ui.notifications.info("Atemorizado: −1 Fortuna, +3 PL.");
      }

    } else if (actitud === "pragmatico") {
      if (plActual < 3) return ui.notifications.warn("No tienes 3 PL para gastar.");
      await this.update({ [`system.lealtad.${mayorReligion}`]: plActual - 3 });
      ui.notifications.info("Pragmático: −3 PL. Anota +1 PE extra en una habilidad marcada.");

    } else if (actitud === "rebelde") {
      const { DialogV2 } = foundry.applications.api;
      const dir = await DialogV2.confirm({
        window: { title: "Rebelde — Fin de sesión" },
        content: `<p>¿Reducir 20 PL para ganar 1 Destino, o gastar 1 Destino para ganar 20 PL?</p>`,
        yes: { label: "20 PL → 1 Destino", icon: "" },
        no:  { label: "1 Destino → 20 PL", icon: "" }
      });
      const destino = this.system.destino;
      if (dir === true && plActual >= 20) {
        await this.update({
          [`system.lealtad.${mayorReligion}`]: plActual - 20,
          "system.destino.actual": Math.min(destino.actual + 1, destino.max)
        });
        ui.notifications.info("Rebelde: −20 PL, +1 Destino.");
      } else if (dir === false && destino.actual >= 1) {
        await this.update({
          [`system.lealtad.${mayorReligion}`]: plActual + 20,
          "system.destino.actual": destino.actual - 1
        });
        ui.notifications.info("Rebelde: −1 Destino, +20 PL.");
      }

    } else if (actitud === "indiferente") {
      const { DialogV2 } = foundry.applications.api;
      const html = `
        <div style="display:grid;gap:6px;padding:4px;">
          <div><label>Origen</label>
            <select id="tq-id-origen">
              ${religiones.map(r => `<option value="${r}">${r} (${lealtad[r] ?? 0} PL)</option>`).join("")}
            </select></div>
          <div><label>Destino</label>
            <select id="tq-id-destino">
              ${religiones.map(r => `<option value="${r}">${r}</option>`).join("")}
            </select></div>
          <div><label>Cantidad (máx. 3)</label>
            <input type="number" id="tq-id-cantidad" value="1" min="1" max="3" /></div> 
        </div>`;           // ¿Qué cojones?¿Seguro?
      const result = await DialogV2.prompt({
        window: { title: "Indiferente — Transferir PL" },
        content: html,
        ok: { label: "Transferir", callback: (_ev, btn) => {
          const f = btn.form ?? btn.closest("form");
          return {
            origen:   document.getElementById("tq-id-origen").value,
            destino:  document.getElementById("tq-id-destino").value,
            cantidad: Math.min(3, Math.max(1, parseInt(document.getElementById("tq-id-cantidad").value) || 1))
          };
        }}
      });
      if (!result || result.origen === result.destino) return;
      const plOrigen = lealtad[result.origen] ?? 0;
      const cant = Math.min(result.cantidad, plOrigen);
      await this.update({
        [`system.lealtad.${result.origen}`]:  plOrigen - cant,
        [`system.lealtad.${result.destino}`]: (lealtad[result.destino] ?? 0) + cant
      });
      ui.notifications.info(`Indiferente: transferidos ${cant} PL de ${result.origen} a ${result.destino}.`);
    }
  }

  async activarBendicion(itemId) {
    const bend = this.items.get(itemId);
    if (!bend) return;
    const pm = bend.system.pmCoste ?? 0;
    const pmActual = this.system.hechiceria?.pmActual ?? 0;
    if (pmActual < pm) {
      return ui.notifications.warn(`No tienes suficientes PM (necesitas ${pm}).`);
    }
    if (pm > 0) await this.update({ "system.hechiceria.pmActual": pmActual - pm });
    await this._efectoBendicion(bend);
  }

  async _efectoBendicion(bend) {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const espiritu = this.system.caracteristicas?.espiritu?.valor ?? 0;
    const half = Math.floor(espiritu / 2);

    const chat = async (desc) => ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<div class="tq-bendicion-msg"><strong>${bend.name}</strong><p>${desc}</p></div>`
    });

    switch (bend.name) {
      case "Afinidad con el Mar":
        await chat(`Tirada de Nadar o Navegar superada automáticamente. <strong>${espiritu} puntos de éxito</strong>.`);
        break;

      case "Aura de Santidad":
        await chat(`Aura activa durante esta conversación. <strong>+3 a todas las habilidades de Comunicación</strong> para convencer a los presentes.`);
        break;

      case "Aura de Sexualidad":
        await chat(`Aura de sexualidad activa durante esta escena. Quienes sean susceptibles de sentirse atraídos quedarán influenciados.`);
        break;

      case "Esquiva Milagrosa":
        await chat(`Bono a Esquivar activo durante este turno: <strong>+${half}</strong>.`);
        break;

      case "Golpe Poderoso":
        await chat(`¡Invoca el poder de su dios! Si el próximo golpe conecta, el daño se incrementa en <strong>+${half}</strong>.`);
        break;

      case "Infundir Calma":
        await chat(`Calma infundida. El objetivo queda libre de terror, furia o estado mental alterado.`);
        break;

      case "Inspiración":
        await chat(`Inspiración divina. Bono de <strong>+${espiritu}</strong> a la tirada de artesanía, arte u obra de creación.`);
        break;

      case "Invocar Horda": {
        const roll = await new Roll("1d6").evaluate();
        await roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: `${bend.name} — criaturas extra`
        });
        break;
      }

      case "Letalidad":
        await chat(`Letalidad activa. La próxima herida grave infligida <strong>mata al enemigo</strong>. Declarar antes de la tirada.`);
        break;

      case "Respeto de los Demonios": {
        const { DialogV2 } = foundry.applications.api;
        const espirituDemonio = await DialogV2.prompt({
          window: { title: "Respeto de los Demonios" },
          content: `<p>Espíritu del demonio (= dificultad de la tirada):</p>
                    <input type="number" id="tq-rd-esp" value="5" min="1" style="width:60px;"/>`,
          ok: { label: "Tirar Imponerse", callback: () =>
            parseInt(document.getElementById("tq-rd-esp").value) || 5
          }
        });
        if (espirituDemonio == null) break;
        const habilidad = this.system.habilidades?.imponerse;
        const base = habilidad ? (this.system.bases[habilidad.base]?.valor ?? 0) : 0;
        const puntuacion = habilidad ? base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) : 0;
        await TQRoll.dialogoTirada("Imponerse (Respeto de los Demonios)", puntuacion, { dificultadFija: espirituDemonio });
        break;
      }

      case "Restablecimiento Corporal": {
        const pvMax = this.system.salud?.pvMax?.valor ?? 0;
        await this.update({ "system.salud.pvActual": pvMax });
        await chat(`¡El cuerpo queda restablecido! PV restaurados a <strong>${pvMax}</strong>. (Uso único — elimina esta bendición si ya fue empleada.)`);
        break;
      }

      case "Sentir Adversario":
        await chat(`Percibes el alineamiento espiritual del objetivo. Sabrás si está alineado con la Ley o el Caos, o cuál de las dos fuerzas predomina en él.`);
        break;

      case "Sentir Millón de Mundos": {
        const habilidad = this.system.habilidades?.multiverso;
        const base = habilidad ? (this.system.bases[habilidad.base]?.valor ?? 0) : 0;
        const puntuacion = habilidad ? base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) : 0;
        await TQRoll.dialogoTirada("Multiverso (Pliegue entre planos)", puntuacion, { dificultadFija: 20 });
        break;
      }

      case "Verdad Incuestionable":
        await chat(`La verdad ha sido pronunciada. Todos los presentes que la hayan oído la creerán a pies juntillas durante <strong>una hora</strong>.`);
        break;

      default:
        await chat(bend.system.efecto);
        break;
    }
  }

  async cambiarLealtadPorPM() {
    const lealtad = this.system.lealtad ?? {};
    const religiones = ["caos", "ley", "elementos", "antepasados"];
    const { DialogV2 } = foundry.applications.api;
    const html = `
      <div style="display:grid;gap:6px;padding:4px;">
        <div><label>Religión</label>
          <select id="tq-lpm-religion">
            ${religiones.map(r => `<option value="${r}">${r} (${lealtad[r] ?? 0} PL)</option>`).join("")}
          </select></div>
        <div><label>Cantidad de PL a convertir</label>
          <input type="number" id="tq-lpm-cantidad" value="1" min="1" /></div>
      </div>`;
    const result = await DialogV2.prompt({
      window: { title: "Cambiar Lealtad por PM" },
      content: html,
      ok: { label: "Convertir", callback: () => ({
        religion: document.getElementById("tq-lpm-religion").value,
        cantidad: Math.max(1, parseInt(document.getElementById("tq-lpm-cantidad").value) || 1)
      })}
    });
    if (!result) return;
    const plActual = lealtad[result.religion] ?? 0;
    const cant = Math.min(result.cantidad, plActual);
    const pmActual = this.system.hechiceria?.pmActual ?? 0;
    const pmMax = this.system.hechiceria?.pmMax ?? 0;
    const pmNuevo = Math.min(pmActual + cant, pmMax);
    await this.update({
      [`system.lealtad.${result.religion}`]: plActual - cant,
      "system.hechiceria.pmActual": pmNuevo
    });
    ui.notifications.info(`Convertidos ${cant} PL de ${result.religion} en ${pmNuevo - pmActual} PM.`);
  }

  async lanzarHechizo(itemId) {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const { tirarComplicacion, TABLA_COMPLICACIONES_MAGIA } = await import("../tablas/TQTablasSucesos.mjs");
    const { DialogV2 } = foundry.applications.api;

    const hechizo = this.items.get(itemId);
    if (!hechizo) return;

    const baseHech = this.system.bases?.hechiceria?.valor ?? 0;
    const verbos = this.system.hechiceria?.verbos ?? {};
    const esferas = this.system.hechiceria?.esferas ?? {};
    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    const claves = [];
    if (hechizo.system.verbo)  claves.push(norm(hechizo.system.verbo));
    if (hechizo.system.esfera) claves.push(norm(hechizo.system.esfera));
       if (!claves.length && hechizo.system.sintaxis) {  // Si el hechizo no tiene verbo/esfera explícitos, entonces se usa el campo sintaxis separado por comas.
      claves.push(...hechizo.system.sintaxis.split(",").map(s => norm(s.trim())).filter(Boolean));
    }
    const niveles = claves.map(c => verbos[c] ?? esferas[c] ?? 0);
    const puntuacion = niveles.length ? baseHech + Math.min(...niveles) : baseHech;

    const dif = hechizo.system.dificultad ?? 15;
    let pmBase = 4;
    if (dif <= 10) pmBase = 1;
    else if (dif <= 15) pmBase = 2;
    else if (dif <= 20) pmBase = 3;
    const pmMin = hechizo.system.pmCoste ?? pmBase;
    const pmMax = (hechizo.system.pmMax ?? 0) > pmMin ? hechizo.system.pmMax : 0; // si no supera pmMin no tiene sentido ofrecerlo
    const pmActual = this.system.hechiceria?.pmActual ?? 0;
    const pmMaxTotal = this.system.hechiceria?.pmMax ?? 0;

    const contenidoDialogo = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/lanzar-hechizo.hbs",
      { hechizo, puntuacion, dif, pmBase, pmMin, pmMax, pmVariable: pmMax > 0, pmActual, pmMaxTotal }
    );

    const config = await DialogV2.wait({
      window: { title: `Lanzar: ${hechizo.name}`, width: 420 },
      classes: ["lh-dialog-window"],
      content: contenidoDialogo,
      rejectClose: false,
      buttons: [
        {
          action: "lanzar",
          label: "Lanzar hechizo",
          default: true,
          callback: (_ev, button) => {
            const f = button.form.elements;
            return {
              pmElegido: parseInt(f.pmElegido?.value) || pmMin,
              blancos:   Math.max(1, parseInt(f.blancos?.value) || 1),
              duracion:  f.duracion?.value   || "standard",
              ceremonia: f.ceremonia?.checked ?? false,
              grimorio:  f.grimorio?.checked ?? false,
              acelerar:  f.acelerar?.checked ?? false,
              limFisica: parseInt(f.limFisica?.value) || 0
            };
          }
        },
        { action: "cancelar", label: "Cancelar" }
      ]
    });
    if (!config) return;

    let mod = 0;
    if (config.ceremonia) mod += 2;
    if (config.grimorio)  mod += 2;
    if (config.acelerar)  mod -= 2;
    mod += config.limFisica; // 0, -1 o -2

    const dolorExtremo = this.system.salud?.dolorExtremo ?? false;
    if (dolorExtremo) mod -= 2;

    // Usar d6 por delibitado
    const debilitado = this.system.salud?.debilitado ?? false;
    const dadoSize = debilitado ? 6 : 10;

    const { dado, total: dadoTotal, tiradas } = await TQRoll._tirarExplosivo(dadoSize);
    const total = dadoTotal + puntuacion + mod;
    const exitos = total - dif;
    const resultado = TQRoll._clasificarResultado(dado, exitos);
    const fallo = exitos < 0;

    let costePM = fallo ? 1 : config.pmElegido;
    if (!fallo) {
        if (config.blancos > 1) costePM += (config.blancos - 1) * pmBase;     // Tantos PM del hechizo como blancos extra
      if (config.duracion === "minutos") costePM += 1;
      if (config.duracion === "horas")   costePM += 2;
    }

    // Crítico: elige beneficio
    let bonusEspiritu = 0;
    if (!fallo && exitos >= 10) {
      const beneficio = await DialogV2.wait({
        window: { title: "¡Éxito crítico! — Elige beneficio", width: 360 },
        content: `<p style="margin-bottom:8px;">Has obtenido <strong>${exitos} puntos de éxito</strong>. Elige un beneficio:</p>
          <select name="beneficio" style="width:100%;font-size:12px;">
            <option value="ahorrar">Ahorrarse 1 PM</option>
            <option value="blanco">Añadir un blanco extra gratis</option>
            <option value="potencia">Aumentar potencia o duración</option>
            <option value="espiritu">+2 a la Lucha de Espíritu</option>
          </select>`,
        rejectClose: false,
        buttons: [{
          action: "elegir", label: "Confirmar", default: true,
          callback: (_ev, b) => b.form.elements.beneficio.value
        }]
      });
      if (beneficio === "ahorrar")   costePM = Math.max(1, costePM - 1);
      if (beneficio === "espiritu")  bonusEspiritu = 2;
    }

    const minVal = niveles.length ? Math.min(...niveles) : 0;
    const desgloseHechizo = niveles.length ? {
      base: baseHech,
      skills: claves.map((c, i) => {
        const display =
          (hechizo.system.verbo  && norm(hechizo.system.verbo)  === c) ? hechizo.system.verbo  :
          (hechizo.system.esfera && norm(hechizo.system.esfera) === c) ? hechizo.system.esfera :
          c;
        return { nombre: display, valor: niveles[i], esMinimo: niveles[i] === minVal, puntuacion: baseHech + niveles[i] };
      })
    } : null;

    const modDesglose = [];
    if (config.ceremonia)      modDesglose.push({ label: "Ceremonia",     valor:  2 });
    if (config.grimorio)       modDesglose.push({ label: "Grimorio",       valor:  2 });
    if (config.acelerar)       modDesglose.push({ label: "Acelerar",       valor: -2 });
    if (config.limFisica < 0)  modDesglose.push({ label: "Lim. física",   valor: config.limFisica });
    if (dolorExtremo)          modDesglose.push({ label: "Dolor extremo",  valor: -2 });

    const datosChat = {
      etiqueta: hechizo.name,
      puntuacion, bonificador: mod, dificultad: dif,
      debilitado, dolorExtremo,
      dado: dadoTotal, dadoDisplay: TQRoll._dadoDisplay(dadoTotal, tiradas),
      total, exitos, resultado, css: resultado.css,
      pd: null,
      desgloseHechizo, modDesglose
    };
    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs",
      datosChat
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: contenido
    });

    const pmNuevo = pmActual - costePM;
    if (pmNuevo >= 0) {
      await this.update({ "system.hechiceria.pmActual": pmNuevo });
      if (pmNuevo === 0) { // Aplicación del Agotamiento Espiritual.
        await this.update({ "system.salud.debilitado": true });
        ui.notifications.warn(`${this.name} ha quedado Debilitado por agotamiento mágico.`);
      } else {
        ui.notifications.info(`${hechizo.name}: −${costePM} PM → quedan ${pmNuevo}/${pmMaxTotal}.`);
      }
    } else {
      // exceso de PM se convierte en daño físico
      const danhoMagico = Math.abs(pmNuevo);
      await this.update({ "system.hechiceria.pmActual": 0, "system.salud.debilitado": true });
      await this.recibirDanho(danhoMagico, danhoMagico);
      ui.notifications.error(`Agotamiento mágico extremo: ${this.name} recibe ${danhoMagico} PD.`);
    }

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MAGIA, this);
    }

    if (!fallo && hechizo.system.requiereTiradaEspiritu) {
      await this._luchaDeEspiritu(hechizo.name, bonusEspiritu);
    }
  }

  async _luchaDeEspiritu(nombreHechizo, bonusCaster = 0) {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const targetActor = game.user.targets.first()?.actor;
    if (!targetActor) {
      ui.notifications.warn("Selecciona un objetivo para la Lucha de Espíritu.");
      return false;
    }
    const espirituAtacante = this.system.caracteristicas?.espiritu?.valor ?? 0;
    const espirituObjetivo = targetActor.system.caracteristicas?.espiritu?.valor ?? 0;
    const { total: dadoAtacante } = await TQRoll._tirarExplosivo(10);
    const { total: dadoObjetivo } = await TQRoll._tirarExplosivo(10);
    const totalAtacante = dadoAtacante + espirituAtacante + bonusCaster;
    const totalObjetivo = dadoObjetivo + espirituObjetivo;
    const gana = totalAtacante > totalObjetivo; // empate cuenta como fallo del atacante, igual que en combate normal

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `Lucha de Espíritu — ${nombreHechizo} vs ${targetActor.name}`,
      content: `<div class="tq-result-card ${gana ? "exito" : "fallo"}">
        <div class="tq-resultado-label">${gana ? "Hechizo surte efecto" : "Objetivo resiste"}</div>
        <div class="tq-desglose">
          ${this.name}: ${dadoAtacante} + ${espirituAtacante}(Esp)${bonusCaster ? ` + ${bonusCaster}(crít.)` : ""} = <strong>${totalAtacante}</strong><br>
          ${targetActor.name}: ${dadoObjetivo} + ${espirituObjetivo}(Esp) = <strong>${totalObjetivo}</strong>
        </div>
      </div>`
    });
    if (!gana) ui.notifications.warn(`${targetActor.name} resiste — ${nombreHechizo} no tiene efecto.`);
    return gana;
  }

  // recuperación por sueño, la habilidad Sueños dobla el ritmo
  async recuperarPM() {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const { DialogV2 } = foundry.applications.api;

    const result = await DialogV2.wait({
      window: { title: "Recuperar Puntos de Magia" },
      content: `<div style="display:grid;gap:8px;padding:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <label>Horas de sueño</label>
          <input type="number" name="horas" value="8" min="1" style="width:60px;" />
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" name="lanzarSuenos" id="tq-tirar-suenos" />
          <label for="tq-tirar-suenos">Intentar tirada de Sueños (Dif 15)</label>
        </div>
      </div>`,
      rejectClose: false,
      buttons: [
        {
          action: "ok",
          label: "Recuperar",
          default: true,
          callback: (_ev, btn) => {
            const f = btn.form.elements;
            return {
              horas: parseInt(f.horas?.value) || 1,
              lanzarSuenos: f.lanzarSuenos?.checked ?? false
            };
          }
        },
        { action: "cancelar", label: "Cancelar" }
      ]
    });
    if (!result) return;

    const { horas, lanzarSuenos } = result;
    const pmActual = this.system.hechiceria?.pmActual ?? 0;
    const pmMax = this.system.hechiceria?.pmMax ?? 0;

    let pmRecuperado = Math.floor(horas / 2);

    if (lanzarSuenos) {
        const habilidad = this.system.habilidades?.suenos;
      const base = habilidad ? (this.system.bases[habilidad.base]?.valor ?? 0) : 0;
      const puntuacion = habilidad ? base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) : 0;
      const resultado = await TQRoll.tirar("Sueños", puntuacion, 15, { actor: this, flavor: "Recuperación de PM" });
      if (resultado.exitos >= 0) pmRecuperado = horas;
    }

    const pmNuevo = Math.min(pmActual + pmRecuperado, pmMax);
    await this.update({ "system.hechiceria.pmActual": pmNuevo });
    ui.notifications.info(`Recuperados ${pmNuevo - pmActual} PM tras ${horas}h de sueño (quedan ${pmNuevo}/${pmMax}).`);
  }


  async recibirDanho(pd, pdBruto) {
    const { DialogV2 } = foundry.applications.api;
    const salud = this.system.salud;
    const fortuna = this.system.fortuna;
    const pvMax = salud.pvMax?.valor ?? 0;
    const pvActual = salud.pvActual?.valor ?? 0;

    let pdFinal = pd;
    // solo se ofrece si tiene 2+ Fortuna, con 1 no merece la pena el diálogo
    if ((fortuna?.actual ?? 0) >= 2) {
      const gastar = await DialogV2.confirm({
        window: { title: "¿Gastar Fortuna?" },
        content: `<p><strong>${this.name}</strong> recibe <strong>${pd} PD</strong>. ¿Gastar 2 Fortuna para reducir el daño a la mitad?</p>`,
        yes: { label: "Sí — gastar 2 Fortuna", icon: "" },
        no:  { label: "No", icon: "" }
      });
      if (gastar) {
        pdFinal = Math.ceil(pd / 2);
        await this.update({ "system.fortuna.actual": fortuna.actual - 2 });
        ui.notifications.info(`${this.name}: 2 Fortuna gastados. Daño reducido a ${pdFinal} PD.`);
      }
    }

    const pvResultante = pvActual - pdFinal;
    const updates = {};

    // daño bruto suficiente para matar en el acto
    if (pdBruto >= pvMax) {
      updates["system.salud.pvActual.valor"] = 0;
      updates["system.salud.muerto"] = true;
      updates["system.salud.incapacitado"] = true;
      await this.update(updates);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<div class="tq-result-card fallo"><div class="tq-resultado-label">☠ Herida Mortal</div><p>${this.name} ha sufrido una herida mortal (${pdBruto} PD vs ${pvMax} PV máx). Muere en el acto.</p></div>`
      });
      return;
    }

    updates["system.salud.pvActual.valor"] = pvResultante;

      const umbralHeridaGrave = Math.floor(pvMax / 2);
    const umbralHeridaLeve = Math.floor(umbralHeridaGrave / 2);
    if (pdFinal >= umbralHeridaGrave) {
      if (!salud.heridasGraves1)      updates["system.salud.heridasGraves1"] = true;
      else if (!salud.heridasGraves2) updates["system.salud.heridasGraves2"] = true;
    } else if (pdFinal >= umbralHeridaLeve) {
      if (!salud.heridasLeves1)      updates["system.salud.heridasLeves1"] = true;
      else if (!salud.heridasLeves2) updates["system.salud.heridasLeves2"] = true;
    }

    const leves1 = updates["system.salud.heridasLeves1"] ?? salud.heridasLeves1;
    const leves2 = updates["system.salud.heridasLeves2"] ?? salud.heridasLeves2;
    const graves1 = updates["system.salud.heridasGraves1"] ?? salud.heridasGraves1;
    const graves2 = updates["system.salud.heridasGraves2"] ?? salud.heridasGraves2;
    if ((leves1 && leves2) || graves1 || graves2)
      updates["system.salud.debilitado"] = true;

    if (pvResultante <= 0) {
      updates["system.salud.incapacitado"] = true;
      updates["system.salud.pvActual.valor"] = 0;

      if (pdFinal >= umbralHeridaGrave) {
        updates["system.salud.agonia"] = true;
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          content: `<div class="tq-result-card complicacion"><div class="tq-resultado-label">⚠ Agonía</div><p>${this.name} está en agonía. Pierde 1 PD por minuto hasta ser estabilizado (Primeros Auxilios Dif 20). Morirá cuando los PD acumulados igualen sus PV máximos (${pvMax}).</p></div>`
        });
      } else {
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          content: `<p><strong>${this.name}</strong> queda <em>Incapacitado</em> (0 PV).</p>`
        });
      }
    }

    await this.update(updates);
  }

  // Intento de Primeros Auxilios 
  async intentarPrimerosAuxilios() {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const { DialogV2 } = foundry.applications.api;
    const habilidad = this.system.habilidades?.primerosAuxilios;
    if (!habilidad) return;

    if ((habilidad.nivel ?? 0) === 0) {
      return ui.notifications.warn("Primeros Auxilios (E): necesitas Nivel 1 o superior para intentar procedimientos complejos.");
    }

    const base = this.system.bases[habilidad.base]?.valor ?? 0;
    const total = base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0);

    const targetActor = game.user.targets.first()?.actor ?? this;
    const esSelf = targetActor.id === this.id;

    const html = `
      <div style="display:grid;gap:8px;padding:4px;">
        <p style="margin:0"><strong>Tratando a:</strong> ${targetActor.name}</p>
        <p style="margin:0">Puntuación: <strong>${total}</strong></p>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="white-space:nowrap">Tipo de tratamiento</label>
          <select name="tipo" style="flex:1;">
            <option value="10">Rasguño (Dif. 10)</option>
            <option value="15" selected>Herida Leve (Dif. 15)</option>
            <option value="20">Herida Grave (Dif. 20)</option>
            <option value="20_agonia">Estabilizar Agonía (Dif. 20)</option>
            <option value="15_desangre">Detener Desangre (Dif. 15)</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" name="autocuracion" id="tq-pa-auto" ${esSelf ? "checked" : ""} />
          <label for="tq-pa-auto">Autocuración (−2 a la tirada)</label> <!-- se marca solo si te curas tú mismo -->
        </div>
      </div>`;

    const config = await DialogV2.wait({
      window: { title: "Primeros Auxilios", width: 380 },
      content: html,
      rejectClose: false,
      buttons: [
        {
          action: "tirar",
          label: "Tirar",
          default: true,
          callback: (_ev, button) => {
            const f = button.form.elements;
            return { tipo: f.tipo.value, autocuracion: f.autocuracion.checked };
          }
        },
        { action: "cancelar", label: "Cancelar" }
      ]
    });
    if (!config) return;

    const esAgonia = config.tipo === "20_agonia";
    const esDesangre = config.tipo === "15_desangre";
    const dificultad = esAgonia ? 20 : esDesangre ? 15 : parseInt(config.tipo);
    const bonificador = config.autocuracion ? -2 : 0;
    const etiqueta = esAgonia   ? "Primeros Auxilios (Estabilizar Agonía)"
                     : esDesangre ? "Primeros Auxilios (Detener Desangre)"
                     :              "Primeros Auxilios";

    const resultado = await TQRoll.tirar(etiqueta, total, dificultad, { actor: this, bonificador });
    if (!resultado) return;

    const exitos = resultado.exitos;
    const updates = {};

    if (exitos >= 0) {
      if (esAgonia) {
        updates["system.salud.agonia"] = false;
        ui.notifications.info(`${targetActor.name}: agonía estabilizada. Ya no pierde PD/minuto.`);
      } else if (esDesangre) {
        updates["system.salud.desangre"] = false;
        ui.notifications.info(`${targetActor.name}: desangre detenido.`);
      } else {
        const pdCritico = Math.floor(exitos / 10);
        const pdTotal = 1 + pdCritico;
        const pvActual = targetActor.system.salud?.pvActual?.valor ?? 0;
        const pvMax = targetActor.system.salud?.pvMax?.valor ?? 0;
        updates["system.salud.sanando"] = true;
        updates["system.salud.pvActual.valor"] = Math.min(pvActual + pdTotal, pvMax);
        const critico = pdCritico > 0 ? ` (+${pdCritico} PD por crítico)` : "";
        ui.notifications.info(`${targetActor.name}: +${pdTotal} PD curados${critico}. Herida marcada como "Sanando".`);
      }
      if (!habilidad.exito) await this.update({ "system.habilidades.primerosAuxilios.exito": true });
      if (Object.keys(updates).length) await targetActor.update(updates);
    } else {
      ui.notifications.warn(`Fallo en Primeros Auxilios. Si mañana la herida de ${targetActor.name} sigue sin "Sanando", deberá tirar Cuerpo para evitar infección.`);
    }
  }

  //Estabilización personaje
  async estabilizar() {
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    if (!this.system.salud?.agonia) return ui.notifications.warn(`${this.name} no está en agonía.`);
    const habilidad = this.system.habilidades?.primerosAuxilios;
    const base = habilidad ? (this.system.bases[habilidad.base]?.valor ?? 0) : 0;
    const puntuacion = habilidad ? base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) : 0;
    const resultado = await TQRoll.tirar("Primeros Auxilios (Estabilizar)", puntuacion, 20, { actor: this });
    if (resultado.exitos >= 0) {
      await this.update({ "system.salud.agonia": false });
      ui.notifications.info(`${this.name} estabilizado. La agonía se detiene.`);
    }
  }

  async _aplicarEntorno(entorno) {
    const updates = {};
    for (const { clave, bonus } of (entorno.system.habilidades ?? [])) {
      if (!clave || !bonus) continue;
      const habilidad = this.system.habilidades?.[clave];
      if (habilidad !== undefined)
        updates[`system.habilidades.${clave}.nivel`] = (habilidad.nivel ?? 0) + bonus;
    }
    await this.update(updates);
  }

  // Ojo esto, revisar a ver como está, porque aquí funciona bien pero en las especies no.
  async _revertirEntorno(entorno) {
    const updates = {};
    for (const { clave, bonus } of (entorno.system.habilidades ?? [])) {
      if (!clave || !bonus) continue;
      const habilidad = this.system.habilidades?.[clave];
      if (habilidad !== undefined)
        updates[`system.habilidades.${clave}.nivel`] = Math.max(0, (habilidad.nivel ?? 0) - bonus);
    }
    await this.update(updates);
  }

  async _aplicarProfesion(profesion) {
    const updates = { "system.profesion": profesion.name };

    for (const { clave, bonus } of (profesion.system.habilidades ?? [])) {
      if (!clave || !bonus) continue;
      const habilidad = this.system.habilidades?.[clave];
      if (habilidad !== undefined) {
        updates[`system.habilidades.${clave}.nivel`] = (habilidad.nivel ?? 0) + bonus;
      }
    }
    await this.update(updates);

    for (const v of (profesion.system.ventajas ?? [])) {
      await Item.create({
        name: v.nombre,
        type: "ventaja",
        system: { coste: v.coste ?? 0, tipo: v.tipo ?? "ventaja", efecto: v.efecto ?? "", fuente: "profesion" }
      }, { parent: this });
    }
  }

  // Mismo del anterior
  async _revertirProfesion(profesion) {
    const updates = { "system.profesion": "" };

    for (const { clave, bonus } of (profesion.system.habilidades ?? [])) {
      if (!clave || !bonus) continue;
      const habilidad = this.system.habilidades?.[clave];
      if (habilidad !== undefined) {
        updates[`system.habilidades.${clave}.nivel`] = Math.max(0, (habilidad.nivel ?? 0) - bonus);
      }
    }
    await this.update(updates);

    const ventajasProf = this.items.filter(i => i.type === "ventaja" && i.system.fuente === "profesion");
    for (const v of ventajasProf) await v.delete();
  }

  async _aplicarOrigen(origen) {
    const updates = {};

    if (origen.system.idiomaNoativo) {
      updates["system.idiomaNoativo"] = origen.system.idiomaNoativo;
      updates["system.habilidades.idioma1.nombre"] = origen.system.idiomaNoativo;
    }

    if (origen.system.religion) {
      updates["system.religion"] = origen.system.religion;
    }

    if (origen.system.ppBonus) {
      updates["system.puntosPP"] = (this.system.puntosPP ?? 0) + origen.system.ppBonus;
    }

    for (const { clave, bonus, nombre } of (origen.system.habilidades ?? [])) {
      if (!clave || !bonus) continue;
      const nivel = this.system.habilidades?.[clave]?.nivel ?? 0;
      updates[`system.habilidades.${clave}.nivel`] = nivel + bonus;
      if (nombre && clave.startsWith("idioma")) {
        updates[`system.habilidades.${clave}.nombre`] = nombre;
      }
    }

    await this.update(updates);
  }

  async _revertirOrigen(origen) {
    const updates = {};

    if (origen.system.idiomaNoativo) {
      updates["system.idiomaNoativo"] = "";
      if (this.system.habilidades?.idioma1?.nombre === origen.system.idiomaNoativo) {
        updates["system.habilidades.idioma1.nombre"] = "";
      }
    }

    if (origen.system.religion) {
      updates["system.religion"] = "";
    }

    if (origen.system.ppBonus) {
      updates["system.puntosPP"] = Math.max(0, (this.system.puntosPP ?? 0) - origen.system.ppBonus);
    }

    for (const { clave, bonus, nombre } of (origen.system.habilidades ?? [])) {
      if (!clave || !bonus) continue;
      const nivel = this.system.habilidades?.[clave]?.nivel ?? 0;
      updates[`system.habilidades.${clave}.nivel`] = Math.max(0, nivel - bonus);
      if (nombre && clave.startsWith("idioma")) {
        updates[`system.habilidades.${clave}.nombre`] = "";
      }
    }

    await this.update(updates);
  }

  async _aplicarEspecie(especie) {
    const updates = {};

    const ppActual = this.system.puntosPP ?? 0;
    updates["system.puntosPP"] = ppActual - (especie.system.costePP ?? 0);

    if (especie.system.bonusCuerpo)   updates["system.caracteristicas.cuerpo.valor"] = Math.min(9, (this.system.caracteristicas?.cuerpo?.valor ?? 5) + especie.system.bonusCuerpo);
    if (especie.system.bonusMente)    updates["system.caracteristicas.mente.valor"] = Math.min(9, (this.system.caracteristicas?.mente?.valor ?? 5) + especie.system.bonusMente);
    if (especie.system.bonusEspiritu) updates["system.caracteristicas.espiritu.valor"] = Math.min(9, (this.system.caracteristicas?.espiritu?.valor ?? 5) + especie.system.bonusEspiritu);

    await this.update(updates);
    ui.notifications.info(`Especie "${especie.name}" aplicada. −${especie.system.costePP} PP.`);
  }

  async _revertirEspecie(especie) {
    const updates = {};

    updates["system.puntosPP"] = (this.system.puntosPP ?? 0) + (especie.system.costePP ?? 0);

    if (especie.system.bonusCuerpo)   updates["system.caracteristicas.cuerpo.valor"] = (this.system.caracteristicas?.cuerpo?.valor ?? 5) - especie.system.bonusCuerpo;
    if (especie.system.bonusMente)    updates["system.caracteristicas.mente.valor"] = (this.system.caracteristicas?.mente?.valor ?? 5) - especie.system.bonusMente;
    if (especie.system.bonusEspiritu) updates["system.caracteristicas.espiritu.valor"] = (this.system.caracteristicas?.espiritu?.valor ?? 5) - especie.system.bonusEspiritu;

    await this.update(updates);
    ui.notifications.info(`Especie "${especie.name}" retirada. +${especie.system.costePP} PP restaurados.`);
  }

  async tirarLesion() {
    const LESIONES = [
      null, // índice 0 no usado
      { min: 1,  max: 4,  titulo: "Pierna o pata inutilizada",   tipos: "todas",
        efecto: "La pierna queda inutilizada. El herido cae al suelo y solo puede desplazarse arrastrándose. Si el arma es <em>cortante</em>, añade efecto de <strong>Desangre</strong>." },
      { min: 5,  max: 8,  titulo: "Brazo o miembro inutilizado",  tipos: "todas",
        efecto: "El brazo queda inutilizado y suelta lo que sostenía. Si el arma es <em>cortante</em>, añade efecto de <strong>Desangre</strong>." },
      { min: 9,  max: 10, titulo: "Conmoción cerebral",           tipos: "contundentes y cortantes",
        efecto: "Hemorragia interna en el cerebro. El herido tira <strong>Cuerpo</strong> a dificultad igual a la magnitud de la herida para no quedar <strong>Incapacitado</strong>." },
      { min: 11, max: 12, titulo: "Herida profunda",              tipos: "penetrantes y cortantes",
        efecto: "El arma se hunde alcanzando órganos internos. Suma <strong>1d3</strong> al daño. Si el arma es <em>penetrante</em>, queda clavada." },
      { min: 13, max: 14, titulo: "Deformación facial",           tipos: "todas",
        efecto: "El arma quiebra la mandíbula, cercena la nariz o marca el rostro. La víctima pierde <strong>1 punto de Atractivo</strong> (mínimo −3)." },
      { min: 15, max: 17, titulo: "Desangre",                     tipos: "cortantes y desgarradoras",
        efecto: "El arma alcanza las vísceras o un vaso sanguíneo importante. La víctima recibe una herida de <strong>Desangre</strong> (1 PD/turno hasta ser tratada con Primeros Auxilios dif. 15)." },
      { min: 18, max: 19, titulo: "Dolor extremo",                tipos: "todas",
        efecto: "El golpe es tan doloroso que el herido sufre <strong>−2</strong> a cualquier tirada durante el resto del combate." },
      { min: 20, max: 20, titulo: "Pérdida de un ojo",            tipos: "penetrantes, cortantes y desgarradoras",
        efecto: "El herido pierde un ojo: <strong>−2</strong> al uso de armas a distancia. Si ya era tuerto, queda ciego." }
    ];

    const roll = await new Roll("1d20").evaluate();
    const r = roll.total;
    const entrada = LESIONES.find(e => e && r >= e.min && r <= e.max);

    const content = `
      <div class="tq-lesion-msg">
        <h3>Tabla de Lesiones — <span class="tq-roll-num">${r}</span></h3>
        <p class="tq-lesion-titulo">${entrada.titulo} <em class="tq-lesion-tipo">(${entrada.tipos})</em></p>
        <p class="tq-lesion-efecto">${entrada.efecto}</p>
      </div>`;

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `<strong>${this.name}</strong> tira en la Tabla de Lesiones`,
      content
    });

    if (r >= 1 && r <= 4) {
      await this.update({ "system.salud.piernaInutilizada": true });
      ui.notifications.warn(`${this.name}: Pierna inutilizada.`);
    }

    if (r >= 5 && r <= 8) {
      await this.update({ "system.salud.brazoInutilizado": true });
      ui.notifications.warn(`${this.name}: Brazo inutilizado.`);
    }

    if (r >= 13 && r <= 14) {
      // pierde 1 punto de Atractivo, no puede bajar de -3
      const atractivoActual = this.system.caracteristicas?.atractivo?.valor ?? 0;
      const atractivoNuevo = Math.max(-3, atractivoActual - 1);
      await this.update({ "system.caracteristicas.atractivo.valor": atractivoNuevo });
      ui.notifications.warn(`${this.name}: Atractivo reducido de ${atractivoActual} a ${atractivoNuevo}.`);
    }

    if (r >= 15 && r <= 17) {
      await this.update({ "system.salud.desangre": true });
      ui.notifications.warn(`${this.name}: Estado de Desangre activo. Pierde 1 PV al inicio de cada ronda.`);
    }

    if (r >= 18 && r <= 19) {
      await this.update({ "system.salud.dolorExtremo": true });
      ui.notifications.warn(`${this.name}: Dolor extremo activo. −2 a todas las tiradas durante el combate.`);
    }

    if (r >= 9 && r <= 10) {
      // dificultad = magnitud del golpe
      const { DialogV2 } = foundry.applications.api;
      const magnitud = await DialogV2.prompt({
        window: { title: "Conmoción cerebral — magnitud de la herida" },
        content: `<div style="padding:8px">
          <label>Magnitud de la herida (PD recibidos)</label>
          <input type="number" id="tq-conmocion-mag" value="1" min="1" style="width:80px;margin-left:8px;" />
        </div>`,
        ok: { label: "Tirar Cuerpo", callback: () => parseInt(document.getElementById("tq-conmocion-mag").value) || 1 }
      });
      if (magnitud) {
        const { TQRoll } = await import("../rolls/TQRoll.mjs");
        const cuerpo = this.system.caracteristicas?.cuerpo?.valor ?? 0;
        await TQRoll.tirar("Cuerpo (Conmoción cerebral)", cuerpo, magnitud, { actor: this });
      }
    }
  }


  // calcula los cambios pero no los aplica, el llamador decide
  calcPX(clave, cantidad = 1) {
    const habilidad = this.system.habilidades?.[clave];
    if (!habilidad) return null;
    const pxActual = habilidad.px ?? 0;
    const nivel = habilidad.nivel ?? 0;

    if (cantidad < 0) {
      return {
        updates: { [`system.habilidades.${clave}.px`]: Math.max(0, pxActual + cantidad) },
        subio: false,
        nivelNuevo: nivel
      };
    }

    const px = pxActual + cantidad;
    // si te pasas del umbral subes de nivel
    const subio = px > nivel;
    return {
      updates: {
        [`system.habilidades.${clave}.nivel`]: subio ? nivel + 1 : nivel,
        [`system.habilidades.${clave}.px`]:    subio ? px - (nivel + 1) : px
      },
      subio,
      nivelNuevo: subio ? nivel + 1 : nivel
    };
  }

  async añadirPXHabilidad(clave, cantidad) {
    if (!cantidad || cantidad === 0) return;
    const resultado = this.calcPX(clave, cantidad);
    if (!resultado) return;
    await this.update(resultado.updates);
    if (resultado.subio) {
      const etiqueta = this.system.habilidades?.[clave]?.nombre && clave.startsWith("idioma")
        ? this.system.habilidades[clave].nombre
        : (game.i18n.localize(`TQ.Habilidades.${clave}`) || clave);
      ui.notifications.info(`¡${etiqueta} sube a Nivel ${resultado.nivelNuevo}!`);
    }
  }

  // +1 PX a habilidades con éxito marcado, borra las marcas
  async aplicarFinDeSesionPX() {
    const habs = this.system.habilidades ?? {};
    const updates = {};
    const conPX = [];
    const subidas = [];

    for (const [clave, habilidad] of Object.entries(habs)) {
      if (!habilidad.exito) continue;
      const resultado = this.calcPX(clave, 1);
      if (!resultado) continue;
      Object.assign(updates, resultado.updates);
      updates[`system.habilidades.${clave}.exito`] = false;
      const etiqueta = habilidad.nombre && clave.startsWith("idioma")
        ? habilidad.nombre
        : (game.i18n.localize(`TQ.Habilidades.${clave}`) || clave);
      conPX.push(etiqueta);
      if (resultado.subio) subidas.push({ etiqueta, nivelNuevo: resultado.nivelNuevo });
    }

    if (!Object.keys(updates).length) {
      return ui.notifications.info("Ninguna habilidad marcada con éxito esta sesión.");
    }

    await this.update(updates);

    let msg = `<div class="tq-bendicion-msg"><strong>Fin de Sesión — ${this.name}</strong>`;
    msg += `<p>+1 PX: ${conPX.join(", ")}</p>`;
    if (subidas.length) {
      msg += `<p><strong>¡Subida de nivel!</strong> ${subidas.map(s => `${s.etiqueta} → Nv. ${s.nivelNuevo}`).join(", ")}</p>`;
    }
    msg += `</div>`;
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: msg });
  }

  async asignarPXHito(totalPXFijo = null) {
    const { DialogV2 } = foundry.applications.api;
    const habs = this.system.habilidades ?? {};

    const opcionesHTML = Object.entries(habs).map(([clave, habilidad]) => {
      const etiqueta = habilidad.nombre && clave.startsWith("idioma")
        ? habilidad.nombre
        : (game.i18n.localize(`TQ.Habilidades.${clave}`) || clave);
      const pxNeed = (habilidad.nivel ?? 0) + 1;
      return `<label style="display:flex;align-items:center;gap:6px;margin:1px 0;font-size:12px;">
        <input type="checkbox" name="hab_${clave}" value="${clave}" />
        <span style="flex:1;">${etiqueta}</span>
        <span style="font-size:10px;opacity:0.7;">Nv.${habilidad.nivel ?? 0} · ${habilidad.px ?? 0}/${pxNeed} PX</span>
      </label>`;
    }).join("");

    const pxCabecera = totalPXFijo !== null
      ? `<p style="font-weight:bold;margin-bottom:8px;">PX disponibles: ${totalPXFijo} <input type="hidden" name="totalPX" value="${totalPXFijo}" /></p>`
      : `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
           <label>PX a repartir (1–5)</label>
           <input type="number" name="totalPX" value="3" min="1" max="5" style="width:50px;" />
         </div>`;

    const html = `
      <div style="padding:4px;">
        ${pxCabecera}
        <p style="font-size:11px;opacity:0.7;margin-bottom:6px;">Máximo 1 PX por habilidad.</p>
        <div style="max-height:300px;overflow-y:auto;border:1px solid var(--tq-bg-mid);padding:4px;border-radius:4px;">
          ${opcionesHTML}
        </div>
      </div>`;

    const config = await DialogV2.wait({
      window: { title: `Fin de Aventura — ${this.name}`, width: 420 },
      content: html,
      rejectClose: false,
      buttons: [
        {
          action: "asignar",
          label: "Asignar",
          default: true,
          callback: (_ev, button) => {
            const f = button.form;
            const totalPX = parseInt(f.elements.totalPX?.value) || 3;
            const seleccionadas = [...f.querySelectorAll("input[type=checkbox]:checked")].map(cb => cb.value);
            return { totalPX, seleccionadas };
          }
        },
        { action: "cancelar", label: "Cancelar" }
      ]
    });
    if (!config) return;

    const { totalPX, seleccionadas } = config;
    if (!seleccionadas.length) return ui.notifications.warn("No seleccionaste ninguna habilidad.");
    if (seleccionadas.length > totalPX) {
      return ui.notifications.warn(`Solo puedes asignar ${totalPX} PX. Has marcado ${seleccionadas.length} habilidades.`);
    }

    const updates = {};
    const subidas = [];

    for (const clave of seleccionadas) {
      const resultado = this.calcPX(clave, 1);
      if (!resultado) continue;
      Object.assign(updates, resultado.updates);
      if (resultado.subio) {
        const habilidad = habs[clave];
        const etiqueta = habilidad.nombre && clave.startsWith("idioma")
          ? habilidad.nombre
          : (game.i18n.localize(`TQ.Habilidades.${clave}`) || clave);
        subidas.push({ etiqueta, nivelNuevo: resultado.nivelNuevo });
      }
    }

    await this.update(updates);

    const nombres = seleccionadas.map(c => {
      const h = habs[c];
      return h.nombre && c.startsWith("idioma") ? h.nombre : (game.i18n.localize(`TQ.Habilidades.${c}`) || c);
    });
    let msg = `<div class="tq-bendicion-msg"><strong>Fin de Aventura — ${this.name}</strong>`;
    msg += `<p>+1 PX: ${nombres.join(", ")}</p>`;
    if (subidas.length) {
      msg += `<p><strong>¡Subida de nivel!</strong> ${subidas.map(s => `${s.etiqueta} → Nv. ${s.nivelNuevo}`).join(", ")}</p>`;
    }
    msg += `</div>`;
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: msg });
  }


  async _preUpdate(changed, options, userId) {
    await super._preUpdate(changed, options, userId);
    // guardar antes del cambio para ver si cruzamos algún umbral
    if (changed.system?.lealtad) {
      options._oldLealtad = {};
      for (const r of ["caos", "ley", "elementos", "antepasados"]) {
        options._oldLealtad[r] = this.system.lealtad?.[r] ?? 0;
      }
    }
  }

  async _onUpdate(changed, options, userId) {
    await super._onUpdate(changed, options, userId);
    if (game.userId !== userId) return;

    // recompensas al alcanzar ciertos umbrales de lealtad
    if (changed.system?.lealtad && options._oldLealtad && game.userId === userId) {
      const hitoUpdates = {};
      let msg50 = [], msg100 = [];
      for (const r of ["caos", "ley", "elementos", "antepasados"]) {
        const oldVal = options._oldLealtad[r] ?? 0;
        const newVal = this.system.lealtad?.[r] ?? 0;
        if (oldVal < 50 && newVal >= 50) {
          const espActual = this.system.caracteristicas?.espiritu?.valor ?? 5;
          hitoUpdates["system.caracteristicas.espiritu.valor"] = (hitoUpdates["system.caracteristicas.espiritu.valor"] ?? espActual) + 1;
          msg50.push(r);
        }
        if (oldVal < 100 && newVal >= 100) {
          const destMax = this.system.destino?.max ?? 1;
          const destActual = this.system.destino?.actual ?? 0;
          hitoUpdates["system.destino.max"] = (hitoUpdates["system.destino.max"] ?? destMax)    + 1;
          hitoUpdates["system.destino.actual"] = (hitoUpdates["system.destino.actual"] ?? destActual) + 1;
          msg100.push(r);
        }
      }
      if (Object.keys(hitoUpdates).length) {
        await this.update(hitoUpdates);
        if (msg50.length) {
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `<div class="tq-bendicion-msg"><strong>Hito de Lealtad — ${msg50.join(", ")}</strong><p>${this.name} alcanza 50 PL y gana <strong>+1 Espíritu</strong> permanente.</p></div>`
          });
        }
        if (msg100.length) {
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `<div class="tq-bendicion-msg"><strong>Apoteosis — ${msg100.join(", ")}</strong><p>${this.name} alcanza 100 PL y gana <strong>+1 Destino</strong> permanente. La deidad se manifiesta.</p></div>`
          });
        }
      }
    }

    // edición manual de heridas desde la ficha, recibirDanho ya lo cubre automáticamente
    const saludCambiada = changed.system?.salud;
    if (!saludCambiada) return;
    const camposHerida = ["heridasLeves1", "heridasLeves2", "heridasGraves1", "heridasGraves2"];
    if (!camposHerida.some(f => f in saludCambiada)) return;

    const salud = this.system.salud;
    const carga = this.system.carga?.valor ?? 0;
    const fuerza = this.system.derivadas?.fuerza?.valor ?? 3;

    const porHeridas = (salud.heridasLeves1 && salud.heridasLeves2) || salud.heridasGraves1 || salud.heridasGraves2;
    const porCarga = carga > fuerza * 3;
    const debeDebilitado = porHeridas || porCarga;

    if (debeDebilitado !== (salud.debilitado ?? false)) {
      await this.update({ "system.salud.debilitado": debeDebilitado });
    }
  }

  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (game.userId !== userId) return;
    const pvMax = this.system.salud?.pvMax?.valor ?? 0;
    if (pvMax > 0) await this.update({ "system.salud.pvActual.valor": pvMax });
  }
}
