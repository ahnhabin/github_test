import Vector2 from "./vector2.js";

export default class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    window.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        event.preventDefault();
      }
      if (!this.keys.has(event.key)) {
        this.justPressed.add(event.key);
      }
      this.keys.add(event.key);
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.key));
  }

  consumePressed(key) {
    if (!this.justPressed.has(key)) {
      return false;
    }
    this.justPressed.delete(key);
    return true;
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
