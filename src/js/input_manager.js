import Vector2 from "./vector2.js";

export default class InputManager {
  constructor() {
    this.keys = new Set();
    window.addEventListener("keydown", (event) => this.keys.add(event.key));
    window.addEventListener("keyup", (event) => this.keys.delete(event.key));
  }

  getDirection() {
    const left = this.keys.has("a") || this.keys.has("ArrowLeft");
    const right = this.keys.has("d") || this.keys.has("ArrowRight");
    const up = this.keys.has("w") || this.keys.has("ArrowUp");
    const down = this.keys.has("s") || this.keys.has("ArrowDown");

    const direction = new Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0)
    );
    return direction.length() > 0 ? direction.normalize() : direction;
  }
}
