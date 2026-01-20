class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(other) {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other) {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  scale(factor) {
    return new Vector2(this.x * factor, this.y * factor);
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const len = this.length() || 1;
    return new Vector2(this.x / len, this.y / len);
  }
}

class InputManager {
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

class Player {
  constructor(position) {
    this.position = position;
    this.radius = 14;
    this.speed = 160;
    this.attackPower = 1;
    this.fireCooldown = 1.0;
    this.fireTimer = 0;
  }

  update(delta, input, bounds) {
    const direction = input.getDirection();
    const movement = direction.scale(this.speed * delta);
    this.position = this.position.add(movement);
    this.position.x = Math.max(this.radius, Math.min(bounds.width - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(bounds.height - this.radius, this.position.y));

    this.fireTimer = Math.max(0, this.fireTimer - delta);
  }

  canFire() {
    return this.fireTimer <= 0;
  }

  resetFireTimer() {
    this.fireTimer = this.fireCooldown;
  }

  increaseAttack() {
    this.attackPower += 1;
  }

  improveFireRate() {
    this.fireCooldown = Math.max(0.2, this.fireCooldown - 0.1);
  }

  increaseSpeed() {
    this.speed *= 1.1;
  }
}

class Enemy {
  constructor(position, speed, health) {
    this.position = position;
    this.radius = 12;
    this.speed = speed;
    this.health = health;
  }

  update(delta, target) {
    const direction = target.subtract(this.position).normalize();
    this.position = this.position.add(direction.scale(this.speed * delta));
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  isDead() {
    return this.health <= 0;
  }
}

class Projectile {
  constructor(position, direction, speed, damage) {
    this.position = position;
    this.velocity = direction.normalize().scale(speed);
    this.damage = damage;
    this.radius = 4;
    this.isActive = true;
  }

  update(delta, bounds) {
    this.position = this.position.add(this.velocity.scale(delta));
    if (
      this.position.x < 0 ||
      this.position.y < 0 ||
      this.position.x > bounds.width ||
      this.position.y > bounds.height
    ) {
      this.isActive = false;
    }
  }
}

class ExperienceOrb {
  constructor(position, value) {
    this.position = position;
    this.radius = 6;
    this.value = value;
  }
}

class RoundManager {
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

class EnemySpawner {
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

    const speed = 50 + round * 8;
    const health = 2 + round;
    return new Enemy(position, speed, health);
  }
}

class UpgradeManager {
  constructor(player) {
    this.player = player;
    this.level = 1;
    this.exp = 0;
    this.nextExp = 5;
  }

  addExp(amount) {
    this.exp += amount;
    let leveledUp = false;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.level += 1;
      this.nextExp = Math.floor(this.nextExp * 1.5);
      this.applyUpgrade();
      leveledUp = true;
    }
    return leveledUp;
  }

  applyUpgrade() {
    const choice = this.level % 3;
    if (choice === 0) {
      this.player.increaseAttack();
    } else if (choice === 1) {
      this.player.improveFireRate();
    } else {
      this.player.increaseSpeed();
    }
  }
}

class HUD {
  constructor() {
    this.round = document.getElementById("round");
    this.level = document.getElementById("level");
    this.exp = document.getElementById("exp");
    this.nextExp = document.getElementById("next-exp");
    this.attack = document.getElementById("attack");
    this.fireRate = document.getElementById("fire-rate");
  }

  update(game) {
    this.round.textContent = game.roundManager.round;
    this.level.textContent = game.upgradeManager.level;
    this.exp.textContent = game.upgradeManager.exp;
    this.nextExp.textContent = game.upgradeManager.nextExp;
    this.attack.textContent = game.player.attackPower;
    this.fireRate.textContent = game.player.fireCooldown.toFixed(1);
  }
}

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlayer(player) {
    this.context.fillStyle = "#4fd1c5";
    this.context.beginPath();
    this.context.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
    this.context.fill();
  }

