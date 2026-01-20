export default class Projectile {
  constructor(position, direction, speed, damage) {
    this.position = position;
    this.velocity = direction.normalize().scale(speed);
    this.damage = damage;
    this.radius = 4;
    this.isActive = true;
  }

  update(delta, bounds) {
    this.position = this.position.add(this.velocity.scale(delta));
    if (
      this.position.x < 0 ||
      this.position.y < 0 ||
      this.position.x > bounds.width ||
      this.position.y > bounds.height
    ) {
      this.isActive = false;
    }
  }
}
