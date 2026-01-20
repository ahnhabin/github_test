export default class RoundManager {
  constructor() {
    this.round = 1;
    this.roundDuration = 20;
    this.timer = 0;
  }

  update(delta) {
    this.timer += delta;
    if (this.timer >= this.roundDuration) {
      this.round += 1;
      this.timer = 0;
      return true;
    }
    return false;
  }
}
