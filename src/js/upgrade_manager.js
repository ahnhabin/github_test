import { UpgradeCatalog } from "./upgrade.js";

export default class UpgradeManager {
  constructor(game) {
    this.game = game;
    this.level = 1;
    this.exp = 0;
    this.nextExp = 5;
    this.catalog = new UpgradeCatalog();
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.level += 1;
      this.nextExp = Math.floor(this.nextExp * 1.5);
      const choices = this.catalog.getRandomChoices(3);
      this.game.presentUpgradeChoices(choices);
      return true;
    }
    return false;
  }

  applyUpgrade(option) {
    option.apply(this.game);
  }
}
