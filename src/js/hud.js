export default class HUD {
  constructor() {
    this.round = document.getElementById("round");
    this.level = document.getElementById("level");
    this.exp = document.getElementById("exp");
    this.nextExp = document.getElementById("next-exp");
    this.attack = document.getElementById("attack");
    this.fireRate = document.getElementById("fire-rate");
    this.hp = document.getElementById("hp");
  }

  update(game) {
    this.round.textContent = game.roundManager.round;
    this.level.textContent = game.upgradeManager.level;
    this.exp.textContent = game.upgradeManager.exp;
    this.nextExp.textContent = game.upgradeManager.nextExp;
    this.attack.textContent = game.player.attackPower;
    this.fireRate.textContent = game.player.fireCooldown.toFixed(1);
    this.hp.textContent = `${game.player.health} / ${game.player.maxHealth}`;
  }
}
