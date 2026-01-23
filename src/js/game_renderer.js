export default class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.camera = { x: 0, y: 0 };
    this.playerImage = null;
    this.playerReady = false;
    this.playerFrame = { w: 0, h: 0, cols: 4, rows: 3 };
    this.bossImage = null;
    this.bossReady = false;
    this.bossProcessed = null;
    this.bossFrame = { w: 85, h: 94, cols: 4, rows: 2 };
    this.bossStage = 1;
    this.setBossSprite(1);
    this.stageBossImage = new Image();
    this.stageBossReady = false;
    this.stageBossImage.src = "src/assets/boss/stage/critters.png";
    this.stageBossImage.addEventListener("load", () => {
      this.stageBossReady = true;
    });
    this.bossBulletImage = new Image();
    this.bossBulletImage.src = "src/assets/boss/boss1/bullet.png";
    this.bossBulletReady = false;
    this.bossBulletProcessed = null;
    this.bossBulletImage.addEventListener("load", () => {
      this.bossBulletProcessed = this.processBulletImage(this.bossBulletImage);
      this.bossBulletReady = true;
    });
    this.droneImage = new Image();
    this.droneImage.src = "src/assets/drones/modular_ships.png";
    this.droneReady = false;
    this.droneProcessed = null;
    this.droneLevel = 1;
    this.droneSprites = [
      { x: 5 * 32, y: 11 * 32, w: 32, h: 32 },
      { x: 6 * 32, y: 5 * 32, w: 32, h: 32 },
      { x: 1 * 32, y: 13 * 32, w: 32, h: 32 },
    ];
    this.droneImage.addEventListener("load", () => {
      this.droneProcessed = this.processColorKeyImage(this.droneImage, 0, 128, 192, 12);
      this.droneReady = true;
    });
    this.spriteImage = new Image();
    this.spriteImage.src = "src/assets/enemies/critters.png";
    this.spriteReady = false;
    this.spriteImage.addEventListener("load", () => {
      this.spriteReady = true;
    });
    this.bulletImage = new Image();
    this.bulletImage.src = "src/assets/projectiles/bullet_sheet.png";
    this.bulletReady = false;
    this.bulletProcessed = null;
    this.bulletImage.addEventListener("load", () => {
      this.bulletProcessed = this.processBulletImage(this.bulletImage);
      this.bulletReady = true;
    });
    this.tileImage = new Image();
    this.tileImage.src = "src/assets/tiles/forest_tiles.png";
    this.tileReady = false;
    this.tileProcessed = null;
    this.tileImage.addEventListener("load", () => {
      this.tileProcessed = this.processTileImage(this.tileImage);
      this.groundTiles = this.buildGroundTiles(this.tileImage);
      if (this.groundTiles.length === 0) {
        this.groundTiles = [{ x: 0, y: 0 }];
      }
      this.tileReady = true;
    });
    this.sprites = {
      player: { x: 17, y: 151, w: 32, h: 35 },
      enemies: {
        spider: { x: 17, y: 9, w: 30, h: 31 },
        dino: { x: 56, y: 9, w: 26, h: 31 },
        bunny: { x: 9, y: 51, w: 37, h: 45 },
        snake: { x: 55, y: 51, w: 28, h: 45 },
        turtle: { x: 18, y: 105, w: 33, h: 33 },
        eyeball: { x: 61, y: 105, w: 19, h: 33 },
        goblin: { x: 56, y: 151, w: 29, h: 35 },
        beast: { x: 15, y: 197, w: 41, h: 23 },
        slime: { x: 64, y: 197, w: 24, h: 23 },
      },
    };
    this.bulletSprites = [
      { x: 362, y: 9, w: 13, h: 22 },
      { x: 11, y: 267, w: 8, h: 30 },
      { x: 358, y: 302, w: 11, h: 39 },
      { x: 438, y: 85, w: 13, h: 49 },
      { x: 438, y: 9, w: 13, h: 59 },
    ];
    this.tileSize = 32;
    this.tileSourceSize = 16;
    this.groundTiles = [{ x: 0, y: 0 }];
    this.decorTiles = [];
    this.treeSprites = [];
    this.theme = { tint: null, name: "grass" };
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setCamera(position) {
    this.camera.x = position.x;
    this.camera.y = position.y;
  }

  setPlayerSprite(path) {
    if (!path) {
      this.playerImage = null;
      this.playerReady = false;
      return;
    }
    this.playerReady = false;
    this.playerImage = new Image();
    this.playerImage.src = path;
    this.playerImage.addEventListener("load", () => {
      this.playerFrame.w = Math.floor(this.playerImage.width / this.playerFrame.cols);
      this.playerFrame.h = Math.floor(this.playerImage.height / this.playerFrame.rows);
      this.playerReady = true;
    });
  }

  drawBackground() {
    if (!this.tileReady) {
      this.context.fillStyle = "#1a241c";
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const groundImage = this.tileImage;
    const decorImage = this.tileProcessed || this.tileImage;
    const tileSize = this.tileSize;
    const halfWidth = this.canvas.width / 2;
    const halfHeight = this.canvas.height / 2;
    const startX = Math.floor((this.camera.x - halfWidth) / tileSize) - 1;
    const endX = Math.floor((this.camera.x + halfWidth) / tileSize) + 1;
    const startY = Math.floor((this.camera.y - halfHeight) / tileSize) - 1;
    const endY = Math.floor((this.camera.y + halfHeight) / tileSize) + 1;

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const tile = this.pickGroundTile(x, y);
        const screenX = (x * tileSize) - (this.camera.x - halfWidth);
        const screenY = (y * tileSize) - (this.camera.y - halfHeight);
        this.drawTile(groundImage, tile, screenX, screenY, tileSize);
      }
    }

    // Intentionally skip decor/trees for a clean grass-only map.
    if (this.theme && this.theme.tint) {
      this.context.save();
      this.context.fillStyle = this.theme.tint;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.restore();
    }
  }

  drawPlayer(player) {
    if (this.playerReady && this.playerImage) {
      const screen = this.toScreen(player.position.x, player.position.y);
      const baseHeight = player.radius * 3.4;
      const width = baseHeight * (this.playerFrame.w / this.playerFrame.h);
      const height = baseHeight;
      const alpha = player.invulnerableTimer > 0 ? 0.6 : 1;
      const frame = player.isMoving ? Math.floor(player.animTime * 8) % this.playerFrame.rows : 0;
      const column = this.getPlayerColumn(player.facing);
      this.context.save();
      this.context.globalAlpha = alpha;
      this.context.imageSmoothingEnabled = false;
      this.context.drawImage(
        this.playerImage,
        column * this.playerFrame.w,
        frame * this.playerFrame.h,
        this.playerFrame.w,
        this.playerFrame.h,
        screen.x - width / 2,
        screen.y - height / 2,
        width,
        height
      );
      this.context.restore();
      return;
    }
    if (this.spriteReady) {
      const sprite = this.sprites.player;
      const size = player.radius * 2.6;
      const alpha = player.invulnerableTimer > 0 ? 0.6 : 1;
      this.drawSprite(sprite, player.position.x, player.position.y, size, alpha);
      return;
    }
    const screen = this.toScreen(player.position.x, player.position.y);
    this.context.fillStyle = player.invulnerableTimer > 0 ? "#fbd38d" : "#4fd1c5";
    this.context.beginPath();
    this.context.arc(screen.x, screen.y, player.radius, 0, Math.PI * 2);
    this.context.fill();
  }

  drawEnemies(enemies) {
    enemies.forEach((enemy) => {
      if (this.spriteReady && enemy.spriteId && this.sprites.enemies[enemy.spriteId]) {
        const sprite = this.sprites.enemies[enemy.spriteId];
        const size = enemy.radius * 3;
        const alpha = enemy.hitTimer > 0 ? 0.5 : 1;
        this.drawSprite(sprite, enemy.position.x, enemy.position.y, size, alpha);
        return;
      }
      const screen = this.toScreen(enemy.position.x, enemy.position.y);
      const alpha = enemy.hitTimer > 0 ? 0.5 : 1;
      this.context.fillStyle = enemy.color;
      this.context.globalAlpha = alpha;
      this.context.beginPath();
      this.context.arc(screen.x, screen.y, enemy.radius, 0, Math.PI * 2);
      this.context.fill();
      this.context.globalAlpha = 1;
    });
  }

  drawBoss(boss) {
    if (!boss) {
      return;
    }
    if (boss.spriteType === "critter" && boss.spriteId && this.stageBossReady) {
      const sprite = this.sprites.enemies[boss.spriteId];
      if (!sprite) {
        return;
      }
      const size = boss.radius * 3.6;
      const alpha = boss.hitTimer > 0 ? 0.6 : 1;
      this.drawSprite(sprite, boss.position.x, boss.position.y, size, alpha, this.stageBossImage);
      return;
    }
    if (!this.bossReady) {
      return;
    }
    const screen = this.toScreen(boss.position.x, boss.position.y);
    const frame = Math.floor(boss.animTime * 6) % this.bossFrame.cols;
    const size = boss.radius * 2.8;
    const width = size * (this.bossFrame.w / this.bossFrame.h);
    const height = size;
    this.context.save();
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      this.bossProcessed || this.bossImage,
      frame * this.bossFrame.w,
      0,
      this.bossFrame.w,
      this.bossFrame.h,
      screen.x - width / 2,
      screen.y - height / 2,
      width,
      height
    );
    this.context.restore();
  }

  drawDrone(drone) {
    if (!drone || !this.droneReady) {
      return;
    }
    const screen = this.toScreen(drone.position.x, drone.position.y);
    const sprite = this.droneSprites[Math.min(this.droneSprites.length - 1, drone.level - 1)];
    const size = drone.radius ? drone.radius * 2 : 32;
    const width = size;
    const height = size;
    this.context.save();
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      this.droneProcessed || this.droneImage,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      screen.x - width / 2,
      screen.y - height / 2,
      width,
      height
    );
    this.context.restore();
  }

  drawProjectiles(projectiles) {
    projectiles.forEach((projectile) => {
      if (this.bulletReady) {
        const sprite = this.pickBulletSprite(projectile);
        const screen = this.toScreen(projectile.position.x, projectile.position.y);
        const height = projectile.radius * 4.2;
        const width = height * (sprite.w / sprite.h);
        const angle = Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI / 2;
        this.drawRotatedSprite(
          sprite,
          screen.x,
          screen.y,
          width,
          height,
          angle,
          this.bulletProcessed || this.bulletImage
        );
        return;
      }
      const screen = this.toScreen(projectile.position.x, projectile.position.y);
      this.context.fillStyle = "#fbd38d";
      this.context.beginPath();
      this.context.arc(screen.x, screen.y, projectile.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  drawBossProjectiles(projectiles) {
    if (!this.bossBulletReady) {
      return;
    }
    projectiles.forEach((projectile) => {
      const screen = this.toScreen(projectile.position.x, projectile.position.y);
      const height = projectile.radius * 3.6;
      const width = height * (13 / 13);
      const angle = Math.atan2(projectile.velocity.y, projectile.velocity.x) + Math.PI / 2;
      this.drawRotatedSprite(
        { x: 0, y: 0, w: 13, h: 13 },
        screen.x,
        screen.y,
        width,
        height,
        angle,
        this.bossBulletProcessed || this.bossBulletImage
      );
    });
  }

  drawExperience(orbs) {
    orbs.forEach((orb) => {
      const screen = this.toScreen(orb.position.x, orb.position.y);
      this.context.save();
      this.context.fillStyle = "#5ee7ff";
      this.context.shadowColor = "rgba(94, 231, 255, 0.8)";
      this.context.shadowBlur = 10;
      this.context.beginPath();
      this.context.arc(screen.x, screen.y, orb.radius, 0, Math.PI * 2);
      this.context.fill();
      this.context.restore();
    });
  }

  drawItemDrops(drops) {
    if (!drops || drops.length === 0) {
      return;
    }
    this.context.save();
    this.context.font = "12px \"Pretendard\", sans-serif";
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    drops.forEach((drop) => {
      const screen = this.toScreen(drop.position.x, drop.position.y);
      const size = drop.radius * 2;
      this.context.fillStyle = "rgba(20, 28, 40, 0.85)";
      this.context.strokeStyle = "rgba(94, 231, 255, 0.6)";
      this.context.lineWidth = 1;
      this.context.fillRect(screen.x - size / 2, screen.y - size / 2, size, size);
      this.context.strokeRect(screen.x - size / 2, screen.y - size / 2, size, size);
      this.context.fillStyle = "#e2f1ff";
      this.context.fillText(drop.label, screen.x, screen.y);
    });
    this.context.restore();
  }

  drawPickupRadius(player) {
    if (!player.barrierRadius || player.barrierRadius <= 0) {
      return;
    }
    const screen = this.toScreen(player.position.x, player.position.y);
    this.context.strokeStyle = "rgba(66, 153, 225, 0.45)";
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.arc(screen.x, screen.y, player.barrierRadius, 0, Math.PI * 2);
    this.context.stroke();
  }

  pickBulletSprite(projectile) {
    const power = Math.max(1, projectile.damage || 1);
    const index = Math.min(this.bulletSprites.length - 1, Math.floor((power - 1) / 2));
    return this.bulletSprites[index];
  }

  pickGroundTile(x, y) {
    return this.groundTiles[this.hashCoords(x, y) % this.groundTiles.length];
  }

  pickDecorTile(x, y) {
    return null;
  }

  shouldPlaceDecor(x, y) {
    return false;
  }

  shouldPlaceTree(x, y) {
    return false;
  }

  pickTreeSprite(x, y) {
    return null;
  }

  hashCoords(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return (n ^ (n >> 16)) >>> 0;
  }

  processTileImage(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const threshold = 254;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  processColorKeyImage(image, r, g, b, threshold) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (
        Math.abs(data[i] - r) <= threshold &&
        Math.abs(data[i + 1] - g) <= threshold &&
        Math.abs(data[i + 2] - b) <= threshold
      ) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  drawTile(image, tile, screenX, screenY, size) {
    const cols = Math.floor(image.width / this.tileSourceSize);
    const id = (tile.y / this.tileSourceSize) * cols + (tile.x / this.tileSourceSize);
    const sx = (id % cols) * this.tileSourceSize;
    const sy = Math.floor(id / cols) * this.tileSourceSize;
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      image,
      sx,
      sy,
      this.tileSourceSize,
      this.tileSourceSize,
      screenX,
      screenY,
      size,
      size
    );
  }

  processBulletImage(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const threshold = 18;
    for (let i = 0; i < data.length; i += 4) {
      const sum = data[i] + data[i + 1] + data[i + 2];
      if (sum <= threshold) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  buildGroundTiles(image) {
    const tiles = [];
    const tileSize = this.tileSourceSize;
    const cols = Math.floor(image.width / tileSize);
    const rows = Math.floor(image.height / tileSize);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, image.width, image.height).data;
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    const threshold = 6;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let bgCount = 0;
        let total = 0;
        let r = 0;
        let g = 0;
        let b = 0;
        for (let ty = 0; ty < tileSize; ty += 1) {
          for (let tx = 0; tx < tileSize; tx += 1) {
            const px = ((y * tileSize + ty) * image.width + (x * tileSize + tx)) * 4;
            const pr = data[px];
            const pg = data[px + 1];
            const pb = data[px + 2];
            r += pr;
            g += pg;
            b += pb;
            total += 1;
            if (
              Math.abs(pr - bgR) <= threshold &&
              Math.abs(pg - bgG) <= threshold &&
              Math.abs(pb - bgB) <= threshold
            ) {
              bgCount += 1;
            }
          }
        }
        const avgR = r / total;
        const avgG = g / total;
        const avgB = b / total;
        const greenish = avgG > avgR + 6 && avgG > avgB + 6 && avgG > 60;
        const bgRatio = bgCount / total;
        if (bgRatio < 0.05 && greenish) {
          tiles.push({ x: x * tileSize, y: y * tileSize });
        }
      }
    }
    return tiles;
  }

  getPlayerColumn(facing) {
    if (facing === "right") {
      return 1;
    }
    if (facing === "up") {
      return 2;
    }
    if (facing === "left") {
      return 3;
    }
    return 0;
  }

  toScreen(worldX, worldY) {
    return {
      x: worldX - this.camera.x + this.canvas.width / 2,
      y: worldY - this.camera.y + this.canvas.height / 2,
    };
  }

  drawSprite(sprite, worldX, worldY, size, alpha, image = this.spriteImage) {
    const screen = this.toScreen(worldX, worldY);
    this.context.save();
    this.context.globalAlpha = alpha;
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      image,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      screen.x - size / 2,
      screen.y - size / 2,
      size,
      size
    );
    this.context.restore();
  }

  drawRotatedSprite(sprite, screenX, screenY, width, height, angle, image) {
    this.context.save();
    this.context.translate(screenX, screenY);
    this.context.rotate(angle);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(
      image,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      -width / 2,
      -height / 2,
      width,
      height
    );
    this.context.restore();
  }

  drawPortal(portal) {
    if (!portal) {
      return;
    }
    const screen = this.toScreen(portal.position.x, portal.position.y);
    const pulse = portal.pulse ?? 0;
    const radius = portal.radius + Math.sin(pulse * 3) * 4;
    this.context.save();
    this.context.strokeStyle = "rgba(94, 231, 255, 0.9)";
    this.context.lineWidth = 3;
    this.context.shadowColor = "rgba(94, 231, 255, 0.6)";
    this.context.shadowBlur = 16;
    this.context.beginPath();
    this.context.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    this.context.stroke();
    this.context.strokeStyle = "rgba(94, 231, 255, 0.4)";
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.arc(screen.x, screen.y, radius * 0.6, 0, Math.PI * 2);
    this.context.stroke();
    this.context.restore();
  }

  drawVisibilityMask(player, radius) {
    if (!radius || radius <= 0) {
      return;
    }
    const screen = this.toScreen(player.position.x, player.position.y);
    this.context.save();
    this.context.fillStyle = "rgba(6, 8, 12, 0.7)";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.globalCompositeOperation = "destination-out";
    this.context.beginPath();
    this.context.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  setBossSprite(stage) {
    const stageIndex = stage || 1;
    this.bossStage = stageIndex;
    let path = "src/assets/boss/boss1/stage1.png";
    let frame = { w: 85, h: 94, cols: 4, rows: 2 };
    if (stageIndex === 2) {
      path = "src/assets/boss/boss1/stage2.png";
      frame = { w: 122, h: 110, cols: 4, rows: 2 };
    } else if (stageIndex === 3) {
      path = "src/assets/boss/boss1/stage3.png";
      frame = { w: 87, h: 110, cols: 4, rows: 2 };
    }
    this.bossReady = false;
    this.bossFrame = frame;
    this.bossImage = new Image();
    this.bossImage.src = path;
    this.bossImage.addEventListener("load", () => {
      this.bossProcessed = this.processTileImage(this.bossImage);
      this.bossReady = true;
    });
  }

  setDroneLevel(level) {
    this.droneLevel = level;
  }

  setTheme(theme) {
    this.theme = theme || { tint: null, name: "grass" };
  }
}
