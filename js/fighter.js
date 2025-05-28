class Fighter {
  constructor(scene, x, y, isBot, data, spriteKey, steps, sound) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isBot = isBot;
    this.spriteKey = spriteKey;
    this.steps = steps;
    this.sound = sound;

    this.frameWidth = data[0];
    this.scale = data[1];
    this.offset = data[2];

    this.sprite = scene.add.sprite(x, y, spriteKey);
    this.sprite.setScale(this.scale);
    this.hitbox = new Phaser.Geom.Rectangle(x, y, 80, 180);

    this.attacking = false;
    this.jump = false;
    this.running = false;
    this.flip = false;
    this.alive = true;
    this.health = 100;
    this.attack_cooldown = 0;
    this.vel_y = 0;
    this.frame_index = 0;
    this.attack_type = 0;
    this.hit = false;
    this.pre_attack_flip = false;
    this.last_jump = 0;
    this.next_jump_delay = 0;

    this.SPEED = 10;
    this.GRAVITY = 2;
    this.JUMP_VELOCITY = -30;
    this.ATTACK_COOLDOWN = 20;
    this.ANIMATION_COOLDOWN = 40;

    this.createAnimations();
  }

  createAnimations() {
    const animations = [
      { key: "idle", frames: this.steps[0] },
      { key: "run", frames: this.steps[1] },
      { key: "jump", frames: this.steps[2] },
      { key: "attack1", frames: this.steps[3] },
      { key: "attack2", frames: this.steps[4] },
      { key: "hit", frames: this.steps[5] },
      { key: "death", frames: this.steps[6] },
    ];

    animations.forEach((anim) => {
      this.scene.anims.create({
        key: `${this.spriteKey}_${anim.key}`,
        frames: this.scene.anims.generateFrameNumbers(this.spriteKey, {
          start: 0,
          end: anim.frames - 1,
        }),
        frameRate: 10,
        repeat: anim.key === "idle" ? -1 : 0,
      });
    });
  }

  update() {
    if (!this.alive) {
      this.sprite.play(`${this.spriteKey}_death`, true);
      return;
    }

    this.vel_y += this.GRAVITY;
    this.y += this.vel_y;

    if (this.y > 310) {
      this.y = 310;
      this.vel_y = 0;
      this.jump = false;
    }

    this.hitbox.x = this.x - 40;
    this.hitbox.y = this.y - 90;

    this.sprite.setPosition(this.x, this.y);
    this.sprite.setFlipX(this.flip);

    this.updateAnimation();

    if (this.attack_cooldown > 0) {
      this.attack_cooldown--;
    }
  }

  updateAnimation() {
    if (this.health <= 0) {
      this.sprite.play(`${this.spriteKey}_death`, true);
    } else if (this.hit) {
      this.sprite.play(`${this.spriteKey}_hit`, true);
      this.hit = false;
    } else if (this.attacking) {
      this.sprite.play(`${this.spriteKey}_attack${this.attack_type + 1}`, true);
    } else if (this.jump) {
      this.sprite.play(`${this.spriteKey}_jump`, true);
    } else if (this.running) {
      this.sprite.play(`${this.spriteKey}_run`, true);
    } else {
      this.sprite.play(`${this.spriteKey}_idle`, true);
    }
  }

  attack(target) {
    if (this.attack_cooldown === 0) {
      this.attacking = true;
      this.attack_cooldown = this.ATTACK_COOLDOWN;
      this.sound.play();

      this.pre_attack_flip = this.flip;

      const hitbox_width = 1;
      const hitbox_offset = 10;
      let attackHitbox;

      if (this.flip) {
        attackHitbox = new Phaser.Geom.Rectangle(
          this.hitbox.x + 10,
          this.hitbox.y,
          hitbox_width,
          this.hitbox.height
        );
      } else {
        attackHitbox = new Phaser.Geom.Rectangle(
          this.hitbox.right - 10,
          this.hitbox.y,
          hitbox_width,
          this.hitbox.height
        );
      }

      if (Phaser.Geom.Rectangle.Overlaps(attackHitbox, target.hitbox)) {
        target.takeHit(10);
      }

      // Reset attacking state after animation
      this.scene.time.delayedCall(500, () => {
        this.attacking = false;
      });
    }
  }

  takeHit(damage) {
    this.health -= damage;
    this.hit = true;

    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.sprite.play(`${this.spriteKey}_death`, true);
    } else {
      this.sprite.play(`${this.spriteKey}_hit`, true);
    }
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.health = 100;
    this.alive = true;
    this.attacking = false;
    this.jump = false;
    this.running = false;
    this.attack_cooldown = 0;
    this.vel_y = 0;
    this.hit = false;
    this.sprite.setPosition(x, y);
    this.hitbox.x = x - 40;
    this.hitbox.y = y - 90;
    this.sprite.play(`${this.spriteKey}_idle`, true);
  }

  // Bot AI methods
  updateBotBehavior(target) {
    if (!this.alive || !target.alive) return;

    const distance = target.x - this.x;
    const absDistance = Math.abs(distance);
    const verticalGap = Math.abs(target.y - this.y);

    if (this.attacking) {
      this.flip = this.pre_attack_flip;
    } else {
      this.flip = distance < 0;
      this.pre_attack_flip = this.flip;
    }

    const inAttackRange = absDistance < 1 && verticalGap < 1;

    if (target.jump && !this.jump) {
      this.vel_y = this.JUMP_VELOCITY;
      this.jump = true;
    } else {
      const now = this.scene.time.now;
      if (!this.last_jump) {
        this.last_jump = now;
        this.next_jump_delay = Phaser.Math.Between(1200, 3000);
      }
      if (now - this.last_jump > this.next_jump_delay) {
        if (!this.jump) {
          this.vel_y = this.JUMP_VELOCITY;
          this.jump = true;
        }
        this.last_jump = now;
        this.next_jump_delay = Phaser.Math.Between(1200, 3000);
      }
    }

    if (inAttackRange && this.attack_cooldown === 0 && !this.attacking) {
      this.attack_type = Phaser.Math.Between(0, 1);
      this.attack(target);
      this.running = false;
      return;
    }

    if (!inAttackRange) {
      this.running = true;
      this.x += distance > 0 ? 5 : -5;
    } else {
      this.running = false;
    }
  }
}
