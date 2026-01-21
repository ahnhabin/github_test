export default class BossProjectile {
  constructor(position, velocity, damage) {
    this.position = position;
    this.velocity = velocity;
    this.damage = damage;
    this.radius = 8;
    this.isActive = true;
  }

  update(delta, origin, maxRange) {
    this.position = this.position.add(this.velocity.scale(delta));
    if (this.position.subtract(origin).length() > maxRange) {
      this.isActive = false;
    }
  }
}
