import { BaseItemSheet } from "./BaseItemSheet.mjs";
import { TQRoll } from "../../rolls/TQRoll.mjs";

export class ObjetoMagicoSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["tierras-quebradas", "sheet", "item", "objeto-magico"],
    position: { width: 520, height: 540 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    form: { template: "systems/tierras-quebradas/templates/items/objeto-magico-sheet.hbs", scrollable: [".item-body"] }
  };

  async _prepareContext() {
    const pack = game.packs.get("tierras-quebradas.habilidades");
    const docs = pack ? await pack.getDocuments() : [];
    const habilidades = docs
      .filter(h => h.system.clave)
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map(h => ({ clave: h.system.clave, nombre: h.name }));
    const actor = this.item.actor;
    let habilidadesPNJ = [];
    if (actor && actor.type !== "pj") {
      const nombresEstandar = new Set(habilidades.map(h => h.nombre));
      habilidadesPNJ = Object.keys(actor.system.habilidades ?? {})
        .filter(n => !nombresEstandar.has(n))
        .sort((a, b) => a.localeCompare(b, "es"))
        .map(n => ({ clave: n, nombre: n }));
    }
    const esferas = ["Agua","Aire","Caos","Cuerpo","Espíritu","Fuego","Ley","Mente","Planta","Tierra"];
    const verbos = ["Aumentar","Conocer","Disminuir","Dirigir","Inhibir","Invocar","Modificar","Transformar"];
    return { item: this.item, system: this.item.system, cssClass: this.options.classes.join(" "), habilidades, habilidadesPNJ, esferas, verbos };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(".item-img")?.addEventListener("click", () => {
      new foundry.applications.apps.FilePicker.implementation({
        type: "image", current: this.item.img, callback: path => this.item.update({ img: path })
      }).browse();
    });
    this.element.querySelectorAll(".toggle-estado").forEach(el => {
      el.addEventListener("click", async ev => {
        const campo = ev.currentTarget.dataset.campo;
        const actual = foundry.utils.getProperty(this.item, campo);
        await this.item.update({ [campo]: !actual });
      });
    });

    this.element.querySelector("input[data-campo='system.modEsfera']")?.addEventListener("change", ev => {
      this.item.update({ "system.modEsfera": parseInt(ev.currentTarget.value) || 0 });
    });
    this.element.querySelector("input[data-campo='system.modVerbo']")?.addEventListener("change", ev => {
      this.item.update({ "system.modVerbo": parseInt(ev.currentTarget.value) || 0 });
    });

    this.element.querySelector(".tirar-espiritu-objeto")?.addEventListener("click", async () => {
      const puntuacion = this.item.system.espiritu ?? 0;
      const etiqueta = game.i18n.localize("TQ.ObjetoMagico.EspirituObjeto");
      const actor = this.item.actor ?? null;
      const rollMode = game.settings.get("core", "rollMode");
      const target = game.user.targets.first();

      if (!target?.actor) {
        await TQRoll.dialogoTirada(etiqueta, puntuacion, { actor, dificultadPorDefecto: 15 });
        return;
      }

      const targetActor = target.actor;
      const targetEspiritu = targetActor.system.caracteristicas?.espiritu?.valor ?? 0;
      const rollTarget = await TQRoll._tirarExplosivo(10, rollMode);
      const dificultad = targetEspiritu + rollTarget.total;
      const dadoDisplay = TQRoll._dadoDisplay(rollTarget.total, rollTarget.tiradas);

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        content: `<p><strong>${targetActor.name}</strong> — ${etiqueta}: ${targetEspiritu} + ${dadoDisplay} = <strong>${dificultad}</strong></p>`,
        ...TQRoll._rollModeData(rollMode)
      });

      await TQRoll.dialogoTirada(etiqueta, puntuacion, { actor, dificultadForzada: dificultad });
    });
  }
}
