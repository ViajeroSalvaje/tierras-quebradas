const { DialogV2 } = foundry.applications.api;
import { tirarComplicacion, TABLA_COMPLICACIONES_MELE, TABLA_COMPLICACIONES_MAGIA } from "../tablas/TQTablasSucesos.mjs";

// Dado explosivo: al sacar el máximo se vuelve a tirar y se suma.
export class TQRoll {
  static async tirar(etiqueta, puntuacion, dificultad, opciones = {}) {
    const { bonificador = 0, flavor = "", actor = null, danho = null, tablaComplicacion = null, esCombate = false } = opciones;

    const debilitado = actor?.system?.salud?.debilitado ?? false;
    const dolorExtremo = actor?.system?.salud?.dolorExtremo ?? false;
    const tamanoDado = debilitado ? 6 : 10;
    const bonusFinal = bonificador + (dolorExtremo ? -2 : 0);

    const { dado, total: dadoTotal, tiradas } = await TQRoll._tirarExplosivo(tamanoDado);
    const total = dadoTotal + puntuacion + bonusFinal;
    const exitos = total - dificultad;
    const resultado = TQRoll._clasificarResultado(dado, exitos);

    let pd = null;
    if (danho !== null && exitos >= 0) {
      pd = TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal);
    }

    const datosChat = {
      etiqueta,
      puntuacion,
      bonificador: bonusFinal,
      dificultad,
      debilitado,
      dolorExtremo,
      dado: dadoTotal,
      dadoDisplay: TQRoll._dadoDisplay(dadoTotal, tiradas),
      total,
      exitos,
      resultado,
      css: resultado.css,
      criticos: esCombate ? TQRoll._criticosTexto(exitos) : null,
      pd,
      actorImg: actor?.img ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs",
      datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content: contenido
    });

    if (tablaComplicacion && resultado.css.includes("complicacion")) {
      const tabla = tablaComplicacion === "magia" ? TABLA_COMPLICACIONES_MAGIA : TABLA_COMPLICACIONES_MELE;
      await tirarComplicacion(tabla, actor);
    }

    return { total, exitos, resultado, dificultad };
  }

  /** Devuelve { dado: tirada_base, total: suma_total, tiradas: [array] }. Debilitado usa d6. */
  static async _tirarExplosivo(tamanoDado = 10) {
    let totalAcumulado = 0;
    let dado;
    let primera = true;
    let dadoBase = 0;
    const tiradas = [];
    do {
      dado = Math.ceil(Math.random() * tamanoDado);
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
    const n = Math.min(Math.floor(exitos / 5) - 1, 3);
    return [
      "",
      "1 efecto — elige 1 proeza o maniobra",
      "2 efectos — elige 2 proezas o maniobras",
      "3 efectos — elige 3 proezas o maniobras"
    ][n];
  }

  // dado=1 activa complicación aunque el total sea exitoso (cambio edición revisada)
  static _clasificarResultado(dado, exitos) {
    const complicacion = (dado === 1);

    if (exitos >= 10) {
      return {
        label: complicacion ? "TQ.Tirada.CriticoComplicacion" : "TQ.Tirada.ExitoCritico",
        css: complicacion ? "critico complicacion" : "critico"
      };
    }
    if (exitos >= 1) {
      return {
        label: complicacion ? "TQ.Tirada.ExitoComplicacion" : "TQ.Tirada.Exito",
        css: complicacion ? "exito complicacion" : "exito"
      };
    }
    if (exitos === 0) {
      return {
        label: complicacion ? "TQ.Tirada.ParcialComplicacion" : "TQ.Tirada.ExitoParcial",
        css: complicacion ? "parcial complicacion" : "parcial"
      };
    }
    return {
      label: complicacion ? "TQ.Tirada.Complicacion" : "TQ.Tirada.Fallo",
      css: complicacion ? "complicacion" : "fallo"
    };
  }

  static async dialogoTirada(etiqueta, puntuacion, opciones = {}) {
    const { modo = "normal", longitudArma = "media", targetActor = null, dificultadPorDefecto = 15, danho = null } = opciones;
    const rivalDatos = TQRoll._prepararDatosRival(targetActor);
    const jugadorDatos = { danoArma: danho?.danoArma ?? "—", md: danho?.md ?? 0, tipo: danho?.tipo ?? "—" };

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-dialogo.hbs",
      { etiqueta, puntuacion, modo, longitudArma, jugadorDatos, rivalDatos, dificultadPorDefecto: String(dificultadPorDefecto) }
    );

    const eleccion = await DialogV2.wait({
      window: { title: game.i18n.format("TQ.Tirada.Label", { habilidad: etiqueta }) },
      content,
      rejectClose: false,
      buttons: [
        {
          action: "tirar",
          label: game.i18n.localize("TQ.Tirada.Boton"),
          default: true,
          callback: (_ev, button) => {
            const f = button.form.elements;
            if (modo === "melee") {
              return {
                puntuacionRival:  parseInt(f.rival_puntuacion?.value)  || 0,
                longitudRival:    f.rival_longitud?.value               || "media",
                bonificadorRival: parseInt(f.rival_bonificador?.value)  || 0,
                danoRival:      f.rival_danoArma?.value?.trim()         || "0",
                mdRival:          parseInt(f.rival_md?.value)           || 0,
                tipoRival:        f.rival_tipo?.value                   || "cortante",
                bonificador:      parseInt(f.bonificador?.value)        || 0
              };
            }
            let dificultad;
            if (modo === "distancia") {
              const dist = parseInt(f.distancia?.value) || 10;
              const esq = parseInt(f.esquivar_blanco?.value) || 0;
              dificultad = Math.max(dist, esq);
            } else {
              dificultad = parseInt(f.dificultad?.value) || 15;
            }
            return {
              dificultad,
              bonificador: parseInt(f.bonificador?.value) || 0
            };
          }
        },
        {
          action: "cancelar",
          label: game.i18n.localize("TQ.Cancelar") || "Cancelar"
        }
      ]
    });

    if (!eleccion) return null;

    if (modo === "melee") {
      return TQRoll.tirarMelee(etiqueta, puntuacion, longitudArma, eleccion, { ...opciones, targetActor });
    }

    return TQRoll.tirar(etiqueta, puntuacion, eleccion.dificultad, {
      ...opciones,
      bonificador: eleccion.bonificador
    });
  }

  /** Tirada enfrentada de melee: tira por ambos contendientes y muestra los dos resultados. */
  static async tirarMelee(etiqueta, puntuacion, longitudJugador, eleccion, opciones = {}) {
    const { actor = null, danho = null, targetActor = null } = opciones;
    const { puntuacionRival, longitudRival, bonificadorRival, danoRival, mdRival, tipoRival, bonificador } = eleccion;

    const modJugador = TQRoll._calcularModLongitud(longitudJugador, longitudRival);
    const modRival = TQRoll._calcularModLongitud(longitudRival, longitudJugador);

    const debilitadoJ = actor?.system?.salud?.debilitado ?? false;
    const dolorExtremoJ = actor?.system?.salud?.dolorExtremo ?? false;
    const dadoJ_size = debilitadoJ ? 6 : 10;
    const bonusJ = bonificador + (dolorExtremoJ ? -2 : 0);

    const debilitadoR = targetActor?.system?.salud?.debilitado ?? false;
    const dadoR_size = debilitadoR ? 6 : 10;

    const { dado: dadoJ, total: dadoTotalJ, tiradas: tiradasJ } = await TQRoll._tirarExplosivo(dadoJ_size);
    const { dado: dadoR, total: dadoTotalR, tiradas: tiradasR } = await TQRoll._tirarExplosivo(dadoR_size);

    const totalJugador = dadoTotalJ + puntuacion + bonusJ + modJugador;
    const totalRival = dadoTotalR + puntuacionRival + bonificadorRival + modRival;

    const exitos = totalJugador - totalRival;
    const resultado = TQRoll._clasificarResultado(dadoJ, exitos);

    // Daño del jugador si impacta (empate favorece al defensor)
    let pd = null;
    if (danho !== null && exitos > 0) {
      pd = TQRoll.calcDanho(danho.danoArma, danho.md, exitos, danho.noLetal);
    }

    // Daño del rival si impacta (exitos < 0)
    let pdRival = null;
    if (exitos < 0) {
      pdRival = TQRoll.calcDanho(danoRival, mdRival, Math.abs(exitos), false);
    }

    // descontar armadura y aplicar
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
      etiqueta,
      esMelee: true,
      puntuacion, bonificador, modLongitud: modJugador,
      dado: dadoTotalJ, dadoDisplay: TQRoll._dadoDisplay(dadoTotalJ, tiradasJ), total: totalJugador,
      puntuacionRival, bonificadorRival, modLongitudRival: modRival,
      dadoRival: dadoTotalR, dadoDisplayRival: TQRoll._dadoDisplay(dadoTotalR, tiradasR), totalRival,
      exitos, resultado, css: resultado.css,
      criticos: TQRoll._criticosTexto(exitos),
      pd, danhoAplicado, proteccionTarget,
      pdRival, danhoRivalAplicado, proteccionJugador,
      actorImg: actor?.img ?? null
    };

    const contenido = await foundry.applications.handlebars.renderTemplate(
      "systems/tierras-quebradas/templates/dialogs/tirada-resultado.hbs",
      datosChat
    );

    await ChatMessage.create({
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content: contenido
    });

    if (resultado.css.includes("complicacion")) {
      await tirarComplicacion(TABLA_COMPLICACIONES_MELE, actor);
    }

    return { total: totalJugador, exitos, resultado };
  }

  static calcDanho(danoArma, md, exitos, noLetal) {
    const danoNum = parseInt(danoArma);
    const exitosDanho = Math.min(exitos, 10);
    const mdStr = md >= 0 ? `+${md}` : `${md}`;
    if (!isNaN(danoNum)) {
      let pdTotal = danoNum + md + exitosDanho;
      if (noLetal) pdTotal = Math.floor(pdTotal / 2);
      return { formula: `${danoNum} ${mdStr}(MD) + ${exitosDanho}(éx.)`, total: pdTotal, noLetal };
    }
    return { formula: `${danoArma} ${mdStr}(MD) + ${exitosDanho}(éx.)`, total: null, noLetal };
  }

  /** +2 si mi arma aventaja a la del rival por 2 o más rangos de longitud. */
  static _calcularModLongitud(miLongitud, suLongitud) {
    const orden = ["corta", "media", "larga", "muy larga"];
    const miIdx = orden.indexOf(miLongitud ?? "media");
    const suIdx = orden.indexOf(suLongitud ?? "media");
    return (miIdx - suIdx) >= 2 ? 2 : 0;
  }

  /** Suma la Protección de todas las armaduras del actor. Armadura blanda protege mitad vs contundente. */
  static _calcularProteccion(actor, tipoArma) {
    let total = 0;
    for (const item of actor.items) {
      if (item.type !== "armadura") continue;
      let prot = item.system.proteccion ?? 0;
      if (item.system.tipo === "blanda" && tipoArma === "contundente") prot = Math.floor(prot / 2);
      total += prot;
    }
    return total;
  }

  /** Pre-rellena los datos del rival a partir del actor objetivo (primer arma melee encontrada). */
  static _prepararDatosRival(targetActor) {
    const defaults = { puntuacion: 10, longitud: "media", danoArma: "0", md: 0, tipo: "cortante" };
    if (!targetActor) return defaults;

    const arma = targetActor.items.find(i => i.type === "arma" && i.system.alcance === "contacto");
    if (!arma) return defaults;

    const habilidad = targetActor.system.habilidades?.[arma.system.habilidad];
    const manos = arma.system.manos ?? "1m";
    let puntuacion = 0;
    if (habilidad) {
      const base = targetActor.system.bases?.[habilidad.base]?.valor ?? 0;
      puntuacion = base + (habilidad.nivel ?? 0) + (habilidad.puntosFijos ?? 0) - (targetActor.system.estorbo?.valor ?? 0);
    }
    const md = (manos === "2m")
      ? (targetActor.system.derivadas?.mDano2m?.valor ?? 0)
      : (targetActor.system.derivadas?.mDano1m?.valor ?? 0);

    return {
      puntuacion,
      longitud: arma.system.longitud ?? "media",
      danoArma:   arma.system.danoArma ?? "0",
      md,
      tipo:     arma.system.tipo ?? "cortante"
    };
  }
}
