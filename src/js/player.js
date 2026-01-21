export default class Player {
  constructor(position) {
    this.position = position;
    this.radius = 14;
    this.speed = 160;
    this.attackPower = 1;
    this.fireCooldown = 1.0;
    this.fireTimer = 0;
    this.projectileCount = 1;
    this.pickupRadius = 50;
    this.orbPickupRadius = 16;
    this.magnetRadius = 140;
    this.barrierRadius = 0;
    this.barrierDamage = 0.6;
    this.barrierLevel = 0;
    this.expMultiplier = 1;
    this.maxHealth = 10;
    this.health = 10;
    this.invulnerableTimer = 0;
    this.facing = "down";
    this.isMoving = false;
    this.animTime = 0;
    this.stageSpeedMultiplier = 1;
  }

  update(delta, input) {
    const direction = input.getDirection();
    this.isMoving = direction.length() > 0;
    if (this.isMoving) {
      this.animTime += delta;
      if (Math.abs(direction.x) > Math.abs(direction.y)) {
        this.facing = direction.x < 0 ? "left" : "right";
      } else {
        this.facing = direction.y < 0 ? "up" : "down";
      }
    }
    const speed = this.speed * (this.stageSpeedMultiplier || 1);
    const movement = direction.scale(speed * delta);
    this.position = this.position.add(movement);

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

  increaseMagnetRadius() {
    this.magnetRadius += 40;
  }

  enableBarrier() {
    if (this.barrierLevel === 0) {
      this.barrierLevel = 1;
      this.barrierRadius = 70;
      return;
    }
    this.increaseBarrierRadius();
  }

  increaseBarrierRadius() {
    if (this.barrierLevel === 0) {
      this.enableBarrier();
      return;
    }
    this.barrierLevel += 1;
    this.barrierRadius += 15;
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
