import Enemy from "./enemy.js";
import Vector2 from "./vector2.js";

export default class EnemySpawner {
  constructor(bounds) {
    this.bounds = bounds;
    this.spawnInterval = 1.5;
    this.spawnTimer = 0;
  }

  setBounds(width, height) {
    this.bounds = { width, height };
  }

  update(delta, round, center) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      return this.spawnEnemy(round, center);
    }
    return null;
  }

  spawnEnemy(round, center) {
    const edge = Math.floor(Math.random() * 4);
    const padding = 60;
    const halfWidth = this.bounds.width / 2;
    const halfHeight = this.bounds.height / 2;
    let position;
    if (edge === 0) {
      position = new Vector2(
        center.x + (Math.random() * 2 - 1) * halfWidth,
        center.y - halfHeight - padding
      );
    } else if (edge === 1) {
      position = new Vector2(
        center.x + halfWidth + padding,
        center.y + (Math.random() * 2 - 1) * halfHeight
      );
    } else if (edge === 2) {
      position = new Vector2(
        center.x + (Math.random() * 2 - 1) * halfWidth,
        center.y + halfHeight + padding
      );
    } else {
      position = new Vector2(
        center.x - halfWidth - padding,
        center.y + (Math.random() * 2 - 1) * halfHeight
      );
    }

    const catalog = this.getCatalog(round);
    const choice = catalog[Math.floor(Math.random() * catalog.length)];
    return new Enemy({
      ...choice,
      position,
      health: Math.ceil(choice.health + round * 0.2),
    });
  }

  getCatalog(round) {
    const base = [
      {
        radius: 22,
        speed: 50 + round * 4,
        health: 1,
        color: "#f56565",
        contactDamage: 1,
        spriteId: "spider",
      },
    ];
    if (round >= 3) {
      base.push({
        radius: 20,
        speed: 90 + round * 6,
        health: 1,
        color: "#f6ad55",
        contactDamage: 1,
        spriteId: "bunny",
      });
    }
    if (round >= 5) {
      base.push({
        radius: 30,
        speed: 40 + round * 2,
        health: 2,
        color: "#68d391",
        contactDamage: 1,
        spriteId: "beast",
      });
    }
    if (round >= 7) {
      base.push({
        radius: 18,
        speed: 120 + round * 5,
        health: 1,
        color: "#63b3ed",
        contactDamage: 1,
        spriteId: "snake",
      });
    }
    if (round >= 9) {
      base.push({
        radius: 22,
        speed: 80 + round * 3,
        health: 1,
        color: "#7f9cf5",
        contactDamage: 1,
        spriteId: "goblin",
      });
    }
    if (round >= 12) {
      base.push({
        radius: 19,
        speed: 100 + round * 4,
        health: 1,
        color: "#f56565",
        contactDamage: 1,
        spriteId: "slime",
      });
    }
    return base;
  }
}
