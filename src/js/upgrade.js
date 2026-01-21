export class UpgradeOption {
  constructor(id, name, description, apply, isAvailable = null, tags = []) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.apply = apply;
    this.isAvailable = isAvailable;
    this.tags = tags;
  }
}

export class UpgradeCatalog {
  constructor() {
    this.options = [
      new UpgradeOption("attack", "공격력 증가", "피해 +1", (game) => game.player.increaseAttack(), null, ["attack"]),
      new UpgradeOption(
        "fire-rate",
        "발사 쿨타임 감소",
        "쿨다운 -0.1s",
        (game) => game.player.improveFireRate(),
        null,
        ["rapid"]
      ),
      new UpgradeOption(
        "projectiles",
        "투사체 증가",
        "투사체 +1",
        (game) => game.player.increaseProjectileCount(),
        null,
        ["attack"]
      ),
      new UpgradeOption(
        "speed",
        "이동 속도 증가",
        "이동 속도 +10%",
        (game) => game.player.increaseSpeed(),
        null,
        ["mobility"]
      ),
      new UpgradeOption(
        "magnet",
        "자석 범위 증가",
        "자석 반경 +40",
        (game) => game.player.increaseMagnetRadius(),
        null,
        ["utility"]
      ),
      new UpgradeOption(
        "barrier",
        "결계 획득",
        "주변 결계가 적에게 피해를 줍니다.",
        (game) => game.enableBarrier(),
        (game) => game.player.barrierLevel === 0,
        ["utility"]
      ),
      new UpgradeOption(
        "barrier-range",
        "결계 범위 증가",
        "결계 반경 +15",
        (game) => game.upgradeBarrierRange(),
        (game) => game.player.barrierLevel > 0,
        ["utility"]
      ),
      new UpgradeOption(
        "exp-drop",
        "경험치 증가",
        "경험치 +25%",
        (game) => game.player.increaseExpDrop(),
        null,
        ["utility"]
      ),
      new UpgradeOption(
        "health",
        "체력 증가",
        "최대 HP +2",
        (game) => game.player.increaseMaxHealth(),
        null,
        ["survival"]
      ),
      new UpgradeOption(
        "drone",
        "드론",
        "자동 공격 드론을 획득합니다.",
        (game) => game.enableDrone(),
        (game) => !game.drone,
        ["summon"]
      ),
      new UpgradeOption(
        "drone-speed",
        "드론 속도 증가",
        "드론 속도/공격력 증가",
        (game) => game.upgradeDrone(),
        (game) => game.drone && !game.drone.isMaxLevel(),
        ["summon"]
      ),
    ];
  }

  getRandomChoices(count, game) {
    const available = this.options.filter((option) =>
      option.isAvailable ? option.isAvailable(game) : true
    );
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
