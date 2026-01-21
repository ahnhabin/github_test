export default class HUD {
  constructor() {
    this.round = document.getElementById("round");
    this.level = document.getElementById("level");
    this.killsRemaining = document.getElementById("kills-remaining");
    this.currency = document.getElementById("currency");
    this.exp = document.getElementById("exp");
    this.nextExp = document.getElementById("next-exp");
    this.expPercent = document.getElementById("exp-percent");
    this.expBar = document.getElementById("exp-bar");
    this.attack = document.getElementById("attack");
    this.fireRate = document.getElementById("fire-rate");
    this.hp = document.getElementById("hp");
  }

  update(game) {
    if (this.round) {
      this.round.textContent = game.stageManager.stage;
    }
    if (this.level) {
      this.level.textContent = game.upgradeManager.level;
    }
    if (this.killsRemaining) {
      const remaining = Math.max(
        0,
        (game.stageManager.killsNeeded || 0) - (game.stageManager.kills || 0)
      );
      this.killsRemaining.textContent = game.stageManager.isBossStage() ? "-" : remaining;
    }
    if (this.currency) {
      this.currency.textContent = game.currency ?? 0;
    }
    if (this.exp) {
      this.exp.textContent = game.upgradeManager.exp;
    }
    if (this.nextExp) {
      this.nextExp.textContent = game.upgradeManager.nextExp;
    }
    if (this.expPercent && this.expBar) {
      const percent =
        game.upgradeManager.nextExp > 0
          ? Math.min(100, Math.floor((game.upgradeManager.exp / game.upgradeManager.nextExp) * 100))
          : 0;
      this.expPercent.textContent = `${percent}%`;
      this.expBar.style.width = `${percent}%`;
    }
    if (this.attack) {
      this.attack.textContent = game.player.attackPower;
    }
    if (this.fireRate) {
      this.fireRate.textContent = game.player.fireCooldown.toFixed(1);
    }
    if (this.hp) {
      this.hp.textContent = `${game.player.health} / ${game.player.maxHealth}`;
    }
  }
}
