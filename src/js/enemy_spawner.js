import Enemy from "./enemy.js";
import Vector2 from "./vector2.js";

export default class EnemySpawner {
  constructor(bounds) {
    this.bounds = bounds;
    this.spawnInterval = 1.5;
    this.spawnTimer = 0;
  }

  update(delta, round) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      return this.spawnEnemy(round);
    }
    return null;
  }

  spawnEnemy(round) {
    const edge = Math.floor(Math.random() * 4);
    const padding = 20;
    let position;
    if (edge === 0) {
      position = new Vector2(Math.random() * this.bounds.width, -padding);
    } else if (edge === 1) {
      position = new Vector2(this.bounds.width + padding, Math.random() * this.bounds.height);
    } else if (edge === 2) {
      position = new Vector2(Math.random() * this.bounds.width, this.bounds.height + padding);
    } else {
      position = new Vector2(-padding, Math.random() * this.bounds.height);
    }

    const catalog = this.getCatalog(round);
    const choice = catalog[Math.floor(Math.random() * catalog.length)];
    return new Enemy({
      ...choice,
      position,
      health: Math.ceil(choice.health + round * 0.4),
    });
  }

  getCatalog(round) {
    const base = [
      { radius: 12, speed: 50 + round * 4, health: 1, color: "#f56565", contactDamage: 1 },
    ];
    if (round >= 3) {
      base.push({
        radius: 10,
        speed: 90 + round * 6,
        health: 1,
        color: "#f6ad55",
        contactDamage: 1,
      });
    }
    if (round >= 5) {
      base.push({
        radius: 16,
        speed: 40 + round * 2,
        health: 3,
        color: "#68d391",
        contactDamage: 2,
      });
    }
    if (round >= 7) {
      base.push({
        radius: 8,
        speed: 120 + round * 5,
        health: 1,
        color: "#63b3ed",
        contactDamage: 1,
      });
    }
    return base;
  }
}
