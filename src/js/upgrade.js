export class UpgradeOption {
  constructor(id, name, description, apply) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.apply = apply;
  }
}

export class UpgradeCatalog {
  constructor() {
    this.options = [
      new UpgradeOption("attack", "공격력 강화", "피해 +1", (game) => game.player.increaseAttack()),
      new UpgradeOption(
        "fire-rate",
        "공격 속도 강화",
        "발사 쿨다운 -0.1s",
        (game) => game.player.improveFireRate()
      ),
      new UpgradeOption(
        "projectiles",
        "발사 개수 증가",
        "추가 투사체 +1",
        (game) => game.player.increaseProjectileCount()
      ),
      new UpgradeOption("speed", "이동 속도 강화", "이동 속도 +10%", (game) =>
        game.player.increaseSpeed()
      ),
      new UpgradeOption(
        "pickup",
        "경험치 자동 흡수 강화",
        "경험치 흡수 범위 +30",
        (game) => game.player.increasePickupRadius()
      ),
      new UpgradeOption(
        "exp-drop",
        "경험치 드랍 강화",
        "드랍 경험치 +25%",
        (game) => game.player.increaseExpDrop()
      ),
      new UpgradeOption("health", "체력 강화", "최대 HP +2", (game) =>
        game.player.increaseMaxHealth()
      ),
    ];
  }

  getRandomChoices(count) {
    const shuffled = [...this.options].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
