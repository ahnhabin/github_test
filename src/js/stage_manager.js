export default class StageManager {
  constructor(maxStage = 50) {
    this.maxStage = maxStage;
    this.stage = 1;
    this.kills = 0;
    this.killsNeeded = this.getKillsNeeded(this.stage);
    this.cleared = false;
    this.unlockedStage = 1;
  }

  isBossStage(stage = this.stage) {
    return stage % 5 === 0;
  }

  getKillsNeeded(stage) {
    return stage * 10;
  }

  registerKill() {
    if (this.cleared || this.isBossStage()) {
      return false;
    }
    this.kills += 1;
    if (this.kills >= this.killsNeeded) {
      this.cleared = true;
      return true;
    }
    return false;
  }

  markBossCleared() {
    this.cleared = true;
  }

  advanceStage() {
    if (this.stage >= this.maxStage) {
      return;
    }
    this.stage += 1;
    this.unlockedStage = Math.max(this.unlockedStage, this.stage);
    this.kills = 0;
    this.killsNeeded = this.getKillsNeeded(this.stage);
    this.cleared = false;
  }

  setStage(stage) {
    const target = Math.max(1, Math.min(this.maxStage, stage));
    this.stage = target;
    this.unlockedStage = Math.max(this.unlockedStage, this.stage);
    this.kills = 0;
    this.killsNeeded = this.getKillsNeeded(this.stage);
    this.cleared = false;
  }
}
