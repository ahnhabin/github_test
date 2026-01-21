import Vector2 from "./vector2.js";

export default class Drone {
  constructor(config) {
    this.level = config.level;
    this.position = config.position;
    this.orbitRadius = config.orbitRadius;
    this.orbitSpeed = config.orbitSpeed;
    this.attackPower = config.attackPower;
    this.attackSpeed = config.attackSpeed;
    this.attackRange = config.attackRange;
    this.hitCooldown = config.hitCooldown;
    this.radius = config.radius;
    this.angle = 0;
    this.attackTimer = 0;
    this.mode = "orbit";
    this.returnPoint = this.position;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.maxLevel = 3;
  }

  update(delta, playerPosition, target) {
    this.attackTimer = Math.max(0, this.attackTimer - delta);
    this.wanderTimer += delta;
    if (this.wanderTimer >= 1.2) {
      this.wanderTimer = 0;
      this.wanderAngle += Math.random() * 0.8 - 0.4;
    }
    const orbitPoint = playerPosition.add(
      new Vector2(
        Math.cos(this.angle) * this.orbitRadius,
        Math.sin(this.angle) * this.orbitRadius
      )
    );
    const wanderPoint = playerPosition.add(
      new Vector2(
        Math.cos(this.wanderAngle) * (this.orbitRadius * 1.4),
        Math.sin(this.wanderAngle) * (this.orbitRadius * 1.4)
      )
    );

    if (this.mode === "return") {
      const toReturn = orbitPoint.subtract(this.position);
      if (toReturn.length() <= this.attackSpeed * delta) {
        this.position = orbitPoint;
        this.mode = "orbit";
      } else {
        const move = toReturn.normalize().scale(this.attackSpeed * delta);
        this.position = this.position.add(move);
      }
      return false;
    }

    if (target && this.attackTimer <= 0) {
      const toTarget = target.position.subtract(this.position);
      const distance = toTarget.length();
      if (distance <= this.attackRange) {
        this.mode = "attack";
      }
      if (this.mode === "attack") {
        const move = toTarget.normalize().scale(this.attackSpeed * delta);
        this.position = this.position.add(move);
        if (distance <= this.radius + target.radius) {
          this.attackTimer = this.hitCooldown;
          this.mode = "return";
          return true;
        }
        if (distance > this.attackRange * 1.5) {
          this.mode = "return";
        }
        return false;
      }
    }

    this.angle += this.orbitSpeed * delta;
    const drift = wanderPoint.subtract(orbitPoint).scale(0.35);
    this.position = orbitPoint.add(drift);
    return false;
  }

  upgrade() {
    if (this.level >= this.maxLevel) {
      return;
    }
    this.level += 1;
    this.orbitSpeed *= 1.1;
    this.attackSpeed *= 1.1;
    this.hitCooldown = Math.max(0.25, this.hitCooldown - 0.1);
    this.attackPower += 1;
    this.radius += 2;
  }

  isMaxLevel() {
    return this.level >= this.maxLevel;
  }
}
