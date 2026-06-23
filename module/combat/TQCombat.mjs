export class TQCombat extends Combat {
  _sortCombatants(a, b) {
    const ia = a.initiative ?? Infinity;
    const ib = b.initiative ?? Infinity;
    if (ia !== ib) return ia - ib;
    const aEsPJ = a.actor?.type === "pj" ? 1 : 0;
    const bEsPJ = b.actor?.type === "pj" ? 1 : 0;
    return aEsPJ - bEsPJ;
  }
}
