class Fighter {
  constructor(scene, x, y, isBot, data, spriteKey, steps, sound) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isBot = isBot;
    this.spriteKey = spriteKey;
    this.steps = steps;
    this.sound = sound;
    this.health = 100;
    this.vel_y = 0;
    this.jump = false;
    this.running = false;
    this.attacking = false;
    this.attack_type = 0;
    this.attack_cooldown = 0;
    this.hit = false;
    this.alive = true;
    this.flip = false;

    // Create sprite
    this.sprite = scene.add.sprite(x, y, spriteKey);
    this.sprite.setScale(data[1]);
    this.sprite.setOrigin(0.5, 1);

    // Adjust position based on offset data
    const [frameWidth, scale, [offsetX, offsetY]] = data;
    this.sprite.x += offsetX;
    this.sprite.y += offsetY;

    // Add animation complete event handler
    this.sprite.on('animationcomplete', (anim) => {
      if (anim.key.includes('attack')) {
        this.attacking = false;
      }
      if (anim.key.includes('hit')) {
        this.hit = false;
      }
      if (anim.key.includes('death')) {
        // Handle death animation completion
        this.alive = false;
      }
    });

    // Create animations
    this.createAnimations();
  }

  createAnimations() {
    // Each row in the spritesheet is a different action
    let startFrame = 0;
    for (let i = 0; i < this.steps.length; i++) {
      const frames = this.steps[i];
      this.scene.anims.create({
        key: `${this.spriteKey}_action${i}`,
        frames: this.scene.anims.generateFrameNumbers(this.spriteKey, {
          start: startFrame,
          end: startFrame + frames - 1,
        }),
        frameRate: 10,
        repeat: i === 0 ? -1 : 0, // idle loops, others don't
      });
      startFrame += frames;
    }
  }

  updateAnimation() {
    let actionIndex = 0;
    if (this.health <= 0) actionIndex = 6;
    else if (this.hit) actionIndex = 5;
    else if (this.attacking) actionIndex = this.attack_type === 0 ? 3 : 4;
    else if (this.jump) actionIndex = 2;
    else if (this.running) actionIndex = 1;
    else actionIndex = 0;
    this.sprite.play(`${this.spriteKey}_action${actionIndex}`, true);
  }

  update() {
    // Update position
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.flipX = this.flip;

    // Update animation
    this.updateAnimation();

    // Handle attack cooldown
    if (this.attack_cooldown > 0) {
      this.attack_cooldown--;
    }

    // Handle death
    if (this.health <= 0 && this.alive) {
      this.alive = false;
      this.health = 0;
    }
  }

  attack(target) {
    if (this.attack_cooldown === 0) {
      this.attacking = true;
      this.attack_cooldown = 20;
      this.sound.play();

      // Check if attack hits
      const distance = Math.abs(this.x - target.x);
      if (distance < 100) {
        target.takeDamage(10);
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hit = true;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.health = 100;
    this.vel_y = 0;
    this.jump = false;
    this.running = false;
    this.attacking = false;
    this.attack_type = 0;
    this.attack_cooldown = 0;
    this.hit = false;
    this.alive = true;
    this.flip = false;
    this.sprite.setPosition(x, y);
    this.updateAnimation();
  }

  // Bot AI methods
  updateBotBehavior(target) {
    if (!this.alive || !target.alive) return;

    const distance = target.x - this.x;
    const absDistance = Math.abs(distance);
    const verticalGap = Math.abs(target.y - this.y);

    // Always face the target
    this.flip = distance < 0;

    const inAttackRange = absDistance < 60 && verticalGap < 60;

    // More aggressive movement
    if (!inAttackRange) {
      this.running = true;
      const moveSpeed = 4; // Increased from 5 to 4 for smoother movement
      this.x += distance > 0 ? moveSpeed : -moveSpeed;
    } else {
      this.running = false;
    }

    // More aggressive attack behavior
    if (inAttackRange && this.attack_cooldown === 0 && !this.attacking) {
      this.attack_type = Math.random() < 0.5 ? 0 : 1;
      this.attack(target);
    }

    // More responsive jumping
    if (target.jump && !this.jump) {
      this.vel_y = -30;
      this.jump = true;
    } else {
      const now = this.scene.time.now;
      if (!this.last_jump) {
        this.last_jump = now;
        this.next_jump_delay = Phaser.Math.Between(1000, 2000); // Reduced delay
      }
      if (now - this.last_jump > this.next_jump_delay) {
        if (!this.jump && Math.random() < 0.3) { // 30% chance to jump
          this.vel_y = -30;
          this.jump = true;
        }
        this.last_jump = now;
        this.next_jump_delay = Phaser.Math.Between(1000, 2000);
      }
    }
  }
}
