export default class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlayer(player) {
    this.context.fillStyle = player.invulnerableTimer > 0 ? "#fbd38d" : "#4fd1c5";
    this.context.beginPath();
    this.context.arc(player.position.x, player.position.y, player.radius, 0, Math.PI * 2);
    this.context.fill();
  }

  drawEnemies(enemies) {
    enemies.forEach((enemy) => {
      this.context.fillStyle = enemy.color;
      this.context.beginPath();
      this.context.arc(enemy.position.x, enemy.position.y, enemy.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  drawProjectiles(projectiles) {
    this.context.fillStyle = "#fbd38d";
    projectiles.forEach((projectile) => {
      this.context.beginPath();
      this.context.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  drawExperience(orbs) {
    this.context.fillStyle = "#9f7aea";
    orbs.forEach((orb) => {
      this.context.beginPath();
      this.context.arc(orb.position.x, orb.position.y, orb.radius, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  drawPickupRadius(player) {
    this.context.strokeStyle = "rgba(159, 122, 234, 0.35)";
    this.context.beginPath();
    this.context.arc(player.position.x, player.position.y, player.pickupRadius, 0, Math.PI * 2);
    this.context.stroke();
  }
}
