const { DialogV2 } = foundry.applications.api;
import { tirarComplicacion, TABLA_COMPLICACIONES_MELE, TABLA_COMPLICACIONES_MAGIA } from "../tablas/TQTablasSucesos.mjs";
import { TOPES_HABILIDAD, HABILIDADES_OPCIONES, ARMA_A_HABILIDAD_PNJ, HABILIDADES_BLIND_GM } from "../helpers/habilidades.mjs";

export class TQRoll {
  static async tirar(etiqueta, puntuacion, dificultad, opciones = {}) {
    const { bonificador = 0, flavor = "", actor = null, targetActor = null, modo = null, danho = null, tablaComplicacion = null, esCombate = false, topeInfo = null, autoExito = false, esRepeticion = false, habClave = null, rollMode = null, dosFortuna = false, etiquetaEnDesglose = false, modDesglose = null, puntuacionMostrada = null } = opciones;
    const modoTirada = rollMode ?? game.settings.get("core", "rollMode");

    const debilitado = actor?.system?.salud?.debilitado ?? false;
    const dolorExtremo = actor?.system?.salud?.dolorExtremo ?? false;
    const tamanoDado = debilitado ? 6 : 10;
    const bonusFinal = bonificador + (dolorExtremo ? -2 : 0);

    let dado, dadoTotal, tiradas, dadoDisplayCustom = null, numComplicaciones = 1;
    if (autoExito) {
      dado = 0; dadoTotal = 0; tiradas = []; numComplicaciones = 0;
    } else if (dosFortuna) {
      const roll1 = await TQRoll._tirarExplosivo(tamanoDado, modoTirada);
      const roll2 = await TQRoll._tirarExplosivo(tamanoDado, modoTirada);
      if (actor) {
        const fortActual = actor.system.fortuna?.actual ?? 0;
        await actor.update({ "system.fortuna.actual": Math.max(0, fortActual - 2) });
      }
      dadoTotal = roll1.total + roll2.total;
      tiradas = roll1.tiradas;
      numComplicaciones = (roll1.dado === 1 ? 1 : 0) + (roll2.dado === 1 ? 1 : 0);
      dado = numComplicaciones > 0 ? 1 : Math.max(roll1.dado, roll2.dado);
      dadoDisplayCustom = `${TQRoll._dadoDisplay(roll1.total, roll1.tiradas)} + ${TQRoll._dadoDisplay(roll2.total, roll2.tiradas)}`;
    } else {
      const roll = await TQRoll._tirarExplosivo(tamanoDado, modoTirada);
      dado = roll.dado; dadoTotal = roll.total; tiradas = roll.tiradas;
    }

    const total = dadoTotal + puntuacion + bonusFinal;
    const exitos = total - dificultad;
    let resultado = TQRoll._clasificarResultado(dado, exitos);

    let pasionEfecto = null;
    if (!autoExito) {
      const pasionFlag = actor?.system?.pasionFlag ?? "";
      if (pasionFlag) {
        pasionEfecto = TQRoll._aplicarPasion(resultado, exitos);
        if (pasionEfecto) resultado = pasionEfecto.resultado;
        await actor.update({ "system.pasionFlag": "" });
      }
    }

    let pd = null;
    if (danho !== null && exitos >= 0) {
      pd = TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal);
    }

