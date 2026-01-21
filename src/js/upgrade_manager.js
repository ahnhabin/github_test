import { UpgradeCatalog } from "./upgrade.js";

export default class UpgradeManager {
  constructor(game) {
    this.game = game;
    this.level = 1;
    this.exp = 0;
    this.nextExp = 3;
    this.catalog = new UpgradeCatalog();
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.nextExp) {
      this.levelUpAndPrompt();
      return true;
    }
    return false;
  }

  applyUpgrade(option) {
    option.apply(this.game);
    this.consumePendingLevels();
  }

  consumePendingLevels() {
    if (this.exp < this.nextExp) {
      return;
    }
    this.levelUpAndPrompt();
  }

  levelUpAndPrompt() {
    this.exp -= this.nextExp;
    this.level += 1;
    this.nextExp = Math.max(3, Math.floor(this.nextExp * 1.25) + 1);
    const choices = this.catalog.getRandomChoices(3, this.game);
    this.game.presentUpgradeChoices(choices);
  }
}
