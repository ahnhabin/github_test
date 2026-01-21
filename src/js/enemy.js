export default class Enemy {
  constructor(config) {
    this.position = config.position;
    this.radius = config.radius;
    this.speed = config.speed;
    this.health = config.health;
    this.color = config.color;
    this.contactDamage = config.contactDamage;
    this.spriteId = config.spriteId;
    this.reward = config.reward ?? 1;
    this.hitTimer = 0;
  }

  update(delta, target) {
    const direction = target.subtract(this.position).normalize();
    this.position = this.position.add(direction.scale(this.speed * delta));
    this.hitTimer = Math.max(0, this.hitTimer - delta);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitTimer = 0.12;
  }

  isDead() {
    return this.health <= 0;
  }
}
