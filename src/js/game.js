import ExperienceOrb from "./experience_orb.js";
import GameRenderer from "./game_renderer.js";
import HUD from "./hud.js";
import InputManager from "./input_manager.js";
import EnemySpawner from "./enemy_spawner.js";
import Boss from "./boss.js";
import BossProjectile from "./boss_projectile.js";
import Drone from "./drone.js";
import ItemDrop from "./item_drop.js";
import Player from "./player.js";
import Projectile from "./projectile.js";
import StageManager from "./stage_manager.js";
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
    this.stageManager = new StageManager(50);
    this.spawner = new EnemySpawner({ width: this.canvas.width, height: this.canvas.height });
    this.upgradeManager = new UpgradeManager(this);
    this.hud = new HUD();
    this.enemies = [];
    this.projectiles = [];
    this.bossProjectiles = [];
    this.experienceOrbs = [];
    this.drone = null;
    this.itemDrops = [];
    this.items = new Map();
    this.itemDefinitions = new Map();
    this.autoBuildEnabled = false;
    this.autoBuildMode = "balance";
    this.synergyCounts = {
      attack: 0,
      rapid: 0,
      survival: 0,
      summon: 0,
      utility: 0,
    };
    this.synergyApplied = new Set();
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
    this.autoToggle = document.getElementById("auto-toggle");
    this.autoModeButtons = document.querySelectorAll("[data-auto-mode]");
    this.inventoryOpen = document.getElementById("inventory-open");
    this.inventoryOverlay = document.getElementById("inventory-overlay");
    this.inventoryList = document.getElementById("inventory-list");
    this.inventoryDetail = document.getElementById("inventory-detail");
    this.inventoryClose = document.getElementById("inventory-close");
    this.shopOpen = document.getElementById("shop-open");
    this.shopOverlay = document.getElementById("shop-overlay");
    this.shopList = document.getElementById("shop-list");
    this.shopDetail = document.getElementById("shop-detail");
    this.shopBuy = document.getElementById("shop-buy");
    this.shopClose = document.getElementById("shop-close");
    this.shopBadge = document.getElementById("shop-badge");
    this.shopCurrency = document.getElementById("shop-currency");
    this.stageMapOpen = document.getElementById("stage-map-open");
    this.stageMapOverlay = document.getElementById("stage-map-overlay");
    this.stageMapGrid = document.getElementById("stage-map-grid");
    this.stageMapClose = document.getElementById("stage-map-close");
    this.stageMapSubtitle = document.getElementById("stage-map-subtitle");
    this.stageMapBadge = document.getElementById("stage-map-badge");
    this.menuOpen = document.getElementById("menu-open");
    this.menuOverlay = document.getElementById("game-menu-overlay");
    this.menuClose = document.getElementById("menu-close");
    this.menuSave = document.getElementById("game-save");
    this.menuMain = document.getElementById("game-main-menu");
    this.menuDailyBoss = document.getElementById("daily-boss-open");
    this.statsOpen = document.getElementById("stats-open");
    this.statsOverlay = document.getElementById("stats-overlay");
    this.statsClose = document.getElementById("stats-close");
    this.statsAvatar = document.getElementById("stats-avatar");
    this.statsName = document.getElementById("stats-name");
    this.statsLevel = document.getElementById("stats-level");
    this.statsRound = document.getElementById("stats-round");
    this.statsKills = document.getElementById("stats-kills");
    this.statsHp = document.getElementById("stats-hp");
    this.statsAttack = document.getElementById("stats-attack");
    this.statsFireRate = document.getElementById("stats-fire-rate");
    this.statsSpeed = document.getElementById("stats-speed");
    this.statsProjectiles = document.getElementById("stats-projectiles");
    this.statsPickup = document.getElementById("stats-pickup");
    this.statsExp = document.getElementById("stats-exp");
    this.statsDrone = document.getElementById("stats-drone");
    this.selectedInventoryId = null;
    this.selectedShopId = null;
    this.playerProfile = null;
    this.playerSpritePath = null;
    this.baseSaveKey = "survivorPrototypeSave";
    this.baseCurrencyKey = "survivorPrototypeCurrency";
    this.saveSlot = null;
    this.currency = 0;
    this.shopItems = [];
    this.shopHasUpdate = false;
    this.skillCooldown = 8;
    this.skillTimer = 0;
    this.skillCooldownEl = document.getElementById("skill-cooldown");
    this.skillTimeEl = document.getElementById("skill-time");
    this.skillTree = {
      q: { name: "집중공격", cooldown: 6, timer: 0, labelEl: null, timeEl: null, cdEl: null },
      w: { name: "속도증가", cooldown: 12, timer: 0, labelEl: null, timeEl: null, cdEl: null },
      e: { name: "쿨다운", cooldown: 18, timer: 0, labelEl: null, timeEl: null, cdEl: null },
      r: { name: "잠금", cooldown: 0, timer: 0, disabled: true, labelEl: null, timeEl: null, cdEl: null },
    };
    this.rapidFocus = { active: false, timer: 0, tick: 0 };
    this.skillTreeElements = this.loadSkillTreeElements();
    this.pendingUpgrades = [];
    this.isStageBoss = false;
    this.stageVisibilityRadius = 0;
    this.portal = null;
    this.stageMapHasUpdate = false;
    this.returnToMenu = false;
    this.autoSaveTimer = null;
    this.stageBossSpriteId = null;
    this.dailyChallengeActive = false;
    this.dailyBossDateKey = "survivorPrototypeDailyBossDate";
    this.stageBossSprites = [
      "spider",
      "dino",
      "bunny",
      "snake",
      "turtle",
      "eyeball",
      "goblin",
      "beast",
      "slime",
    ];
    this.registerOverlayHandlers();
    this.refreshShop(false);
    this.applyStageSettings();
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
      if (this.saveSlot) {
        const profile = this.playerProfile;
        this.resetForNewGame(this.saveSlot);
        if (profile) {
          this.setPlayerProfile(profile);
        }
        this.hideOverlay();
        this.isGameOver = false;
        this.setPaused(false);
      } else {
        window.location.reload();
      }
    });

    this.menuButton.addEventListener("click", () => {
      window.location.reload();
    });

    if (this.autoToggle) {
      this.autoToggle.addEventListener("click", () => {
        this.autoBuildEnabled = !this.autoBuildEnabled;
        this.updateAutoUi();
      });
    }

    if (this.autoModeButtons) {
      this.autoModeButtons.forEach((button) => {
        button.addEventListener("click", () => {
          this.autoBuildMode = button.dataset.autoMode || "balance";
          this.updateAutoUi();
        });
      });
    }

    if (this.inventoryOpen && this.inventoryOverlay) {
      this.inventoryOpen.addEventListener("click", () => {
        this.prepareMenuNavigation();
        this.openInventory();
      });
    }

    if (this.inventoryClose && this.inventoryOverlay) {
      this.inventoryClose.addEventListener("click", () => {
        this.closeInventory();
      });
    }

    if (this.shopOpen && this.shopOverlay) {
      this.shopOpen.addEventListener("click", () => {
        this.prepareMenuNavigation();
        this.openShop();
      });
    }

    if (this.shopClose && this.shopOverlay) {
      this.shopClose.addEventListener("click", () => {
        this.closeShop();
      });
    }

    if (this.shopList) {
      this.shopList.addEventListener("click", (event) => {
        const button = event.target.closest(".shop-item");
        if (!button || button.classList.contains("is-soldout")) {
          return;
        }
        this.selectedShopId = button.dataset.itemId;
        this.updateShopUi();
      });
    }

    if (this.shopBuy) {
      this.shopBuy.addEventListener("click", () => {
        this.buyShopItem();
      });
    }

    if (this.menuOpen && this.menuOverlay) {
      this.menuOpen.addEventListener("click", () => {
        this.openGameMenu();
      });
    }

    if (this.menuClose && this.menuOverlay) {
      this.menuClose.addEventListener("click", () => {
        this.closeGameMenu();
      });
    }

    if (this.menuSave) {
      this.menuSave.addEventListener("click", () => {
        this.saveGame();
        window.alert("저장되었습니다.");
      });
    }

    if (this.menuDailyBoss) {
      this.menuDailyBoss.addEventListener("click", () => {
        if (!this.saveSlot) {
          window.alert("먼저 새 게임이나 이어하기로 슬롯을 선택하세요.");
          return;
        }
        if (!this.canStartDailyBoss()) {
          window.alert("오늘의 일일 보스 도전은 이미 완료했습니다.");
          return;
        }
        this.closeGameMenu();
        this.startDailyBossChallenge();
      });
    }

    if (this.menuMain) {
      this.menuMain.addEventListener("click", () => {
        this.saveGame();
        window.location.reload();
      });
    }

    if (this.stageMapOpen && this.stageMapOverlay) {
      this.stageMapOpen.addEventListener("click", () => {
        this.prepareMenuNavigation();
        this.openStageMap();
      });
    }

    if (this.stageMapClose && this.stageMapOverlay) {
      this.stageMapClose.addEventListener("click", () => {
        this.closeStageMap();
      });
    }

    if (this.stageMapGrid) {
      this.stageMapGrid.addEventListener("click", (event) => {
        const button = event.target.closest(".stage-map-node");
        if (!button || button.classList.contains("is-locked")) {
          return;
        }
        const stage = Number(button.dataset.stage);
        if (!Number.isFinite(stage)) {
          return;
        }
        this.transitionToStage(stage);
        this.closeStageMap();
      });
    }

    if (this.statsOpen && this.statsOverlay) {
      this.statsOpen.addEventListener("click", () => {
        this.prepareMenuNavigation();
        this.openStats();
      });
    }

    if (this.statsClose && this.statsOverlay) {
      this.statsClose.addEventListener("click", () => {
        this.closeStats();
      });
    }

    if (this.inventoryList) {
      this.inventoryList.addEventListener("click", (event) => {
        const button = event.target.closest(".inventory-item");
        if (!button) {
          return;
        }
        this.selectedInventoryId = button.dataset.itemId;
        this.updateInventoryUi();
      });
    }
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
    const resolvedPath = this.resolvePlayerSpritePath({ path });
    this.playerSpritePath = resolvedPath || null;
    this.renderer.setPlayerSprite(resolvedPath);
    this.updateStatsAvatar();
  }

  setPlayerProfile(profile) {
    if (!profile) {
      return;
    }
    const resolvedPath = this.resolvePlayerSpritePath(profile);
    this.playerProfile = { ...profile, path: resolvedPath };
    this.setPlayerSprite(resolvedPath);
    if (this.statsName) {
      this.statsName.textContent = profile.id || "선택된 캐릭터";
    }
  }

  resolvePlayerSpritePath(profile) {
    if (!profile) {
      return null;
    }
    const id = profile.id || "";
    const legacyPath = profile.path || "";
    if (id) {
      if (/^F_\d+$/i.test(id)) {
        return `src/assets/characters/female/${id.toLowerCase()}.png`;
      }
      if (/^M_\d+$/i.test(id)) {
        return `src/assets/characters/male/${id.toLowerCase()}.png`;
      }
    }
    return legacyPath || null;
  }

  setPaused(value) {
    this.isPaused = value;
  }

  setSaveSlot(slotId) {
    if (!slotId) {
      return;
    }
    this.saveSlot = slotId;
    window.localStorage.setItem("survivorPrototypeLastSlot", slotId);
    this.currency = this.loadCurrency();
    this.updateShopUi();
  }

  resetForNewGame(slotId) {
    this.setSaveSlot(slotId);
    this.player = new Player(new Vector2(0, 0));
    this.upgradeManager = new UpgradeManager(this);
    this.stageManager = new StageManager(50);
    this.enemies = [];
    this.projectiles = [];
    this.bossProjectiles = [];
    this.experienceOrbs = [];
    this.drone = null;
    this.itemDrops = [];
    this.items = new Map();
    this.itemDefinitions = new Map();
    this.synergyCounts = {
      attack: 0,
      rapid: 0,
      survival: 0,
      summon: 0,
      utility: 0,
    };
    this.synergyApplied = new Set();
    this.boss = null;
    this.bossStage = 0;
    this.isBossChallenge = false;
    this.isStageBoss = false;
    this.stageVisibilityRadius = 0;
    this.portal = null;
    this.stageMapHasUpdate = false;
    this.dailyChallengeActive = false;
    this.stageBossSpriteId = null;
    this.rapidFocus = { active: false, timer: 0, tick: 0 };
    Object.values(this.skillTree).forEach((skill) => {
      skill.timer = 0;
    });
    this.skillTimer = 0;
    this.currency = this.loadCurrency();
    this.applyStageSettings();
    this.updateInventoryUi();
    this.updateShopUi();
    this.updateStatsUi();
    this.renderStageMap();
    this.isGameOver = false;
    this.hideOverlay();
    this.setPaused(false);
  }

  loadFromSave(data, slotId) {
    if (!data) {
      return;
    }
    this.setSaveSlot(slotId);
    this.player = new Player(new Vector2(0, 0));
    this.upgradeManager = new UpgradeManager(this);
    this.stageManager = new StageManager(50);
    this.enemies = [];
    this.projectiles = [];
    this.bossProjectiles = [];
    this.experienceOrbs = [];
    this.drone = null;
    this.itemDrops = [];
    this.items = new Map();
    this.itemDefinitions = new Map();
    this.synergyCounts = data.synergyCounts || {
      attack: 0,
      rapid: 0,
      survival: 0,
      summon: 0,
      utility: 0,
    };
    this.synergyApplied = new Set(data.synergyApplied || []);
    this.boss = null;
    this.bossStage = 0;
    this.isBossChallenge = false;
    this.isStageBoss = false;
    this.portal = null;
    this.stageMapHasUpdate = false;
    this.dailyChallengeActive = false;
    this.stageBossSpriteId = null;
    this.rapidFocus = { active: false, timer: 0, tick: 0 };
    Object.values(this.skillTree).forEach((skill) => {
      skill.timer = 0;
    });
    this.skillTimer = 0;
    this.isGameOver = false;

    if (data.playerProfile) {
      this.playerProfile = {
        ...data.playerProfile,
        path: this.resolvePlayerSpritePath(data.playerProfile),
      };
      this.setPlayerSprite(this.playerProfile.path);
    }

    this.applySavedPlayerStats(data.playerStats || {});
    if (this.player.health <= 0) {
      this.player.health = this.player.maxHealth;
    }
    this.applySavedUpgrades(data.upgrades || {});
    this.applySavedStage(data.stageState || {});
    this.applySavedItems(data.items || []);
    this.applySavedDrone(data.droneLevel || 0);
    this.applySavedBarrier(data.barrier || null);

    this.currency = Number.isFinite(data.currency) ? data.currency : this.currency;
    this.saveCurrency();

    this.applyStageSettings();
    this.updateInventoryUi();
    this.updateShopUi();
    this.updateStatsUi();
    this.renderStageMap();
    this.hideOverlay();
    this.setPaused(false);
  }

  applySavedPlayerStats(stats) {
    this.player.attackPower = stats.attackPower ?? this.player.attackPower;
    this.player.fireCooldown = stats.fireCooldown ?? this.player.fireCooldown;
    this.player.projectileCount = stats.projectileCount ?? this.player.projectileCount;
    this.player.speed = stats.speed ?? this.player.speed;
    this.player.pickupRadius = stats.pickupRadius ?? this.player.pickupRadius;
    this.player.magnetRadius = stats.magnetRadius ?? this.player.magnetRadius;
    this.player.orbPickupRadius = stats.orbPickupRadius ?? this.player.orbPickupRadius;
    this.player.expMultiplier = stats.expMultiplier ?? this.player.expMultiplier;
    this.player.maxHealth = stats.maxHealth ?? this.player.maxHealth;
    this.player.health = Math.min(stats.health ?? this.player.health, this.player.maxHealth);
  }

  applySavedUpgrades(upgrades) {
    this.upgradeManager.level = upgrades.level ?? this.upgradeManager.level;
    this.upgradeManager.exp = upgrades.exp ?? this.upgradeManager.exp;
    this.upgradeManager.nextExp = upgrades.nextExp ?? this.upgradeManager.nextExp;
  }

  applySavedStage(stageState) {
    if (!stageState) {
      return;
    }
    this.stageManager.stage = stageState.stage ?? this.stageManager.stage;
    this.stageManager.unlockedStage =
      stageState.unlockedStage ?? this.stageManager.unlockedStage;
    this.stageManager.kills = stageState.kills ?? 0;
    this.stageManager.killsNeeded =
      stageState.killsNeeded ?? this.stageManager.getKillsNeeded(this.stageManager.stage);
    this.stageManager.cleared = stageState.cleared ?? false;
  }

  applySavedItems(items) {
    if (!Array.isArray(items)) {
      return;
    }
    items.forEach((item) => {
      this.items.set(item.id, {
        name: item.name,
        description: item.description || "",
        count: item.count || 1,
      });
      this.itemDefinitions.set(item.id, {
        name: item.name,
        description: item.description || "",
      });
    });
  }

  applySavedDrone(level) {
    if (!level || level <= 0) {
      return;
    }
    this.drone = new Drone({
      level,
      position: new Vector2(this.player.position.x, this.player.position.y),
      orbitRadius: 90,
      orbitSpeed: 2.1 + (level - 1) * 0.3,
      attackPower: 1 + (level - 1),
      attackSpeed: 320 + (level - 1) * 40,
      attackRange: 420 + (level - 1) * 40,
      hitCooldown: Math.max(0.3, 0.6 - (level - 1) * 0.05),
      radius: 14,
    });
    this.renderer.setDroneLevel(level);
  }

  applySavedBarrier(barrier) {
    if (!barrier) {
      return;
    }
    this.player.barrierLevel = barrier.level || 0;
    this.player.barrierRadius = barrier.radius || 0;
    this.player.barrierDamage = barrier.damage || this.player.barrierDamage;
  }

  exportSaveState() {
    return {
      updatedAt: Date.now(),
      stage: this.stageManager.stage,
      level: this.upgradeManager.level,
      playerProfile: this.playerProfile,
      playerStats: {
        attackPower: this.player.attackPower,
        fireCooldown: this.player.fireCooldown,
        projectileCount: this.player.projectileCount,
        speed: this.player.speed,
        pickupRadius: this.player.pickupRadius,
        magnetRadius: this.player.magnetRadius,
        orbPickupRadius: this.player.orbPickupRadius,
        expMultiplier: this.player.expMultiplier,
        maxHealth: this.player.maxHealth,
        health: this.player.health,
      },
      upgrades: {
        level: this.upgradeManager.level,
        exp: this.upgradeManager.exp,
        nextExp: this.upgradeManager.nextExp,
      },
      stageState: {
        stage: this.stageManager.stage,
        unlockedStage: this.stageManager.unlockedStage,
        kills: this.stageManager.kills,
        killsNeeded: this.stageManager.killsNeeded,
        cleared: this.stageManager.cleared,
      },
      items: Array.from(this.items.entries()).map(([id, item]) => ({
        id,
        name: item.name,
        description: item.description || "",
        count: item.count || 1,
      })),
      droneLevel: this.drone?.level || 0,
      barrier: {
        level: this.player.barrierLevel,
        radius: this.player.barrierRadius,
        damage: this.player.barrierDamage,
      },
      currency: this.currency,
      synergyCounts: this.synergyCounts,
      synergyApplied: Array.from(this.synergyApplied),
    };
  }

  saveGame() {
    if (!this.saveSlot) {
      return;
    }
    const data = this.exportSaveState();
    try {
      window.localStorage.setItem(
        `${this.baseSaveKey}:${this.saveSlot}`,
        JSON.stringify(data)
      );
      window.localStorage.setItem("survivorPrototypeLastSlot", this.saveSlot);
    } catch (error) {
      // Ignore save errors.
    }
  }

  start() {
    if (this.hasStarted) {
      return;
    }
    this.hasStarted = true;
    this.lastTime = performance.now();
    if (!this.autoSaveTimer) {
      this.autoSaveTimer = window.setInterval(() => {
        this.saveGame();
      }, 30000);
    }
    this.saveGame();
    requestAnimationFrame(this.loop);
  }

  loadSkillTreeElements() {
    const map = {};
    ["q", "w", "e", "r"].forEach((key) => {
      map[key] = {
        cdEl: document.getElementById(`skill-${key}-cd`),
        timeEl: document.getElementById(`skill-${key}-time`),
      };
    });
    return map;
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
      this.updateSkillUi();
      this.updateSkillTreeUi();
      this.updateStatsUi();
      return;
    }

    this.player.update(delta, this.input);
    this.updateSkill(delta);
    this.updatePortal(delta);

    this.ensureStageBoss();

    if (!this.isBossChallenge && !this.boss && !this.stageManager.isBossStage()) {
      const spawned = this.spawner.update(
        delta,
        this.stageManager.stage,
        this.player.position,
        this.getStageDifficulty()
      );
      if (spawned) {
        if (Array.isArray(spawned)) {
          this.enemies.push(...spawned);
        } else {
          this.enemies.push(spawned);
        }
      }
    }

    this.autoFire();
    this.updateDrone(delta);
    this.updateProjectiles(delta);
    this.updateBoss(delta);
    this.updateBossProjectiles(delta);
    this.updateEnemies(delta);
    this.updateItemDrops();
    this.collectExperience(delta);
    this.hud.update(this);
    this.updateBossUi();
    this.updateAutoUi();
    this.updateSkillUi();
    this.updateSkillTreeUi();
    this.updateStatsUi();
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
        const expScale = 1 + this.stageManager.stage * 0.05;
        const expValue = Math.ceil(2 * this.player.expMultiplier * expScale);
        this.experienceOrbs.push(new ExperienceOrb(enemy.position, expValue));
        this.addCurrency(enemy.reward || 1);
        this.maybeDropItem(enemy.position);
        const advanced = this.stageManager.registerKill();
        if (advanced) {
          this.handleStageClear();
        }
      } else {
        remaining.push(enemy);
      }
    });
    this.enemies = remaining;

    if (this.player.barrierRadius > 0) {
      this.enemies.forEach((enemy) => {
        const distance = enemy.position.subtract(this.player.position).length();
        if (distance <= this.player.barrierRadius + enemy.radius) {
          enemy.takeDamage(this.player.barrierDamage * delta);
        }
      });
    }

    if (this.player.health <= 0) {
      this.triggerGameOver();
    }
  }

  updateSkill(delta) {
    if (this.skillTimer > 0) {
      this.skillTimer = Math.max(0, this.skillTimer - delta);
    }
    if (!this.input.consumePressed(" ")) {
      this.updateSkillTree(delta);
      return;
    }
    if (this.skillTimer > 0) {
      this.updateSkillTree(delta);
      return;
    }
    this.castSkill();
    this.skillTimer = this.skillCooldown;
    this.updateSkillTree(delta);
  }

  updateSkillTree(delta) {
    this.updateRapidFocus(delta);
    Object.values(this.skillTree).forEach((skill) => {
      if (skill.timer > 0) {
        skill.timer = Math.max(0, skill.timer - delta);
      }
    });

    if (this.input.consumePressed("q")) {
      this.tryCastSkill("q");
    }
    if (this.input.consumePressed("w")) {
      this.tryCastSkill("w");
    }
    if (this.input.consumePressed("e")) {
      this.tryCastSkill("e");
    }
    if (this.input.consumePressed("r")) {
      this.tryCastSkill("r");
    }
  }

  tryCastSkill(key) {
    const skill = this.skillTree[key];
    if (!skill || skill.disabled) {
      return;
    }
    if (skill.timer > 0) {
      return;
    }
    if (key === "q") {
      this.castFocusedBurst(22, 0.6, 380, 1.1);
      skill.timer = skill.cooldown;
      return;
    }
    if (key === "w") {
      this.startRapidFocus();
      skill.timer = skill.cooldown;
      return;
    }
    if (key === "e") {
      this.reduceAllSkillCooldowns(0.4);
      skill.timer = skill.cooldown;
    }
  }

  castFocusedBurst(count, spread, speed, damageMultiplier) {
    const target = this.findClosestEnemy();
    if (!target) {
      return;
    }
    const direction = target.position.subtract(this.player.position).normalize();
    const baseAngle = Math.atan2(direction.y, direction.x);
    const start = baseAngle - (spread * (count - 1)) / 2;
    for (let i = 0; i < count; i += 1) {
      const angle = start + spread * i;
      const dir = new Vector2(Math.cos(angle), Math.sin(angle));
      const damage = Math.max(1, this.player.attackPower * damageMultiplier);
      this.projectiles.push(
        new Projectile(new Vector2(this.player.position.x, this.player.position.y), dir, speed, damage)
      );
    }
  }

  startRapidFocus() {
    this.rapidFocus = { active: true, timer: 3.2, tick: 0 };
    this.player.stageSpeedMultiplier = (this.player.stageSpeedMultiplier || 1) * 1.2;
  }

  updateRapidFocus(delta) {
    if (!this.rapidFocus.active) {
      return;
    }
    this.rapidFocus.timer -= delta;
    this.rapidFocus.tick -= delta;
    if (this.rapidFocus.tick <= 0) {
      this.rapidFocus.tick = 0.12;
      this.castFocusedBurst(8, 0.35, 420, 0.75);
    }
    if (this.rapidFocus.timer <= 0) {
      this.rapidFocus.active = false;
      this.player.stageSpeedMultiplier = this.getStageDifficulty().speedPenalty;
    }
  }

  reduceAllSkillCooldowns(ratio) {
    const multiplier = Math.max(0, Math.min(1, 1 - ratio));
    Object.keys(this.skillTree).forEach((key) => {
      if (key === "e") {
        return;
      }
      this.skillTree[key].timer *= multiplier;
    });
    this.skillTimer *= multiplier;
  }

  castSkill() {
    const count = 32;
    const speed = 420;
    const damage = Math.max(1, this.player.attackPower * 0.8);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const direction = new Vector2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        new Projectile(
          new Vector2(this.player.position.x, this.player.position.y),
          direction,
          speed,
          damage
        )
      );
    }
  }

  collectExperience(delta) {
    const remaining = [];
    this.experienceOrbs.forEach((orb) => {
      const distance = orb.position.subtract(this.player.position).length();
      if (distance <= this.player.orbPickupRadius) {
        this.upgradeManager.addExp(orb.value);
      } else if (distance <= this.player.magnetRadius) {
        const speed = Math.max(120, (this.player.magnetRadius - distance) * 4);
        orb.moveToward(this.player.position, speed, delta);
        remaining.push(orb);
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
    this.renderer.drawItemDrops(this.itemDrops);
    this.renderer.drawPortal(this.portal);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawDrone(this.drone);
    this.renderer.drawProjectiles(this.projectiles);
    this.renderer.drawBossProjectiles(this.bossProjectiles);
    this.renderer.drawBoss(this.boss);
    this.renderer.drawEnemies(this.enemies);
    this.renderer.drawVisibilityMask(this.player, this.stageVisibilityRadius);
  }

  presentUpgradeChoices(options) {
    if (this.autoBuildEnabled) {
      const choice = this.autoSelectUpgrade(options);
      if (choice) {
        this.upgradeManager.applyUpgrade(choice);
      }
      return;
    }
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
    const difficultyScale = difficulty === "hard" ? 1.9 : 1.2;
    const stageScale = 1 + (this.bossStage - 1) * 0.6;
    const stageDifficultyScale = this.isStageBoss
      ? 1 + this.stageManager.stage * 0.04
      : 1;
    const isCritterBoss = this.isStageBoss;
    const baseRadius = isCritterBoss ? 70 + this.stageManager.stage * 1.2 : 38 + (this.bossStage - 1) * 6;
    this.boss = new Boss({
      position: new Vector2(this.player.position.x + 200, this.player.position.y - 120),
      radius: baseRadius,
      maxHealth: Math.floor(260 * difficultyScale * stageScale * stageDifficultyScale),
      speed: (isCritterBoss ? 70 : 55 + (this.bossStage - 1) * 8) * stageDifficultyScale,
      damage: Math.ceil(
        (difficultyScale > 1 ? 4 + this.bossStage : 3 + this.bossStage) * stageDifficultyScale
      ),
      projectileSpeed: (isCritterBoss ? 240 : 210) * stageDifficultyScale,
      attackInterval: Math.max(0.55, 1.3 - (this.bossStage - 1) * 0.18),
      burstInterval: Math.max(1.9, 3.8 - (this.bossStage - 1) * 0.5),
      spriteType: isCritterBoss ? "critter" : "mage",
      spriteId: isCritterBoss ? this.stageBossSpriteId : null,
    });
    this.enemies = [];
    this.spawner.spawnTimer = 0;
    if (this.bossName) {
      this.bossName.textContent = this.isStageBoss
        ? `${this.stageManager.stage}스테이지 보스`
        : `일일 보스 ${this.bossStage}단계`;
    }
    if (!isCritterBoss) {
      this.renderer.setBossSprite(this.bossStage);
    }
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
      const spread = 0.26 + this.bossStage * 0.08;
      const count = 4 + this.bossStage * 3 + (this.isStageBoss ? 6 : 0);
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
      if (this.isStageBoss) {
        const ringCount = 10 + Math.floor(this.stageManager.stage / 2);
        const offset = this.boss.animTime * 1.4;
        for (let i = 0; i < ringCount; i += 1) {
          const angle = (Math.PI * 2 * i) / ringCount + offset;
          const velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(
            this.boss.projectileSpeed * 0.9
          );
          this.bossProjectiles.push(
            new BossProjectile(new Vector2(this.boss.position.x, this.boss.position.y), velocity, 1)
          );
        }
      }
      this.boss.resetAttack();
    }

    if (this.boss.canBurst()) {
      const burstCount = 16 + this.bossStage * 6;
      for (let i = 0; i < burstCount; i += 1) {
        const angle = (Math.PI * 2 * i) / burstCount;
        const velocity = new Vector2(Math.cos(angle), Math.sin(angle)).scale(
          this.boss.projectileSpeed * 0.95
        );
        this.bossProjectiles.push(
          new BossProjectile(new Vector2(this.boss.position.x, this.boss.position.y), velocity, 1)
        );
      }
      this.boss.resetBurst();
    }

    if (this.boss.isDead()) {
      if (this.dailyChallengeActive) {
        const rewardCurrency = 4000;
        const rewardExp = 8000;
        this.addCurrency(rewardCurrency);
        this.experienceOrbs.push(new ExperienceOrb(this.boss.position, rewardExp));
      } else {
        this.addCurrency(200 * this.bossStage);
        const expScale = 1 + this.stageManager.stage * 0.1;
        this.experienceOrbs.push(new ExperienceOrb(this.boss.position, Math.ceil(1000 * expScale)));
      }

      const maxPhase = this.isStageBoss ? 1 : 3;
      if (this.bossStage < maxPhase) {
        this.bossStage += 1;
        this.boss = null;
        this.bossProjectiles = [];
        this.spawnBoss(this.bossDifficulty);
      } else {
        this.boss = null;
        this.bossProjectiles = [];
        if (this.isStageBoss) {
          this.isStageBoss = false;
          this.stageManager.markBossCleared();
          this.handleStageClear();
        }
        if (this.dailyChallengeActive) {
          this.completeDailyChallenge();
        }
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

  ensureStageBoss() {
    if (this.isBossChallenge) {
      return;
    }
    if (!this.stageManager.isBossStage() || this.stageManager.cleared) {
      return;
    }
    if (this.boss) {
      return;
    }
    this.isStageBoss = true;
    this.bossStage = 1;
    const index = Math.floor(this.stageManager.stage / 5) - 1;
    this.stageBossSpriteId = this.stageBossSprites[index % this.stageBossSprites.length];
    this.bossDifficulty = this.stageManager.stage >= 20 ? "hard" : "normal";
    this.spawnBoss(this.bossDifficulty);
  }

  handleStageClear() {
    this.spawnPortal();
    this.rewardRoundAdvance();
    this.saveGame();
  }

  advanceStageFromPortal() {
    if (!this.stageManager.cleared) {
      return;
    }
    if (this.stageManager.stage >= this.stageManager.maxStage) {
      return;
    }
    this.stageManager.advanceStage();
    this.resetStageState();
    this.applyStageSettings();
    this.portal = null;
    this.stageMapHasUpdate = true;
    this.updateStageMapBadge();
    this.renderStageMap();
  }

  transitionToStage(stage) {
    if (stage > this.stageManager.unlockedStage) {
      return;
    }
    this.stageManager.setStage(stage);
    this.resetStageState();
    this.applyStageSettings();
    this.portal = null;
    this.renderStageMap();
  }

  resetStageState() {
    this.enemies = [];
    this.projectiles = [];
    this.bossProjectiles = [];
    this.experienceOrbs = [];
    this.itemDrops = [];
    this.boss = null;
    this.isStageBoss = false;
    this.bossStage = 0;
    this.portal = null;
    this.spawner.spawnTimer = 0;
  }

  applyStageSettings() {
    const difficulty = this.getStageDifficulty();
    this.spawner.setSpawnInterval(difficulty.spawnInterval);
    this.player.stageSpeedMultiplier = difficulty.speedPenalty;
    this.stageVisibilityRadius = difficulty.visibilityRadius;
    this.renderer.setTheme(this.getStageTheme(this.stageManager.stage));
  }

  getStageDifficulty() {
    const stage = this.stageManager.stage;
    const healthScale = 1 + stage * 0.035;
    const speedScale = 1 + stage * 0.02;
    const rewardScale = 1 + stage * 0.04;
    const spawnInterval = Math.max(0.28, 0.7 - stage * 0.008);
    const speedPenalty = stage >= 15 ? Math.max(0.78, 1 - stage * 0.004) : 1;
    const visibilityRadius = stage >= 10 ? Math.max(240, 420 - stage * 4) : 0;
    return {
      healthScale,
      speedScale,
      rewardScale,
      spawnInterval,
      speedPenalty,
      visibilityRadius,
    };
  }

  getStageTheme(stage) {
    const tier = Math.floor((stage - 1) / 5);
    const themes = [
      { name: "grass", tint: null },
      { name: "dusk", tint: "rgba(40, 70, 120, 0.18)" },
      { name: "autumn", tint: "rgba(120, 80, 40, 0.2)" },
      { name: "frost", tint: "rgba(200, 220, 255, 0.18)" },
      { name: "swamp", tint: "rgba(40, 100, 60, 0.22)" },
      { name: "ember", tint: "rgba(130, 50, 40, 0.22)" },
      { name: "midnight", tint: "rgba(20, 30, 60, 0.25)" },
      { name: "myst", tint: "rgba(60, 90, 120, 0.22)" },
      { name: "sand", tint: "rgba(170, 150, 90, 0.22)" },
      { name: "storm", tint: "rgba(70, 120, 130, 0.24)" },
    ];
    return themes[Math.min(themes.length - 1, tier)];
  }

  openStageMap() {
    if (!this.stageMapOverlay) {
      return;
    }
    this.stageMapOverlay.hidden = false;
    this.setPaused(true);
    this.stageMapHasUpdate = false;
    this.updateStageMapBadge();
    this.renderStageMap();
  }

  closeStageMap() {
    if (!this.stageMapOverlay) {
      return;
    }
    this.stageMapOverlay.hidden = true;
    this.handleOverlayClose();
  }

  openGameMenu() {
    if (!this.menuOverlay) {
      return;
    }
    this.returnToMenu = false;
    this.menuOverlay.hidden = false;
    this.setPaused(true);
  }

  closeGameMenu() {
    if (!this.menuOverlay) {
      return;
    }
    this.menuOverlay.hidden = true;
    this.setPaused(false);
  }

  prepareMenuNavigation() {
    this.returnToMenu = !!(this.menuOverlay && !this.menuOverlay.hidden);
    if (this.returnToMenu) {
      this.closeGameMenu();
    }
  }

  handleOverlayClose() {
    if (this.returnToMenu) {
      this.returnToMenu = false;
      this.openGameMenu();
      return;
    }
    this.setPaused(false);
  }

  renderStageMap() {
    if (!this.stageMapGrid) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= this.stageManager.maxStage; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stage-map-node";
      button.dataset.stage = String(i);
      button.textContent = this.stageManager.isBossStage(i) ? `B${i}` : `${i}`;
      if (i === this.stageManager.stage) {
        button.classList.add("is-current");
      }
      if (this.stageManager.isBossStage(i)) {
        button.classList.add("is-boss");
      }
      if (i > this.stageManager.unlockedStage) {
        button.classList.add("is-locked");
      }
      fragment.appendChild(button);
    }
    this.stageMapGrid.innerHTML = "";
    this.stageMapGrid.appendChild(fragment);
    if (this.stageMapSubtitle) {
      this.stageMapSubtitle.textContent = `스테이지 ${this.stageManager.stage}`;
    }
  }

  updateStageMapBadge() {
    if (!this.stageMapBadge) {
      return;
    }
    this.stageMapBadge.hidden = !this.stageMapHasUpdate;
  }

  spawnPortal() {
    if (!this.stageManager.cleared || this.portal) {
      return;
    }
    const offset = new Vector2(120, -80);
    this.portal = {
      position: new Vector2(
        this.player.position.x + offset.x,
        this.player.position.y + offset.y
      ),
      radius: 26,
      pulse: 0,
    };
  }

  updatePortal(delta) {
    if (!this.portal) {
      return;
    }
    this.portal.pulse += delta;
    const distance = this.portal.position.subtract(this.player.position).length();
    if (distance <= this.portal.radius + this.player.radius) {
      this.advanceStageFromPortal();
    }
  }

  updateItemDrops() {
    if (this.itemDrops.length === 0) {
      return;
    }
    const remaining = [];
    this.itemDrops.forEach((drop) => {
      const distance = drop.position.subtract(this.player.position).length();
      if (distance <= this.player.pickupRadius) {
        drop.apply(this);
        this.addItem(drop.id, drop.label);
      } else {
        remaining.push(drop);
      }
    });
    this.itemDrops = remaining;
  }

  maybeDropItem(position) {
    if (Math.random() > 0.18) {
      return;
    }
    const pool = [
      {
        id: "core",
        label: "코어",
        description: "공격력 +1",
        apply: (game) => {
          game.player.increaseAttack();
        },
      },
      {
        id: "reactor",
        label: "리액터",
        description: "발사 쿨타임 -0.1s",
        apply: (game) => {
          game.player.improveFireRate();
        },
      },
      {
        id: "armor",
        label: "아머",
        description: "최대 HP +2",
        apply: (game) => {
          game.player.increaseMaxHealth();
        },
      },
      {
        id: "drone-chip",
        label: "드론 칩",
        description: "드론 강화 1단계",
        apply: (game) => {
          game.upgradeDrone();
        },
      },
    ];
    const choice = pool[Math.floor(Math.random() * pool.length)];
    this.itemDefinitions.set(choice.id, {
      name: choice.label,
      description: choice.description,
    });
    this.itemDrops.push(
      new ItemDrop({
        id: choice.id,
        label: choice.label,
        description: choice.description,
        position,
        radius: 12,
        apply: choice.apply,
      })
    );
  }

  addItem(id, name) {
    const definition = this.itemDefinitions.get(id);
    const itemName = definition?.name || name;
    const description = definition?.description || "";
    const current = this.items.get(id) || { name: itemName, description, count: 0 };
    current.count += 1;
    this.items.set(id, current);
    this.updateInventoryUi();
  }

  updateAutoUi() {
    if (!this.autoToggle || !this.autoModeButtons) {
      return;
    }
    this.autoToggle.textContent = this.autoBuildEnabled ? "AUTO ON" : "AUTO OFF";
    this.autoModeButtons.forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.autoMode === this.autoBuildMode);
    });
  }

  openInventory() {
    if (!this.inventoryOverlay) {
      return;
    }
    this.inventoryOverlay.hidden = false;
    this.setPaused(true);
    this.updateInventoryUi();
  }

  closeInventory() {
    if (!this.inventoryOverlay) {
      return;
    }
    this.inventoryOverlay.hidden = true;
    this.handleOverlayClose();
  }

  openShop() {
    if (!this.shopOverlay) {
      return;
    }
    this.shopOverlay.hidden = false;
    this.setPaused(true);
    this.shopHasUpdate = false;
    this.updateShopBadge();
    this.updateShopUi();
  }

  closeShop() {
    if (!this.shopOverlay) {
      return;
    }
    this.shopOverlay.hidden = true;
    this.handleOverlayClose();
  }

  openStats() {
    if (!this.statsOverlay) {
      return;
    }
    this.statsOverlay.hidden = false;
    this.setPaused(true);
    this.updateStatsUi();
  }

  closeStats() {
    if (!this.statsOverlay) {
      return;
    }
    this.statsOverlay.hidden = true;
    this.handleOverlayClose();
  }

  updateInventoryUi() {
    if (!this.inventoryList || !this.inventoryDetail) {
      return;
    }
    this.inventoryList.innerHTML = "";
    if (this.items.size === 0) {
      this.inventoryDetail.textContent = "아이템을 선택하세요.";
      return;
    }
    if (!this.selectedInventoryId || !this.items.has(this.selectedInventoryId)) {
      this.selectedInventoryId = this.items.keys().next().value;
    }
    this.items.forEach((item, id) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inventory-item";
      button.dataset.itemId = id;
      button.textContent = `${item.name} x${item.count}`;
      if (id === this.selectedInventoryId) {
        button.classList.add("is-selected");
      }
      this.inventoryList.appendChild(button);
    });
    const selected = this.items.get(this.selectedInventoryId);
    if (selected) {
      this.inventoryDetail.textContent = selected.description || "설명 없음";
    }
  }

  updateShopUi() {
    if (!this.shopList || !this.shopDetail || !this.shopBuy) {
      return;
    }
    this.shopList.innerHTML = "";
    if (this.shopItems.length === 0) {
      this.shopDetail.textContent = "현재 판매 아이템이 없습니다.";
      this.shopBuy.disabled = true;
      return;
    }
    if (!this.selectedShopId || !this.shopItems.some((item) => item.id === this.selectedShopId)) {
      this.selectedShopId = this.shopItems[0].id;
    }
    this.shopItems.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shop-item";
      button.dataset.itemId = item.id;
      if (item.sold) {
        button.classList.add("is-soldout");
      }
      if (item.id === this.selectedShopId) {
        button.classList.add("is-selected");
      }
      button.innerHTML = `
        <div class="shop-item__title">${item.name}</div>
        <div class="shop-item__meta">가격 ${item.cost}</div>
      `;
      this.shopList.appendChild(button);
    });
    const selected = this.shopItems.find((item) => item.id === this.selectedShopId);
    if (selected) {
      const affordable = this.currency >= selected.cost;
      const status = selected.sold
        ? "품절"
        : affordable
          ? "구매 가능"
          : "재화 부족";
      this.shopDetail.innerHTML = `
        <div><strong>${selected.name}</strong></div>
        <div>${selected.description}</div>
        <div>가격: ${selected.cost}</div>
        <div>상태: ${status}</div>
      `;
      this.shopBuy.disabled = selected.sold || !affordable;
    }
    if (this.shopCurrency) {
      this.shopCurrency.textContent = this.currency;
    }
  }

  updateShopBadge() {
    if (!this.shopBadge) {
      return;
    }
    this.shopBadge.hidden = !this.shopHasUpdate;
  }

  updateSkillUi() {
    if (!this.skillCooldownEl || !this.skillTimeEl) {
      return;
    }
    const ratio = this.skillCooldown > 0 ? this.skillTimer / this.skillCooldown : 0;
    this.skillCooldownEl.style.setProperty("--cooldown", ratio.toFixed(3));
    if (this.skillTimer <= 0) {
      this.skillTimeEl.textContent = "READY";
    } else {
      this.skillTimeEl.textContent = `${this.skillTimer.toFixed(1)}s`;
    }
  }

  updateSkillTreeUi() {
    Object.entries(this.skillTree).forEach(([key, skill]) => {
      const els = this.skillTreeElements[key];
      if (!els || !els.cdEl || !els.timeEl) {
        return;
      }
      if (skill.disabled) {
        els.timeEl.textContent = "LOCK";
        els.cdEl.style.setProperty("--cooldown", "1");
        return;
      }
      const ratio =
        skill.cooldown > 0 ? Math.max(0, Math.min(1, skill.timer / skill.cooldown)) : 0;
      els.cdEl.style.setProperty("--cooldown", ratio.toFixed(3));
      els.timeEl.textContent = skill.timer > 0 ? `${skill.timer.toFixed(1)}s` : "READY";
    });
  }

  buyShopItem() {
    const selected = this.shopItems.find((item) => item.id === this.selectedShopId);
    if (!selected || selected.sold) {
      return;
    }
    if (this.currency < selected.cost) {
      return;
    }
    this.addCurrency(-selected.cost);
    selected.apply(this);
    selected.sold = true;
    this.updateShopUi();
    this.updateStatsUi();
  }

  refreshShop(notify) {
    const catalog = this.getShopCatalog();
    const shuffled = [...catalog].sort(() => Math.random() - 0.5);
    this.shopItems = shuffled.slice(0, 4).map((item) => ({
      ...item,
      sold: false,
    }));
    this.selectedShopId = this.shopItems.length > 0 ? this.shopItems[0].id : null;
    if (notify) {
      this.shopHasUpdate = true;
    }
    this.updateShopBadge();
    this.updateShopUi();
  }

  getShopCatalog() {
    return [
      {
        id: "shop-attack",
        name: "공격력 강화",
        description: "공격력이 +1 증가합니다.",
        cost: 25,
        apply: (game) => game.player.increaseAttack(),
      },
      {
        id: "shop-rapid",
        name: "연사 강화",
        description: "발사 쿨타임이 -0.1s 감소합니다.",
        cost: 30,
        apply: (game) => game.player.improveFireRate(),
      },
      {
        id: "shop-hp",
        name: "체력 강화",
        description: "최대 HP가 +2 증가합니다.",
        cost: 28,
        apply: (game) => game.player.increaseMaxHealth(),
      },
      {
        id: "shop-speed",
        name: "기동성 강화",
        description: "이동 속도가 10% 증가합니다.",
        cost: 22,
        apply: (game) => game.player.increaseSpeed(),
      },
      {
        id: "shop-projectile",
        name: "투사체 강화",
        description: "투사체 수가 +1 증가합니다.",
        cost: 35,
        apply: (game) => game.player.increaseProjectileCount(),
      },
      {
        id: "shop-drone",
        name: "드론 강화",
        description: "드론을 강화합니다.",
        cost: 40,
        apply: (game) => game.upgradeDrone(),
      },
    ];
  }

  getCurrencyKey() {
    if (!this.saveSlot) {
      return this.baseCurrencyKey;
    }
    return `${this.baseCurrencyKey}:${this.saveSlot}`;
  }

  loadCurrency() {
    try {
      const stored = window.localStorage.getItem(this.getCurrencyKey());
      const value = Number(stored);
      return Number.isFinite(value) ? value : 0;
    } catch (error) {
      return 0;
    }
  }

  saveCurrency() {
    try {
      window.localStorage.setItem(this.getCurrencyKey(), String(this.currency));
    } catch (error) {
      // Ignore storage errors.
    }
  }

  addCurrency(amount) {
    this.currency = Math.max(0, this.currency + amount);
    this.saveCurrency();
    this.updateShopUi();
  }

  updateStatsAvatar() {
    if (!this.statsAvatar) {
      return;
    }
    if (!this.playerSpritePath) {
      this.statsAvatar.style.backgroundImage = "none";
      return;
    }
    this.statsAvatar.style.backgroundImage = `url("${this.playerSpritePath}")`;
    this.statsAvatar.style.backgroundPosition = "0 0";
  }

  updateStatsUi() {
    if (!this.statsOverlay || this.statsOverlay.hidden) {
      return;
    }
    if (this.statsName && this.playerProfile?.id) {
      this.statsName.textContent = this.playerProfile.id;
    }
    if (this.statsLevel) {
      this.statsLevel.textContent = this.upgradeManager.level;
    }
    if (this.statsRound) {
      this.statsRound.textContent = this.stageManager.stage;
    }
    if (this.statsKills) {
      const remaining = Math.max(
        0,
        (this.stageManager.killsNeeded || 0) - (this.stageManager.kills || 0)
      );
      this.statsKills.textContent = this.stageManager.isBossStage() ? "-" : remaining;
    }
    if (this.statsHp) {
      this.statsHp.textContent = `${this.player.health} / ${this.player.maxHealth}`;
    }
    if (this.statsAttack) {
      this.statsAttack.textContent = this.player.attackPower;
    }
    if (this.statsFireRate) {
      this.statsFireRate.textContent = `${this.player.fireCooldown.toFixed(1)}s`;
    }
    if (this.statsSpeed) {
      const speed = this.player.speed * (this.player.stageSpeedMultiplier || 1);
      this.statsSpeed.textContent = Math.round(speed);
    }
    if (this.statsProjectiles) {
      this.statsProjectiles.textContent = this.player.projectileCount;
    }
    if (this.statsPickup) {
      this.statsPickup.textContent = Math.round(this.player.magnetRadius);
    }
    if (this.statsExp) {
      this.statsExp.textContent = this.player.expMultiplier.toFixed(2);
    }
    if (this.statsDrone) {
      this.statsDrone.textContent = this.drone ? `Lv.${this.drone.level}` : "없음";
    }
  }

  registerUpgradeTags(tags) {
    tags.forEach((tag) => {
      if (this.synergyCounts[tag] === undefined) {
        this.synergyCounts[tag] = 0;
      }
      this.synergyCounts[tag] += 1;
      if (this.synergyCounts[tag] >= 3 && !this.synergyApplied.has(tag)) {
        this.applySynergy(tag);
        this.synergyApplied.add(tag);
      }
    });
  }

  applySynergy(tag) {
    if (tag === "attack") {
      this.player.increaseAttack();
      this.itemDefinitions.set("synergy-attack", {
        name: "시너지: 공격",
        description: "공격 태그 3회 달성 보너스 (공격력 +1)",
      });
      this.addItem("synergy-attack", "시너지: 공격");
    } else if (tag === "rapid") {
      this.player.improveFireRate();
      this.itemDefinitions.set("synergy-rapid", {
        name: "시너지: 연사",
        description: "연사 태그 3회 달성 보너스 (쿨다운 감소)",
      });
      this.addItem("synergy-rapid", "시너지: 연사");
    } else if (tag === "survival") {
      this.player.increaseMaxHealth();
      this.itemDefinitions.set("synergy-survival", {
        name: "시너지: 생존",
        description: "생존 태그 3회 달성 보너스 (최대 HP 증가)",
      });
      this.addItem("synergy-survival", "시너지: 생존");
    } else if (tag === "summon") {
      this.upgradeDrone();
      this.itemDefinitions.set("synergy-summon", {
        name: "시너지: 소환",
        description: "소환 태그 3회 달성 보너스 (드론 강화)",
      });
      this.addItem("synergy-summon", "시너지: 소환");
    } else if (tag === "utility") {
      this.player.increaseMagnetRadius();
      this.itemDefinitions.set("synergy-utility", {
        name: "시너지: 유틸",
        description: "유틸 태그 3회 달성 보너스 (자석 범위 증가)",
      });
      this.addItem("synergy-utility", "시너지: 유틸");
    }
  }

  autoSelectUpgrade(options) {
    const weights = {
      attack: this.autoBuildMode === "attack" ? 3 : 1,
      rapid: this.autoBuildMode === "attack" ? 2 : 1,
      survival: this.autoBuildMode === "survival" ? 3 : 1,
      summon: this.autoBuildMode === "attack" ? 2 : 1,
      utility: this.autoBuildMode === "balance" ? 2 : 1,
      mobility: this.autoBuildMode === "balance" ? 2 : 1,
    };
    let best = options[0];
    let bestScore = -1;
    options.forEach((option) => {
      const tags = option.tags || [];
      const score = tags.reduce((sum, tag) => sum + (weights[tag] || 1), 0);
      if (score > bestScore) {
        best = option;
        bestScore = score;
      }
    });
    return best;
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
    this.itemDefinitions.set("drone", {
      name: "드론",
      description: "플레이어 주변을 돌며 적에게 돌진 공격합니다.",
    });
    this.addItem("drone", "드론");
    this.renderer.setDroneLevel(this.drone.level);
  }

  enableBarrier() {
    this.player.enableBarrier();
    this.itemDefinitions.set("barrier", {
      name: `결계 Lv.${this.player.barrierLevel}`,
      description: "주변 결계가 적에게 피해를 줍니다.",
    });
    this.items.set("barrier", {
      name: `결계 Lv.${this.player.barrierLevel}`,
      description: "주변 결계가 적에게 피해를 줍니다.",
      count: 1,
    });
    this.updateInventoryUi();
  }

  upgradeBarrierRange() {
    this.player.increaseBarrierRadius();
    this.itemDefinitions.set("barrier", {
      name: `결계 Lv.${this.player.barrierLevel}`,
      description: "결계 반경이 증가했습니다.",
    });
    this.items.set("barrier", {
      name: `결계 Lv.${this.player.barrierLevel}`,
      description: "결계 반경이 증가했습니다.",
      count: 1,
    });
    this.updateInventoryUi();
  }

  upgradeDrone() {
    if (!this.drone) {
      this.enableDrone();
      return;
    }
    this.drone.upgrade();
    this.itemDefinitions.set("drone", {
      name: `드론 Lv.${this.drone.level}`,
      description: "드론 속도/공격력이 강화되었습니다.",
    });
    this.items.set("drone", {
      name: `드론 Lv.${this.drone.level}`,
      description: "드론 속도/공격력이 강화되었습니다.",
      count: 1,
    });
    this.updateInventoryUi();
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
    this.refreshShop(true);
  }

  canStartDailyBoss() {
    const today = new Date().toISOString().slice(0, 10);
    const last = window.localStorage.getItem(this.dailyBossDateKey);
    return last !== today;
  }

  startDailyBossChallenge() {
    this.dailyChallengeActive = true;
    this.isBossChallenge = true;
    this.isStageBoss = false;
    this.bossStage = 1;
    this.bossDifficulty = "hard";
    this.boss = null;
    this.bossProjectiles = [];
    this.enemies = [];
    this.spawner.spawnTimer = 0;
    this.spawnBoss(this.bossDifficulty);
  }

  completeDailyChallenge() {
    this.dailyChallengeActive = false;
    const today = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(this.dailyBossDateKey, today);
    this.saveGame();
  }
}

