export default class Enemy {
  constructor(config) {
    this.position = config.position;
    this.radius = config.radius;
    this.speed = config.speed;
    this.health = config.health;
    this.color = config.color;
    this.contactDamage = config.contactDamage;
    this.spriteId = config.spriteId;
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
