import Vector2 from "./vector2.js";

export default class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    window.addEventListener("keydown", (event) => {
      let key = event.key;
      if (key.length === 1) {
        key = key.toLowerCase();
      }
      if (key === " ") {
        event.preventDefault();
      }
      if (!this.keys.has(key)) {
        this.justPressed.add(key);
      }
      this.keys.add(key);
    });
    window.addEventListener("keyup", (event) => {
      let key = event.key;
      if (key.length === 1) {
        key = key.toLowerCase();
      }
      this.keys.delete(key);
      this.justPressed.delete(key);
    });
  }

  consumePressed(key) {
    if (!this.justPressed.has(key)) {
      return false;
    }
    this.justPressed.delete(key);
    return true;
  }

  getDirection() {
    const left = this.keys.has("ArrowLeft");
    const right = this.keys.has("ArrowRight");
    const up = this.keys.has("ArrowUp");
    const down = this.keys.has("ArrowDown");

    const direction = new Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0)
    );
    return direction.length() > 0 ? direction.normalize() : direction;
  }
}