    let proteccionTarget = 0, danhoAplicado = null;
    if (pd?.total != null && targetActor && modo === "distancia") {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho.tipo ?? "cortante");
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
    }

    const datosChat = {
      etiqueta, puntuacion, bonificador: bonusFinal, dificultad, debilitado, dolorExtremo, dado: dadoTotal, dadoDisplay: autoExito ? "—" : (dadoDisplayCustom ?? TQRoll._dadoDisplay(dadoTotal, tiradas)), total, exitos, resultado, css: resultado.css, criticos: esCombate ? TQRoll._criticosTexto(exitos) : null, pd, proteccionTarget: proteccionTarget || null, danhoAplicado, pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null, topeInfo, mostrarFortuna: !autoExito && !esRepeticion && !esCombate && !dosFortuna, actorId: actor?.id ?? null, etiquetaEnDesglose, modDesglose, puntuacionMostrada
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(modoTirada), flags: {
        "tierras-quebradas": {
          etiqueta, puntuacion, dificultad, bonificador, rollMode: modoTirada, bonusFinalOriginal: bonusFinal, actorId: actor?.id ?? null, habClave, tablaComplicacion: tablaComplicacion ?? null, esRepeticion, totalOriginal: total, exitosOriginales: exitos, resultadoCssOriginal: resultado.css, resultadoLabelOriginal: resultado.label, dadoDisplayOriginal: autoExito ? "—" : TQRoll._dadoDisplay(dadoTotal, tiradas), debilitadoOriginal: debilitado, dolorExtremoOriginal: dolorExtremo
        }
      }
    });

    if (!autoExito && tablaComplicacion && resultado.css.includes("complicacion")) {
      const tabla = tablaComplicacion === "magia" ? TABLA_COMPLICACIONES_MAGIA : TABLA_COMPLICACIONES_MELE;
      for (let i = 0; i < numComplicaciones; i++) await tirarComplicacion(tabla, actor);
    }

    return { total, exitos, resultado, dificultad, autoExito };
  }

  static async repetirConFortuna(messageId) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const { etiqueta, puntuacion, dificultad, bonificador: bonOrig, actorId, tablaComplicacion: tablaOrig, totalOriginal, exitosOriginales, resultadoCssOriginal, resultadoLabelOriginal, dadoDisplayOriginal, bonusFinalOriginal, debilitadoOriginal, dolorExtremoOriginal, rollMode: modoTirada } = flags;

    const actor = game.actors.get(actorId);
    if (!actor) return;
    const fortuna = actor.system.fortuna;
    if ((fortuna?.actual ?? 0) <= 0) return;

    const debilitado = actor.system.salud?.debilitado ?? false;
    const dolorExtremo = actor.system.salud?.dolorExtremo ?? false;
    const tamanoDado = debilitado ? 6 : 10;
    const bonusFinalNuevo = (bonOrig ?? 0) + (dolorExtremo ? -2 : 0);

    const rollNuevo = await TQRoll._tirarExplosivo(tamanoDado, modoTirada);
    const dadoNuevo = rollNuevo.dado;
    const dadoTotalNuevo = rollNuevo.total;
    const totalNuevo = dadoTotalNuevo + (puntuacion ?? 0) + bonusFinalNuevo;
    const exitosNuevos = totalNuevo - (dificultad ?? 15);
    const resultadoNuevo = TQRoll._clasificarResultado(dadoNuevo, exitosNuevos);
    const dadoDisplayNuevo = TQRoll._dadoDisplay(dadoTotalNuevo, rollNuevo.tiradas);

    await actor.update({ "system.fortuna.actual": Math.max(0, fortuna.actual - 1) });

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion.hbs", {
        etiqueta, original: { dadoDisplay: dadoDisplayOriginal, total: totalOriginal, exitos: exitosOriginales, label: resultadoLabelOriginal, css: resultadoCssOriginal }, nuevo: { dadoDisplay: dadoDisplayNuevo, total: totalNuevo, exitos: exitosNuevos, label: resultadoNuevo.label, css: resultadoNuevo.css }
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }), content: contenido, ...TQRoll._rollModeData(modoTirada), flags: {
        "tierras-quebradas": {
          esEleccionFortuna: true, etiqueta, puntuacion: puntuacion ?? 0, dificultad: dificultad ?? 15, actorId, tablaComplicacion: tablaOrig ?? null, rollMode: modoTirada, original: { dadoDisplay: dadoDisplayOriginal, total: totalOriginal, exitos: exitosOriginales, css: resultadoCssOriginal, label: resultadoLabelOriginal, bonificador: bonusFinalOriginal ?? 0, debilitado: debilitadoOriginal ?? false, dolorExtremo: dolorExtremoOriginal ?? false }, nuevo: { dadoDisplay: dadoDisplayNuevo, total: totalNuevo, exitos: exitosNuevos, css: resultadoNuevo.css, label: resultadoNuevo.label, bonificador: bonusFinalNuevo, debilitado, dolorExtremo }
        }
      }
    });
  }

  static async elegirResultadoFortuna(messageId, eleccion) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const { etiqueta, puntuacion, dificultad, actorId, tablaComplicacion: tablaOrig, rollMode: modoTirada } = flags;
    const actor = game.actors.get(actorId);
    if (!actor) return;

    const datos = flags[eleccion];
    const datosChat = {
      etiqueta, puntuacion: puntuacion ?? 0, dificultad: dificultad ?? 15, dadoDisplay: datos.dadoDisplay, total: datos.total, exitos: datos.exitos, resultado: { css: datos.css, label: datos.label }, css: datos.css, bonificador: datos.bonificador ?? 0, debilitado: datos.debilitado ?? false, dolorExtremo: datos.dolorExtremo ?? false, criticos: null, pd: null, pasionEfecto: null, actorImg: actor?.img ?? null, topeInfo: null, mostrarFortuna: false, actorId: actorId ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }), content: contenido, ...TQRoll._rollModeData(modoTirada), flags: { "tierras-quebradas": { esRepeticion: true } }
    });

    if (eleccion === "nuevo" && tablaOrig && datos.css.includes("complicacion")) {
      const tabla = tablaOrig === "magia" ? TABLA_COMPLICACIONES_MAGIA : TABLA_COMPLICACIONES_MELE;
      await tirarComplicacion(tabla, actor);
    }
  }

  static async _tirarExplosivo(tamanoDado = 10, rollMode = null) {
    rollMode = rollMode ?? "publicroll";
    let dsnSync = true, dsnWhisper = null, dsnBlind = false;
    if (rollMode === "blindroll") {
      dsnWhisper = game.users.filter(u => u.isGM).map(u => u.id);
      dsnBlind = true;
    } else if (rollMode === "gmroll") {
      dsnWhisper = [...new Set([...game.users.filter(u => u.isGM).map(u => u.id), game.user.id])];
    } else if (rollMode === "selfroll") {
      dsnSync = false;
    }

    let totalAcumulado = 0;
    let dado;
    let primera = true;
    let dadoBase = 0;
    const tiradas = [];
    do {
      const resultadoDado = await new Roll(`1d${tamanoDado}`).evaluate();
      dado = resultadoDado.total;
      if (game.dice3d) await game.dice3d.showForRoll(resultadoDado, game.user, dsnSync, dsnWhisper, dsnBlind);
      if (primera) { dadoBase = dado; primera = false; }
      totalAcumulado += dado;
      tiradas.push(dado);
    } while (dado === tamanoDado);
    return { dado: dadoBase, total: totalAcumulado, tiradas };
  }

  static _dadoDisplay(total, tiradas) {
    return tiradas.length > 1 ? `${total} (${tiradas.join("+")})` : `${total}`;
  }

  static _criticosTexto(exitos) {
    if (exitos < 10) return null;
    const indiceMD = Math.min(Math.floor(exitos / 5) - 1, 3);
    return [
      "", "1 efecto — elige 1 proeza o maniobra", "2 efectos — elige 2 proezas o maniobras", "3 efectos — elige 3 proezas o maniobras"
    ][indiceMD];
  }

  static _rollModeData(rollMode = null) {
    rollMode = rollMode ?? game.settings.get("core", "rollMode");
    const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
    if (rollMode === "gmroll")    return { whisper: [...new Set([...gmIds, game.user.id])] };
    if (rollMode === "blindroll") return { whisper: gmIds, blind: true };
    if (rollMode === "selfroll")  return { whisper: [game.user.id] };
    return {};
  }

  static _clasificarResultado(dado, exitos) {
    const complicacion = (dado === 1);

    if (exitos >= 10) {
      return {
        label: complicacion ? "TQ.Tirada.CriticoComplicacion" : "TQ.Tirada.ExitoCritico", css: complicacion ? "critico complicacion" : "critico"
      };
    }
    if (exitos >= 0) {
      return {
        label: complicacion ? "TQ.Tirada.ExitoComplicacion" : "TQ.Tirada.Exito", css: complicacion ? "exito complicacion" : "exito"
      };
    }
    return {
      label: complicacion ? "TQ.Tirada.Complicacion" : "TQ.Tirada.Fallo", css: complicacion ? "complicacion" : "fallo"
    };
  }

  static _aplicarPasion(resultado, exitos) {
    if (exitos >= 0) {
      if (resultado.css.includes("critico")) {
        return { resultado, texto: "Pasión: segundo Éxito Crítico" };
      }
      const nuevoCss = resultado.css.includes("complicacion") ? "critico complicacion" : "critico";
      return {
        resultado: { label: nuevoCss.includes("complicacion") ? "TQ.Tirada.CriticoComplicacion" : "TQ.Tirada.ExitoCritico", css: nuevoCss }, texto: "Pasión: Éxito Crítico"
      };
    }
    if (resultado.css.includes("complicacion")) {
      return { resultado, texto: "Pasión: Complicación (ya tenías)" };
    }
    const nuevoCss = resultado.css === "fallo" ? "complicacion" : resultado.css + " complicacion";
    return {
      resultado: { label: "TQ.Tirada.Complicacion", css: nuevoCss }, texto: "Pasión: Complicación"
    };
  }

  static async dialogoTirada(etiqueta, puntuacion, opciones = {}) {
    const { modo = "normal", longitudArma = "media", targetActor = null, dificultadPorDefecto = 15, danho = null, actor = null, habClave = null, extraTopes = [] } = opciones;

    const forzarBlind = !game.user.isGM
      && habClave
      && game.settings.get("tierras-quebradas", "blindRollHabilidades")
      && HABILIDADES_BLIND_GM.has(habClave);
    const rollModeEfectivo = forzarBlind ? "blindroll" : null;

    const capClaves = [...(TOPES_HABILIDAD[habClave] ?? []), ...extraTopes];
    const getCapValor = (clave) => {
      if (!actor || actor.type !== "pj") return 0;
      const hab = actor.system.habilidades?.[clave];
      if (!hab) return 0;
      const base = actor.system.bases?.[hab.base]?.valor ?? 0;
      const penalizacion = (actor.system.estorbo?.valor ?? 0) * (hab.estorbo ?? 0);
      return base + (hab.nivel ?? 0)  - penalizacion;
    };
    const habLabel = (clave) => {
      if ((clave === "idioma2" || clave === "idioma3") && actor) {
        const nombre = actor.system.habilidades?.[clave]?.nombre;
        if (nombre) return `Idioma: ${nombre}`;
      }
      return HABILIDADES_OPCIONES.find(h => h.clave === clave)?.label ?? clave;
    };
    const topesOpciones = capClaves.map(clave => ({ clave, label: habLabel(clave), valor: getCapValor(clave) }));

    const rivalDatos = TQRoll._prepararDatosRival(targetActor);
    const jugadorDatos = { danoArma: danho?.danoArma ?? "—", md: danho?.md ?? 0, tipo: danho?.tipo ?? "—" };

    const escalaDif = opciones.escalaDif ?? "habilidad";
    const fortunaActual = actor?.system?.fortuna?.actual ?? 0;
    const dosFortDisponible = fortunaActual >= 2;
    const aliados = modo === "distancia"
      ? (game.scenes.active?.tokens ?? [])
          .filter(t => t.actor?.type === "pj" && t.actor?.id !== actor?.id)
          .map(t => ({ id: t.actor.id, name: t.name }))
      : [];
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-dialogo.hbs", { etiqueta, puntuacion, modo, longitudArma, jugadorDatos, rivalDatos, dificultadPorDefecto: String(dificultadPorDefecto), topesOpciones, escalaDif, aliados }
    );

    const eleccion = await DialogV2.wait({
      window: { title: game.i18n.format("TQ.Tirada.Label", { habilidad: etiqueta }) }, classes: [
        "tq-tirada-dialog", ...(!dosFortDisponible ? ["tq-fort-insuf"] : []), ...(modo !== "normal" ? ["tq-sin-exito-auto"] : [])
      ], content, rejectClose: false, buttons: [
        {
          action: "tirar", label: "Lanzar", default: true, callback: (_ev, button) => {
            const campos = button.form.elements;
            const topeActivo = campos.tope_activo?.checked ?? false;
            const topeClave = topeActivo ? (campos.tope_habilidad?.value ?? null) : null;
            if (modo === "melee") {
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, longitudRival: campos.rival_longitud?.value || "media", bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, danoRival: campos.rival_danoArma?.value?.trim() || "0", mdRival: parseInt(campos.rival_md?.value) || 0, tipoRival: campos.rival_tipo?.value || "cortante", bonificador: parseInt(campos.bonificador?.value) || 0, topeClave
              };
            }
            let dificultad;
            if (modo === "distancia") {
              const dist = parseInt(campos.distancia?.value) || 10;
              const esq = parseInt(campos.esquivar_blanco?.value) || 0;
              dificultad = Math.max(dist, esq);
            } else {
              dificultad = parseInt(campos.dificultad?.value) || 15;
            }
            const bonApuntar = (modo === "distancia" && (campos.apuntando?.checked ?? false)) ? 2 : 0;
            return {
              dificultad, bonificador: (parseInt(campos.bonificador?.value) || 0) + bonApuntar, topeClave, enMelee: modo === "distancia" ? (campos.en_melee?.checked ?? false) : false, aliadoId: modo === "distancia" ? (campos.aliado_id?.value ?? null) : null
            };
          }
        }, {
          action: "dos-fortuna", label: "Usar 2 Fortuna", callback: (_ev, button) => {
            if (fortunaActual < 2) return null;
            const campos = button.form.elements;
            const topeActivo = campos.tope_activo?.checked ?? false;
            const topeClave = topeActivo ? (campos.tope_habilidad?.value ?? null) : null;
            if (modo === "melee") {
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, longitudRival: campos.rival_longitud?.value || "media", bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, danoRival: campos.rival_danoArma?.value?.trim() || "0", mdRival: parseInt(campos.rival_md?.value) || 0, tipoRival: campos.rival_tipo?.value || "cortante", bonificador: parseInt(campos.bonificador?.value) || 0, topeClave, dosFortuna: true
              };
            }
            const dificultad = parseInt(campos.dificultad?.value) || 15;
            return {
              dificultad, bonificador: parseInt(campos.bonificador?.value) || 0, topeClave, dosFortuna: true
            };
          }
        }, {
          action: "cancelar", label: game.i18n.localize("TQ.Cancelar") || "Cancelar", callback: () => null
        }, {
          action: "auto", label: "Éxito Automático", callback: (_ev, button) => {
            if (modo !== "normal") return null;
            const campos = button.form.elements;
            const topeActivo = campos.tope_activo?.checked ?? false;
            const topeClave = topeActivo ? (campos.tope_habilidad?.value ?? null) : null;
            const dificultad = parseInt(campos.dificultad?.value) || 15;
            const bonificador = parseInt(campos.bonificador?.value) || 0;
            return { dificultad, bonificador, topeClave, autoExito: true };
          }
        }
      ]
    });

    if (!eleccion || typeof eleccion !== "object") return null;

    const topeEntry = eleccion.topeClave ? topesOpciones.find(t => t.clave === eleccion.topeClave) : null;
    let puntuacionFinal = puntuacion;
    let topeInfo = null;
    if (topeEntry && topeEntry.valor < puntuacion) {
      puntuacionFinal = topeEntry.valor;
      topeInfo = topeEntry;
    }
    const modDesgloseLocal = opciones.modDesglose ?? null;
    const modDesgloseTotal = modDesgloseLocal ? modDesgloseLocal.reduce((s, m) => s + m.valor, 0) : 0;
    const puntuacionMostrada = puntuacionFinal;
    puntuacionFinal += modDesgloseTotal;

    if (eleccion.autoExito) {
      const margen = puntuacionFinal + (eleccion.bonificador ?? 0) - eleccion.dificultad;
      if (margen < -1) {
        const msg = `Éxito automático no disponible: incluso con un 1 en el dado fallarías (margen ${margen}).`;
        ui.notifications.warn(msg);
        await ChatMessage.create({
          speaker: opciones.actor ? ChatMessage.getSpeaker({ actor: opciones.actor }) : ChatMessage.getSpeaker(), content: `<div class="tq-aviso">${msg}</div>`, ...TQRoll._rollModeData()
        });
        return null;
      }
    }

    if (modo === "melee") {
      return TQRoll.tirarMelee(etiqueta, puntuacionFinal, longitudArma, eleccion, { ...opciones, targetActor, topeInfo, puntuacionMostrada, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false });
    }

    const resultado = await TQRoll.tirar(etiqueta, puntuacionFinal, eleccion.dificultad, {
      ...opciones, bonificador: eleccion.bonificador, topeInfo, puntuacionMostrada, autoExito: eleccion.autoExito ?? false, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false
    });
    if (!resultado) return null;
    return { ...resultado, enMelee: eleccion.enMelee ?? false, aliadoId: eleccion.aliadoId ?? null };
  }

  /** Tirada enfrentada de melee: tira por ambos contendientes y muestra los dos resultados. */
  static async tirarMelee(etiqueta, puntuacion, longitudJugador, eleccion, opciones = {}) {
    const { actor = null, danho = null, targetActor = null, topeInfo = null, rollMode: rollModeOpc = null, dosFortuna = false, modDesglose = null, puntuacionMostrada = null } = opciones;
    const { puntuacionRival, longitudRival, bonificadorRival, danoRival, mdRival, tipoRival, bonificador } = eleccion;
    const modoTirada = rollModeOpc ?? game.settings.get("core", "rollMode");

    const modJugador = TQRoll._calcularModLongitud(longitudJugador, longitudRival);
    const modRival = TQRoll._calcularModLongitud(longitudRival, longitudJugador);

    const debilitadoJ = actor?.system?.salud?.debilitado ?? false;
    const dolorExtremoJ = actor?.system?.salud?.dolorExtremo ?? false;
    const dadoJ_size = debilitadoJ ? 6 : 10;
    const bonusJ = bonificador + (dolorExtremoJ ? -2 : 0);

    const debilitadoR = targetActor?.system?.salud?.debilitado ?? false;
    const dadoR_size = debilitadoR ? 6 : 10;

    let dadoJ, dadoTotalJ, tiradasJ, dadoDisplayJCustom = null;
    if (dosFortuna) {
      const rollJ1 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      const rollJ2 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      if (actor) {
        const fortActual = actor.system.fortuna?.actual ?? 0;
        await actor.update({ "system.fortuna.actual": Math.max(0, fortActual - 2) });
      }
      dadoTotalJ = rollJ1.total + rollJ2.total;
      tiradasJ = rollJ1.tiradas;
      const compJ = (rollJ1.dado === 1 ? 1 : 0) + (rollJ2.dado === 1 ? 1 : 0);
      dadoJ = compJ > 0 ? 1 : Math.max(rollJ1.dado, rollJ2.dado);
      dadoDisplayJCustom = `${TQRoll._dadoDisplay(rollJ1.total, rollJ1.tiradas)} + ${TQRoll._dadoDisplay(rollJ2.total, rollJ2.tiradas)}`;
    } else {
      ({ dado: dadoJ, total: dadoTotalJ, tiradas: tiradasJ } = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada));
    }
    const { dado: dadoR, total: dadoTotalR, tiradas: tiradasR } = await TQRoll._tirarExplosivo(dadoR_size, modoTirada);

    const totalJugador = dadoTotalJ + puntuacion + bonusJ + modJugador;
    const totalRival = dadoTotalR + puntuacionRival + bonificadorRival + modRival;

    const exitos = totalJugador - totalRival;
    let resultado = TQRoll._clasificarResultado(dadoJ, exitos);

    const pasionFlag = actor?.system?.pasionFlag ?? "";
    let pasionEfecto = null;
    if (pasionFlag) {
      pasionEfecto = TQRoll._aplicarPasion(resultado, exitos);
      if (pasionEfecto) resultado = pasionEfecto.resultado;
      await actor.update({ "system.pasionFlag": "" });
    }

    if (exitos === 0) {
      const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
      const dadoDisplayJ = dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ);
      const contenidoTablas = await foundry.applications.handlebars.renderTemplate(
        "systems/tierras-quebradas/templates/dialogs/tablas-melee.hbs", {
          etiqueta, puntuacion, bonificador: bonusJ, modLongitud: modJugador, dadoDisplayJ, totalJugador, puntuacionRival, bonificadorRival, modLongitudRival: modRival, dadoDisplayR: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival, rivalNombre: targetActor?.name ?? "Rival"
        }
      );
      await ChatMessage.create({
        speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content: contenidoTablas, whisper: gmIds, flags: {
          "tierras-quebradas": {
            esTablasMelee: true, etiqueta, puntuacion, bonificador: bonusJ, modLongitud: modJugador, dadoDisplayJ, totalJugador, dadoJ, puntuacionRival, bonificadorRival, modLongitudRival: modRival, dadoDisplayR: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival, actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null, danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoTipo: danho?.tipo ?? "cortante", danhoNoLetal: danho?.noLetal ?? false, danoRival, mdRival, tipoRival, rollMode: modoTirada, pasionEfecto: pasionEfecto?.texto ?? null, topeInfo: topeInfo ?? null
          }
        }
      });
      return { total: totalJugador, exitos: 0, resultado };
    }

    let pd = null;
    if (danho !== null && exitos > 0) {
      pd = TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal);
    }

    let pdRival = null;
    if (exitos < 0) {
      pdRival = TQRoll.calcDanho(danoRival, mdRival, Math.abs(exitos), false);
    }

    let danhoAplicado = null, proteccionTarget = 0;
    let danhoRivalAplicado = null, proteccionJugador = 0;

    if (pd?.total != null && targetActor) {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho?.tipo);
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
      await targetActor.recibirDanho(danhoAplicado, pd.total);
    }

    if (pdRival?.total != null && actor) {
      proteccionJugador = TQRoll._calcularProteccion(actor, tipoRival ?? "cortante");
      danhoRivalAplicado = Math.max(0, pdRival.total - proteccionJugador);
      await actor.recibirDanho(danhoRivalAplicado, pdRival.total);
    }

    const datosChat = {
      etiqueta, esMelee: true, puntuacion, bonificador, modLongitud: modJugador, dado: dadoTotalJ, dadoDisplay: dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ), total: totalJugador, puntuacionRival, bonificadorRival, modLongitudRival: modRival, dadoRival: dadoTotalR, dadoDisplayRival: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival, exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos), pd, danhoAplicado, proteccionTarget, pdRival, danhoRivalAplicado, proteccionJugador, pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null, atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", topeInfo, modDesglose, puntuacionMostrada
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(modoTirada)
    });

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actor);
    }

    return { total: totalJugador, exitos, resultado };
  }

  static calcDanho(danoArma, md, exitos, noLetal) {
    const danoNum = parseInt(danoArma);
    const exitosDanho = Math.min(exitos, 10);
    const mdStr = md >= 0 ? `+ ${md}` : `- ${Math.abs(md)}`;
    if (!isNaN(danoNum)) {
      let pdTotal = danoNum + md + exitosDanho;
      if (noLetal) pdTotal = Math.floor(pdTotal / 2);
      return { formula: `${danoNum} ${mdStr} (MD) + ${exitosDanho} Éxitos`, total: pdTotal, noLetal };
    }
    return { formula: `${danoArma} ${mdStr} (MD) + ${exitosDanho} Éxitos`, total: null, noLetal };
  }

  static _calcularModLongitud(miLongitud, suLongitud) {
    const orden = ["corta", "media", "larga", "muy larga"];
    const miIdx = orden.indexOf(miLongitud ?? "media");
    const suIdx = orden.indexOf(suLongitud ?? "media");
    return (miIdx - suIdx) >= 2 ? 2 : 0;
  }

  static _calcularProteccion(actor, tipoArma) {
    let total = 0;
    for (const item of actor.items) {
      if (item.type !== "armadura") continue;
      let prot = item.system.proteccion ?? 0;
      if (item.system.tipo === "blanda" && tipoArma === "contundente") prot = Math.floor(prot / 2);
      if (item.system.esYelmo && !item.system.viseraBajada) prot = Math.max(0, prot - 1);
      total += prot;
    }
    return total;
  }

  static async resolverTablas(messageId, resolucion) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    if (!flags.esTablasMelee) return;

    const actor = flags.actorId ? game.actors.get(flags.actorId) : null;
    const targetActor = flags.targetActorId ? game.actors.get(flags.targetActorId) : null;
    const resultado = TQRoll._clasificarResultado(flags.dadoJ, 0);

    let pd = null, pdRival = null;
    let danhoAplicado = null, proteccionTarget = 0;
    let danhoRivalAplicado = null, proteccionJugador = 0;

    if ((resolucion === "atacante" || resolucion === "ambos") && flags.danoArma !== null) {
      pd = TQRoll.calcDanho(flags.danoArma, flags.danhoMd, 0, flags.danhoNoLetal);
      if (pd?.total != null && targetActor) {
        proteccionTarget = TQRoll._calcularProteccion(targetActor, flags.danhoTipo);
        danhoAplicado = Math.max(0, pd.total - proteccionTarget);
        await targetActor.recibirDanho(danhoAplicado, pd.total);
      }
    }

    if ((resolucion === "rival" || resolucion === "ambos") && flags.danoRival) {
      pdRival = TQRoll.calcDanho(flags.danoRival, flags.mdRival, 0, false);
      if (pdRival?.total != null && actor) {
        proteccionJugador = TQRoll._calcularProteccion(actor, flags.tipoRival ?? "cortante");
        danhoRivalAplicado = Math.max(0, pdRival.total - proteccionJugador);
        await actor.recibirDanho(danhoRivalAplicado, pdRival.total);
      }
    }

    const resolucionTexto = {
      atacante: "Tablas — el atacante impacta con 0 PE", rival: "Tablas — el rival impacta con 0 PE", ambos: "Tablas — ambos impactan con 0 PE", nadie: "Tablas — nadie impacta"
    }[resolucion];

    const datosChat = {
      etiqueta: flags.etiqueta, esMelee: true, puntuacion: flags.puntuacion, bonificador: flags.bonificador, modLongitud: flags.modLongitud, dadoDisplay: flags.dadoDisplayJ, total: flags.totalJugador, puntuacionRival: flags.puntuacionRival, bonificadorRival: flags.bonificadorRival, modLongitudRival: flags.modLongitudRival, dadoDisplayRival: flags.dadoDisplayR, totalRival: flags.totalRival, exitos: 0, resultado, css: resultado.css, criticos: null, pd, danhoAplicado, proteccionTarget, pdRival, danhoRivalAplicado, proteccionJugador, pasionEfecto: flags.pasionEfecto ?? null, actorImg: actor?.img ?? null, atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", topeInfo: flags.topeInfo ?? null, resolucionTablas: resolucionTexto
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(flags.rollMode)
    });

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actor);
    }
  }

  /** Pre-rellena los datos del rival a partir del actor objetivo (primer arma melee encontrada). */
  static _prepararDatosRival(targetActor) {
    const defaults = { puntuacion: 10, longitud: "media", danoArma: "0", md: 0, tipo: "cortante" };
    if (!targetActor) return defaults;

    const arma = targetActor.items.find(i => i.type === "arma" && i.system.alcance === "contacto");
    if (!arma) return defaults;

    const habKey = arma.system.habilidad;
    const manos = arma.system.manos ?? "1m";
    let puntuacion = 0;
    if (targetActor.type === "pj") {
      const habilidad = targetActor.system.habilidades?.[habKey];
      if (habilidad) {
        const base = targetActor.system.bases?.[habilidad.base]?.valor ?? 0;
        puntuacion = base + (habilidad.nivel ?? 0)  - (targetActor.system.estorbo?.valor ?? 0);
      }
    } else {
      const habNombre = ARMA_A_HABILIDAD_PNJ[habKey] ?? habKey;
      const valor = targetActor.system.habilidades?.[habNombre];
      puntuacion = typeof valor === "number" ? valor : 0;
    }
    const md = (manos === "2m")
      ? (targetActor.system.derivadas?.mDano2m?.valor ?? 0)
      : (targetActor.system.derivadas?.mDano1m?.valor ?? 0);

    return {
      puntuacion, longitud: arma.system.longitud ?? "media", danoArma: arma.system.danoArma ?? "0", md, tipo: arma.system.tipo ?? "cortante"
    };
  }

  static async tirarEnfrentada(actorA, habNombreA, habTotalA, actorB, habNombreB, habTotalB, opciones = {}) {
    const { habClave = null } = opciones;
    const forzarBlind = !game.user.isGM
      && habClave
      && game.settings.get("tierras-quebradas", "blindRollHabilidades")
      && HABILIDADES_BLIND_GM.has(habClave);
    const modoTirada = forzarBlind ? "blindroll" : game.settings.get("core", "rollMode");

    if (forzarBlind) {
      const debilitadoA = actorA?.system?.salud?.debilitado ?? false;
      const dolorExtremoA = actorA?.system?.salud?.dolorExtremo ?? false;
      const dadoSizeA = debilitadoA ? 6 : 10;
      const bonusA = dolorExtremoA ? -2 : 0;
      const debilitadoB = actorB?.system?.salud?.debilitado ?? false;
      const dadoSizeB = debilitadoB ? 6 : 10;
      const { dado: dadoA, total: dadoTotalA, tiradas: tiradasA } = await TQRoll._tirarExplosivo(dadoSizeA, modoTirada);
      const { total: dadoTotalB, tiradas: tiradasB } = await TQRoll._tirarExplosivo(dadoSizeB, modoTirada);
      const totalA = dadoTotalA + habTotalA + bonusA;
      const totalB = dadoTotalB + habTotalB;
      const exitos = totalA - totalB;
      let resultado = TQRoll._clasificarResultado(dadoA, exitos);
      const pasionFlag = actorA?.system?.pasionFlag ?? "";
      let pasionEfecto = null;
      if (pasionFlag) {
        pasionEfecto = TQRoll._aplicarPasion(resultado, exitos);
        if (pasionEfecto) resultado = pasionEfecto.resultado;
        await actorA.update({ "system.pasionFlag": "" });
      }
      const datosChat = {
        etiqueta: `Tirada Enfrentada: ${habNombreA} vs ${habNombreB}`, esEnfrentada: true, nombreA: actorA?.name ?? "Iniciador", habNombreA, puntuacionA: habTotalA, bonificadorA: bonusA || null, dadoDisplayA: TQRoll._dadoDisplay(dadoTotalA, tiradasA), totalA, nombreB: actorB?.name ?? "Oponente", habNombreB, puntuacionB: habTotalB, dadoDisplayB: TQRoll._dadoDisplay(dadoTotalB, tiradasB), totalB, exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos), pasionEfecto: pasionEfecto?.texto ?? null, debilitado: debilitadoA, dolorExtremo: dolorExtremoA
      };
      const contenido = await foundry.applications.handlebars.renderTemplate("systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat);
      await ChatMessage.create({ speaker: actorA ? ChatMessage.getSpeaker({ actor: actorA }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(modoTirada) });
      if (resultado.css.includes("complicacion")) await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actorA);
      return { totalA, totalB, exitos, resultado };
    }

    const debilitadoB = actorB?.system?.salud?.debilitado ?? false;
    const dadoSizeB = debilitadoB ? 6 : 10;
    const { total: dadoTotalB, tiradas: tiradasB } = await TQRoll._tirarExplosivo(dadoSizeB, modoTirada);
    const dadoDisplayB = TQRoll._dadoDisplay(dadoTotalB, tiradasB);

    const fortunaActualA = actorA?.system?.fortuna?.actual ?? 0;
    const puedeFortuna = fortunaActualA >= 2;

    const contenidoIntermedio = `<div class="tq-result-card complicacion">
      <div class="tq-card-titulo">Tirada Enfrentada</div>
      <hr/>
      <p style="text-align:center;margin:6px 0;"><strong>${actorB?.name ?? "Oponente"}</strong> saca: <span style="font-size:1.4em;font-weight:bold;">${dadoDisplayB}</span></p>
      <div class="tq-card-botones" style="gap:8px;">
        <button class="tq-enfrentada-normal">Sin Fortuna</button>
        <button class="tq-enfrentada-fortuna"${puedeFortuna ? "" : " disabled"}>Usar 2 Fortuna</button>
      </div>
    </div>`;

    await ChatMessage.create({
      speaker: actorA ? ChatMessage.getSpeaker({ actor: actorA }) : ChatMessage.getSpeaker(),
      content: contenidoIntermedio,
      flags: {
        "tierras-quebradas": {
          esEnfrentadaPendiente: true,
          actorAId: actorA?.id ?? null, habNombreA, habTotalA,
          actorBId: actorB?.id ?? null, habNombreB, habTotalB,
          dadoTotalB, dadoDisplayB, modoTirada, habClave
        }
      },
      ...TQRoll._rollModeData(modoTirada)
    });
  }

  static async completarEnfrentada(messageId, usarFortuna) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    if (flags.enfrentadaCompletada) return;
    const { actorAId, habNombreA, habTotalA, actorBId, habNombreB, habTotalB, dadoTotalB, dadoDisplayB, modoTirada, habClave } = flags;

    const actorA = game.actors.get(actorAId);
    const actorB = game.actors.get(actorBId);
    if (actorA && !actorA.isOwner) return;

    await message.update({ "flags.tierras-quebradas.enfrentadaCompletada": true });

    const debilitadoA = actorA?.system?.salud?.debilitado ?? false;
    const dolorExtremoA = actorA?.system?.salud?.dolorExtremo ?? false;
    const dadoSizeA = debilitadoA ? 6 : 10;
    const bonusA = dolorExtremoA ? -2 : 0;

    let dadoTotalA, dadoA, dadoDisplayACustom = null;

    if (usarFortuna) {
      const fortActual = actorA?.system?.fortuna?.actual ?? 0;
      if (fortActual < 2) { ui.notifications.warn("No tienes suficiente Fortuna (necesitas 2)."); return; }
      const roll1 = await TQRoll._tirarExplosivo(dadoSizeA, modoTirada);
      const roll2 = await TQRoll._tirarExplosivo(dadoSizeA, modoTirada);
      await actorA.update({ "system.fortuna.actual": Math.max(0, fortActual - 2) });
      dadoTotalA = roll1.total + roll2.total;
      const compA = (roll1.dado === 1 ? 1 : 0) + (roll2.dado === 1 ? 1 : 0);
      dadoA = compA > 0 ? 1 : Math.max(roll1.dado, roll2.dado);
      dadoDisplayACustom = `${TQRoll._dadoDisplay(roll1.total, roll1.tiradas)} + ${TQRoll._dadoDisplay(roll2.total, roll2.tiradas)}`;
    } else {
      ({ dado: dadoA, total: dadoTotalA } = await TQRoll._tirarExplosivo(dadoSizeA, modoTirada));
    }

    const totalA = dadoTotalA + habTotalA + bonusA;
    const totalB = dadoTotalB + habTotalB;
    const exitos = totalA - totalB;
    let resultado = TQRoll._clasificarResultado(dadoA, exitos);

    const pasionFlag = actorA?.system?.pasionFlag ?? "";
    let pasionEfecto = null;
    if (pasionFlag) {
      pasionEfecto = TQRoll._aplicarPasion(resultado, exitos);
      if (pasionEfecto) resultado = pasionEfecto.resultado;
      await actorA.update({ "system.pasionFlag": "" });
    }

    const datosChat = {
      etiqueta: `Tirada Enfrentada: ${habNombreA} vs ${habNombreB}`, esEnfrentada: true,
      nombreA: actorA?.name ?? "Iniciador", habNombreA, puntuacionA: habTotalA, bonificadorA: bonusA || null,
      dadoDisplayA: dadoDisplayACustom ?? TQRoll._dadoDisplay(dadoTotalA, []), totalA,
      nombreB: actorB?.name ?? "Oponente", habNombreB, puntuacionB: habTotalB, dadoDisplayB, totalB,
      exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos),
      pasionEfecto: pasionEfecto?.texto ?? null, debilitado: debilitadoA, dolorExtremo: dolorExtremoA
    };

    const contenido = await foundry.applications.handlebars.renderTemplate("systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat);
    await ChatMessage.create({ speaker: actorA ? ChatMessage.getSpeaker({ actor: actorA }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(modoTirada) });

    if (resultado.css.includes("complicacion")) await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actorA);
  }
}
