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
    this.mobileMenuTexts = [];
    this.mobileCharTexts = [];
    this.mobileControls = null;
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
    // Don't clear mobile controls here, they'll be recreated when needed
    this.mobileMenuTexts = [];
    this.mobileCharTexts = [];
  }

  showGameModeSelection() {
    this.clearScreen();
    this.mobileMenuTexts = [];

    const mode1 = this.add.text(300, 200, "1 Player (vs Bot)", {
      fontSize: "40px",
      fill: "#ffff00",
      fontFamily: this.getFontFamily(),
      backgroundColor: this.isMobile ? "#333" : undefined,
      padding: { x: 20, y: 10 }
    });
    const mode2 = this.add.text(300, 270, "2 Player", {
      fontSize: "40px",
      fill: "#ffff00",
      fontFamily: this.getFontFamily(),
      backgroundColor: this.isMobile ? "#333" : undefined,
      padding: { x: 20, y: 10 }
    });

    this.mobileMenuTexts.push(mode1, mode2);

    if (this.isMobile) {
      mode1.setInteractive();
      mode2.setInteractive();
      mode1.on("pointerdown", () => {
        this.gameMode = 1;
        this.showCharacterSelection();
      });
      mode2.on("pointerdown", () => {
        this.gameMode = 2;
        this.showCharacterSelection();
      });
    }

    // Add quit button for desktop
    if (!this.isMobile) {
      const quitBtn = this.add.text(SCREEN_WIDTH - 60, 20, "X", {
        fontSize: "36px",
        fill: "#ff0000",
        fontFamily: this.getFontFamily(),
        backgroundColor: "#222",
        padding: { x: 10, y: 5 }
      }).setInteractive();
      quitBtn.on("pointerdown", () => {
        window.location.reload();
      });
    }
  }

  showCharacterSelection() {
    this.clearScreen();
    this.mobileCharTexts = [];

    // Add quit button for desktop
    if (!this.isMobile) {
      const quitBtn = this.add.text(SCREEN_WIDTH - 60, 20, "X", {
        fontSize: "36px",
        fill: "#ff0000",
        fontFamily: this.getFontFamily(),
        backgroundColor: "#222",
        padding: { x: 10, y: 5 }
      }).setInteractive();
      quitBtn.on("pointerdown", () => {
        window.location.reload();
      });
    }

    // Player 1 selection
    let y = 150;
    HEROES.forEach((hero, i) => {
      const txt = this.add.text(
        70,
        y + i * 40,
        `${String.fromCharCode(81 + i)}: ${hero.charAt(0).toUpperCase() + hero.slice(1)}`,
        { fontSize: "30px", fill: "#ffff00", fontFamily: this.getFontFamily(), backgroundColor: this.isMobile ? "#333" : undefined, padding: { x: 10, y: 5 } }
      );
      if (this.isMobile) {
        txt.setInteractive();
        txt.on("pointerdown", () => this.selectCharacter(hero));
      }
      this.mobileCharTexts.push(txt);
    });

    y += 100;
    VILLAINS.forEach((villain, i) => {
      const key = i === 0 ? "E" : "R";
      const txt = this.add.text(
        70,
        y + i * 40,
        `${key}: ${villain.charAt(0).toUpperCase() + villain.slice(1)}`,
        { fontSize: "30px", fill: "#ffff00", fontFamily: this.getFontFamily(), backgroundColor: this.isMobile ? "#333" : undefined, padding: { x: 10, y: 5 } }
      );
      if (this.isMobile) {
        txt.setInteractive();
        txt.on("pointerdown", () => this.selectCharacter(villain));
      }
      this.mobileCharTexts.push(txt);
    });

    // Player 2 selection (if needed)
    if (this.player1Done && this.gameMode === 2) {
      let y2 = 60;
      if (!this.isMobile) {
        this.add.text(50, 60, "Player 2: Choose Opponent (U/I/O/P)", {
          fontSize: "30px",
          fill: "#fff",
          fontFamily: this.getFontFamily(),
        });
      }
      ["captain", "ironman", "thanos", "loki"].forEach((char, i) => {
        const txt = this.add.text(
          400,
          y2 + i * 40,
          `${char.charAt(0).toUpperCase() + char.slice(1)}`,
          { fontSize: "30px", fill: "#ffff00", fontFamily: this.getFontFamily(), backgroundColor: this.isMobile ? "#333" : undefined, padding: { x: 10, y: 5 } }
        );
        if (this.isMobile) {
          txt.setInteractive();
          txt.on("pointerdown", () => this.selectCharacter(char));
        }
        this.mobileCharTexts.push(txt);
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
    if (!this.isMobile) {
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
    }

    this.music.play();

    if (this.isMobile) {
      this.createTouchControls();
    }
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
      this.fighter2.attack_type = 0;
      this.fighter2.attack(this.fighter1);
    } else if (this.keys.k.isDown && this.fighter2.attack_cooldown === 0) {
      this.fighter2.attack_type = 1;
      this.fighter2.attack(this.fighter1);
    }
  }

  controlBot(bot, target) {
    if (!bot.alive || !target.alive || !this.inputEnabled) return;

    const distance = target.x - bot.x;
    const absDistance = Math.abs(distance);
    const verticalGap = Math.abs(target.y - bot.y);

    bot.flip = distance < 0;

    const inAttackRange = absDistance < 60 && verticalGap < 60;

    if (inAttackRange && bot.attack_cooldown === 0) {
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

      this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, "victory").setScale(0.5);

      this.add.text(
        SCREEN_WIDTH / 2,
        SCREEN_HEIGHT / 2 + 100,
        `Score - Player 1: ${this.score[0]}  Player 2: ${this.score[1]}`,
        {
          fontSize: "32px",
          fill: "#fff",
          fontFamily: this.getFontFamily(),
        }
      ).setOrigin(0.5);

      if (this.score[0] === 3 || this.score[1] === 3) {
        // Match over
        const matchWinner = this.score[0] === 3 ? "Player 1" : "Player 2";
        this.add.text(
          SCREEN_WIDTH / 2,
          SCREEN_HEIGHT / 2 + 150,
          `${matchWinner} Wins The Match!`,
          {
            fontSize: "32px",
            fill: "#ffff00",
            fontFamily: this.getFontFamily(),
          }
        ).setOrigin(0.5);

        // Reset after delay or tap/space
        if (this.isMobile) {
          const returnButton = this.add.rectangle(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2 + 220,
            400,
            60,
            0x333333
          ).setInteractive();
          this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2 + 220,
            "Tap to Restart",
            {
              fontSize: "24px",
              fill: "#ffff00",
              fontFamily: this.getFontFamily(),
            }
          ).setOrigin(0.5);
          returnButton.on("pointerdown", () => {
            this.score = [0, 0];
            this.returnToGameModeSelection();
          });
        } else {
          this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2 + 220,
            "Press SPACE to Restart",
            {
              fontSize: "24px",
              fill: "#ffff00",
              fontFamily: this.getFontFamily(),
            }
          ).setOrigin(0.5);
          this.input.keyboard.once("keydown-SPACE", () => {
            this.score = [0, 0];
            this.returnToGameModeSelection();
          });
        }
      } else {
        // Next round
        if (this.isMobile) {
          const returnButton = this.add.rectangle(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2 + 200,
            400,
            60,
            0x333333
          ).setInteractive();
          this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2 + 200,
            "Tap to Continue",
            {
              fontSize: "24px",
              fill: "#ffff00",
              fontFamily: this.getFontFamily(),
            }
          ).setOrigin(0.5);
          returnButton.on("pointerdown", () => {
            this.roundOver = false;
            this.introCount = 3;
            this.lastCountUpdate = 0;
            this.fighter1.reset(200, 310);
            this.fighter2.reset(700, 310);
            this.showHealthBars();
            this.inputEnabled = true;
            this.clearScreen();
            if (this.isMobile) {
              this.createTouchControls();
            }
          });
        } else {
          this.add.text(
            SCREEN_WIDTH / 2,
            SCREEN_HEIGHT / 2 + 150,
            "Press SPACE to Continue",
            {
              fontSize: "24px",
              fill: "#ffff00",
              fontFamily: this.getFontFamily(),
            }
          ).setOrigin(0.5);
          this.input.keyboard.once("keydown-SPACE", () => {
            this.roundOver = false;
            this.introCount = 3;
            this.lastCountUpdate = 0;
            this.fighter1.reset(200, 310);
            this.fighter2.reset(700, 310);
            this.showHealthBars();
            this.inputEnabled = true;
            this.clearScreen();
            if (this.isMobile) {
              this.createTouchControls();
            }
          });
        }
      }
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

    if (this.isMobile) {
      this.createTouchControls();
    }
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
    if (this.mobileControls) {
      this.mobileControls.clear(true, true);
    }
    this.mobileControls = this.add.group();

    // D-pad left/right
    const left = this.add.circle(80, SCREEN_HEIGHT - 80, 40, 0xffffff, 0.5).setScrollFactor(0);
    const right = this.add.circle(180, SCREEN_HEIGHT - 80, 40, 0xffffff, 0.5).setScrollFactor(0);

    // Add directional arrows
    const leftArrow = this.add.text(80, SCREEN_HEIGHT - 80, "←", {
      fontSize: "32px",
      fill: "#000000",
      fontFamily: this.getFontFamily()
    }).setOrigin(0.5).setScrollFactor(0);

    const rightArrow = this.add.text(180, SCREEN_HEIGHT - 80, "→", {
      fontSize: "32px",
      fill: "#000000",
      fontFamily: this.getFontFamily()
    }).setOrigin(0.5).setScrollFactor(0);

    // Jump
    const jump = this.add.circle(SCREEN_WIDTH - 180, SCREEN_HEIGHT - 80, 40, 0x00ff00, 0.5).setScrollFactor(0);
    const jumpArrow = this.add.text(SCREEN_WIDTH - 180, SCREEN_HEIGHT - 80, "↑", {
      fontSize: "32px",
      fill: "#000000",
      fontFamily: this.getFontFamily()
    }).setOrigin(0.5).setScrollFactor(0);

    // Attack 1 & 2 for Player 1
    const atk1 = this.add.circle(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 140, 35, 0xff0000, 0.5).setScrollFactor(0);
    const atk2 = this.add.circle(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40, 35, 0xff8800, 0.5).setScrollFactor(0);

    // Add attack labels for Player 1
    const atk1Label = this.add.text(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 140, "J", {
      fontSize: "24px",
      fill: "#000000",
      fontFamily: this.getFontFamily()
    }).setOrigin(0.5).setScrollFactor(0);

    const atk2Label = this.add.text(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 40, "K", {
      fontSize: "24px",
      fill: "#000000",
      fontFamily: this.getFontFamily()
    }).setOrigin(0.5).setScrollFactor(0);

    // Attack 1 & 2 for Player 2 (if in 2-player mode)
    let atk1P2, atk2P2, atk1P2Label, atk2P2Label;
    if (this.gameMode === 2 && !this.fighter2.isBot) {
      atk1P2 = this.add.circle(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 240, 35, 0xff0000, 0.5).setScrollFactor(0);
      atk2P2 = this.add.circle(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 180, 35, 0xff8800, 0.5).setScrollFactor(0);

      atk1P2Label = this.add.text(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 240, "L", {
        fontSize: "24px",
        fill: "#000000",
        fontFamily: this.getFontFamily()
      }).setOrigin(0.5).setScrollFactor(0);

      atk2P2Label = this.add.text(SCREEN_WIDTH - 80, SCREEN_HEIGHT - 180, "K", {
        fontSize: "24px",
        fill: "#000000",
        fontFamily: this.getFontFamily()
      }).setOrigin(0.5).setScrollFactor(0);
    }

    // Add all elements to the controls group
    const controlElements = [left, right, jump, atk1, atk2, leftArrow, rightArrow, jumpArrow, atk1Label, atk2Label];
    if (this.gameMode === 2 && !this.fighter2.isBot) {
      controlElements.push(atk1P2, atk2P2, atk1P2Label, atk2P2Label);
    }
    this.mobileControls.addMultiple(controlElements);

    // Make only the actual buttons interactive, not the labels
    [left, right, jump, atk1, atk2].forEach(button => {
      button.setInteractive();
    });

    if (this.gameMode === 2 && !this.fighter2.isBot) {
      [atk1P2, atk2P2].forEach(button => {
        button.setInteractive();
      });
    }

    // These will simulate key presses for your input handlers
    left.on("pointerdown", () => {
      this.cursors.left.isDown = true;
      left.setAlpha(0.7); // Visual feedback
    });
    left.on("pointerup", () => {
      this.cursors.left.isDown = false;
      left.setAlpha(0.5);
    });
    left.on("pointerout", () => {
      this.cursors.left.isDown = false;
      left.setAlpha(0.5);
    });

    right.on("pointerdown", () => {
      this.cursors.right.isDown = true;
      right.setAlpha(0.7);
    });
    right.on("pointerup", () => {
      this.cursors.right.isDown = false;
      right.setAlpha(0.5);
    });
    right.on("pointerout", () => {
      this.cursors.right.isDown = false;
      right.setAlpha(0.5);
    });

    jump.on("pointerdown", () => {
      this.cursors.up.isDown = true;
      jump.setAlpha(0.7);
    });
    jump.on("pointerup", () => {
      this.cursors.up.isDown = false;
      jump.setAlpha(0.5);
    });
    jump.on("pointerout", () => {
      this.cursors.up.isDown = false;
      jump.setAlpha(0.5);
    });

    atk1.on("pointerdown", () => {
      this.keys.j.isDown = true;
      atk1.setAlpha(0.7);
    });
    atk1.on("pointerup", () => {
      this.keys.j.isDown = false;
      atk1.setAlpha(0.5);
    });
    atk1.on("pointerout", () => {
      this.keys.j.isDown = false;
      atk1.setAlpha(0.5);
    });

    atk2.on("pointerdown", () => {
      this.keys.k.isDown = true;
      atk2.setAlpha(0.7);
    });
    atk2.on("pointerup", () => {
      this.keys.k.isDown = false;
      atk2.setAlpha(0.5);
    });
    atk2.on("pointerout", () => {
      this.keys.k.isDown = false;
      atk2.setAlpha(0.5);
    });

    // Player 2 attack controls (if in 2-player mode)
    if (this.gameMode === 2 && !this.fighter2.isBot) {
      atk1P2.on("pointerdown", () => {
        this.keys.l.isDown = true;
        atk1P2.setAlpha(0.7);
      });
      atk1P2.on("pointerup", () => {
        this.keys.l.isDown = false;
        atk1P2.setAlpha(0.5);
      });
      atk1P2.on("pointerout", () => {
        this.keys.l.isDown = false;
        atk1P2.setAlpha(0.5);
      });

      atk2P2.on("pointerdown", () => {
        this.keys.k.isDown = true;
        atk2P2.setAlpha(0.7);
      });
      atk2P2.on("pointerup", () => {
        this.keys.k.isDown = false;
        atk2P2.setAlpha(0.5);
      });
      atk2P2.on("pointerout", () => {
        this.keys.k.isDown = false;
        atk2P2.setAlpha(0.5);
      });
    }

    // Hide controls on desktop
    if (!this.isMobile) {
      this.mobileControls.setVisible(false);
    }
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
