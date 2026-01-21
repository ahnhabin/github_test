import ExperienceOrb from "./experience_orb.js";
import GameRenderer from "./game_renderer.js";
import HUD from "./hud.js";
import InputManager from "./input_manager.js";
import EnemySpawner from "./enemy_spawner.js";
import Boss from "./boss.js";
import BossProjectile from "./boss_projectile.js";
import Drone from "./drone.js";
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
    this.player = new Player(new Vector2(0, 0));
    this.roundManager = new RoundManager();
    this.spawner = new EnemySpawner({ width: this.canvas.width, height: this.canvas.height });
    this.upgradeManager = new UpgradeManager(this);
    this.hud = new HUD();
    this.enemies = [];
    this.projectiles = [];
    this.bossProjectiles = [];
    this.experienceOrbs = [];
    this.drone = null;
    this.boss = null;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.isPaused = false;
    this.isGameOver = false;
    this.hasStarted = false;
    this.isBossChallenge = false;
    this.bossStage = 0;
    this.overlay = document.getElementById("overlay");
    this.overlayTitle = document.getElementById("overlay-title");
    this.overlayDescription = document.getElementById("overlay-description");
    this.overlayChoices = document.getElementById("upgrade-choices");
    this.restartButton = document.getElementById("restart-button");
    this.menuButton = document.getElementById("menu-button");
    this.bossBar = document.getElementById("boss-bar");
    this.bossName = document.getElementById("boss-name");
    this.bossHpText = document.getElementById("boss-hp-text");
    this.bossHpBar = document.getElementById("boss-hp-bar");
    this.bossCancel = document.getElementById("boss-cancel-run");
    this.bossCancel = document.getElementById("boss-cancel-run");
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

    this.menuButton.addEventListener("click", () => {
      window.location.reload();
    });
  }

  setViewport(width, height) {
    if (!width || !height) {
      return;
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.spawner.setBounds(width, height);
  }

  setPlayerSprite(path) {
    this.renderer.setPlayerSprite(path);
  }

  setPaused(value) {
    this.isPaused = value;
  }

  start() {
    if (this.hasStarted) {
      return;
    }
    this.hasStarted = true;
    this.lastTime = performance.now();
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

    this.player.update(delta, this.input);

    if (!this.isBossChallenge && !this.boss) {
      const spawnEnemy = this.spawner.update(delta, this.roundManager.round, this.player.position);
      if (spawnEnemy) {
        this.enemies.push(spawnEnemy);
      }
    }

    this.autoFire();
    this.updateDrone(delta);
    this.updateProjectiles(delta);
    this.updateBoss(delta);
    this.updateBossProjectiles(delta);
    this.updateEnemies(delta);
    this.collectExperience();
    this.hud.update(this);
    this.updateBossUi();
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
    const count = this.player.projectileCount;
    const perpendicular = new Vector2(-direction.y, direction.x);
    const spacing = 10;

    for (let i = 0; i < count; i += 1) {
      const offsetIndex = i - (count - 1) / 2;
      const offset = perpendicular.scale(offsetIndex * spacing);
      const spawnPosition = new Vector2(
        this.player.position.x + offset.x,
        this.player.position.y + offset.y
      );
      const projectile = new Projectile(
        spawnPosition,
        direction,
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
    if (this.boss) {
      const distance = this.boss.position.subtract(this.player.position).length();
      if (distance < closestDistance) {
        closest = this.boss;
        closestDistance = distance;
      }
    }
    return closest;
  }

  findClosestTarget(position) {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    this.enemies.forEach((enemy) => {
      const distance = enemy.position.subtract(position).length();
      if (distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    });
    if (this.boss) {
      const distance = this.boss.position.subtract(position).length();
      if (distance < closestDistance) {
        closest = this.boss;
        closestDistance = distance;
      }
    }
    return closest;
  }

  updateProjectiles(delta) {
    const maxRange = Math.max(this.canvas.width, this.canvas.height) * 1.2;
    this.projectiles.forEach((projectile) =>
      projectile.update(delta, this.player.position, maxRange)
    );
    this.projectiles = this.projectiles.filter((projectile) => projectile.isActive);

    this.projectiles.forEach((projectile) => {
      if (this.boss && this.checkCollision(projectile, this.boss)) {
        this.boss.takeDamage(projectile.damage);
        projectile.isActive = false;
      }
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
        const expValue = Math.ceil(2 * this.player.expMultiplier);
        this.experienceOrbs.push(new ExperienceOrb(enemy.position, expValue));
        const advanced = this.roundManager.registerKill();
        if (advanced) {
          this.rewardRoundAdvance();
        }
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
    this.renderer.setCamera(this.player.position);
    this.renderer.drawBackground();
    this.renderer.drawPickupRadius(this.player);
    this.renderer.drawExperience(this.experienceOrbs);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawDrone(this.drone);
    this.renderer.drawProjectiles(this.projectiles);
    this.renderer.drawBossProjectiles(this.bossProjectiles);
    this.renderer.drawBoss(this.boss);
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
    this.menuButton.classList.remove("is-visible");
    this.overlay.classList.add("overlay--active");
    this.isPaused = true;
  }

  hideOverlay() {
    this.overlay.classList.remove("overlay--active");
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.overlayTitle.textContent = "게임 오버";
    this.overlayDescription.textContent = "다시 시작하려면 버튼을 눌러주세요.";
    this.overlayChoices.innerHTML = "";
    this.restartButton.classList.add("is-visible");
    this.menuButton.classList.add("is-visible");
    this.overlay.classList.add("overlay--active");
  }

  spawnBoss(difficulty) {
    const difficultyScale = difficulty === "hard" ? 1.6 : 1.0;
    const stageScale = 1 + (this.bossStage - 1) * 0.6;
    this.boss = new Boss({
      position: new Vector2(this.player.position.x + 200, this.player.position.y - 120),
      radius: 36 + (this.bossStage - 1) * 6,
      maxHealth: Math.floor(220 * difficultyScale * stageScale),
      speed: 40 + (this.bossStage - 1) * 6,
      damage: difficultyScale > 1 ? 3 + this.bossStage : 2 + this.bossStage,
      projectileSpeed: 170,
      attackInterval: Math.max(0.7, 1.6 - (this.bossStage - 1) * 0.2),
      burstInterval: Math.max(2.4, 4.5 - (this.bossStage - 1) * 0.6),
    });
    this.enemies = [];
    this.spawner.spawnTimer = 0;
    if (this.bossName) {
      this.bossName.textContent = `${this.bossStage}스테이지 보스`;
    }
    this.renderer.setBossSprite(this.bossStage);
  }

  updateBoss(delta) {
    if (!this.boss) {
      return;
    }
    this.boss.update(delta, this.player.position);
    if (this.checkCollision(this.boss, this.player)) {
      this.player.takeDamage(this.boss.damage);
    }

    if (this.boss.canAttack()) {
      const dir = this.boss.getAimDirection(this.player.position);
      const spread = 0.2 + this.bossStage * 0.06;
      const count = 3 + this.bossStage * 2;
      const baseAngle = Math.atan2(dir.y, dir.x);
      const start = baseAngle - (spread * (count - 1)) / 2;
      for (let i = 0; i < count; i += 1) {
        const angle = start + spread * i;
        const velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(
          this.boss.projectileSpeed
        );
        this.bossProjectiles.push(
          new BossProjectile(new Vector2(this.boss.position.x, this.boss.position.y), velocity, 2)
        );
      }
      this.boss.resetAttack();
    }

    if (this.boss.canBurst()) {
      const burstCount = 12 + this.bossStage * 4;
      for (let i = 0; i < burstCount; i += 1) {
        const angle = (Math.PI * 2 * i) / burstCount;
        const velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(
          this.boss.projectileSpeed * 0.85
        );
        this.bossProjectiles.push(
          new BossProjectile(new Vector2(this.boss.position.x, this.boss.position.y), velocity, 1)
        );
      }
      this.boss.resetBurst();
    }

    if (this.boss.isDead()) {
      this.experienceOrbs.push(new ExperienceOrb(this.boss.position, 1000));
      if (this.bossStage < 3) {
        this.bossStage += 1;
        this.boss = null;
        this.bossProjectiles = [];
        this.spawnBoss(this.bossDifficulty);
      } else {
        this.boss = null;
        this.bossProjectiles = [];
        this.isBossChallenge = false;
        this.bossStage = 0;
      }
    }
  }

  updateBossProjectiles(delta) {
    if (this.bossProjectiles.length === 0) {
      return;
    }
    const maxRange = Math.max(this.canvas.width, this.canvas.height) * 1.8;
    this.bossProjectiles.forEach((projectile) =>
      projectile.update(delta, this.player.position, maxRange)
    );
    this.bossProjectiles = this.bossProjectiles.filter((projectile) => projectile.isActive);

    this.bossProjectiles.forEach((projectile) => {
      if (this.checkCollision(projectile, this.player)) {
        this.player.takeDamage(projectile.damage);
        projectile.isActive = false;
      }
    });
  }

  updateBossUi() {
    if (!this.bossBar || !this.bossHpBar || !this.bossHpText) {
      return;
    }
    if (!this.boss) {
      this.bossBar.hidden = true;
      return;
    }
    const ratio = Math.max(0, this.boss.getHealthRatio());
    const percent = Math.ceil(ratio * 100);
    this.bossBar.hidden = false;
    this.bossHpBar.style.width = `${percent}%`;
    this.bossHpText.textContent = `${percent}%`;
  }

  updateDrone(delta) {
    if (!this.drone) {
      return;
    }
    const target = this.findClosestTarget(this.drone.position);
    const hit = this.drone.update(delta, this.player.position, target);
    if (hit && target) {
      target.takeDamage(this.drone.attackPower);
    }
  }

  startBossChallenge(config) {
    if (this.boss) {
      return;
    }
    this.isBossChallenge = true;
    this.bossStage = 1;
    this.bossDifficulty = config?.difficulty || "normal";
    this.spawnBoss(this.bossDifficulty);
  }

  enableDrone() {
    if (this.drone) {
      return;
    }
    this.drone = new Drone({
      level: 1,
      position: new Vector2(this.player.position.x, this.player.position.y),
      orbitRadius: 90,
      orbitSpeed: 2.1,
      attackPower: 1,
      attackSpeed: 320,
      attackRange: 420,
      hitCooldown: 0.6,
      radius: 14,
    });
    this.renderer.setDroneLevel(this.drone.level);
  }

  upgradeDrone() {
    if (!this.drone) {
      this.enableDrone();
      return;
    }
    this.drone.upgrade();
    this.renderer.setDroneLevel(this.drone.level);
  }

  cancelBossChallenge() {
    if (!this.isBossChallenge) {
      return;
    }
    this.boss = null;
    this.bossProjectiles = [];
    this.isBossChallenge = false;
    this.bossStage = 0;
    if (this.bossBar) {
      this.bossBar.hidden = true;
    }
  }

  cancelBossChallenge() {
    if (!this.isBossChallenge) {
      return;
    }
    this.boss = null;
    this.bossProjectiles = [];
    this.isBossChallenge = false;
    this.bossStage = 0;
    if (this.bossBar) {
      this.bossBar.hidden = true;
    }
  }

  rewardRoundAdvance() {
    const choices = this.upgradeManager.catalog.getRandomChoices(3, this);
    this.presentUpgradeChoices(choices);
  }
}

