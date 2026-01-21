export default class RoundManager {
  constructor() {
    this.round = 1;
    this.kills = 0;
    this.killsNeeded = 10;
  }

  isBossRound() {
    return false;
  }

  registerKill() {
    this.kills += 1;
    if (this.kills >= this.killsNeeded) {
      this.advanceRound();
      return true;
    }
    return false;
  }

  advanceRound() {
    this.round += 1;
    this.kills = 0;
    if (!this.isBossRound()) {
      this.killsNeeded = this.round * 10;
    }
  }
}
