export class TQItem extends Item {
  prepareDerivedData() {
    super.prepareDerivedData();
  }

  async tirar(actor) {
    if (this.type !== "hechizo") return;
    const { TQRoll } = await import("../rolls/TQRoll.mjs");
    const hab = actor?.system?.hechiceria?.habilidades?.[this.name];
    const base = actor?.system?.bases?.hechiceria?.valor ?? 0;
    const nivel = hab?.nivel ?? 0;
    const total = base + nivel;
    return TQRoll.dialogoTirada(this.name, total, { actor });
  }
}
