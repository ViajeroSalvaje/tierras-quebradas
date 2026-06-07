export class TQCombat extends Combat {
  /**
   * Orden de declaración de intenciones: Mente ascendente.
   * El personaje con Mente más baja declara primero.
   * En caso de empate, los PNJ declaran antes que los PJ.
   */
  _sortCombatants(a, b) {
    const ia = a.initiative ?? Infinity;
    const ib = b.initiative ?? Infinity;
    if (ia !== ib) return ia - ib;
    // Empate: PNJ/criatura antes que PJ
    const aEsPJ = a.actor?.type === "pj" ? 1 : 0;
    const bEsPJ = b.actor?.type === "pj" ? 1 : 0;
    return aEsPJ - bEsPJ;
  }
}
