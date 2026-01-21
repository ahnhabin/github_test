import Enemy from "./enemy.js";
import Vector2 from "./vector2.js";

export default class EnemySpawner {
  constructor(bounds) {
    this.bounds = bounds;
    this.spawnInterval = 0.65;
    this.spawnTimer = 0;
  }

  setBounds(width, height) {
    this.bounds = { width, height };
  }

  setSpawnInterval(interval) {
    this.spawnInterval = Math.max(0.25, interval);
  }

  update(delta, stage, center, difficulty = null) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const count = Math.min(6, 1 + Math.floor(stage / 3));
      const enemies = [];
      for (let i = 0; i < count; i += 1) {
        enemies.push(this.spawnEnemy(stage, center, difficulty));
      }
      return enemies;
    }
    return null;
  }

  spawnEnemy(stage, center, difficulty = null) {
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

    const catalog = this.getCatalog(stage);
    const choice = catalog[Math.floor(Math.random() * catalog.length)];
    const healthScale = difficulty?.healthScale ?? 1;
    const speedScale = difficulty?.speedScale ?? 1;
    const rewardScale = difficulty?.rewardScale ?? 1;
    return new Enemy({
      ...choice,
      position,
      speed: choice.speed * speedScale,
      health: Math.ceil((choice.health + stage * 0.2) * healthScale),
      reward: Math.ceil((choice.reward ?? 1) * rewardScale),
    });
  }

  getCatalog(stage) {
    const base = [
      {
        radius: 22,
        speed: 50 + stage * 4,
        health: 1,
        color: "#f56565",
        contactDamage: 1,
        spriteId: "spider",
        reward: 1,
      },
    ];
    if (stage >= 3) {
      base.push({
        radius: 20,
        speed: 90 + stage * 6,
        health: 1,
        color: "#f6ad55",
        contactDamage: 1,
        spriteId: "bunny",
        reward: 2,
      });
    }
    if (stage >= 5) {
      base.push({
        radius: 30,
        speed: 40 + stage * 2,
        health: 2,
        color: "#68d391",
        contactDamage: 1,
        spriteId: "beast",
        reward: 3,
      });
    }
    if (stage >= 7) {
      base.push({
        radius: 18,
        speed: 120 + stage * 5,
        health: 1,
        color: "#63b3ed",
        contactDamage: 1,
        spriteId: "snake",
        reward: 2,
      });
    }
    if (stage >= 9) {
      base.push({
        radius: 22,
        speed: 80 + stage * 3,
        health: 1,
        color: "#7f9cf5",
        contactDamage: 1,
        spriteId: "goblin",
        reward: 3,
      });
    }
    if (stage >= 12) {
      base.push({
        radius: 19,
        speed: 100 + stage * 4,
        health: 1,
        color: "#f56565",
        contactDamage: 1,
        spriteId: "slime",
        reward: 4,
      });
    }
    return base;
  }
}
