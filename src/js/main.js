import Game from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  const game = Game.getInstance();
  const menu = document.getElementById("menu");
  const startButton = document.getElementById("start-button");
  const panelButtons = document.querySelectorAll("[data-panel]");
  const panels = document.querySelectorAll(".menu__content");
  const canvas = document.getElementById("game");
  const characterSelect = document.getElementById("character-select");
  const characterGrid = document.getElementById("character-grid");
  const characterConfirm = document.getElementById("character-confirm");
  const characterCancel = document.getElementById("character-cancel");
  const bossOpen = document.getElementById("boss-open");
  const bossOverlay = document.getElementById("boss-select-overlay");
  const bossGrid = document.getElementById("boss-grid");
  const bossDifficulty = document.getElementById("boss-difficulty");
  const bossConfirm = document.getElementById("boss-confirm");
  const bossCancel = document.getElementById("boss-cancel");
  const bossCancelRun = document.getElementById("boss-cancel-run");

  const hidePanels = () => {
    panels.forEach((panel) => {
      panel.hidden = true;
    });
  };

  const resizeCanvas = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    game.setViewport(width, height);
  };

  const characterAssets = [
    { id: "F_01", path: "src/asset/Females/F_01.png" },
    { id: "M_12", path: "src/asset/Males/M_12.png" },
    { id: "F_09", path: "src/asset/Females/F_09.png" },
    { id: "M_08", path: "src/asset/Males/M_08.png" },
    { id: "F_05", path: "src/asset/Females/F_05.png" },
    { id: "M_05", path: "src/asset/Males/M_05.png" },
    { id: "M_04", path: "src/asset/Males/M_04.png" },
    { id: "F_11", path: "src/asset/Females/F_11.png" },
    { id: "M_11", path: "src/asset/Males/M_11.png" },
    { id: "F_07", path: "src/asset/Females/F_07.png" },
    { id: "M_07", path: "src/asset/Males/M_07.png" },
    { id: "F_04", path: "src/asset/Females/F_04.png" },
    { id: "F_03", path: "src/asset/Females/F_03.png" },
    { id: "M_03", path: "src/asset/Males/M_03.png" },
    { id: "F_12", path: "src/asset/Females/F_12.png" },
    { id: "M_10", path: "src/asset/Males/M_10.png" },
    { id: "F_08", path: "src/asset/Females/F_08.png" },
    { id: "M_06", path: "src/asset/Males/M_06.png" },
    { id: "M_01", path: "src/asset/Males/M_01.png" },
    { id: "F_02", path: "src/asset/Females/F_02.png" },
    { id: "M_02", path: "src/asset/Males/M_02.png" },
    { id: "F_10", path: "src/asset/Females/F_10.png" },
    { id: "M_09", path: "src/asset/Males/M_09.png" },
    { id: "F_06", path: "src/asset/Females/F_06.png" },
  ];

  const bossOptions = [
    {
      id: "boss1",
      name: "보스 1: 마법사",
      description: "중거리 탄막 보스",
      image: "src/asset/spritesheets/boss1/1stage/mage-1-85x94.png",
    },
  ];
  let selectedBoss = null;
  let selectedDifficulty = "normal";
  let selectedCharacter = null;

  const renderCharacterGrid = () => {
    const fragment = document.createDocumentFragment();
    const columns = 6;
    const rows = 4;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const index = row * columns + col;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "character-card";
        button.style.setProperty("--col", col);
        button.style.setProperty("--row", row);
        button.dataset.index = index;
        const asset = characterAssets[index];
        if (asset) {
          button.setAttribute("aria-label", asset.id);
        } else {
          button.disabled = true;
        }
        fragment.appendChild(button);
      }
    }
    characterGrid.innerHTML = "";
    characterGrid.appendChild(fragment);
  };

  const updateSelectedCard = (target) => {
    characterGrid.querySelectorAll(".character-card").forEach((card) => {
      card.classList.toggle("is-selected", card === target);
    });
  };

  const openCharacterSelect = () => {
    menu.classList.add("menu--selecting");
    characterSelect.hidden = false;
    selectedCharacter = null;
    updateSelectedCard(null);
    characterConfirm.disabled = true;
  };

  const closeCharacterSelect = () => {
    menu.classList.remove("menu--selecting");
    characterSelect.hidden = true;
  };

  const renderBossGrid = () => {
    const fragment = document.createDocumentFragment();
    bossOptions.forEach((boss) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "boss-card";
      card.dataset.bossId = boss.id;
      card.innerHTML = `
        <div class="boss-card__thumb"><img src="${boss.image}" alt="${boss.name}" /></div>
        <div class="boss-card__title">${boss.name}</div>
        <div class="boss-card__desc">${boss.description}</div>
      `;
      fragment.appendChild(card);
    });
    bossGrid.innerHTML = "";
    bossGrid.appendChild(fragment);
  };

  const openBossOverlay = () => {
    if (!bossGrid.hasChildNodes()) {
      renderBossGrid();
    }
    selectedBoss = null;
    bossConfirm.disabled = true;
    bossOverlay.hidden = false;
    game.setPaused(true);
  };

  const closeBossOverlay = () => {
    bossOverlay.hidden = true;
    game.setPaused(false);
  };

  panelButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.panel;
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }
      const willShow = target.hidden;
      hidePanels();
      target.hidden = !willShow;
    });
  });

  startButton.addEventListener("click", () => {
    hidePanels();
    if (!characterGrid.hasChildNodes()) {
      renderCharacterGrid();
    }
    openCharacterSelect();
  });

  bossOpen.addEventListener("click", () => {
    openBossOverlay();
  });

  bossGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".boss-card");
    if (!card) {
      return;
    }
    const bossId = card.dataset.bossId;
    selectedBoss = bossOptions.find((boss) => boss.id === bossId) || null;
    bossGrid.querySelectorAll(".boss-card").forEach((node) => {
      node.classList.toggle("is-selected", node === card);
    });
    bossConfirm.disabled = !selectedBoss;
  });

  bossDifficulty.addEventListener("click", (event) => {
    const button = event.target.closest("[data-difficulty]");
    if (!button) {
      return;
    }
    selectedDifficulty = button.dataset.difficulty;
    bossDifficulty.querySelectorAll("[data-difficulty]").forEach((node) => {
      node.classList.toggle("is-selected", node === button);
    });
  });

  bossConfirm.addEventListener("click", () => {
    if (!selectedBoss) {
      return;
    }
    game.startBossChallenge({
      bossId: selectedBoss.id,
      difficulty: selectedDifficulty,
    });
    closeBossOverlay();
  });

  bossCancel.addEventListener("click", () => {
    closeBossOverlay();
  });

  bossCancelRun.addEventListener("click", () => {
    game.cancelBossChallenge();
  });

  characterGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".character-card");
    if (!button || button.disabled) {
      return;
    }
    const index = Number(button.dataset.index);
    const asset = characterAssets[index];
    if (!asset) {
      return;
    }
    selectedCharacter = asset;
    updateSelectedCard(button);
    characterConfirm.disabled = false;
  });

  characterConfirm.addEventListener("click", () => {
    if (!selectedCharacter) {
      return;
    }
    game.setPlayerSprite(selectedCharacter.path);
    menu.classList.add("is-hidden");
    closeCharacterSelect();
    game.start();
  });

  characterCancel.addEventListener("click", () => {
    closeCharacterSelect();
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
});
