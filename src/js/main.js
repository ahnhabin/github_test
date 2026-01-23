import Game from "./game.js";

document.addEventListener("DOMContentLoaded", () => {
  const game = Game.getInstance();
  const menu = document.getElementById("menu");
  const newGameButton = document.getElementById("new-game-button");
  const continueButton = document.getElementById("continue-button");
  const loadGameButton = document.getElementById("load-game-button");
  const panelButtons = document.querySelectorAll("[data-panel]");
  const panels = document.querySelectorAll(".menu__content");
  const canvas = document.getElementById("game");
  const characterSelect = document.getElementById("character-select");
  const characterGrid = document.getElementById("character-grid");
  const characterConfirm = document.getElementById("character-confirm");
  const characterCancel = document.getElementById("character-cancel");
  const saveSelect = document.getElementById("save-select");
  const saveGrid = document.getElementById("save-grid");
  const saveConfirm = document.getElementById("save-confirm");
  const saveCancel = document.getElementById("save-cancel");
  const saveSelectTitle = document.getElementById("save-select-title");
  const saveSelectDesc = document.getElementById("save-select-desc");

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
    { id: "F_01", path: "src/assets/characters/female/f_01.png" },
    { id: "M_12", path: "src/assets/characters/male/m_12.png" },
    { id: "F_09", path: "src/assets/characters/female/f_09.png" },
    { id: "M_08", path: "src/assets/characters/male/m_08.png" },
    { id: "F_05", path: "src/assets/characters/female/f_05.png" },
    { id: "M_05", path: "src/assets/characters/male/m_05.png" },
    { id: "M_04", path: "src/assets/characters/male/m_04.png" },
    { id: "F_11", path: "src/assets/characters/female/f_11.png" },
    { id: "M_11", path: "src/assets/characters/male/m_11.png" },
    { id: "F_07", path: "src/assets/characters/female/f_07.png" },
    { id: "M_07", path: "src/assets/characters/male/m_07.png" },
    { id: "F_04", path: "src/assets/characters/female/f_04.png" },
    { id: "F_03", path: "src/assets/characters/female/f_03.png" },
    { id: "M_03", path: "src/assets/characters/male/m_03.png" },
    { id: "F_12", path: "src/assets/characters/female/f_12.png" },
    { id: "M_10", path: "src/assets/characters/male/m_10.png" },
    { id: "F_08", path: "src/assets/characters/female/f_08.png" },
    { id: "M_06", path: "src/assets/characters/male/m_06.png" },
    { id: "M_01", path: "src/assets/characters/male/m_01.png" },
    { id: "F_02", path: "src/assets/characters/female/f_02.png" },
    { id: "M_02", path: "src/assets/characters/male/m_02.png" },
    { id: "F_10", path: "src/assets/characters/female/f_10.png" },
    { id: "M_09", path: "src/assets/characters/male/m_09.png" },
    { id: "F_06", path: "src/assets/characters/female/f_06.png" },
  ];
  let selectedCharacter = null;

  const getSaveKey = (slot) => `survivorPrototypeSave:${slot}`;
  const getLastSlotKey = () => window.localStorage.getItem("survivorPrototypeLastSlot");
  const readSave = (slot) => {
    const raw = window.localStorage.getItem(getSaveKey(slot));
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  };

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

  const renderSaveGrid = () => {
    if (!saveGrid) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= 3; i += 1) {
      const slotId = `slot${i}`;
      const data = readSave(slotId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "save-slot";
      button.dataset.slot = slotId;
      button.dataset.empty = data ? "false" : "true";
      const subtitle = data ? `스테이지 ${data.stage} · 레벨 ${data.level}` : "비어있음";
      const time = data?.updatedAt
        ? new Date(data.updatedAt).toLocaleString("ko-KR")
        : "새 게임 가능";
      button.innerHTML = `
        <div class="save-slot__title">슬롯 ${i}</div>
        <div class="save-slot__meta">${subtitle}</div>
        <div class="save-slot__meta">${time}</div>
      `;
      fragment.appendChild(button);
    }
    saveGrid.innerHTML = "";
    saveGrid.appendChild(fragment);
  };

  const updateSaveSelection = (target) => {
    saveGrid.querySelectorAll(".save-slot").forEach((slot) => {
      slot.classList.toggle("is-selected", slot === target);
    });
  };

  const openSaveSelect = (mode) => {
    menu.classList.add("menu--selecting");
    saveSelect.hidden = false;
    saveConfirm.disabled = true;
    saveSelect.dataset.mode = mode;
    saveSelect.dataset.slot = "";
    if (saveSelectTitle) {
      saveSelectTitle.textContent =
        mode === "load"
          ? "게임 불러오기"
          : mode === "daily"
            ? "일일 보스 도전"
            : "새 게임 슬롯 선택";
    }
    if (saveSelectDesc) {
      saveSelectDesc.textContent =
        mode === "load"
          ? "이어할 저장 슬롯을 선택하세요."
          : mode === "daily"
            ? "도전할 저장 슬롯을 선택하세요."
            : "새 게임을 저장할 슬롯을 선택하세요.";
    }
    renderSaveGrid();
  };

  const closeSaveSelect = () => {
    menu.classList.remove("menu--selecting");
    saveSelect.hidden = true;
  };

  const updateContinueButton = () => {
    const slot = getLastSlotKey();
    const data = slot ? readSave(slot) : null;
    if (continueButton) {
      continueButton.disabled = !data;
    }
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

  if (newGameButton) {
    newGameButton.addEventListener("click", () => {
      hidePanels();
      openSaveSelect("new");
    });
  }

  if (loadGameButton) {
    loadGameButton.addEventListener("click", () => {
      hidePanels();
      openSaveSelect("load");
    });
  }


  if (continueButton) {
    continueButton.addEventListener("click", () => {
      const slot = getLastSlotKey();
      if (!slot) {
        return;
      }
      const data = readSave(slot);
      if (!data) {
        return;
      }
      game.loadFromSave(data, slot);
      menu.classList.add("is-hidden");
      game.start();
    });
  }

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
    const slot = saveSelect?.dataset.slot;
    if (!slot) {
      return;
    }
    game.resetForNewGame(slot);
    game.setPlayerProfile(selectedCharacter);
    menu.classList.add("is-hidden");
    closeCharacterSelect();
    game.start();
  });

  characterCancel.addEventListener("click", () => {
    closeCharacterSelect();
  });

  if (saveGrid) {
    saveGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".save-slot");
      if (!button) {
        return;
      }
      const isEmpty = button.dataset.empty === "true";
      if (saveSelect?.dataset.mode === "load" && isEmpty) {
        return;
      }
      saveSelect.dataset.slot = button.dataset.slot;
      updateSaveSelection(button);
      saveConfirm.disabled = false;
    });
  }

  if (saveConfirm) {
    saveConfirm.addEventListener("click", () => {
      const slot = saveSelect?.dataset.slot;
      const mode = saveSelect?.dataset.mode;
      if (!slot || !mode) {
        return;
      }
      if (mode === "new") {
        if (!characterGrid.hasChildNodes()) {
          renderCharacterGrid();
        }
        closeSaveSelect();
        openCharacterSelect();
      } else {
        const data = readSave(slot);
        if (!data) {
          return;
        }
        game.loadFromSave(data, slot);
        menu.classList.add("is-hidden");
        closeSaveSelect();
        game.start();
      }
    });
  }

  if (saveCancel) {
    saveCancel.addEventListener("click", () => {
      closeSaveSelect();
    });
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  updateContinueButton();
});
