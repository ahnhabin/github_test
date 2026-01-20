import ExperienceOrb from "./experience_orb.js";
import GameRenderer from "./game_renderer.js";
import HUD from "./hud.js";
import InputManager from "./input_manager.js";
import EnemySpawner from "./enemy_spawner.js";
import Player from "./player.js";
import Projectile from "./projectile.js";
import RoundManager from "./round_manager.js";
import UpgradeManager from "./upgrade_manager.js";
import Vector2 from "./vector2.js";

export default class Game {
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
    this.upgradeManager = new UpgradeManager(this);
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
    this.pendingUpgrades = [];
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