  drawEnemies(enemies) {
    this.context.fillStyle = "#f56565";
    enemies.forEach((enemy) => {
      this.context.beginPath();
      this.context.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  drawProjectiles(projectiles) {
    this.context.fillStyle = "#fbd38d";
    projectiles.forEach((projectile) => {
      this.context.beginPath();
      this.context.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  drawExperience(orbs) {
    this.context.fillStyle = "#9f7aea";
    orbs.forEach((orb) => {
      this.context.beginPath();
      this.context.arc(orb.position.x, orb.position.y, orb.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }
}

class Game {
  static instance = null;

  static getInstance() {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }

  constructor() {
    if (Game.instance) {
      throw new Error("Use Game.getInstance() instead of new Game().");
    }
    this.canvas = document.getElementById("game");
    this.renderer = new GameRenderer(this.canvas);
    this.input = new InputManager();
    this.player = new Player(new Vector2(this.canvas.width / 2, this.canvas.height / 2));
    this.roundManager = new RoundManager();
    this.spawner = new EnemySpawner({ width: this.canvas.width, height: this.canvas.height });
    this.upgradeManager = new UpgradeManager(this.player);
    this.hud = new HUD();
    this.enemies = [];
    this.projectiles = [];
    this.experienceOrbs = [];
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    const delta = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(delta);
    this.render();
    requestAnimationFrame(this.loop);
  }

  update(delta) {
    this.player.update(delta, this.input, this.canvas);

    const spawnEnemy = this.spawner.update(delta, this.roundManager.round);
    if (spawnEnemy) {
      this.enemies.push(spawnEnemy);
    }

    const nextRound = this.roundManager.update(delta);
    if (nextRound) {
      this.spawner.spawnInterval = Math.max(0.4, this.spawner.spawnInterval - 0.1);
    }

    this.autoFire();
    this.updateProjectiles(delta);
    this.updateEnemies(delta);
    this.collectExperience();
    this.hud.update(this);
  }

  autoFire() {
    if (!this.player.canFire()) {
      return;
    }

    const target = this.findClosestEnemy();
    if (!target) {
      return;
    }

    const direction = target.position.subtract(this.player.position);
    const projectile = new Projectile(
      new Vector2(this.player.position.x, this.player.position.y),
      direction,
      320,
      this.player.attackPower
    );
    this.projectiles.push(projectile);
    this.player.resetFireTimer();
  }

  findClosestEnemy() {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    this.enemies.forEach((enemy) => {
      const distance = enemy.position.subtract(this.player.position).length();
      if (distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    });
    return closest;
  }

  updateProjectiles(delta) {
    this.projectiles.forEach((projectile) => projectile.update(delta, this.canvas));
    this.projectiles = this.projectiles.filter((projectile) => projectile.isActive);

    this.projectiles.forEach((projectile) => {
      this.enemies.forEach((enemy) => {
        if (this.checkCollision(projectile, enemy)) {
          enemy.takeDamage(projectile.damage);
          projectile.isActive = false;
        }
      });
    });
  }

  updateEnemies(delta) {
    this.enemies.forEach((enemy) => enemy.update(delta, this.player.position));
    const remaining = [];
    this.enemies.forEach((enemy) => {
      if (enemy.isDead()) {
        this.experienceOrbs.push(new ExperienceOrb(enemy.position, 1));
      } else {
        remaining.push(enemy);
      }
    });
    this.enemies = remaining;
  }

  collectExperience() {
    const remaining = [];
    this.experienceOrbs.forEach((orb) => {
      const distance = orb.position.subtract(this.player.position).length();
      if (distance <= this.player.radius + orb.radius) {
        this.upgradeManager.addExp(orb.value);
      } else {
        remaining.push(orb);
      }
    });
    this.experienceOrbs = remaining;
  }

  checkCollision(a, b) {
    const distance = a.position.subtract(b.position).length();
    return distance < a.radius + b.radius;
  }

  render() {
    this.renderer.clear();
    this.renderer.drawExperience(this.experienceOrbs);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawProjectiles(this.projectiles);
    this.renderer.drawEnemies(this.enemies);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Game.getInstance().start();
});
