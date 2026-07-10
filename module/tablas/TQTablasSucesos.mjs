export const TABLA_COMPLICACIONES_MELE = [
  { range: [1, 2], text: "Golpeas a un amigo cercano (impacto con 0 éxitos). Si no hay nadie cerca, vuelve a tirar." }, { range: [3, 3], text: "Sin resuello. Quedas <strong>Debilitado</strong> este turno y el siguiente." }, { range: [4, 4], text: "Vista nublada (sangre o sudor en los ojos). −2 a tu próxima tirada." }, { range: [5, 7], text: "Te expones con torpeza. El oponente tiene <strong>+2</strong> en su próxima acción contra ti." }, { range: [8, 10], text: "Tropiezas y caes al suelo." }, { range: [11, 11], text: "Se te cae una pieza de armadura. Resta 1 a tu Protección hasta recuperarla." }, { range: [12, 14], text: "Se te cae el arma, queda clavada en algo, o pierdes un objeto del equipo." }, { range: [15, 15], text: "Distracción seria. Tu oponente se beneficia de una <strong>Proeza</strong>." }, { range: [16, 17], text: "El arma se rompe. Si es un arma natural, recibes tanto daño como tu MD." }, { range: [18, 19], text: "Te hieres con tu propia arma o el entorno. Sufres <strong>1d6 PD</strong> (contundente)." }, { range: [20, 20], text: "<strong>Desastre.</strong> Tira dos veces en esta tabla." }
];

export const TABLA_COMPLICACIONES_MAGIA = [
  { range: [1, 2], text: "Punzadas de dolor. Quedas <strong>Debilitado</strong> este turno y el siguiente." }, { range: [3, 3], text: "Horrendas visiones. <strong>Incapacitado</strong> durante 1d6 turnos." }, { range: [4, 4], text: "Invocación. Aparece una criatura menor (no hostil, pero problemática)." }, { range: [5, 6], text: "Error. El hechizo afecta a un blanco distinto del elegido." }, { range: [7, 7], text: "Trastorno. Tirada de <strong>Espíritu</strong> (dif. 12) o adquiere trastorno mental." }, { range: [8, 9], text: "Rebosamiento. Pierdes el <strong>doble de los PM</strong> previstos para el hechizo." }, { range: [10, 11], text: "Disrupción. Hemorragias internas: sufres una herida de <strong>1d3 PD</strong>." }, { range: [12, 12], text: "Deformación. Una parte del cuerpo sufre una deformación permanente." }, { range: [13, 13], text: "Incapacitación mágica. No puedes lanzar conjuros durante <strong>una hora</strong>." }, { range: [14, 14], text: "Pulsión. Sientes la necesidad de lanzar otro conjuro al turno siguiente." }, { range: [15, 15], text: "Explosión de luz. Todos los presentes (menos tú) quedan <strong>cegados 1 turno</strong>." }, { range: [16, 16], text: "Mermado. Adquieres una debilidad mágica al azar durante una hora." }, { range: [17, 17], text: "Crujido espaciotemporal. Todos los presentes reciben una herida de PD igual a los PM gastados." }, { range: [18, 18], text: "Grieta. Se abre un portal a otro plano. Tirada de <strong>Fuerza</strong> (dif. 12) para no ser absorbido." }, { range: [19, 19], text: "Fugacidad. El hechizo dura solo 1 turno. Si falló, pierde 1 PM adicional." }, { range: [20, 20], text: "<strong>Desastre.</strong> Tira dos veces en esta tabla." }
];

export async function tirarComplicacion(tabla, actor) {
  const roll = await new Roll("1d20").evaluate();
  const num = roll.total;
  const entrada = tabla.find(e => num >= e.range[0] && num <= e.range[1]);
  const content = `<div class="tq-result-card complicacion">
    <div class="tq-card-titulo">Complicación — ${num}</div>
    <hr/>
    <p>${entrada?.text ?? "Resultado desconocido."}</p>
  </div>`;
  if (game.dice3d) await game.dice3d.showForRoll(roll, game.user, true, null, false);
  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(), content
  });
}
