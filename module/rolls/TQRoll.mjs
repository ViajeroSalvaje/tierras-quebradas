const { DialogV2 } = foundry.applications.api;
import { tirarComplicacion, TABLA_COMPLICACIONES_MELE, TABLA_COMPLICACIONES_MAGIA } from "../tablas/TQTablasSucesos.mjs";
import { TOPES_HABILIDAD, HABILIDADES_OPCIONES, ARMA_A_HABILIDAD_PNJ, HABILIDADES_BLIND_GM } from "../helpers/habilidades.mjs";

export class TQRoll {
  static _hasLucky(actor) {
    return actor?.items.some(i => i.type === "rasgo" && i.name === "Buena suerte") ?? false;
  }

  static async tirar(etiqueta, puntuacion, dificultad, opciones = {}) {
    const { bonificador = 0, flavor = "", actor = null, targetActor = null, modo = null, danho = null, tablaComplicacion = null, esCombate = false, topeInfo = null, autoExito = false, esRepeticion = false, habClave = null, rollMode = null, dosFortuna = false, luckyDosFortuna = false, mixedDosFortuna = false, etiquetaEnDesglose = false, modDesglose = null, puntuacionMostrada = null, pmRecuperadoBase = null, pmRecuperadoExito = null, pmRecuperadoCritico = null, siguienteRango = false, escudoDoble = false, modoRezo = false } = opciones;
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
        if (mixedDosFortuna) {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 1), "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 1) });
        } else if (luckyDosFortuna) {
          await actor.update({ "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 2) });
        } else {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 2) });
        }
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
      pd = await TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal, danho.bonoDano ?? 0);
    }
    if (siguienteRango && pd?.total != null) {
      pd = { ...pd, total: Math.floor(pd.total / 2), formula: pd.formula + " ÷2" };
    }

    let proteccionTarget = 0, danhoAplicado = null;
    if (pd?.total != null && targetActor && modo === "distancia") {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho.tipo ?? "cortante", escudoDoble);
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
    }

    const pmRecuperado = pmRecuperadoExito !== null ? (exitos >= 10 && pmRecuperadoCritico != null ? pmRecuperadoCritico : exitos >= 0 ? pmRecuperadoExito : (pmRecuperadoBase ?? 0)) : null;
    const datosChat = {
      etiqueta, puntuacion, bonificador: bonusFinal, dificultad, debilitado, dolorExtremo, dado: dadoTotal, dadoDisplay: autoExito ? "—" : (dadoDisplayCustom ?? TQRoll._dadoDisplay(dadoTotal, tiradas)), total, exitos, resultado, css: resultado.css, criticos: esCombate ? TQRoll._criticosTexto(exitos) : null, pd, proteccionTarget: proteccionTarget || null, danhoAplicado, pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null, topeInfo, mostrarFortuna: !autoExito && !esRepeticion && !dosFortuna, mostrarLucky: !autoExito && !esRepeticion && !dosFortuna && actor?.type === "pj" && TQRoll._hasLucky(actor), actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null, etiquetaEnDesglose, modDesglose, puntuacionMostrada, mostrarRecuperarPM: pmRecuperado !== null && !esCombate, pmRecuperado: pmRecuperado ?? 0, mostrarRezo: modoRezo && !esCombate
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(modoTirada), flags: {
        "tierras-quebradas": {
          etiqueta, puntuacion, dificultad, bonificador, rollMode: modoTirada, bonusFinalOriginal: bonusFinal, actorId: actor?.id ?? null, habClave, tablaComplicacion: tablaComplicacion ?? null, esRepeticion, totalOriginal: total, exitosOriginales: exitos, resultadoCssOriginal: resultado.css, resultadoLabelOriginal: resultado.label, dadoDisplayOriginal: autoExito ? "—" : TQRoll._dadoDisplay(dadoTotal, tiradas), debilitadoOriginal: debilitado, dolorExtremoOriginal: dolorExtremo, danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoNoLetal: danho?.noLetal ?? false, danhoTipo: danho?.tipo ?? null, danhoBono: danho?.bonoDano ?? 0, targetActorId: targetActor?.id ?? null, proteccionTargetOriginal: proteccionTarget || 0, danhoAplicadoOriginal: danhoAplicado ?? null, pmRecuperadoBase: pmRecuperadoBase ?? null, pmRecuperadoExito: pmRecuperadoExito ?? null, pmRecuperadoCritico: pmRecuperadoCritico ?? null, pmRecuperadoOriginal: pmRecuperado ?? null, siguienteRango, escudoDoble, modoRezo
        }
      }
    });

    if (!autoExito && tablaComplicacion && resultado.css.includes("complicacion")) {
      const tabla = tablaComplicacion === "magia" ? TABLA_COMPLICACIONES_MAGIA : TABLA_COMPLICACIONES_MELE;
      for (let i = 0; i < numComplicaciones; i++) await tirarComplicacion(tabla, actor);
    }

    return { total, exitos, resultado, dificultad, autoExito };
  }

  static async repetirConFortuna(messageId, { desdePoolLucky = false } = {}) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const { etiqueta, puntuacion, dificultad, bonificador: bonOrig, superioridad = 0, actorId, tablaComplicacion: tablaOrig, totalOriginal, exitosOriginales, resultadoCssOriginal, resultadoLabelOriginal, dadoDisplayOriginal, bonusFinalOriginal, debilitadoOriginal, dolorExtremoOriginal, rollMode: modoTirada, danoArma, danhoMd, danhoNoLetal, danhoTipo, danhoBono = 0, targetActorId, proteccionTargetOriginal, danhoAplicadoOriginal, danoRival, mdRival, tipoRival, desgloseHechizo, requiereTiradaEspiritu, bonusEspiritu: bonusEspirituOrig, pmRecuperadoBase, pmRecuperadoExito, pmRecuperadoCritico = null, atacanteNombre, rivalNombre, dadoDisplayRival, puntuacionRival, bonificadorRival, modLongitud, modLongitudRival, siguienteRango: sigRango, escudoDoble = false, esDistanciaEnfrentada = false, defEfectivo = null, defRawTotal = null, modoRezo = false } = flags;

    const actor = game.actors.get(actorId);
    if (!actor) return;
    const fortuna = actor.system.fortuna;
    if (desdePoolLucky) {
      if ((fortuna?.lucky ?? 0) <= 0) return;
    } else {
      if ((fortuna?.actual ?? 0) <= 0) return;
    }

    const debilitado = actor.system.salud?.debilitado ?? false;
    const dolorExtremo = actor.system.salud?.dolorExtremo ?? false;
    const tamanoDado = debilitado ? 6 : 10;
    const bonusFinalNuevo = (bonOrig ?? 0) + (dolorExtremo ? -2 : 0);

    const rollNuevo = await TQRoll._tirarExplosivo(tamanoDado, modoTirada);
    const dadoNuevo = rollNuevo.dado;
    const dadoTotalNuevo = rollNuevo.total;
    const totalNuevo = dadoTotalNuevo + (puntuacion ?? 0) + bonusFinalNuevo + superioridad;
    const exitosNuevos = totalNuevo - (dificultad ?? 15);
    const resultadoNuevo = TQRoll._clasificarResultado(dadoNuevo, exitosNuevos);
    const dadoDisplayNuevo = TQRoll._dadoDisplay(dadoTotalNuevo, rollNuevo.tiradas);

    let pdOriginal = null, pdNuevo = null;
    if (danoArma !== null && danoArma !== undefined) {
      if (exitosOriginales >= 0) pdOriginal = await TQRoll.calcDanho(danoArma, danhoMd ?? 0, exitosOriginales, danhoNoLetal ?? false, danhoBono ?? 0);
      if (exitosNuevos >= 0) pdNuevo = await TQRoll.calcDanho(danoArma, danhoMd ?? 0, exitosNuevos, danhoNoLetal ?? false, danhoBono ?? 0);
    }
    if (sigRango) {
      if (pdOriginal?.total != null) pdOriginal = { ...pdOriginal, total: Math.floor(pdOriginal.total / 2), formula: pdOriginal.formula + " ÷2" };
      if (pdNuevo?.total != null) pdNuevo = { ...pdNuevo, total: Math.floor(pdNuevo.total / 2), formula: pdNuevo.formula + " ÷2" };
    }

    let pdRivalOriginal = null, pdRivalNuevo = null;
    let danhoRivOrig = null, danhoRivNuevo = null, protJugador = 0;
    if (danoRival) {
      protJugador = TQRoll._calcularProteccion(actor, tipoRival ?? "cortante");
      if (exitosOriginales < 0) {
        pdRivalOriginal = await TQRoll.calcDanho(danoRival, mdRival ?? 0, Math.abs(exitosOriginales), false);
        if (pdRivalOriginal?.total != null) danhoRivOrig = Math.max(0, pdRivalOriginal.total - protJugador);
      }
      if (exitosNuevos < 0) {
        pdRivalNuevo = await TQRoll.calcDanho(danoRival, mdRival ?? 0, Math.abs(exitosNuevos), false);
        if (pdRivalNuevo?.total != null) danhoRivNuevo = Math.max(0, pdRivalNuevo.total - protJugador);
      }
    }

    if (desdePoolLucky) {
      await actor.update({ "system.fortuna.lucky": Math.max(0, (fortuna.lucky ?? 0) - 1) });
    } else {
      await actor.update({ "system.fortuna.actual": Math.max(0, fortuna.actual - 1) });
    }

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion.hbs", {
        etiqueta, original: { dadoDisplay: dadoDisplayOriginal, total: totalOriginal, exitos: exitosOriginales, label: resultadoLabelOriginal, css: resultadoCssOriginal }, nuevo: { dadoDisplay: dadoDisplayNuevo, total: totalNuevo, exitos: exitosNuevos, label: resultadoNuevo.label, css: resultadoNuevo.css }
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }), content: contenido, ...TQRoll._rollModeData(modoTirada), flags: {
        "tierras-quebradas": {
          esEleccionFortuna: true, etiqueta, puntuacion: puntuacion ?? 0, dificultad: dificultad ?? 15, actorId, tablaComplicacion: tablaOrig ?? null, rollMode: modoTirada,
          danoArma: danoArma ?? null, danhoMd: danhoMd ?? 0, danhoNoLetal: danhoNoLetal ?? false, danhoTipo: danhoTipo ?? null, danhoBono: danhoBono ?? 0, targetActorId: targetActorId ?? null, danoRival: danoRival ?? null, mdRival: mdRival ?? 0, tipoRival: tipoRival ?? "cortante", desgloseHechizo: desgloseHechizo ?? null, requiereTiradaEspiritu: requiereTiradaEspiritu ?? false, bonusEspiritu: bonusEspirituOrig ?? 0, pmRecuperadoBase: pmRecuperadoBase ?? null, pmRecuperadoExito: pmRecuperadoExito ?? null, pmRecuperadoCritico: pmRecuperadoCritico ?? null, siguienteRango: sigRango ?? false, escudoDoble, esDistanciaEnfrentada, defEfectivo: defEfectivo ?? null, defRawTotal: defRawTotal ?? null, modoRezo: modoRezo ?? false,
          atacanteNombre: atacanteNombre ?? null, rivalNombre: rivalNombre ?? null, dadoDisplayRival: dadoDisplayRival ?? null, puntuacionRival: puntuacionRival ?? 0, bonificadorRival: bonificadorRival ?? 0, modLongitud: modLongitud ?? 0, modLongitudRival: modLongitudRival ?? 0,
          original: { dadoDisplay: dadoDisplayOriginal, total: totalOriginal, exitos: exitosOriginales, css: resultadoCssOriginal, label: resultadoLabelOriginal, bonificador: bonusFinalOriginal ?? 0, debilitado: debilitadoOriginal ?? false, dolorExtremo: dolorExtremoOriginal ?? false, pd: pdOriginal, proteccionTarget: proteccionTargetOriginal || null, danhoAplicado: danhoAplicadoOriginal ?? null, pdRival: pdRivalOriginal, proteccionJugador: protJugador || null, danhoRivalAplicado: danhoRivOrig, pmRecuperado: pmRecuperadoExito !== null ? (exitosOriginales >= 10 && pmRecuperadoCritico != null ? pmRecuperadoCritico : exitosOriginales >= 0 ? pmRecuperadoExito : (pmRecuperadoBase ?? 0)) : null },
          nuevo: { dadoDisplay: dadoDisplayNuevo, total: totalNuevo, exitos: exitosNuevos, css: resultadoNuevo.css, label: resultadoNuevo.label, bonificador: bonusFinalNuevo, debilitado, dolorExtremo, pd: pdNuevo, pdRival: pdRivalNuevo, proteccionJugador: protJugador || null, danhoRivalAplicado: danhoRivNuevo, pmRecuperado: pmRecuperadoExito !== null ? (exitosNuevos >= 10 && pmRecuperadoCritico != null ? pmRecuperadoCritico : exitosNuevos >= 0 ? pmRecuperadoExito : (pmRecuperadoBase ?? 0)) : null }
        }
      }
    });
  }

  static async elegirResultadoFortuna(messageId, eleccion) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const { etiqueta, puntuacion, dificultad, actorId, tablaComplicacion: tablaOrig, rollMode: modoTirada, atacanteNombre, rivalNombre, dadoDisplayRival, puntuacionRival, bonificadorRival, modLongitud, modLongitudRival, modoRezo = false } = flags;
    const actor = game.actors.get(actorId);
    if (!actor) return;

    const datos = flags[eleccion];
    const { danoArma, danhoMd, danhoNoLetal, danhoTipo, danhoBono, targetActorId } = flags;

    let pd = datos.pd ?? null;
    let proteccionTarget = datos.proteccionTarget ?? null;
    let danhoAplicado = datos.danhoAplicado ?? null;
    let pdRival = datos.pdRival ?? null;
    let proteccionJugador = datos.proteccionJugador ?? null;
    let danhoRivalAplicado = datos.danhoRivalAplicado ?? null;

    const bonusEspirituFinal = 0;

    // Para "nuevo": calcular protección y daño neto (sin aplicar — lo hace el botón)
    if (eleccion === "nuevo" && pd?.total != null && danhoAplicado === null) {
      const targetActor = targetActorId ? game.actors.get(targetActorId) : null;
      if (targetActor) {
        proteccionTarget = TQRoll._calcularProteccion(targetActor, danhoTipo ?? "cortante", flags.escudoDoble ?? false) || null;
        danhoAplicado = Math.max(0, pd.total - (proteccionTarget ?? 0));
      }
    }

    const pmRecuperadoElegido = tablaOrig ? null : (datos.pmRecuperado ?? null);
    const datosChat = {
      etiqueta, puntuacion: puntuacion ?? 0, dificultad: dificultad ?? 15, dadoDisplay: datos.dadoDisplay, total: datos.total, exitos: datos.exitos, resultado: { css: datos.css, label: datos.label }, css: datos.css, bonificador: datos.bonificador ?? 0, debilitado: datos.debilitado ?? false, dolorExtremo: datos.dolorExtremo ?? false, criticos: null, pd, proteccionTarget, danhoAplicado, pdRival, proteccionJugador, danhoRivalAplicado, desgloseHechizo: flags.desgloseHechizo ?? null, mostrarAplicarResultado: flags.tablaComplicacion === "magia" && (datos.exitos ?? -1) >= 0, bonusEspiritu: bonusEspirituFinal, requiereTiradaEspiritu: flags.requiereTiradaEspiritu ?? false, pasionEfecto: null, actorImg: actor?.img ?? null, topeInfo: null, mostrarFortuna: false, actorId: actorId ?? null, targetActorId: targetActorId ?? null, mostrarRecuperarPM: pmRecuperadoElegido !== null, pmRecuperado: pmRecuperadoElegido ?? 0, mostrarRezo: modoRezo,
      esMelee: tablaOrig === "melee" || (flags.esDistanciaEnfrentada ?? false), atacanteNombre: atacanteNombre ?? null, rivalNombre: rivalNombre ?? null, dadoDisplayRival: dadoDisplayRival ?? null, puntuacionRival: puntuacionRival ?? 0, bonificadorRival: bonificadorRival ?? 0, totalRival: dificultad ?? 0, modLongitud: modLongitud ?? 0, modLongitudRival: modLongitudRival ?? 0,
      defRawTotal: flags.defRawTotal ?? null
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
      "", game.i18n.localize("TQ.Criticos.efecto1"), game.i18n.localize("TQ.Criticos.efecto2"), game.i18n.localize("TQ.Criticos.efecto3")
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
        return { resultado, texto: game.i18n.localize("TQ.Pasion.SegundoCritico") };
      }
      const nuevoCss = resultado.css.includes("complicacion") ? "critico complicacion" : "critico";
      return {
        resultado: { label: nuevoCss.includes("complicacion") ? "TQ.Tirada.CriticoComplicacion" : "TQ.Tirada.ExitoCritico", css: nuevoCss }, texto: game.i18n.localize("TQ.Pasion.Critico")
      };
    }
    if (resultado.css.includes("complicacion")) {
      return { resultado, texto: game.i18n.localize("TQ.Pasion.ComplicacionYaTenias") };
    }
    const nuevoCss = resultado.css === "fallo" ? "complicacion" : resultado.css + " complicacion";
    return {
      resultado: { label: "TQ.Tirada.Complicacion", css: nuevoCss }, texto: game.i18n.localize("TQ.Pasion.Complicacion")
    };
  }

  static async dialogoTirada(etiqueta, puntuacion, opciones = {}) {
    const { modo = "normal", longitudArma = "media", targetActor = null, dificultadPorDefecto = 15, dificultadForzada = null, danho = null, actor = null, habClave = null, extraTopes = [], rivalDatosDA = null, actoresMapDA = null, esProyectil = false, dialogWidth = null, dialogClasses = [], dialogTitle = null, bonificadorDefecto = 0 } = opciones;

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

    let rivalDatos = TQRoll._prepararDatosRival(targetActor);
    let rivalPrerollData = null;
    if (modo === "melee" && targetActor) {
      const armaRival = await TQRoll._seleccionarArmaRival(targetActor);
      rivalDatos = TQRoll._extraerDatosArmaRival(targetActor, armaRival);
      const modoTiradaActual = rollModeEfectivo ?? game.settings.get("core", "rollMode");
      const debilitadoR = targetActor.system?.salud?.debilitado ?? false;
      const preroll = await TQRoll._tirarExplosivo(debilitadoR ? 6 : 10, modoTiradaActual);
      const modRivalPre = TQRoll._calcularModLongitud(rivalDatos.longitud, longitudArma);
      const totalRivalPre = preroll.total + rivalDatos.puntuacion + modRivalPre;
      await TQRoll._publicarPrerollRival(targetActor, rivalDatos, preroll, modRivalPre, totalRivalPre, modoTiradaActual);
      rivalPrerollData = { dado: preroll.dado, total: preroll.total, tiradas: preroll.tiradas };
    }
    const jugadorDatos = { danoArma: danho?.danoArma ?? "—", md: danho?.md ?? 0, tipo: danho?.tipo ?? "—" };

    const escalaDif = opciones.escalaDif ?? "habilidad";
    const fortunaActual = actor?.system?.fortuna?.actual ?? 0;
    const luckyActual = TQRoll._hasLucky(actor) ? (actor?.system?.fortuna?.lucky ?? 0) : 0;
    const dosFortDisponible = fortunaActual >= 2 || luckyActual >= 2 || (fortunaActual >= 1 && luckyActual >= 1);
    const aliados = modo === "distancia"
      ? (game.scenes.active?.tokens ?? [])
          .filter(t => t.actor?.type === "pj" && t.actor?.id !== actor?.id)
          .map(t => ({ id: t.actor.id, name: t.name }))
      : [];
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-dialogo.hbs", { etiqueta, puntuacion, modo, longitudArma, jugadorDatos, rivalDatos, rivalYaLanzado: rivalPrerollData !== null, rivalDatosGA: opciones.rivalDatosGA ?? null, rivalDatosDA, dificultadPorDefecto: String(dificultadForzada ?? dificultadPorDefecto), dificultadForzada: dificultadForzada != null ? String(dificultadForzada) : null, topesOpciones, escalaDif, aliados, bonificadorDefecto }
    );

    const eleccion = await DialogV2.wait({
      window: { title: dialogTitle ?? game.i18n.format("TQ.Tirada.Label", { habilidad: etiqueta }) }, classes: [
        "tq-tirada-dialog", ...(!dosFortDisponible ? ["tq-fort-insuf"] : []), ...(modo !== "normal" ? ["tq-sin-exito-auto"] : []), ...dialogClasses
      ], content, rejectClose: false, buttons: [
        {
          action: "tirar", label: game.i18n.localize("TQ.Botones.Lanzar"), default: true, callback: (_ev, button) => {
            const campos = button.form.elements;
            const topeActivo = campos.tope_activo?.checked ?? false;
            const topeClave = topeActivo ? (campos.tope_habilidad?.value ?? null) : null;
            if (modo === "melee") {
              const supActivo = campos.superioridad_activo?.checked ?? false;
              const superioridad = supActivo ? (parseInt(campos.superioridad_valor?.value) || 0) : 0;
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, longitudRival: campos.rival_longitud?.value || "media", bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, danoRival: campos.rival_danoArma?.value?.trim() || "0", mdRival: parseInt(campos.rival_md?.value) || 0, tipoRival: campos.rival_tipo?.value || "cortante", bonificador: parseInt(campos.bonificador?.value) || 0, superioridad, topeClave
              };
            }
            if (modo === "melee-multiple") {
              return { bonificador: parseInt(campos.bonificador?.value) || 0, topeClave };
            }
            if (modo === "golpe-aislado") {
              const supActivo = campos.superioridad_activo?.checked ?? false;
              const superioridad = supActivo ? (parseInt(campos.superioridad_valor?.value) || 0) : 0;
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, bonificador: parseInt(campos.bonificador?.value) || 0, superioridad, debilitadoBonus: parseInt(campos.debilitado_bonus?.value) || 0, targetActorUuid: campos.target_actor_uuid?.value || null
              };
            }
            if (modo === "trata-de-escapar") {
              const supActivo = campos.superioridad_activo?.checked ?? false;
              const superioridad = supActivo ? (parseInt(campos.superioridad_valor?.value) || 0) : 0;
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, bonificador: parseInt(campos.bonificador?.value) || 0, superioridad, targetActorUuid: campos.target_actor_uuid?.value || null
              };
            }
            if (modo === "distancia-cubierto" || modo === "distancia-escudo") {
              const dist = parseInt(campos.distancia?.value) || 10;
              const sigRango = campos.siguiente_rango?.checked ?? false;
              const bonApuntar = (campos.apuntando?.checked ?? false) ? 2 : 0;
              return {
                distanciaDif: sigRango ? 25 : dist, bonificador: (parseInt(campos.bonificador?.value) || 0) + bonApuntar, topeClave, sigRango,
                puntuacionDefensor: parseInt(campos.defensor_puntuacion?.value) || 0,
                bonificadorDefensor: parseInt(campos.defensor_bonificador?.value) || 0,
                targetActorUuid: campos.target_actor_uuid_da?.value || null
              };
            }
            if (modo === "distancia") {
              const dist = parseInt(campos.distancia?.value) || 10;
              const esq = parseInt(campos.esquivar_blanco?.value) || 0;
              const sigRango = campos.siguiente_rango?.checked ?? false;
              const bonApuntar = (campos.apuntando?.checked ?? false) ? 2 : 0;
              return {
                dificultad: sigRango ? 25 : Math.max(dist, esq), bonificador: (parseInt(campos.bonificador?.value) || 0) + bonApuntar, topeClave, enMelee: campos.en_melee?.checked ?? false, aliadoId: campos.aliado_id?.value ?? null, siguienteRango: sigRango
              };
            }
            return {
              dificultad: parseInt(campos.dificultad?.value) || 15, bonificador: parseInt(campos.bonificador?.value) || 0, topeClave
            };
          }
        }, {
          action: "dos-fortuna", label: game.i18n.localize("TQ.Botones.UsarDosFortuna"), callback: (_ev, button) => {
            if (fortunaActual < 2 && luckyActual < 2 && !(fortunaActual >= 1 && luckyActual >= 1)) return null;
            const luckyDosFortuna = fortunaActual < 2 && luckyActual >= 2;
            const mixedDosFortuna = !luckyDosFortuna && fortunaActual < 2 && fortunaActual >= 1 && luckyActual >= 1;
            const campos = button.form.elements;
            const topeActivo = campos.tope_activo?.checked ?? false;
            const topeClave = topeActivo ? (campos.tope_habilidad?.value ?? null) : null;
            if (modo === "melee") {
              const supActivo = campos.superioridad_activo?.checked ?? false;
              const superioridad = supActivo ? (parseInt(campos.superioridad_valor?.value) || 0) : 0;
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, longitudRival: campos.rival_longitud?.value || "media", bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, danoRival: campos.rival_danoArma?.value?.trim() || "0", mdRival: parseInt(campos.rival_md?.value) || 0, tipoRival: campos.rival_tipo?.value || "cortante", bonificador: parseInt(campos.bonificador?.value) || 0, superioridad, topeClave, dosFortuna: true, luckyDosFortuna, mixedDosFortuna
              };
            }
            if (modo === "melee-multiple") {
              return { bonificador: parseInt(campos.bonificador?.value) || 0, topeClave, dosFortuna: true, luckyDosFortuna, mixedDosFortuna };
            }
            if (modo === "golpe-aislado") {
              const supActivo = campos.superioridad_activo?.checked ?? false;
              const superioridad = supActivo ? (parseInt(campos.superioridad_valor?.value) || 0) : 0;
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, bonificador: parseInt(campos.bonificador?.value) || 0, superioridad, debilitadoBonus: parseInt(campos.debilitado_bonus?.value) || 0, targetActorUuid: campos.target_actor_uuid?.value || null, dosFortuna: true, luckyDosFortuna, mixedDosFortuna
              };
            }
            if (modo === "trata-de-escapar") {
              const supActivo = campos.superioridad_activo?.checked ?? false;
              const superioridad = supActivo ? (parseInt(campos.superioridad_valor?.value) || 0) : 0;
              return {
                puntuacionRival: parseInt(campos.rival_puntuacion?.value) || 0, bonificadorRival: parseInt(campos.rival_bonificador?.value) || 0, bonificador: parseInt(campos.bonificador?.value) || 0, superioridad, targetActorUuid: campos.target_actor_uuid?.value || null, dosFortuna: true, luckyDosFortuna, mixedDosFortuna
              };
            }
            if (modo === "distancia-cubierto" || modo === "distancia-escudo") {
              const dist = parseInt(campos.distancia?.value) || 10;
              const sigRango = campos.siguiente_rango?.checked ?? false;
              const bonApuntar = (campos.apuntando?.checked ?? false) ? 2 : 0;
              return {
                distanciaDif: sigRango ? 25 : dist, bonificador: (parseInt(campos.bonificador?.value) || 0) + bonApuntar, topeClave, sigRango, dosFortuna: true, luckyDosFortuna, mixedDosFortuna,
                puntuacionDefensor: parseInt(campos.defensor_puntuacion?.value) || 0,
                bonificadorDefensor: parseInt(campos.defensor_bonificador?.value) || 0,
                targetActorUuid: campos.target_actor_uuid_da?.value || null
              };
            }
            if (modo === "distancia") {
              const dist = parseInt(campos.distancia?.value) || 10;
              const esq = parseInt(campos.esquivar_blanco?.value) || 0;
              const sigRango = campos.siguiente_rango?.checked ?? false;
              const dif = sigRango ? 25 : Math.max(dist, esq);
              const bonApuntar = (campos.apuntando?.checked ?? false) ? 2 : 0;
              return {
                dificultad: dif, bonificador: (parseInt(campos.bonificador?.value) || 0) + bonApuntar, topeClave, dosFortuna: true, luckyDosFortuna, mixedDosFortuna, enMelee: campos.en_melee?.checked ?? false, aliadoId: campos.aliado_id?.value ?? null, siguienteRango: sigRango
              };
            }
            const dificultad = parseInt(campos.dificultad?.value) || 15;
            return {
              dificultad, bonificador: parseInt(campos.bonificador?.value) || 0, topeClave, dosFortuna: true, luckyDosFortuna, mixedDosFortuna
            };
          }
        }, {
          action: "cancelar", label: game.i18n.localize("TQ.Cancelar") || "Cancelar", callback: () => null
        }, {
          action: "auto", label: game.i18n.localize("TQ.Botones.ExitoAutomatico"), callback: (_ev, button) => {
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
      const margen = puntuacionFinal + (eleccion.bonificador ?? 0) - (dificultadForzada ?? eleccion.dificultad);
      if (margen < -1) {
        const msg = game.i18n.format("TQ.Warn.ExitoAutoNoDisponible", { margen });
        ui.notifications.warn(msg);
        await ChatMessage.create({
          speaker: opciones.actor ? ChatMessage.getSpeaker({ actor: opciones.actor }) : ChatMessage.getSpeaker(), content: `<div class="tq-aviso">${msg}</div>`, ...TQRoll._rollModeData()
        });
        return null;
      }
    }

    if (modo === "melee") {
      return TQRoll.tirarMelee(etiqueta, puntuacionFinal, longitudArma, eleccion, { ...opciones, targetActor, topeInfo, puntuacionMostrada, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false, luckyDosFortuna: eleccion.luckyDosFortuna ?? false, mixedDosFortuna: eleccion.mixedDosFortuna ?? false, rivalPreroll: rivalPrerollData });
    }

    if (modo === "melee-multiple") {
      return { puntuacionFinal, bonificador: eleccion.bonificador ?? 0, dosFortuna: eleccion.dosFortuna ?? false, luckyDosFortuna: eleccion.luckyDosFortuna ?? false, mixedDosFortuna: eleccion.mixedDosFortuna ?? false, modDesgloseLocal };
    }

    if (modo === "golpe-aislado") {
      const targetActorGA = targetActor ?? (eleccion.targetActorUuid ? opciones.actoresMapGA?.get(eleccion.targetActorUuid) ?? null : null);
      return TQRoll.tirarGolpeAislado(etiqueta, puntuacionFinal, eleccion, { ...opciones, targetActor: targetActorGA, topeInfo, puntuacionMostrada, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false, luckyDosFortuna: eleccion.luckyDosFortuna ?? false, mixedDosFortuna: eleccion.mixedDosFortuna ?? false });
    }

    if (modo === "trata-de-escapar") {
      const targetActorTE = targetActor ?? (eleccion.targetActorUuid ? opciones.actoresMapGA?.get(eleccion.targetActorUuid) ?? null : null);
      return TQRoll.tirarTrataDeEscapar(etiqueta, puntuacionFinal, eleccion, { ...opciones, targetActor: targetActorTE, topeInfo, puntuacionMostrada, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false, luckyDosFortuna: eleccion.luckyDosFortuna ?? false, mixedDosFortuna: eleccion.mixedDosFortuna ?? false });
    }

    if (modo === "distancia-cubierto" || modo === "distancia-escudo") {
      const targetActorDA = targetActor ?? (eleccion.targetActorUuid ? actoresMapDA?.get(eleccion.targetActorUuid) ?? null : null);
      return TQRoll.tirarDistanciaEnfrentada(etiqueta, puntuacionFinal, eleccion, { ...opciones, targetActor: targetActorDA, topeInfo, puntuacionMostrada, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false, luckyDosFortuna: eleccion.luckyDosFortuna ?? false, mixedDosFortuna: eleccion.mixedDosFortuna ?? false, modo });
    }

    const resultado = await TQRoll.tirar(etiqueta, puntuacionFinal, dificultadForzada ?? eleccion.dificultad, {
      ...opciones, bonificador: eleccion.bonificador, topeInfo, puntuacionMostrada, autoExito: eleccion.autoExito ?? false, rollMode: rollModeEfectivo, dosFortuna: eleccion.dosFortuna ?? false, luckyDosFortuna: eleccion.luckyDosFortuna ?? false, mixedDosFortuna: eleccion.mixedDosFortuna ?? false, siguienteRango: eleccion.siguienteRango ?? false
    });
    if (!resultado) return null;
    return { ...resultado, enMelee: eleccion.enMelee ?? false, aliadoId: eleccion.aliadoId ?? null };
  }

  static async tirarMelee(etiqueta, puntuacion, longitudJugador, eleccion, opciones = {}) {
    const { actor = null, danho = null, targetActor = null, topeInfo = null, rollMode: rollModeOpc = null, dosFortuna = false, luckyDosFortuna = false, mixedDosFortuna = false, modDesglose = null, puntuacionMostrada = null, rivalPreroll = null } = opciones;
    const { puntuacionRival, longitudRival, bonificadorRival, danoRival, mdRival, tipoRival, bonificador, superioridad = 0 } = eleccion;
    const modoTirada = rollModeOpc ?? game.settings.get("core", "rollMode");

    const modJugador = TQRoll._calcularModLongitud(longitudJugador, longitudRival);
    const modRival = TQRoll._calcularModLongitud(longitudRival, longitudJugador);

    const debilitadoJ = actor?.system?.salud?.debilitado ?? false;
    const dolorExtremoJ = actor?.system?.salud?.dolorExtremo ?? false;
    const dadoJ_size = debilitadoJ ? 6 : 10;
    const bonusJ = bonificador + superioridad + (dolorExtremoJ ? -2 : 0);

    const debilitadoR = targetActor?.system?.salud?.debilitado ?? false;
    const dadoR_size = debilitadoR ? 6 : 10;

    let dadoJ, dadoTotalJ, tiradasJ, dadoDisplayJCustom = null;
    if (dosFortuna) {
      const rollJ1 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      const rollJ2 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      if (actor) {
        if (mixedDosFortuna) {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 1), "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 1) });
        } else if (luckyDosFortuna) {
          await actor.update({ "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 2) });
        } else {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 2) });
        }
      }
      dadoTotalJ = rollJ1.total + rollJ2.total;
      tiradasJ = rollJ1.tiradas;
      const compJ = (rollJ1.dado === 1 ? 1 : 0) + (rollJ2.dado === 1 ? 1 : 0);
      dadoJ = compJ > 0 ? 1 : Math.max(rollJ1.dado, rollJ2.dado);
      dadoDisplayJCustom = `${TQRoll._dadoDisplay(rollJ1.total, rollJ1.tiradas)} + ${TQRoll._dadoDisplay(rollJ2.total, rollJ2.tiradas)}`;
    } else {
      ({ dado: dadoJ, total: dadoTotalJ, tiradas: tiradasJ } = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada));
    }
    const { dado: dadoR, total: dadoTotalR, tiradas: tiradasR } = rivalPreroll ?? await TQRoll._tirarExplosivo(dadoR_size, modoTirada);

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
            esTablasMelee: true, etiqueta, puntuacion, bonificador: bonusJ, modLongitud: modJugador, dadoDisplayJ, totalJugador, dadoJ, puntuacionRival, bonificadorRival, modLongitudRival: modRival, dadoDisplayR: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival, actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null, danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoTipo: danho?.tipo ?? "cortante", danhoNoLetal: danho?.noLetal ?? false, danhoBono: danho?.bonoDano ?? 0, danoRival, mdRival, tipoRival, rollMode: modoTirada, pasionEfecto: pasionEfecto?.texto ?? null, topeInfo: topeInfo ?? null
          }
        }
      });
      return { total: totalJugador, exitos: 0, resultado };
    }

    let pd = null;
    if (danho !== null && exitos > 0) {
      pd = await TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal, danho.bonoDano ?? 0);
    }

    let pdRival = null;
    if (exitos < 0) {
      pdRival = await TQRoll.calcDanho(danoRival, mdRival, Math.abs(exitos), false);
    }

    let danhoAplicado = null, proteccionTarget = 0;
    let danhoRivalAplicado = null, proteccionJugador = 0;

    if (pd?.total != null && targetActor) {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho?.tipo);
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
    }

    if (pdRival?.total != null && actor) {
      proteccionJugador = TQRoll._calcularProteccion(actor, tipoRival ?? "cortante");
      danhoRivalAplicado = Math.max(0, pdRival.total - proteccionJugador);
    }

    const datosChat = {
      etiqueta, esMelee: true, puntuacion, bonificador, superioridad: superioridad || null, modLongitud: modJugador, dado: dadoTotalJ, dadoDisplay: dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ), total: totalJugador, puntuacionRival, bonificadorRival, modLongitudRival: modRival, dadoRival: dadoTotalR, dadoDisplayRival: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival, exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos), pd, danhoAplicado, proteccionTarget, pdRival, danhoRivalAplicado, proteccionJugador, pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null, atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", topeInfo, modDesglose, puntuacionMostrada, mostrarFortuna: !dosFortuna, mostrarLucky: !dosFortuna && actor?.type === "pj" && TQRoll._hasLucky(actor), actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content: contenido, ...TQRoll._rollModeData(modoTirada), flags: {
        "tierras-quebradas": {
          etiqueta, puntuacion, dificultad: totalRival, bonificador: bonusJ, rollMode: modoTirada, bonusFinalOriginal: bonusJ, actorId: actor?.id ?? null, habClave: null, tablaComplicacion: "melee", esRepeticion: false, totalOriginal: totalJugador, exitosOriginales: exitos, resultadoCssOriginal: resultado.css, resultadoLabelOriginal: resultado.label, dadoDisplayOriginal: dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ), debilitadoOriginal: debilitadoJ, dolorExtremoOriginal: dolorExtremoJ, danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoNoLetal: danho?.noLetal ?? false, danhoTipo: danho?.tipo ?? null, danhoBono: danho?.bonoDano ?? 0, targetActorId: targetActor?.id ?? null, proteccionTargetOriginal: proteccionTarget ?? null, danhoAplicadoOriginal: danhoAplicado ?? null, danoRival: danoRival ?? null, mdRival: mdRival ?? 0, tipoRival: tipoRival ?? "cortante",
          atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", dadoDisplayRival: TQRoll._dadoDisplay(dadoTotalR, tiradasR), puntuacionRival, bonificadorRival, modLongitud: modJugador, modLongitudRival: modRival
        }
      }
    });

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actor);
    }

    return { total: totalJugador, exitos, resultado };
  }

  // ignora melé: rival no lanza dado, dificultad = su valor de esquivar/agilidad
  static async tirarGolpeAislado(etiqueta, puntuacion, eleccion, opciones = {}) {
    const { actor = null, danho = null, targetActor = null, topeInfo = null, rollMode: rollModeOpc = null, dosFortuna = false, luckyDosFortuna = false, mixedDosFortuna = false, modDesglose = null, puntuacionMostrada = null, textoContextual = null } = opciones;
    const { puntuacionRival, bonificadorRival, bonificador, superioridad = 0, debilitadoBonus = 0 } = eleccion;
    const modoTirada = rollModeOpc ?? game.settings.get("core", "rollMode");

    const debilitadoJ = actor?.system?.salud?.debilitado ?? false;
    const dadoJ_size = debilitadoJ ? 6 : 10;

    let dadoJ, dadoTotalJ, tiradasJ, dadoDisplayJCustom = null;
    if (dosFortuna) {
      const rollJ1 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      const rollJ2 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      if (actor) {
        if (mixedDosFortuna) {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 1), "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 1) });
        } else if (luckyDosFortuna) {
          await actor.update({ "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 2) });
        } else {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 2) });
        }
      }
      dadoTotalJ = rollJ1.total + rollJ2.total;
      tiradasJ = rollJ1.tiradas;
      const compJ = (rollJ1.dado === 1 ? 1 : 0) + (rollJ2.dado === 1 ? 1 : 0);
      dadoJ = compJ > 0 ? 1 : Math.max(rollJ1.dado, rollJ2.dado);
      dadoDisplayJCustom = `${TQRoll._dadoDisplay(rollJ1.total, rollJ1.tiradas)} + ${TQRoll._dadoDisplay(rollJ2.total, rollJ2.tiradas)}`;
    } else {
      ({ dado: dadoJ, total: dadoTotalJ, tiradas: tiradasJ } = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada));
    }

    const totalJugador = dadoTotalJ + puntuacion + bonificador + superioridad + debilitadoBonus;
    const totalRival = puntuacionRival;
    const exitos = totalJugador - totalRival;
    let resultado = TQRoll._clasificarResultado(dadoJ, exitos);

    const pasionFlag = actor?.system?.pasionFlag ?? "";
    let pasionEfecto = null;
    if (pasionFlag) {
      pasionEfecto = TQRoll._aplicarPasion(resultado, exitos);
      if (pasionEfecto) resultado = pasionEfecto.resultado;
      await actor.update({ "system.pasionFlag": "" });
    }

    const modDesgloseDisplay = [...(modDesglose ?? [])];
    if (debilitadoBonus > 0) {
      modDesgloseDisplay.push({ label: game.i18n.localize("TQ.Melee.Debilitado"), valor: debilitadoBonus, signo: "+", valorAbs: debilitadoBonus });
    }

    let pd = null;
    if (danho !== null && exitos > 0) {
      pd = await TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal, danho.bonoDano ?? 0);
    }

    let danhoAplicado = null, proteccionTarget = 0;
    if (pd?.total != null && targetActor) {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho?.tipo);
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
    }

    const dadoDisplay = dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ);
    const datosChat = {
      etiqueta, esMelee: true, puntuacion, bonificador, superioridad: superioridad || null, modDesglose: modDesgloseDisplay.length ? modDesgloseDisplay : null,
      dado: dadoTotalJ, dadoDisplay, total: totalJugador,
      puntuacionRival, bonificadorRival: 0, dadoRival: null, dadoDisplayRival: null, totalRival,
      exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos),
      pd, danhoAplicado, proteccionTarget: proteccionTarget || null, pdRival: null, danhoRivalAplicado: null, proteccionJugador: 0,
      pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null,
      atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival",
      topeInfo, puntuacionMostrada, mostrarFortuna: !dosFortuna && actor?.type === "pj", mostrarLucky: !dosFortuna && actor?.type === "pj" && TQRoll._hasLucky(actor),
      actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null,
      textoContextual: textoContextual ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    const bonusFinalOriginal = bonificador + debilitadoBonus;
    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: {
        "tierras-quebradas": {
          etiqueta, puntuacion, dificultad: totalRival, bonificador: bonusFinalOriginal, superioridad, rollMode: modoTirada, bonusFinalOriginal,
          actorId: actor?.id ?? null, habClave: null, tablaComplicacion: "melee", esRepeticion: false,
          totalOriginal: totalJugador, exitosOriginales: exitos, resultadoCssOriginal: resultado.css, resultadoLabelOriginal: resultado.label,
          dadoDisplayOriginal: dadoDisplay, debilitadoOriginal: debilitadoJ, dolorExtremoOriginal: false,
          danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoNoLetal: danho?.noLetal ?? false, danhoTipo: danho?.tipo ?? null, danhoBono: danho?.bonoDano ?? 0,
          targetActorId: targetActor?.id ?? null, proteccionTargetOriginal: proteccionTarget || 0, danhoAplicadoOriginal: danhoAplicado ?? null,
          danoRival: null, mdRival: 0, tipoRival: "cortante",
          atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", dadoDisplayRival: null, puntuacionRival, bonificadorRival: 0
        }
      }
    });

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actor);
    }

    return { total: totalJugador, exitos, resultado };
  }

  // trata de escapar: ambos lanzan dado, sin +2 por debilitado
  static async tirarTrataDeEscapar(etiqueta, puntuacion, eleccion, opciones = {}) {
    const { actor = null, danho = null, targetActor = null, topeInfo = null, rollMode: rollModeOpc = null, dosFortuna = false, luckyDosFortuna = false, mixedDosFortuna = false, modDesglose = null, puntuacionMostrada = null, textoContextual = null } = opciones;
    const { puntuacionRival, bonificadorRival, bonificador, superioridad = 0 } = eleccion;
    const modoTirada = rollModeOpc ?? game.settings.get("core", "rollMode");

    const debilitadoJ = actor?.system?.salud?.debilitado ?? false;
    const dadoJ_size = debilitadoJ ? 6 : 10;

    let dadoJ, dadoTotalJ, tiradasJ, dadoDisplayJCustom = null;
    if (dosFortuna) {
      const rollJ1 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      const rollJ2 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      if (actor) {
        if (mixedDosFortuna) {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 1), "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 1) });
        } else if (luckyDosFortuna) {
          await actor.update({ "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 2) });
        } else {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 2) });
        }
      }
      dadoTotalJ = rollJ1.total + rollJ2.total;
      tiradasJ = rollJ1.tiradas;
      const compJ = (rollJ1.dado === 1 ? 1 : 0) + (rollJ2.dado === 1 ? 1 : 0);
      dadoJ = compJ > 0 ? 1 : Math.max(rollJ1.dado, rollJ2.dado);
      dadoDisplayJCustom = `${TQRoll._dadoDisplay(rollJ1.total, rollJ1.tiradas)} + ${TQRoll._dadoDisplay(rollJ2.total, rollJ2.tiradas)}`;
    } else {
      ({ dado: dadoJ, total: dadoTotalJ, tiradas: tiradasJ } = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada));
    }

    const debilitadoR = targetActor?.system?.salud?.debilitado ?? false;
    const dadoR_size = debilitadoR ? 6 : 10;
    const { dado: dadoR, total: dadoTotalR, tiradas: tiradasR } = await TQRoll._tirarExplosivo(dadoR_size, modoTirada);

    const totalJugador = dadoTotalJ + puntuacion + bonificador + superioridad;
    const totalRival = dadoTotalR + puntuacionRival + bonificadorRival;
    const exitos = totalJugador - totalRival;
    let resultado = TQRoll._clasificarResultado(dadoJ, exitos);

    const pasionFlag = actor?.system?.pasionFlag ?? "";
    let pasionEfecto = null;
    if (pasionFlag) {
      pasionEfecto = TQRoll._aplicarPasion(resultado, exitos);
      if (pasionEfecto) resultado = pasionEfecto.resultado;
      await actor.update({ "system.pasionFlag": "" });
    }

    let pd = null;
    if (danho !== null && exitos > 0) {
      pd = await TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal, danho.bonoDano ?? 0);
    }

    let danhoAplicado = null, proteccionTarget = 0;
    if (pd?.total != null && targetActor) {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho?.tipo);
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
    }

    const dadoDisplay = dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ);
    const dadoDisplayRival = TQRoll._dadoDisplay(dadoTotalR, tiradasR);
    const datosChat = {
      etiqueta, esMelee: true, puntuacion, bonificador, superioridad: superioridad || null, modDesglose: modDesglose?.length ? modDesglose : null,
      dado: dadoTotalJ, dadoDisplay, total: totalJugador,
      puntuacionRival, bonificadorRival, dadoRival: dadoTotalR, dadoDisplayRival, totalRival,
      exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos),
      pd, danhoAplicado, proteccionTarget: proteccionTarget || null, pdRival: null, danhoRivalAplicado: null, proteccionJugador: 0,
      pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null,
      atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival",
      topeInfo, puntuacionMostrada, mostrarFortuna: !dosFortuna && actor?.type === "pj", mostrarLucky: !dosFortuna && actor?.type === "pj" && TQRoll._hasLucky(actor),
      actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null,
      textoContextual: textoContextual ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: {
        "tierras-quebradas": {
          etiqueta, puntuacion, dificultad: totalRival, bonificador, superioridad, rollMode: modoTirada, bonusFinalOriginal: bonificador,
          actorId: actor?.id ?? null, habClave: null, tablaComplicacion: "melee", esRepeticion: false,
          totalOriginal: totalJugador, exitosOriginales: exitos, resultadoCssOriginal: resultado.css, resultadoLabelOriginal: resultado.label,
          dadoDisplayOriginal: dadoDisplay, debilitadoOriginal: debilitadoJ, dolorExtremoOriginal: false,
          danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoNoLetal: danho?.noLetal ?? false, danhoTipo: danho?.tipo ?? null, danhoBono: danho?.bonoDano ?? 0,
          targetActorId: targetActor?.id ?? null, proteccionTargetOriginal: proteccionTarget || 0, danhoAplicadoOriginal: danhoAplicado ?? null,
          danoRival: null, mdRival: 0, tipoRival: "cortante",
          atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", dadoDisplayRival, puntuacionRival, bonificadorRival
        }
      }
    });

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actor);
    }

    return { total: totalJugador, exitos, resultado };
  }

  static async calcDanho(danoArma, md, exitos, noLetal, bonoDano = 0) {
    const danoNum = Number(danoArma);
    const exitosDanho = Math.min(exitos, 10);
    const mdStr = md >= 0 ? `+ ${md}` : `- ${Math.abs(md)}`;
    const bonoStr = bonoDano > 0 ? ` + ${bonoDano}` : bonoDano < 0 ? ` - ${Math.abs(bonoDano)}` : "";
    if (!isNaN(danoNum)) {
      let pdTotal = danoNum + md + exitosDanho + bonoDano;
      if (noLetal) pdTotal = Math.floor(pdTotal / 2);
      return { formula: `${danoNum}${bonoStr} ${mdStr} (MD) + ${exitosDanho} Éxitos`, total: pdTotal, noLetal };
    }
    const roll = await new Roll(danoArma).evaluate();
    const dadoTotal = roll.total;
    let pdTotal = dadoTotal + md + exitosDanho + bonoDano;
    if (noLetal) pdTotal = Math.floor(pdTotal / 2);
    return { formula: `${danoArma}=${dadoTotal}${bonoStr} ${mdStr} (MD) + ${exitosDanho} Éxitos`, total: pdTotal, noLetal };
  }

  static _calcularModLongitud(miLongitud, suLongitud) {
    const orden = ["corta", "media", "larga", "muy larga"];
    const miIdx = orden.indexOf(miLongitud ?? "media");
    const suIdx = orden.indexOf(suLongitud ?? "media");
    return (miIdx - suIdx) >= 2 ? 2 : 0;
  }

  static _calcularProteccion(actor, tipoArma, escudoDoble = false) {
    let total = 0;
    for (const item of actor.items) {
      const esArmadura = item.type === "armadura" || (item.type === "objetoMagico" && item.system.tipoObjeto === "armadura");
      if (!esArmadura || item.system.equipped === false) continue;
      const modProt = item.system.categoria === "encantado" && !item.system.sintonizado ? 0 : (item.system.modProteccion ?? 0);
      let prot = (item.system.proteccion ?? 0) + modProt;
      if (item.system.tipo === "blanda" && tipoArma === "contundente") prot = Math.floor(prot / 2);
      if (item.system.esYelmo && !item.system.viseraBajada) prot = Math.max(0, prot - 1);
      if (escudoDoble && item.system.zona === "Escudo") prot *= 2;
      total += prot;
    }
    return total;
  }

  static async tirarDistanciaEnfrentada(etiqueta, puntuacion, eleccion, opciones = {}) {
    const modo = opciones.modo ?? "distancia-cubierto";
    const { actor = null, danho = null, targetActor = null, topeInfo = null, rollMode: rollModeOpc = null, dosFortuna = false, luckyDosFortuna = false, mixedDosFortuna = false, modDesglose = null, puntuacionMostrada = null, esProyectil = false } = opciones;
    const { bonificador, distanciaDif, sigRango, puntuacionDefensor, bonificadorDefensor } = eleccion;
    const modoTirada = rollModeOpc ?? game.settings.get("core", "rollMode");

    const debilitadoJ = actor?.system?.salud?.debilitado ?? false;
    const dolorExtremoJ = actor?.system?.salud?.dolorExtremo ?? false;
    const dadoJ_size = debilitadoJ ? 6 : 10;
    const bonusJ = bonificador + (dolorExtremoJ ? -2 : 0);
    const penalizadorDef = (modo === "distancia-cubierto" && esProyectil) ? -2 : 0;

    let dadoJ, dadoTotalJ, tiradasJ, dadoDisplayJCustom = null;
    if (dosFortuna) {
      const rollJ1 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      const rollJ2 = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada);
      if (actor) {
        if (mixedDosFortuna) {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 1), "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 1) });
        } else if (luckyDosFortuna) {
          await actor.update({ "system.fortuna.lucky": Math.max(0, (actor.system.fortuna?.lucky ?? 0) - 2) });
        } else {
          await actor.update({ "system.fortuna.actual": Math.max(0, (actor.system.fortuna?.actual ?? 0) - 2) });
        }
      }
      dadoTotalJ = rollJ1.total + rollJ2.total;
      tiradasJ = rollJ1.tiradas;
      const compJ = (rollJ1.dado === 1 ? 1 : 0) + (rollJ2.dado === 1 ? 1 : 0);
      dadoJ = compJ > 0 ? 1 : Math.max(rollJ1.dado, rollJ2.dado);
      dadoDisplayJCustom = `${TQRoll._dadoDisplay(rollJ1.total, rollJ1.tiradas)} + ${TQRoll._dadoDisplay(rollJ2.total, rollJ2.tiradas)}`;
    } else {
      ({ dado: dadoJ, total: dadoTotalJ, tiradas: tiradasJ } = await TQRoll._tirarExplosivo(dadoJ_size, modoTirada));
    }

    const debilitadoR = targetActor?.system?.salud?.debilitado ?? false;
    const dadoR_size = debilitadoR ? 6 : 10;
    const { dado: dadoR, total: dadoTotalR, tiradas: tiradasR } = await TQRoll._tirarExplosivo(dadoR_size, modoTirada);

    const totalJugador = dadoTotalJ + puntuacion + bonusJ;
    const bonifDefTotal = bonificadorDefensor + penalizadorDef;
    const defRawTotal = dadoTotalR + puntuacionDefensor + bonifDefTotal;
    const defEfectivo = Math.max(defRawTotal, distanciaDif);

    const exitos = totalJugador - defEfectivo;
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
          etiqueta, puntuacion, bonificador: bonusJ, modLongitud: 0, dadoDisplayJ, totalJugador,
          puntuacionRival: puntuacionDefensor, bonificadorRival: bonifDefTotal, modLongitudRival: 0,
          dadoDisplayR: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival: defEfectivo,
          rivalNombre: targetActor?.name ?? "Defensor"
        }
      );
      await ChatMessage.create({
        speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
        content: contenidoTablas,
        whisper: gmIds,
        flags: {
          "tierras-quebradas": {
            esTablasMelee: true, etiqueta, puntuacion, bonificador: bonusJ, modLongitud: 0,
            dadoDisplayJ, totalJugador, dadoJ,
            puntuacionRival: puntuacionDefensor, bonificadorRival: bonifDefTotal, modLongitudRival: 0,
            dadoDisplayR: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival: defEfectivo,
            actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null,
            danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoTipo: danho?.tipo ?? "cortante", danhoNoLetal: danho?.noLetal ?? false, danhoBono: danho?.bonoDano ?? 0,
            danoRival: null, mdRival: 0, tipoRival: "cortante",
            rollMode: modoTirada, pasionEfecto: pasionEfecto?.texto ?? null, topeInfo: topeInfo ?? null,
            siguienteRango: sigRango
          }
        }
      });
      return { total: totalJugador, exitos: 0, resultado };
    }

    let pd = null;
    if (danho !== null && exitos > 0) {
      pd = await TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal, danho.bonoDano ?? 0);
    }
    if (sigRango && pd?.total != null) {
      pd = { ...pd, total: Math.floor(pd.total / 2), formula: pd.formula + " ÷2" };
    }

    let danhoAplicado = null, proteccionTarget = 0;
    if (pd?.total != null && targetActor) {
      proteccionTarget = TQRoll._calcularProteccion(targetActor, danho?.tipo);
      danhoAplicado = Math.max(0, pd.total - proteccionTarget);
    }

    const dadoDisplayJ = dadoDisplayJCustom ?? TQRoll._dadoDisplay(dadoTotalJ, tiradasJ);
    const dadoDisplayR = TQRoll._dadoDisplay(dadoTotalR, tiradasR);

    const datosChat = {
      etiqueta, esMelee: true, puntuacion, bonificador: bonusJ, modLongitud: 0,
      dado: dadoTotalJ, dadoDisplay: dadoDisplayJ, total: totalJugador,
      puntuacionRival: puntuacionDefensor, bonificadorRival: bonifDefTotal, modLongitudRival: 0,
      dadoRival: dadoTotalR, dadoDisplayRival: dadoDisplayR, totalRival: defEfectivo,
      defRawTotal: defRawTotal !== defEfectivo ? defRawTotal : null,
      exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos),
      pd, danhoAplicado, proteccionTarget: proteccionTarget || null,
      pdRival: null, danhoRivalAplicado: null, proteccionJugador: 0,
      pasionEfecto: pasionEfecto?.texto ?? null, actorImg: actor?.img ?? null,
      atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Defensor",
      topeInfo, modDesglose, puntuacionMostrada, mostrarFortuna: !dosFortuna && actor?.type === "pj", mostrarLucky: !dosFortuna && actor?.type === "pj" && TQRoll._hasLucky(actor),
      actorId: actor?.id ?? null, targetActorId: targetActor?.id ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: {
        "tierras-quebradas": {
          etiqueta, puntuacion, dificultad: defEfectivo, bonificador: bonusJ, rollMode: modoTirada, bonusFinalOriginal: bonusJ,
          actorId: actor?.id ?? null, habClave: null, tablaComplicacion: null, esRepeticion: false,
          totalOriginal: totalJugador, exitosOriginales: exitos, resultadoCssOriginal: resultado.css, resultadoLabelOriginal: resultado.label,
          dadoDisplayOriginal: dadoDisplayJ, debilitadoOriginal: debilitadoJ, dolorExtremoOriginal: dolorExtremoJ,
          danoArma: danho?.danoArma ?? null, danhoMd: danho?.md ?? 0, danhoNoLetal: danho?.noLetal ?? false, danhoTipo: danho?.tipo ?? null, danhoBono: danho?.bonoDano ?? 0,
          targetActorId: targetActor?.id ?? null, proteccionTargetOriginal: proteccionTarget || 0, danhoAplicadoOriginal: danhoAplicado ?? null,
          danoRival: null, mdRival: 0, tipoRival: "cortante",
          atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Defensor",
          dadoDisplayRival: dadoDisplayR, puntuacionRival: puntuacionDefensor, bonificadorRival: bonifDefTotal,
          modLongitud: 0, modLongitudRival: 0, siguienteRango: sigRango,
          esDistanciaEnfrentada: true, defEfectivo, defRawTotal, puntuacionDefensor, bonificadorDefensor, distanciaDif, esProyectil, modo
        }
      }
    });

    return { total: totalJugador, exitos, resultado };
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
      pd = await TQRoll.calcDanho(flags.danoArma, flags.danhoMd, 0, flags.danhoNoLetal, flags.danhoBono ?? 0);
      if (flags.siguienteRango && pd?.total != null) {
        pd = { ...pd, total: Math.floor(pd.total / 2), formula: pd.formula + " ÷2" };
      }
      if (pd?.total != null && targetActor) {
        proteccionTarget = TQRoll._calcularProteccion(targetActor, flags.danhoTipo);
        danhoAplicado = Math.max(0, pd.total - proteccionTarget);
        await targetActor.recibirDanho(danhoAplicado, pd.total);
      }
    }

    if ((resolucion === "rival" || resolucion === "ambos") && flags.danoRival) {
      pdRival = await TQRoll.calcDanho(flags.danoRival, flags.mdRival, 0, false);
      if (pdRival?.total != null && actor) {
        proteccionJugador = TQRoll._calcularProteccion(actor, flags.tipoRival ?? "cortante");
        danhoRivalAplicado = Math.max(0, pdRival.total - proteccionJugador);
      }
    }

    const resolucionTexto = {
      atacante: game.i18n.localize("TQ.Tablas.AtacanteImpacta0PE"),
      rival: game.i18n.localize("TQ.Tablas.RivalImpacta0PE"),
      ambos: game.i18n.localize("TQ.Tablas.AmbosImpactan0PE"),
      nadie: game.i18n.localize("TQ.Tablas.NadieImpacta")
    }[resolucion];

    const datosChat = {
      etiqueta: flags.etiqueta, esMelee: true, puntuacion: flags.puntuacion, bonificador: flags.bonificador, modLongitud: flags.modLongitud, dadoDisplay: flags.dadoDisplayJ, total: flags.totalJugador, puntuacionRival: flags.puntuacionRival, bonificadorRival: flags.bonificadorRival, modLongitudRival: flags.modLongitudRival, dadoDisplayRival: flags.dadoDisplayR, totalRival: flags.totalRival, exitos: 0, resultado, css: resultado.css, criticos: null, pd, danhoAplicado, proteccionTarget, pdRival, danhoRivalAplicado, proteccionJugador, pasionEfecto: flags.pasionEfecto ?? null, actorImg: actor?.img ?? null, atacanteNombre: actor?.name ?? "PJ", rivalNombre: targetActor?.name ?? "Rival", topeInfo: flags.topeInfo ?? null, resolucionTablas: resolucionTexto, actorId: actor?.id ?? null
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
        puntuacion = base + (habilidad.nivel ?? 0);
      }
    } else {
      const habNombre = ARMA_A_HABILIDAD_PNJ[habKey] ?? habKey;
      const valor = targetActor.system.habilidades?.[habNombre];
      if (typeof valor === "number") puntuacion = valor;
      else if (valor && typeof valor === "object") puntuacion = valor.total ?? valor.nivel ?? 0;
    }
    const md = (manos === "2m")
      ? (targetActor.system.derivadas?.mDano2m?.valor ?? 0)
      : (targetActor.system.derivadas?.mDano1m?.valor ?? 0);

    return {
      puntuacion, longitud: arma.system.longitud ?? "media", danoArma: arma.system.danoArma ?? "0", md, tipo: arma.system.tipo ?? "cortante"
    };
  }

  static async _seleccionarArmaRival(targetActor) {
    const armasMelee = targetActor.items.filter(i => i.type === "arma" && i.system.alcance === "contacto");
    if (armasMelee.length === 0) return null;
    if (armasMelee.length === 1) return armasMelee[0];
    const equipadas = armasMelee.filter(i => i.system.equipped !== false);
    if (equipadas.length === 0) return armasMelee[0];
    if (equipadas.length === 1) return equipadas[0];
    const opcionesHtml = equipadas.map(a => `<option value="${a.id}">${a.name}</option>`).join("");
    const armaId = await DialogV2.prompt({
      window: { title: `Arma de ${targetActor.name}` },
      content: `<select name="arma_rival" style="width:100%;margin-top:8px">${opcionesHtml}</select>`,
      ok: { label: "Confirmar", callback: (_ev, button) => button.form.elements.arma_rival?.value }
    });
    return equipadas.find(a => a.id === armaId) ?? equipadas[0];
  }

  static _extraerDatosArmaRival(targetActor, arma) {
    const defaults = { puntuacion: 10, longitud: "media", danoArma: "0", md: 0, tipo: "cortante" };
    if (!arma) return defaults;
    const habKey = arma.system.habilidad;
    const manos = arma.system.manos ?? "1m";
    let puntuacion = 0;
    if (targetActor.type === "pj") {
      const habilidad = targetActor.system.habilidades?.[habKey];
      if (habilidad) {
        const base = targetActor.system.bases?.[habilidad.base]?.valor ?? 0;
        puntuacion = base + (habilidad.nivel ?? 0);
      }
    } else {
      const habNombre = ARMA_A_HABILIDAD_PNJ[habKey] ?? habKey;
      const valor = targetActor.system.habilidades?.[habNombre];
      if (typeof valor === "number") puntuacion = valor;
      else if (valor && typeof valor === "object") puntuacion = valor.total ?? valor.nivel ?? 0;
    }
    const md = (manos === "2m")
      ? (targetActor.system.derivadas?.mDano2m?.valor ?? 0)
      : (targetActor.system.derivadas?.mDano1m?.valor ?? 0);
    return {
      puntuacion, longitud: arma.system.longitud ?? "media", danoArma: arma.system.danoArma ?? "0", md, tipo: arma.system.tipo ?? "cortante"
    };
  }

  static async _publicarPrerollRival(targetActor, datosRival, preroll, modRival, totalRival, modoTirada) {
    const debilitado = targetActor.system?.salud?.debilitado ?? false;
    const dadoDisplay = TQRoll._dadoDisplay(preroll.total, preroll.tiradas);
    const partesMod = modRival ? `<span>+ ${modRival} (long.)</span>` : "";
    const contenido = `<div class="tq-tirada-resultado parcial tq-tablas-card">
  <div class="tq-chat-header"><span class="tq-chat-etiqueta">${targetActor.name}</span></div>
  <div class="tq-melee-grid" style="grid-template-columns:1fr">
    <div class="tq-melee-col rival">
      <div class="tq-melee-titulo">Tirada de melé</div>
      <div class="tq-melee-nums">
        <span><i class="fas fa-dice-d${debilitado ? 6 : 10}"></i> <strong>${dadoDisplay}</strong></span>
        <span>+ ${datosRival.puntuacion}</span>
        ${partesMod}
        <span class="tq-melee-total">= <strong>${totalRival}</strong></span>
      </div>
    </div>
  </div>
</div>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: targetActor }),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada)
    });
  }

  static async tirarEnfrentada(actorA, habNombreA, habTotalA, actorB, habNombreB, habTotalB, opciones = {}) {
    const { habClave = null, mod = 0 } = opciones;
    const forzarBlind = !game.user.isGM
      && habClave
      && game.settings.get("tierras-quebradas", "blindRollHabilidades")
      && HABILIDADES_BLIND_GM.has(habClave);
    const modoTirada = forzarBlind ? "blindroll" : game.settings.get("core", "rollMode");

    if (forzarBlind) {
      const debilitadoA = actorA?.system?.salud?.debilitado ?? false;
      const dolorExtremoA = actorA?.system?.salud?.dolorExtremo ?? false;
      const dadoSizeA = debilitadoA ? 6 : 10;
      const bonusA = (dolorExtremoA ? -2 : 0) + mod;
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
        etiqueta: game.i18n.format("TQ.Tirada.EnfrentadaLabel", { habA: habNombreA, habB: habNombreB }), esEnfrentada: true, nombreA: actorA?.name ?? "Iniciador", habNombreA, puntuacionA: habTotalA, bonificadorA: bonusA || null, dadoDisplayA: TQRoll._dadoDisplay(dadoTotalA, tiradasA), totalA, nombreB: actorB?.name ?? "Oponente", habNombreB, puntuacionB: habTotalB, dadoDisplayB: TQRoll._dadoDisplay(dadoTotalB, tiradasB), totalB, exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos), pasionEfecto: pasionEfecto?.texto ?? null, debilitado: debilitadoA, dolorExtremo: dolorExtremoA
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
      <div class="tq-card-titulo">${game.i18n.localize("TQ.Tirada.Enfrentada")}</div>
      <hr/>
      <p style="text-align:center;margin:6px 0;"><strong>${actorB?.name ?? "Oponente"}</strong> saca: <span style="font-size:1.4em;font-weight:bold;">${dadoDisplayB}</span></p>
      <div class="tq-card-botones" style="gap:8px;">
        <button class="tq-enfrentada-normal">${game.i18n.localize("TQ.Tirada.SinFortuna")}</button>
        <button class="tq-enfrentada-fortuna"${puedeFortuna ? "" : " disabled"}>${game.i18n.localize("TQ.Botones.UsarDosFortuna")}</button>
      </div>
    </div>`;

    await ChatMessage.create({
      speaker: actorA ? ChatMessage.getSpeaker({ actor: actorA }) : ChatMessage.getSpeaker(),
      content: contenidoIntermedio,
      flags: {
        "tierras-quebradas": {
          esEnfrentadaPendiente: true,
          actorAId: actorA?.id ?? null, habNombreA, habTotalA, mod,
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
    const { actorAId, habNombreA, habTotalA, mod = 0, actorBId, habNombreB, habTotalB, dadoTotalB, dadoDisplayB, modoTirada, habClave } = flags;

    const actorA = game.actors.get(actorAId);
    const actorB = game.actors.get(actorBId);
    if (actorA && !actorA.isOwner) return;

    await message.update({ "flags.tierras-quebradas.enfrentadaCompletada": true });

    const debilitadoA = actorA?.system?.salud?.debilitado ?? false;
    const dolorExtremoA = actorA?.system?.salud?.dolorExtremo ?? false;
    const dadoSizeA = debilitadoA ? 6 : 10;
    const bonusA = (dolorExtremoA ? -2 : 0) + mod;

    let dadoTotalA, dadoA, dadoDisplayACustom = null;

    if (usarFortuna) {
      const fortActual = actorA?.system?.fortuna?.actual ?? 0;
      if (fortActual < 2) { ui.notifications.warn(game.i18n.localize("TQ.Warn.SinFortuna")); return; }
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

    const dadoDisplayA = dadoDisplayACustom ?? TQRoll._dadoDisplay(dadoTotalA, []);
    const datosChat = {
      etiqueta: game.i18n.format("TQ.Tirada.EnfrentadaLabel", { habA: habNombreA, habB: habNombreB }), esEnfrentada: true,
      nombreA: actorA?.name ?? "Iniciador", habNombreA, puntuacionA: habTotalA, bonificadorA: bonusA || null,
      dadoDisplayA, totalA,
      nombreB: actorB?.name ?? "Oponente", habNombreB, puntuacionB: habTotalB, dadoDisplayB, totalB,
      exitos, resultado, css: resultado.css, criticos: TQRoll._criticosTexto(exitos),
      pasionEfecto: pasionEfecto?.texto ?? null, debilitado: debilitadoA, dolorExtremo: dolorExtremoA,
      mostrarFortuna: !usarFortuna && actorA?.type === "pj", mostrarLucky: !usarFortuna && actorA?.type === "pj" && TQRoll._hasLucky(actorA), actorId: actorAId
    };

    const contenido = await foundry.applications.handlebars.renderTemplate("systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat);
    await ChatMessage.create({
      speaker: actorA ? ChatMessage.getSpeaker({ actor: actorA }) : ChatMessage.getSpeaker(),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: { "tierras-quebradas": {
        esEnfrentadaFortuna: !usarFortuna && actorA?.type === "pj",
        actorAId, habNombreA, habTotalA, bonusA, dadoDisplayA, totalA, totalB, exitos,
        resultadoCss: resultado.css, resultadoLabel: resultado.label,
        nombreA: actorA?.name ?? "Iniciador", nombreB: actorB?.name ?? "Oponente",
        habNombreB, puntuacionB: habTotalB, dadoDisplayB, modoTirada
      }}
    });

    if (resultado.css.includes("complicacion")) await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actorA);
  }

  static async repetirConFortunaEnfrentada(messageId) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const { actorAId, habNombreA, habTotalA, bonusA, dadoDisplayA: dadoDisplayOriginal, totalA: totalOriginal, totalB, exitos: exitosOriginales, resultadoCss, resultadoLabel, nombreA, nombreB, habNombreB, puntuacionB, dadoDisplayB, modoTirada } = flags;

    const actorA = game.actors.get(actorAId);
    if (!actorA) return;
    const fortuna = actorA.system.fortuna;
    if ((fortuna?.actual ?? 0) <= 0) return;

    const debilitado = actorA.system.salud?.debilitado ?? false;
    const rollNuevo = await TQRoll._tirarExplosivo(debilitado ? 6 : 10, modoTirada);
    const dadoTotalNuevo = rollNuevo.total;
    const totalNuevo = dadoTotalNuevo + habTotalA + bonusA;
    const exitosNuevos = totalNuevo - totalB;
    const resultadoNuevo = TQRoll._clasificarResultado(rollNuevo.dado, exitosNuevos);
    const dadoDisplayNuevo = TQRoll._dadoDisplay(dadoTotalNuevo, rollNuevo.tiradas);

    await actorA.update({ "system.fortuna.actual": Math.max(0, fortuna.actual - 1) });

    const etiqueta = game.i18n.format("TQ.Tirada.EnfrentadaLabel", { habA: habNombreA, habB: habNombreB });
    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion.hbs", {
        etiqueta,
        original: { dadoDisplay: dadoDisplayOriginal, total: totalOriginal, exitos: exitosOriginales, label: resultadoLabel, css: resultadoCss },
        nuevo: { dadoDisplay: dadoDisplayNuevo, total: totalNuevo, exitos: exitosNuevos, label: resultadoNuevo.label, css: resultadoNuevo.css }
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorA }),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: { "tierras-quebradas": {
        esEleccionFortunaEnfrentada: true,
        actorAId, modoTirada,
        nombreA, habNombreA, habTotalA, bonusA,
        nombreB, habNombreB, puntuacionB, dadoDisplayB, totalB,
        original: { dadoDisplay: dadoDisplayOriginal, total: totalOriginal, exitos: exitosOriginales, css: resultadoCss, label: resultadoLabel },
        nuevo: { dadoDisplay: dadoDisplayNuevo, total: totalNuevo, exitos: exitosNuevos, css: resultadoNuevo.css, label: resultadoNuevo.label }
      }}
    });
  }

  static async rollOponentesMultiple(oponentes, bonoSuperioridad = 0) {
    const modoTirada = game.settings.get("core", "rollMode");
    const filas = [];
    for (const op of oponentes) {
      const opActor = op.actorId ? game.actors.get(op.actorId) : null;
      const debOp = opActor?.system?.salud?.debilitado ?? false;
      const { total: diceTotal, tiradas } = await TQRoll._tirarExplosivo(debOp ? 6 : 10, modoTirada);
      filas.push({
        actorId: op.actorId, nombre: op.nombre, puntuacion: op.puntuacion, danho: op.danho,
        dadoDisplay: TQRoll._dadoDisplay(diceTotal, tiradas),
        bonoSuperioridad: bonoSuperioridad || null,
        total: diceTotal + op.puntuacion + bonoSuperioridad,
        diceTotal, tiradas
      });
    }
    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-multimelee-rivales.hbs",
      { filas }
    );
    await ChatMessage.create({ content: contenido, ...TQRoll._rollModeData(modoTirada) });
    return filas;
  }

  static async _calcFilasMultimelee({ filasOponentes, totalUnico, unicoDanho, unico }) {
    const filas = [];
    for (const op of filasOponentes) {
      const opActor = op.actorId ? game.actors.get(op.actorId) : null;
      const exitos = totalUnico - op.total;
      const unicoGana = exitos > 0;
      let pdUnico = null, danhoOponente = null, protOponente = 0;
      let pdOponente = null, danhoUnico = null, protUnico = 0;
      if (unicoGana && unicoDanho) {
        pdUnico = await TQRoll.calcDanho(unicoDanho.danoArma, unicoDanho.md ?? 0, exitos, unicoDanho.noLetal ?? false, unicoDanho.bonoDano ?? 0);
        if (pdUnico?.total != null && opActor) {
          protOponente = TQRoll._calcularProteccion(opActor, unicoDanho.tipo ?? "cortante");
          danhoOponente = Math.max(0, pdUnico.total - protOponente);
        }
      }
      if (!unicoGana && op.danho) {
        const exitosOp = -exitos;
        pdOponente = await TQRoll.calcDanho(op.danho.danoArma, op.danho.md ?? 0, exitosOp, op.danho.noLetal ?? false, 0);
        if (pdOponente?.total != null && unico) {
          protUnico = TQRoll._calcularProteccion(unico, op.danho.tipo ?? "cortante");
          danhoUnico = Math.max(0, pdOponente.total - protUnico);
        }
      }
      filas.push({
        actorId: op.actorId, nombre: op.nombre, puntuacion: op.puntuacion,
        dadoDisplay: op.dadoDisplay, total: op.total,
        bonoSuperioridad: op.bonoSuperioridad || null,
        exitos, unicoGana,
        pdUnico, danhoOponente, protOponente: protOponente || null,
        pdOponente, danhoUnico, protUnico: protUnico || null
      });
    }
    return filas;
  }

  static async tirarMeleeMultiple({ unico, unicoPuntuacion, unicoDanho, unicoNombre, filasOponentes, modo, modDesglose = null, dosFortuna = false, pjActorId = null, unicoDicePreroll = null, unicoTiradasPreroll = null, unicoDadoDisplayPreroll = null }) {
    const modoTirada = game.settings.get("core", "rollMode");
    const debU = unico?.system?.salud?.debilitado ?? false;
    const carasU = debU ? 6 : 10;
    let dadoTU, tiradasU, dadoDisplayU, complicacion = false;

    if (unicoDicePreroll != null) {
      dadoTU = unicoDicePreroll;
      tiradasU = unicoTiradasPreroll ?? [unicoDicePreroll];
      dadoDisplayU = unicoDadoDisplayPreroll ?? TQRoll._dadoDisplay(dadoTU, tiradasU);
      complicacion = tiradasU[tiradasU.length - 1] === 1;
    } else if (dosFortuna) {
      const r1 = await TQRoll._tirarExplosivo(carasU, modoTirada);
      const r2 = await TQRoll._tirarExplosivo(carasU, modoTirada);
      dadoTU = r1.total + r2.total;
      tiradasU = [...r1.tiradas, ...r2.tiradas];
      dadoDisplayU = `${TQRoll._dadoDisplay(r1.total, r1.tiradas)} + ${TQRoll._dadoDisplay(r2.total, r2.tiradas)}`;
      complicacion = r1.tiradas[r1.tiradas.length - 1] === 1 || r2.tiradas[r2.tiradas.length - 1] === 1;
    } else {
      ({ total: dadoTU, tiradas: tiradasU } = await TQRoll._tirarExplosivo(carasU, modoTirada));
      dadoDisplayU = TQRoll._dadoDisplay(dadoTU, tiradasU);
      complicacion = tiradasU[tiradasU.length - 1] === 1;
    }

    const totalUnico = dadoTU + unicoPuntuacion;
    const unicoRawDie = tiradasU[0];

    const filas = await TQRoll._calcFilasMultimelee({ filasOponentes, totalUnico, unicoDanho, unico });

    const necesitaElegir = filas.filter(f => f.unicoGana && f.pdUnico).length > 1;
    const fortunaActor = (modo === "Nvs1" && pjActorId) ? game.actors.get(pjActorId) : unico;
    const fortunaActual = fortunaActor?.system?.fortuna?.actual ?? 0;
    const puedeUsarFortuna = !dosFortuna && !complicacion && fortunaActual >= 1;

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-multimelee-resultado.hbs",
      { unicoNombre, unicoPuntuacion, dadoDisplayU, totalUnico, modDesglose, filas, modo, necesitaElegir, unicoActorId: unico?.id ?? null, puedeUsarFortuna }
    );

    await ChatMessage.create({
      speaker: unico ? ChatMessage.getSpeaker({ actor: unico }) : ChatMessage.getSpeaker(),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: {
        "tierras-quebradas": {
          esMeleeMultiple: true,
          unicoActorId: unico?.id ?? null,
          puedeUsarFortuna,
          unicoRawDie,
          unicoDiceTotal: dadoTU,
          unicoDadoDisplay: dadoDisplayU,
          unicoPuntuacion,
          unicoDanho: unicoDanho ?? null,
          modDesglose: modDesglose ?? null,
          modo,
          pjActorId: pjActorId ?? null,
          debilitado: debU,
          dosFortuna,
          filasOponentes: filasOponentes.map(f => ({
            actorId: f.actorId, nombre: f.nombre, puntuacion: f.puntuacion,
            danho: f.danho, dadoDisplay: f.dadoDisplay, total: f.total,
            bonoSuperioridad: f.bonoSuperioridad ?? null
          })),
          filas: filas.map(f => ({
            actorId: f.actorId, nombre: f.nombre, unicoGana: f.unicoGana,
            pdTotal: f.pdUnico?.total ?? null, danhoOponente: f.danhoOponente, protOponente: f.protOponente
          })),
          danhoElegidoActorId: null
        }
      }
    });

    if (complicacion) await tirarComplicacion(TABLA_COMPLICACIONES_MELE, unico);
  }

  static async gastarFortunaMultiple(messageId) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    if (!flags.puedeUsarFortuna) return;
    const modoTirada = game.settings.get("core", "rollMode");
    const etiqueta = game.i18n.localize("TQ.Melee.MeleeMultipleTitulo");

    if (flags.modo === "Nvs1" && flags.pjActorId) {
      const pjActor = game.actors.get(flags.pjActorId);
      if (!pjActor || (pjActor.system?.fortuna?.actual ?? 0) < 1) return;
      const pjFila = (flags.filasOponentes ?? []).find(f => f.actorId === flags.pjActorId);
      if (!pjFila) return;
      const pjBonoSup = pjFila.bonoSuperioridad ?? 0;
      const pjPuntuacion = pjFila.puntuacion;
      const pjOrigDiceTotal = pjFila.total - pjPuntuacion - pjBonoSup;
      const pjOrigDadoDisplay = pjFila.dadoDisplay;

      const debPJ = pjActor.system?.salud?.debilitado ?? false;
      const { total: nuevoDiceTotal, tiradas: nuevasTiradas } = await TQRoll._tirarExplosivo(debPJ ? 6 : 10, modoTirada);
      const nuevoDadoDisplay = TQRoll._dadoDisplay(nuevoDiceTotal, nuevasTiradas);

      await pjActor.update({ "system.fortuna.actual": Math.max(0, (pjActor.system.fortuna?.actual ?? 0) - 1) });
      await message.update({ flags: { "tierras-quebradas": { ...flags, puedeUsarFortuna: false } } });

      const contenido = await foundry.applications.handlebars.renderTemplate(
        "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion-multiple.hbs",
        {
          etiqueta,
          original: { dadoDisplay: pjOrigDadoDisplay, total: pjOrigDiceTotal + pjPuntuacion + pjBonoSup },
          nuevo:    { dadoDisplay: nuevoDadoDisplay,    total: nuevoDiceTotal + pjPuntuacion + pjBonoSup }
        }
      );
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: pjActor }),
        content: contenido,
        ...TQRoll._rollModeData(modoTirada),
        flags: {
          "tierras-quebradas": {
            esEleccionFortunaMultiple: true,
            esNvs1Fortune: true,
            originalMsgId: messageId,
            pjActorId: flags.pjActorId,
            pjOrigDiceTotal,
            pjOrigDadoDisplay,
            nuevoDiceTotal,
            nuevoDadoDisplay,
            pjPuntuacion,
            pjBonoSup
          }
        }
      });
      return;
    }

    const unico = flags.unicoActorId ? game.actors.get(flags.unicoActorId) : null;
    if (!unico || (unico.system?.fortuna?.actual ?? 0) < 1) return;

    const carasU = (flags.debilitado ?? false) ? 6 : 10;
    const { total: nuevoDiceTotal, tiradas: nuevasTiradas } = await TQRoll._tirarExplosivo(carasU, modoTirada);
    const nuevoDadoDisplay = TQRoll._dadoDisplay(nuevoDiceTotal, nuevasTiradas);

    const origDiceTotal = flags.unicoDiceTotal;
    const origDadoDisplay = flags.unicoDadoDisplay;
    const unicoPuntuacion = flags.unicoPuntuacion;

    await unico.update({ "system.fortuna.actual": Math.max(0, (unico.system.fortuna?.actual ?? 0) - 1) });
    await message.update({ flags: { "tierras-quebradas": { ...flags, puedeUsarFortuna: false } } });

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-fortuna-eleccion-multiple.hbs",
      {
        etiqueta,
        original: { dadoDisplay: origDadoDisplay, total: origDiceTotal + unicoPuntuacion },
        nuevo:    { dadoDisplay: nuevoDadoDisplay, total: nuevoDiceTotal + unicoPuntuacion }
      }
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: unico }),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: {
        "tierras-quebradas": {
          esEleccionFortunaMultiple: true,
          originalMsgId: messageId,
          origDiceTotal,
          nuevoDiceTotal,
          unicoPuntuacion
        }
      }
    });
  }

  static async elegirDadoMultiple(choiceMessageId, eleccion) {
    try {
      const choiceMsg = game.messages.get(choiceMessageId);
      if (!choiceMsg) return;
      const choiceFlags = choiceMsg.flags?.["tierras-quebradas"] ?? {};
      if (!choiceFlags.esEleccionFortunaMultiple) return;

      const origMsg = game.messages.get(choiceFlags.originalMsgId);
      if (!origMsg) return;
      const flags = origMsg.flags?.["tierras-quebradas"] ?? {};

      const unico = flags.unicoActorId ? game.actors.get(flags.unicoActorId) : null;
      const modoTirada = game.settings.get("core", "rollMode");
      let filasOponentesFinales, totalUnico, dadoDisplayU, unicoPuntuacion;

      if (choiceFlags.esNvs1Fortune) {
        const diceTotal = eleccion === "nuevo" ? choiceFlags.nuevoDiceTotal : choiceFlags.pjOrigDiceTotal;
        const ddPJ = eleccion === "nuevo" ? choiceFlags.nuevoDadoDisplay : choiceFlags.pjOrigDadoDisplay;
        filasOponentesFinales = (flags.filasOponentes ?? []).map(f =>
          f.actorId === choiceFlags.pjActorId
            ? { ...f, total: diceTotal + choiceFlags.pjPuntuacion + choiceFlags.pjBonoSup, dadoDisplay: ddPJ }
            : f
        );
        totalUnico = flags.unicoDiceTotal + flags.unicoPuntuacion;
        dadoDisplayU = flags.unicoDadoDisplay;
        unicoPuntuacion = flags.unicoPuntuacion;
      } else {
        const diceTotal = eleccion === "nuevo" ? choiceFlags.nuevoDiceTotal : choiceFlags.origDiceTotal;
        dadoDisplayU = eleccion === "nuevo"
          ? TQRoll._dadoDisplay(choiceFlags.nuevoDiceTotal, [choiceFlags.nuevoDiceTotal])
          : flags.unicoDadoDisplay;
        unicoPuntuacion = choiceFlags.unicoPuntuacion;
        totalUnico = diceTotal + unicoPuntuacion;
        filasOponentesFinales = flags.filasOponentes;
      }

      const filas = await TQRoll._calcFilasMultimelee({
        filasOponentes: filasOponentesFinales, totalUnico, unicoDanho: flags.unicoDanho, unico
      });
      const necesitaElegir = filas.filter(f => f.unicoGana && f.pdUnico).length > 1;

      const contenido = await foundry.applications.handlebars.renderTemplate(
        "systems/tierras-quebradas/templates/dialogs/tirada-multimelee-resultado.hbs",
        { unicoNombre: unico?.name ?? flags.unicoNombre, unicoPuntuacion, dadoDisplayU, totalUnico, modDesglose: flags.modDesglose, filas, modo: flags.modo, necesitaElegir, unicoActorId: unico?.id ?? null, puedeUsarFortuna: false }
      );

      await ChatMessage.create({
        speaker: origMsg.speaker,
        content: contenido,
        ...TQRoll._rollModeData(modoTirada),
        flags: { "tierras-quebradas": {
          esMeleeMultiple: true,
          unicoActorId: unico?.id ?? null,
          puedeUsarFortuna: false,
          unicoDiceTotal: totalUnico - unicoPuntuacion,
          unicoDadoDisplay: dadoDisplayU,
          unicoPuntuacion,
          unicoDanho: flags.unicoDanho,
          modDesglose: flags.modDesglose,
          modo: flags.modo,
          pjActorId: flags.pjActorId ?? null,
          filasOponentes: filasOponentesFinales,
          filas: filas.map(f => ({
            actorId: f.actorId, nombre: f.nombre, unicoGana: f.unicoGana,
            pdTotal: f.pdUnico?.total ?? null, danhoOponente: f.danhoOponente, protOponente: f.protOponente
          })),
          danhoElegidoActorId: null
        }}
      });

      await origMsg.update({ flags: { "tierras-quebradas": { ...flags, puedeUsarFortuna: false } } });
      await choiceMsg.update({ flags: { "tierras-quebradas": { ...choiceFlags, resuelta: true } } });
    } catch (err) {
      console.error("[TQ] elegirDadoMultiple error:", err);
      ui.notifications.error("Error al elegir dado: " + err.message);
    }
  }

  static async elegirDanhoMultiple(messageId, actorId) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const fila = (flags.filas ?? []).find(f => f.actorId === actorId);
    if (!fila?.unicoGana) return;
    const actor = game.actors.get(actorId);
    if (actor && fila.danhoOponente != null) {
      await actor.recibirDanho(fila.danhoOponente, fila.pdTotal ?? fila.danhoOponente);
    }
    await message.update({ "flags.tierras-quebradas.danhoElegidoActorId": actorId });
  }

  static async elegirResultadoFortunaEnfrentada(messageId, eleccion) {
    const message = game.messages.get(messageId);
    if (!message) return;
    const flags = message.flags?.["tierras-quebradas"] ?? {};
    const { actorAId, modoTirada, nombreA, habNombreA, habTotalA, bonusA, dadoDisplayB, puntuacionB, totalB, nombreB, habNombreB } = flags;

    const actorA = game.actors.get(actorAId);
    if (!actorA) return;

    const datos = flags[eleccion];
    const resultado = { css: datos.css, label: datos.label };

    const datosChat = {
      etiqueta: game.i18n.format("TQ.Tirada.EnfrentadaLabel", { habA: habNombreA, habB: habNombreB }),
      esEnfrentada: true,
      nombreA, habNombreA, puntuacionA: habTotalA, bonificadorA: bonusA || null,
      dadoDisplayA: datos.dadoDisplay, totalA: datos.total,
      nombreB, habNombreB, puntuacionB, dadoDisplayB, totalB,
      exitos: datos.exitos, resultado, css: datos.css,
      criticos: TQRoll._criticosTexto(datos.exitos),
      pasionEfecto: null, debilitado: false, dolorExtremo: false,
      mostrarFortuna: false, actorId: actorAId
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs", datosChat
    );
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorA }),
      content: contenido,
      ...TQRoll._rollModeData(modoTirada),
      flags: { "tierras-quebradas": { esRepeticion: true } }
    });
  }
}
