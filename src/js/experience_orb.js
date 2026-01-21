export default class ExperienceOrb {
  constructor(position, value) {
    this.position = position;
    this.radius = 7;
    this.value = value;
  }

  moveToward(target, speed, delta) {
    const direction = target.subtract(this.position).normalize();
    this.position = this.position.add(direction.scale(speed * delta));
  }
}
