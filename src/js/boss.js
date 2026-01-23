import Vector2 from "./vector2.js";

export default class Boss {
  constructor(config) {
    this.position = config.position;
    this.radius = config.radius;
    this.speed = config.speed;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.damage = config.damage;
    this.projectileSpeed = config.projectileSpeed;
    this.attackInterval = config.attackInterval;
    this.burstInterval = config.burstInterval;
    this.spriteType = config.spriteType || "mage";
    this.spriteId = config.spriteId || null;
    this.animTime = 0;
    this.attackTimer = 0;
    this.burstTimer = 0;
    this.hitTimer = 0;
  }

  update(delta, playerPosition) {
    this.animTime += delta;
    this.attackTimer += delta;
    this.burstTimer += delta;
    this.hitTimer = Math.max(0, this.hitTimer - delta);

    const toPlayer = playerPosition.subtract(this.position);
    const distance = toPlayer.length();
    const desiredDistance = 180;
    if (distance > desiredDistance) {
      const move = toPlayer.normalize().scale(this.speed * delta);
      this.position = this.position.add(move);
    }
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.hitTimer = 0.12;
  }

  isDead() {
    return this.health <= 0;
  }

  canAttack() {
    return this.attackTimer >= this.attackInterval;
  }

  resetAttack() {
    this.attackTimer = 0;
  }

  canBurst() {
    return this.burstTimer >= this.burstInterval;
  }

  resetBurst() {
    this.burstTimer = 0;
  }

  getHealthRatio() {
    return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
  }

  getAimDirection(playerPosition) {
    return playerPosition.subtract(this.position).normalize();
  }
}
