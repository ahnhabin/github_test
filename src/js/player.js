export default class Player {
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
