const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 600;

const HEROES = ["captain", "ironman"];
const VILLAINS = ["thanos", "loki"];

const CHARACTERS = {
  captain: {
    sheet: "assets/images/warrior/Sprites/warrior.png",
    data: [162, 0.86, [0, -44]],
    steps: [1, 6, 1, 6, 6, 1, 1],
    sound: "sword",
  },
  ironman: {
    sheet: "assets/images/ironman/Sprites/ironman.png",
    data: [162, 0.87, [0, -43]],
    steps: [1, 6, 1, 6, 6, 1, 1],
    sound: "magic",
  },
  thanos: {
    sheet: "assets/images/wizard/Sprites/wizard.png",
    data: [162, 0.9, [112, -38]],
    steps: [1, 6, 1, 6, 6, 1, 1],
    sound: "magic",
  },
  loki: {
    sheet: "assets/images/loki/Sprites/loki.png",
    data: [162, 1.02, [112, -26]],
    steps: [1, 6, 1, 6, 6, 1, 1],
    sound: "sword",
  },
};

// Add touch controls configuration
const TOUCH_CONTROLS = {
  left: { x: 100, y: 500, radius: 50 },
  right: { x: 200, y: 500, radius: 50 },
  attack: { x: 800, y: 500, radius: 50 },
  jump: { x: 900, y: 500, radius: 50 }
};

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.fighter1 = null;
    this.fighter2 = null;
    this.gameMode = null;
    this.roundOver = false;
    this.score = [0, 0];
    this.introCount = 3;
    this.lastCountUpdate = 0;
    this.selecting = true;
    this.player1Done = false;
    this.player2Side = null;
    this.inputEnabled = true;
    this.background = null;
    this.fontLoaded = false;
    this.touchControls = null;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  preload() {
    this.load.bitmapFont(
      "turok",
      "assets/fonts/turok.png",
      "assets/fonts/turok.xml"
    );

    this.loadCustomFont();

    this.load.image("background", "assets/images/background/background.jpg");
    this.load.image("victory", "assets/images/icons/victory.png");

    Object.entries(CHARACTERS).forEach(([key, data]) => {
      this.load.spritesheet(key, data.sheet, {
        frameWidth: data.data[0],
        frameHeight: data.data[0],
      });
    });

    this.load.audio("music", "assets/audio/music.mp3");
    this.load.audio("sword", "assets/audio/sword.wav");
    this.load.audio("magic", "assets/audio/magic.wav");
  }

  loadCustomFont() {
    const font = new FontFace("Turok", "url(assets/fonts/turok.ttf)");

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        this.fontLoaded = true;
        console.log("Turok font loaded successfully");
      })
      .catch((error) => {
        console.error("Failed to load Turok font:", error);
        this.fontLoaded = false;
      });
  }

  create() {
    this.background = null;

    this.initializeAudio();

    this.createHealthBars();
    this.hideHealthBars();

    this.setupInputHandling();

    this.showGameModeSelection();

    if (this.isMobile) {
      this.createTouchControls();
    }
  }

  getFontFamily() {
    return this.fontLoaded ? "Turok, Arial" : "Arial";
  }

  initializeAudio() {
    this.music = this.sound.add("music", {
      loop: true,
      volume: 0.5,
    });
    this.swordSound = this.sound.add("sword", { volume: 0.7 });
    this.magicSound = this.sound.add("magic", { volume: 0.7 });

    this.music.play();
  }

  createHealthBars() {
    this.healthBar1 = this.add.rectangle(100, 50, 404, 34, 0xffffff);
    this.healthBar2 = this.add.rectangle(
      SCREEN_WIDTH - 100,
      50,
      404,
      34,
      0xffffff
    );

    this.healthFill1 = this.add.rectangle(100, 50, 400, 30, 0xff0000);
    this.healthFill2 = this.add.rectangle(
      SCREEN_WIDTH - 100,
      50,
      400,
      30,
      0xff0000
    );
  }

  hideHealthBars() {
    this.healthBar1.setVisible(false);
    this.healthBar2.setVisible(false);
    this.healthFill1.setVisible(false);
    this.healthFill2.setVisible(false);
  }

  showHealthBars() {
    this.healthBar1.setVisible(true);
    this.healthBar2.setVisible(true);
    this.healthFill1.setVisible(true);
    this.healthFill2.setVisible(true);
  }

  setupInputHandling() {
    this.input.keyboard.on("keydown-ONE", () => {
      console.log("One pressed");
      if (this.selecting && !this.gameMode) {
        this.gameMode = 1;
        this.showCharacterSelection();
      }
    });

    this.input.keyboard.on("keydown-TWO", () => {
      console.log("Two pressed");
      if (this.selecting && !this.gameMode) {
        this.gameMode = 2;
        this.showCharacterSelection();
      }
    });

    this.input.keyboard.on("keydown", (event) => {
      console.log("Key pressed:", event.key);
    });

    this.input.keyboard.on("keydown-Q", () => {
      console.log("Q pressed - Captain");
      if (this.selecting && !this.player1Done) {
        this.selectCharacter("captain");
      }
    });

    this.input.keyboard.on("keydown-W", () => {
      console.log("W pressed - Ironman");
      if (this.selecting && !this.player1Done) {
        this.selectCharacter("ironman");
      }
    });

    this.input.keyboard.on("keydown-E", () => {
      console.log("E pressed - Thanos");
      if (this.selecting && !this.player1Done) {
        this.selectCharacter("thanos");
      }
    });

    this.input.keyboard.on("keydown-R", () => {
      console.log("R pressed - Loki");
      if (this.selecting && !this.player1Done) {
        console.log("Attempting to select Loki for Player 1");
        this.selectCharacter("loki");
      } else {
        console.log("Cannot select Loki:", {
          selecting: this.selecting,
          player1Done: this.player1Done,
        });
      }
    });

    this.input.keyboard.on("keydown-U", () => {
      console.log("U pressed - Captain");
      if (this.selecting && this.player1Done && this.gameMode === 2) {
        this.selectCharacter("captain");
      }
    });

    this.input.keyboard.on("keydown-I", () => {
      console.log("I pressed - Ironman");
      if (this.selecting && this.player1Done && this.gameMode === 2) {
        this.selectCharacter("ironman");
      }
    });

    this.input.keyboard.on("keydown-O", () => {
      console.log("O pressed - Thanos");
      if (this.selecting && this.player1Done && this.gameMode === 2) {
        this.selectCharacter("thanos");
      }
    });

    this.input.keyboard.on("keydown-P", () => {
      console.log("P pressed - Loki");
      if (this.selecting && this.player1Done && this.gameMode === 2) {
        this.selectCharacter("loki");
      }
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.keys = {
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      j: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      k: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      l: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
    };

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.selecting) {
        this.scene.restart();
      }
    });
  }

  clearScreen() {
    this.children.list.forEach((child) => {
      if (
        child.type === "Text" ||
        (child.type === "Image" && child !== this.background)
      ) {
        child.destroy();
      }
    });
  }

  showGameModeSelection() {
    this.clearScreen();

    this.add.text(320, 100, "Choose Game Mode", {
      fontSize: "40px",
      fill: "#fff",
      fontFamily: this.getFontFamily(),
    });

    // Create clickable buttons for game modes
    const createModeButton = (y, text, mode) => {
      const button = this.add.rectangle(SCREEN_WIDTH / 2, y, 400, 60, 0xffff00, 0.3)
        .setInteractive()
        .on('pointerdown', () => {
          if (this.selecting && !this.gameMode) {
            this.gameMode = mode;
            this.showCharacterSelection();
          }
        });

      this.add.text(SCREEN_WIDTH / 2, y, text, {
        fontSize: "40px",
        fill: "#ffff00",
        fontFamily: this.getFontFamily(),
      }).setOrigin(0.5);

      return button;
    };

    createModeButton(200, "1 Player (vs Bot)", 1);
    createModeButton(270, "2 Player", 2);

    // Keep keyboard controls for desktop
    if (!this.isMobile) {
      this.add.text(300, 200, "Press 1: 1 Player (vs Bot)", {
        fontSize: "40px",
        fill: "#ffff00",
        fontFamily: this.getFontFamily(),
      });

      this.add.text(300, 270, "Press 2: 2 Player", {
        fontSize: "40px",
        fill: "#ffff00",
        fontFamily: this.getFontFamily(),
      });
    }
  }

  showCharacterSelection() {
    this.clearScreen();

    const createCharacterButton = (x, y, character, key) => {
      const button = this.add.rectangle(x, y, 200, 60, 0xffff00, 0.3)
        .setInteractive()
        .on('pointerdown', () => {
          if (this.selecting && !this.player1Done) {
            this.selectCharacter(character);
          } else if (this.selecting && this.player1Done && this.gameMode === 2) {
            this.selectCharacter(character);
          }
        });

      this.add.text(x, y, `${key}: ${character.charAt(0).toUpperCase() + character.slice(1)}`, {
        fontSize: "30px",
        fill: "#ffff00",
        fontFamily: this.getFontFamily(),
      }).setOrigin(0.5);

      return button;
    };

    this.add.text(50, 30, "Player 1: Choose Hero or Villain", {
      fontSize: "30px",
      fill: "#fff",
      fontFamily: this.getFontFamily(),
    });

    this.add.text(50, 120, "Heroes:", {
      fontSize: "30px",
      fill: "#fff",
      fontFamily: this.getFontFamily(),
    });

    // Create hero buttons
    HEROES.forEach((hero, i) => {
      const x = 150 + (i * 250);
      const y = 150;
      createCharacterButton(x, y, hero, String.fromCharCode(81 + i));
    });

    this.add.text(50, 220, "Villains:", {
      fontSize: "30px",
      fill: "#fff",
      fontFamily: this.getFontFamily(),
    });

    // Create villain buttons
    VILLAINS.forEach((villain, i) => {
      const x = 150 + (i * 250);
      const y = 250;
      const key = i === 0 ? "E" : "R";
      createCharacterButton(x, y, villain, key);
    });

    if (this.player1Done && this.gameMode === 2) {
      this.add.text(50, 60, "Player 2: Choose Opponent", {
        fontSize: "30px",
        fill: "#fff",
        fontFamily: this.getFontFamily(),
      });
    }

    // Keep keyboard controls for desktop
    if (!this.isMobile) {
      this.add.text(10, 10, "Press R to select Loki", {
        fontSize: "16px",
        fill: "#fff",
        fontFamily: this.getFontFamily(),
      });
    }
  }

  selectCharacter(choice) {
    console.log("Attempting to select character:", choice);
    console.log("Current state:", {
      selecting: this.selecting,
      player1Done: this.player1Done,
      gameMode: this.gameMode,
      player2Side: this.player2Side,
    });

    if (!this.selecting) {
      console.log("Not in selection mode");
      return;
    }

    if (!this.player1Done) {
      console.log("Processing Player 1 selection");
      const side1 = HEROES.includes(choice) ? "hero" : "villain";
      this.player2Side = side1 === "hero" ? "villain" : "hero";

      console.log("Player 1 selected:", choice, "Side:", side1);

      if (!CHARACTERS[choice]) {
        console.error("Character not found:", choice);
        return;
      }

      const char1 = CHARACTERS[choice];
      this.fighter1 = new Fighter(
        this,
        200,
        310,
        false,
        char1.data,
        choice,
        char1.steps,
        this.swordSound
      );

      this.player1Done = true;
      console.log("Player 1 selection complete");

      if (this.gameMode === 1) {
        //  bot player
        const options = this.player2Side === "villain" ? VILLAINS : HEROES;
        const availableOptions = options.filter((c) => c !== choice);
        const botChoice =
          availableOptions[Math.floor(Math.random() * availableOptions.length)];

        console.log("Bot selected:", botChoice);

        const char2 = CHARACTERS[botChoice];
        this.fighter2 = new Fighter(
          this,
          700,
          310,
          true,
          char2.data,
          botChoice,
          char2.steps,
          this.magicSound
        );
        this.startGame();
      } else {
        this.showCharacterSelection();
      }
    } else if (this.gameMode === 2) {
      console.log("Processing Player 2 selection");

      if (!this.fighter1) {
        console.error("Fighter 1 not initialized");
        return;
      }

      if (choice === this.fighter1.spriteKey) {
        console.log("Cannot select same character");
        return;
      }

      const validSelection =
        (this.player2Side === "hero" && HEROES.includes(choice)) ||
        (this.player2Side === "villain" && VILLAINS.includes(choice));

      if (!validSelection) {
        console.log("Invalid character selection for side:", this.player2Side);
        return;
      }

      if (!CHARACTERS[choice]) {
        console.error("Character not found:", choice);
        return;
      }

      const char2 = CHARACTERS[choice];
      this.fighter2 = new Fighter(
        this,
        700,
        310,
        false,
        char2.data,
        choice,
        char2.steps,
        this.magicSound
      );
      this.startGame();
    }
  }

  startGame() {
    console.log("Starting game...");
    this.selecting = false;
    this.inputEnabled = true;

    if (!this.background) {
      this.background = this.add
        .image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "background")
        .setScale(SCREEN_WIDTH / 1000, SCREEN_HEIGHT / 600);

      this.background.setDepth(-1);
    }

    this.showHealthBars();

    this.children.list.forEach((child) => {
      if (child.type === "Text") {
        child.destroy();
      }
    });

    // Add game instructions
    this.add.text(
      10,
      10,
      "Player 1: Arrow keys to move, Up to jump, J/K to attack",
      {
        fontSize: "16px",
        fill: "#fff",
        fontFamily: this.getFontFamily(),
      }
    );

    if (!this.fighter2.isBot) {
      this.add.text(10, 30, "Player 2: A/D to move, W to jump, L to attack", {
        fontSize: "16px",
        fill: "#fff",
        fontFamily: this.getFontFamily(),
      });
    }

    this.music.play();
  }

  update() {
    // Debug log for game state
    if (this.selecting) {
      console.log("Game is in selection mode");
      return;
    }
    if (this.roundOver) {
      console.log("Game is in round over state");
      return;
    }

    if (this.fighter1) {
      this.fighter1.update();
      console.log("Fighter 1 position:", this.fighter1.x, this.fighter1.y); // Debug log
    }
    if (this.fighter2) {
      this.fighter2.update();
      console.log("Fighter 2 position:", this.fighter2.x, this.fighter2.y); // Debug log
    }

    if (this.fighter1) {
      this.healthFill1.width = this.fighter1.health * 4;
    }
    if (this.fighter2) {
      this.healthFill2.width = this.fighter2.health * 4;
    }

    this.handlePlayer1Input();

    if (this.fighter2.isBot) {
      this.controlBot(this.fighter2, this.fighter1);
    } else {
      this.handlePlayer2Input();
    }

    this.checkRoundOver();
  }

  handlePlayer1Input() {
    if (!this.fighter1 || !this.fighter1.alive || !this.inputEnabled) {
      console.log("Player 1 input disabled:", {
        fighterExists: !!this.fighter1,
        isAlive: this.fighter1?.alive,
        inputEnabled: this.inputEnabled,
      });
      return;
    }

    if (this.cursors.left.isDown) {
      console.log("Player 1 moving left");
      this.fighter1.x = Math.max(50, this.fighter1.x - 5);
      this.fighter1.running = true;
      this.fighter1.flip = true;
    } else if (this.cursors.right.isDown) {
      console.log("Player 1 moving right");
      this.fighter1.x = Math.min(SCREEN_WIDTH - 50, this.fighter1.x + 5);
      this.fighter1.running = true;
      this.fighter1.flip = false;
    } else {
      this.fighter1.running = false;
    }

    if (this.cursors.up.isDown && !this.fighter1.jump) {
      console.log("Player 1 jumping");
      this.fighter1.vel_y = -30;
      this.fighter1.jump = true;
    }

    if (this.keys.j.isDown && this.fighter1.attack_cooldown === 0) {
      console.log("Player 1 attack 1");
      this.fighter1.attack_type = 0;
      this.fighter1.attack(this.fighter2);
    } else if (this.keys.k.isDown && this.fighter1.attack_cooldown === 0) {
      console.log("Player 1 attack 2");
      this.fighter1.attack_type = 1;
      this.fighter1.attack(this.fighter2);
    }
  }

  handlePlayer2Input() {
    if (!this.fighter2 || !this.fighter2.alive || !this.inputEnabled) return;

    if (this.keys.a.isDown) {
      console.log("Player 2 moving left"); // Debug log
      this.fighter2.x = Math.max(50, this.fighter2.x - 5);
      this.fighter2.running = true;
      this.fighter2.flip = true;
    } else if (this.keys.d.isDown) {
      console.log("Player 2 moving right"); // Debug log
      this.fighter2.x = Math.min(SCREEN_WIDTH - 50, this.fighter2.x + 5);
      this.fighter2.running = true;
      this.fighter2.flip = false;
    } else {
      this.fighter2.running = false;
    }

    if (this.keys.w.isDown && !this.fighter2.jump) {
      console.log("Player 2 jumping"); // Debug log
      this.fighter2.vel_y = -30;
      this.fighter2.jump = true;
    }

    if (this.keys.l.isDown && this.fighter2.attack_cooldown === 0) {
      console.log("Player 2 attacking"); // Debug log
      this.fighter2.attack_type = 0;
      this.fighter2.attack(this.fighter1);
    }
  }

  controlBot(bot, target) {
    if (!bot.alive || !target.alive || !this.inputEnabled) return;

    const distance = target.x - bot.x;
    const absDistance = Math.abs(distance);

    bot.flip = distance < 0;

    if (absDistance < 60 && bot.attack_cooldown === 0) {
      bot.attack_type = Math.random() < 0.5 ? 0 : 1;
      bot.attack(target);
    } else {
      bot.running = true;
      const newX = bot.x + (distance > 0 ? 2 : -2);
      if (newX >= 50 && newX <= SCREEN_WIDTH - 50) {
        bot.x = newX;
      }
    }

    if ((target.jump && !bot.jump) || (Math.random() < 0.01 && !bot.jump)) {
      bot.vel_y = -30;
      bot.jump = true;
    }
  }

  checkRoundOver() {
    if (!this.fighter1.alive || !this.fighter2.alive) {
      this.roundOver = true;
      this.inputEnabled = false;
      const winner = this.fighter1.alive ? 1 : 2;
      this.score[winner - 1]++;

      this.clearScreen();

      this.add
        .image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "victory")
        .setScale(0.5);

      this.add
        .text(
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 + 100,
          `Score - Player 1: ${this.score[0]}  Player 2: ${this.score[1]}`,
          {
            fontSize: "32px",
            fill: "#fff",
            fontFamily: this.getFontFamily(),
          }
        )
        .setOrigin(0.5);

      this.add
        .text(
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 + 150,
          "Press SPACE to return to game mode selection",
          {
            fontSize: "24px",
            fill: "#ffff00",
            fontFamily: this.getFontFamily(),
          }
        )
        .setOrigin(0.5);

      this.input.keyboard.once("keydown-SPACE", () => {
        console.log("Returning to game mode selection...");
        this.returnToGameModeSelection();
      });
    }
  }

  returnToGameModeSelection() {
    this.roundOver = false;
    this.selecting = true;
    this.inputEnabled = true;
    this.gameMode = null;
    this.player1Done = false;
    this.player2Side = null;
    this.introCount = 3;
    this.lastCountUpdate = 0;

    this.clearScreen();

    if (this.fighter1) {
      this.fighter1.sprite.destroy();
      this.fighter1 = null;
    }
    if (this.fighter2) {
      this.fighter2.sprite.destroy();
      this.fighter2 = null;
    }

    this.showGameModeSelection();
  }

  showCountdown() {
    const countdownText = this.add
      .text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, this.introCount.toString(), {
        fontSize: "64px",
        fill: "#fff",
        fontFamily: this.getFontFamily(),
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.introCount--;
        if (this.introCount > 0) {
          countdownText.setText(this.introCount.toString());
        } else if (this.introCount === 0) {
          countdownText.setText("FIGHT!");
          this.time.delayedCall(1000, () => {
            countdownText.destroy();
            this.inputEnabled = true;
          });
        }
      },
      callbackScope: this,
      repeat: this.introCount,
    });
  }

  createTouchControls() {
    this.touchControls = this.add.group();

    // Create virtual joystick
    const leftButton = this.add.circle(TOUCH_CONTROLS.left.x, TOUCH_CONTROLS.left.y, TOUCH_CONTROLS.left.radius, 0xffffff, 0.5);
    const rightButton = this.add.circle(TOUCH_CONTROLS.right.x, TOUCH_CONTROLS.right.y, TOUCH_CONTROLS.right.radius, 0xffffff, 0.5);
    const attackButton = this.add.circle(TOUCH_CONTROLS.attack.x, TOUCH_CONTROLS.attack.y, TOUCH_CONTROLS.attack.radius, 0xff0000, 0.5);
    const jumpButton = this.add.circle(TOUCH_CONTROLS.jump.x, TOUCH_CONTROLS.jump.y, TOUCH_CONTROLS.jump.radius, 0x00ff00, 0.5);

    this.touchControls.add(leftButton);
    this.touchControls.add(rightButton);
    this.touchControls.add(attackButton);
    this.touchControls.add(jumpButton);

    // Make buttons interactive
    [leftButton, rightButton, attackButton, jumpButton].forEach(button => {
      button.setInteractive();
    });

    // Add touch event handlers
    leftButton.on('pointerdown', () => this.keys.a.isDown = true);
    leftButton.on('pointerup', () => this.keys.a.isDown = false);

    rightButton.on('pointerdown', () => this.keys.d.isDown = true);
    rightButton.on('pointerup', () => this.keys.d.isDown = false);

    attackButton.on('pointerdown', () => this.keys.j.isDown = true);
    attackButton.on('pointerup', () => this.keys.j.isDown = false);

    jumpButton.on('pointerdown', () => this.keys.w.isDown = true);
    jumpButton.on('pointerup', () => this.keys.w.isDown = false);
  }
}

const config = {
  type: Phaser.AUTO,
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scene: GameScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  audio: {
    disableWebAudio: false,
  },
};

// Create game instance
const game = new Phaser.Game(config);
