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
    this.projectileCount = 1;
    this.pickupRadius = 60;
    this.expMultiplier = 1;
    this.maxHealth = 10;
    this.health = 10;
    this.invulnerableTimer = 0;
  }

  update(delta, input, bounds) {
    const direction = input.getDirection();
    const movement = direction.scale(this.speed * delta);
    this.position = this.position.add(movement);
    this.position.x = Math.max(this.radius, Math.min(bounds.width - this.radius, this.position.x));
    this.position.y = Math.max(this.radius, Math.min(bounds.height - this.radius, this.position.y));

    this.fireTimer = Math.max(0, this.fireTimer - delta);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);
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

  increaseProjectileCount() {
    this.projectileCount += 1;
  }

  increasePickupRadius() {
    this.pickupRadius += 30;
  }

  increaseExpDrop() {
    this.expMultiplier += 0.25;
  }

  increaseMaxHealth() {
    this.maxHealth += 2;
    this.health = Math.min(this.health + 2, this.maxHealth);
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) {
      return false;
    }
    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.6;
    return true;
  }
}

class Enemy {
  constructor(config) {
    this.position = config.position;
    this.radius = config.radius;
    this.speed = config.speed;
    this.health = config.health;
    this.color = config.color;
    this.contactDamage = config.contactDamage;
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

class UpgradeOption {
  constructor(id, name, description, apply) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.apply = apply;
  }
}

class UpgradeCatalog {
  constructor() {
    this.options = [
      new UpgradeOption("attack", "공격력 강화", "피해 +1", (game) => game.player.increaseAttack()),
      new UpgradeOption(
        "fire-rate",
        "공격 속도 강화",
        "발사 쿨다운 -0.1s",
        (game) => game.player.improveFireRate()
      ),
      new UpgradeOption(
        "projectiles",
        "발사 개수 증가",
        "추가 투사체 +1",
        (game) => game.player.increaseProjectileCount()
      ),
      new UpgradeOption("speed", "이동 속도 강화", "이동 속도 +10%", (game) =>
        game.player.increaseSpeed()
      ),
      new UpgradeOption(
        "pickup",
        "경험치 자동 흡수 강화",
        "경험치 흡수 범위 +30",
        (game) => game.player.increasePickupRadius()
      ),
      new UpgradeOption(
        "exp-drop",
        "경험치 드랍 강화",
        "드랍 경험치 +25%",
        (game) => game.player.increaseExpDrop()
      ),
      new UpgradeOption("health", "체력 강화", "최대 HP +2", (game) =>
        game.player.increaseMaxHealth()
      ),
    ];
  }

  getRandomChoices(count) {
    const shuffled = [...this.options].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}

class UpgradeManager {
  constructor(player, game) {
    this.player = player;
    this.game = game;
    this.level = 1;
    this.exp = 0;
    this.nextExp = 5;
    this.catalog = new UpgradeCatalog();
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.level += 1;
      this.nextExp = Math.floor(this.nextExp * 1.5);
      const choices = this.catalog.getRandomChoices(3);
      this.game.presentUpgradeChoices(choices);
      return true;
    }
    return false;
  }

  applyUpgrade(option) {
    option.apply(this.game);
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
    this.hp = document.getElementById("hp");
  }

  update(game) {
    this.round.textContent = game.roundManager.round;
    this.level.textContent = game.upgradeManager.level;
    this.exp.textContent = game.upgradeManager.exp;
    this.nextExp.textContent = game.upgradeManager.nextExp;
    this.attack.textContent = game.player.attackPower;
    this.fireRate.textContent = game.player.fireCooldown.toFixed(1);
    this.hp.textContent = `${game.player.health} / ${game.player.maxHealth}`;
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
    this.context.fillStyle = player.invulnerableTimer > 0 ? "#fbd38d" : "#4fd1c5";
    this.context.beginPath();
    this.context.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
    this.context.fill();
  }

