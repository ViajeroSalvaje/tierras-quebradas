// Redondeo TQ: al entero más cercano; X.5 redondea hacia abajo.
// Ejemplos: tqRound(1.6) → 2, tqRound(5.5) → 5, tqRound(5.4) → 5
export function tqRound(x) {
  return Math.ceil(x - 0.5);
}