  drawEnemies(enemies) {
    enemies.forEach((enemy) => {
      this.context.fillStyle = enemy.color;
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

  drawPickupRadius(player) {
    this.context.strokeStyle = "rgba(159, 122, 234, 0.35)";
    this.context.beginPath();
    this.context.arc(player.position.x, player.position.y, player.pickupRadius, 0, Math.PI * 2);
    this.context.stroke();
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
    this.upgradeManager = new UpgradeManager(this.player, this);
    this.hud = new HUD();
    this.enemies = [];
    this.projectiles = [];
    this.experienceOrbs = [];
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.isPaused = false;
    this.isGameOver = false;
    this.overlay = document.getElementById("overlay");
    this.overlayTitle = document.getElementById("overlay-title");
    this.overlayDescription = document.getElementById("overlay-description");
    this.overlayChoices = document.getElementById("upgrade-choices");
    this.restartButton = document.getElementById("restart-button");
    this.registerOverlayHandlers();
  }

  registerOverlayHandlers() {
    this.overlayChoices.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }
      const upgradeId = button.dataset.upgradeId;
      const option = this.pendingUpgrades.find((item) => item.id === upgradeId);
      if (!option) {
        return;
      }
      this.upgradeManager.applyUpgrade(option);
      this.hideOverlay();
      this.isPaused = false;
    });

    this.restartButton.addEventListener("click", () => {
      window.location.reload();
    });
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
    if (this.isGameOver) {
      return;
    }

    if (this.isPaused) {
      this.hud.update(this);
      return;
    }

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

    const direction = target.position.subtract(this.player.position).normalize();
    const baseAngle = Math.atan2(direction.y, direction.x);
    const spread = 0.25;
    const count = this.player.projectileCount;
    const start = baseAngle - (spread * (count - 1)) / 2;

    for (let i = 0; i < count; i += 1) {
      const angle = start + spread * i;
      const shotDirection = new Vector2(Math.cos(angle), Math.sin(angle));
      const projectile = new Projectile(
        new Vector2(this.player.position.x, this.player.position.y),
        shotDirection,
        320,
        this.player.attackPower
      );
      this.projectiles.push(projectile);
    }

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
    const remaining = [];
    this.enemies.forEach((enemy) => {
      enemy.update(delta, this.player.position);
      if (this.checkCollision(enemy, this.player)) {
        const tookDamage = this.player.takeDamage(enemy.contactDamage);
        if (!tookDamage) {
          remaining.push(enemy);
        }
        return;
      }
      if (enemy.isDead()) {
        const expValue = Math.ceil(1 * this.player.expMultiplier);
        this.experienceOrbs.push(new ExperienceOrb(enemy.position, expValue));
      } else {
        remaining.push(enemy);
      }
    });
    this.enemies = remaining;

    if (this.player.health <= 0) {
      this.triggerGameOver();
    }
  }

  collectExperience() {
    const remaining = [];
    this.experienceOrbs.forEach((orb) => {
      const distance = orb.position.subtract(this.player.position).length();
      if (distance <= this.player.pickupRadius) {
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
    this.renderer.drawPickupRadius(this.player);
    this.renderer.drawExperience(this.experienceOrbs);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawProjectiles(this.projectiles);
    this.renderer.drawEnemies(this.enemies);
  }

  presentUpgradeChoices(options) {
    this.pendingUpgrades = options;
    this.overlayTitle.textContent = "업그레이드 선택";
    this.overlayDescription.textContent = "원하는 강화를 선택하세요.";
    this.overlayChoices.innerHTML = options
      .map(
        (option) => `
        <button class="upgrade-card" data-upgrade-id="${option.id}" type="button">
          <h3>${option.name}</h3>
          <p>${option.description}</p>
        </button>
      `
      )
      .join("");
    this.restartButton.classList.remove("is-visible");
    this.overlay.classList.add("overlay--active");
    this.isPaused = true;
  }

  hideOverlay() {
    this.overlay.classList.remove("overlay--active");
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.overlayTitle.textContent = "게임 오버";
    this.overlayDescription.textContent = "다시 도전해보세요.";
    this.overlayChoices.innerHTML = "";
    this.restartButton.classList.add("is-visible");
    this.overlay.classList.add("overlay--active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Game.getInstance().start();
});
