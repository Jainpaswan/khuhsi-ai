// Khushi's Birthday Quest - Mobile-First 2D Canvas Engine
// Provides 60fps platformer gameplay with 3 levels, power-ups, collectibles, obstacles, and particle systems.

import { audioSynth } from './audioSynth.js';

export class BirthdayQuestGame {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    this.onStateChange = options.onStateChange || (() => {});
    this.onFinalCelebration = options.onFinalCelebration || (() => {});

    // Game Config & State
    this.width = 800;
    this.height = 450;
    
    this.state = 'IDLE'; // IDLE, PLAYING, PAUSED, LEVEL_WIN, GAME_OVER, CELEBRATION
    this.currentLevelIndex = 0; // 0, 1, 2
    this.score = 0;
    this.lives = 3;
    this.levelTime = 0; // in seconds
    this.timerInterval = null;

    // Camera
    this.cameraX = 0;
    this.levelWidth = 2800;

    // Keys State
    this.keys = { left: false, right: false, up: false, down: false };

    // Player (Khushi)
    this.player = {
      x: 100,
      y: 300,
      width: 44,
      height: 60,
      vx: 0,
      vy: 0,
      speed: 4.5,
      jumpForce: -11.5,
      isGrounded: false,
      facing: 'right', // 'left' or 'right'
      animFrame: 0,
      animTimer: 0,
      
      // Hit state
      invulnerableTimer: 0,

      // Active Power-ups
      powerUp: null, // 'wings', 'speed', 'magnet', 'shield'
      powerUpTime: 0
    };

    // Level Objects
    this.platforms = [];
    this.collectibles = [];
    this.obstacles = [];
    this.powerUpItems = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bgBalloons = [];

    // Finish Gate
    this.finishGate = { x: 2600, y: 150, width: 90, height: 250 };

    // Level Definitions
    this.levelDefs = [
      {
        name: "Level 1: Balloon Garden 🎈",
        bgColor1: '#ffe6f2',
        bgColor2: '#e6f0ff',
        groundColor: '#7bc676',
        groundTopColor: '#9be396',
        width: 2600,
        description: "Welcome to the sunny birthday garden! Collect cakes, balloons & gifts."
      },
      {
        name: "Level 2: Candy Cloud Kingdom ☁️",
        bgColor1: '#ebd4fc',
        bgColor2: '#c9e6ff',
        groundColor: '#d68fd6',
        groundTopColor: '#f2bbf2',
        width: 3000,
        description: "Watch out for sleeping cats & moving cloud hazards! Find Speed & Magnet power-ups!"
      },
      {
        name: "Level 3: Starry Birthday Night ⭐",
        bgColor1: '#2b1b54',
        bgColor2: '#522d7a',
        groundColor: '#413075',
        groundTopColor: '#6c53b3',
        width: 3400,
        description: "Fly with Rainbow Wings under starry skies to unlock the Final Birthday Surprise!"
      }
    ];

    // Bind Resize
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Bind Controls
    this.setupKeyboardControls();
    this.setupTouchControls();

    // Start background decor animation
    this.initBackgroundDecor();

    // Loop Handle
    this.animReqId = null;
    this.lastFrameTime = performance.now();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this.canvas.width = Math.min(rect.width, 960);
      this.canvas.height = Math.min(rect.height, 540);
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    }
  }

  initBackgroundDecor() {
    this.bgBalloons = [];
    for (let i = 0; i < 25; i++) {
      this.bgBalloons.push({
        x: Math.random() * 3400,
        y: Math.random() * 300 + 50,
        size: Math.random() * 16 + 14,
        color: ['#ff9bbd', '#b5a7ff', '#7dd3fc', '#fde047', '#f472b6'][i % 5],
        speedY: Math.random() * 0.4 + 0.2,
        swing: Math.random() * 20,
        swingSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'PLAYING') return;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        if (!this.keys.up) this.handleJumpInput();
        this.keys.up = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.keys.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) this.keys.up = false;
    });
  }

  setupTouchControls() {
    // Touch event helpers called by external UI buttons or direct canvas touch
    this.setControlState = (dir, active) => {
      if (dir === 'left') this.keys.left = active;
      if (dir === 'right') this.keys.right = active;
      if (dir === 'jump') {
        if (active && !this.keys.up) this.handleJumpInput();
        this.keys.up = active;
      }
    };
  }

  handleJumpInput() {
    if (this.state !== 'PLAYING') return;
    
    // Rainbow Wings allows unlimited flying jump
    if (this.player.powerUp === 'wings') {
      this.player.vy = -7.5;
      audioSynth.playJump();
      this.addParticles(this.player.x + 22, this.player.y + 40, '#ff9bbd', 4);
    } else if (this.player.isGrounded) {
      this.player.vy = this.player.jumpForce;
      this.player.isGrounded = false;
      audioSynth.playJump();
      this.addParticles(this.player.x + 22, this.player.y + 55, '#ffffff', 5);
    }
  }

  startLevel(levelIdx = 0) {
    this.currentLevelIndex = levelIdx;
    const def = this.levelDefs[levelIdx];
    this.levelWidth = def.width;

    // Reset Player
    this.player.x = 80;
    this.player.y = 250;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.powerUp = null;
    this.player.powerUpTime = 0;
    this.player.invulnerableTimer = 0;

    this.cameraX = 0;
    this.levelTime = 0;
    this.particles = [];
    this.floatingTexts = [];

    // Build level contents
    this.buildLevelData(levelIdx);

    this.state = 'PLAYING';
    this.onStateChange(this.state, { level: levelIdx + 1, score: this.score, lives: this.lives });

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state === 'PLAYING') {
        this.levelTime++;
        // Update powerup countdown
        if (this.player.powerUp) {
          this.player.powerUpTime--;
          if (this.player.powerUpTime <= 0) {
            this.player.powerUp = null;
            this.addFloatingText("Power-up Expired!", this.player.x, this.player.y - 20, '#ff6b6b');
          }
        }
      }
    }, 1000);

    if (!this.animReqId) {
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }
  }

  buildLevelData(levelIdx) {
    this.platforms = [];
    this.collectibles = [];
    this.obstacles = [];
    this.powerUpItems = [];

    const groundY = this.height - 60;

    // Base ground platforms
    this.platforms.push({ x: 0, y: groundY, width: this.levelWidth, height: 100, isGround: true });

    if (levelIdx === 0) {
      // Level 1: Balloon Garden
      // Elevated platforms
      [
        { x: 300, y: groundY - 80, w: 160 },
        { x: 550, y: groundY - 140, w: 180 },
        { x: 850, y: groundY - 90, w: 200 },
        { x: 1200, y: groundY - 130, w: 220 },
        { x: 1550, y: groundY - 80, w: 180 },
        { x: 1850, y: groundY - 150, w: 240 },
        { x: 2200, y: groundY - 100, w: 200 }
      ].forEach(p => this.platforms.push({ x: p.x, y: p.y, width: p.w, height: 24 }));

      // Collectibles
      // Cakes (+10)
      [340, 600, 920, 1260, 1600, 1920, 2260].forEach(x => {
        this.collectibles.push({ type: 'cake', x, y: groundY - 120, size: 28, points: 10, label: '🎂' });
      });
      // Balloons (+5)
      [220, 420, 700, 1050, 1400, 1750, 2050, 2400].forEach(x => {
        this.collectibles.push({ type: 'balloon', x, y: groundY - 180, size: 26, points: 5, label: '🎈' });
      });
      // Gifts (+20)
      [480, 1100, 1680, 2150].forEach(x => {
        this.collectibles.push({ type: 'gift', x, y: groundY - 45, size: 30, points: 20, label: '🎁' });
      });
      // Stars (+50)
      [640, 1300, 1970].forEach(x => {
        this.collectibles.push({ type: 'star', x, y: groundY - 200, size: 28, points: 50, label: '⭐' });
      });

      // Obstacles
      // Puddles
      [400, 980, 1480, 2000].forEach(x => {
        this.obstacles.push({ type: 'puddle', x, y: groundY - 8, width: 65, height: 16 });
      });
      // Toy blocks
      [750, 1350, 1800].forEach(x => {
        this.obstacles.push({ type: 'toyblock', x, y: groundY - 40, width: 40, height: 40 });
      });

      // Power-ups
      this.powerUpItems.push({ type: 'speed', x: 700, y: groundY - 170, label: '⚡', name: 'Speed Boost' });
      this.powerUpItems.push({ type: 'shield', x: 1500, y: groundY - 120, label: '🛡️', name: 'Shield Protection' });

      this.finishGate.x = 2450;
      this.finishGate.y = groundY - 180;

    } else if (levelIdx === 1) {
      // Level 2: Candy Cloud Kingdom
      // Platforms (including moving clouds)
      [
        { x: 280, y: groundY - 90, w: 160 },
        { x: 500, y: groundY - 160, w: 180 },
        { x: 780, y: groundY - 100, w: 150 },
        { x: 1050, y: groundY - 170, w: 200 },
        { x: 1350, y: groundY - 110, w: 170 },
        { x: 1650, y: groundY - 180, w: 220 },
        { x: 2000, y: groundY - 120, w: 180 },
        { x: 2350, y: groundY - 160, w: 200 }
      ].forEach(p => this.platforms.push({ x: p.x, y: p.y, width: p.w, height: 24 }));

      // Moving clouds platforms
      this.platforms.push({ x: 650, y: groundY - 210, width: 120, height: 20, isMoving: true, minX: 600, maxX: 850, vx: 1.5 });
      this.platforms.push({ x: 1500, y: groundY - 220, width: 130, height: 20, isMoving: true, minX: 1400, maxX: 1700, vx: 1.8 });

      // Collectibles
      [320, 560, 820, 1100, 1400, 1720, 2060, 2400].forEach(x => {
        this.collectibles.push({ type: 'cake', x, y: groundY - 130, size: 28, points: 10, label: '🎂' });
      });
      [200, 450, 720, 950, 1250, 1580, 1880, 2200, 2550].forEach(x => {
        this.collectibles.push({ type: 'balloon', x, y: groundY - 200, size: 26, points: 5, label: '🎈' });
      });
      [400, 900, 1500, 2100].forEach(x => {
        this.collectibles.push({ type: 'gift', x, y: groundY - 45, size: 30, points: 20, label: '🎁' });
      });
      [700, 1560, 2250].forEach(x => {
        this.collectibles.push({ type: 'star', x, y: groundY - 240, size: 28, points: 50, label: '⭐' });
      });

      // Obstacles: Sleeping cats, puddles, rolling presents, toy blocks
      this.obstacles.push({ type: 'sleepingcat', x: 600, y: groundY - 36, width: 45, height: 36 });
      this.obstacles.push({ type: 'sleepingcat', x: 1450, y: groundY - 36, width: 45, height: 36 });
      this.obstacles.push({ type: 'sleepingcat', x: 2150, y: groundY - 36, width: 45, height: 36 });
      
      this.obstacles.push({ type: 'rollingpresent', x: 1200, y: groundY - 35, width: 35, height: 35, vx: -2.2, minX: 900, maxX: 1300 });
      this.obstacles.push({ type: 'rollingpresent', x: 1900, y: groundY - 35, width: 35, height: 35, vx: -2.5, minX: 1600, maxX: 2000 });

      this.obstacles.push({ type: 'puddle', x: 450, y: groundY - 8, width: 70, height: 16 });
      this.obstacles.push({ type: 'toyblock', x: 1000, y: groundY - 40, width: 42, height: 42 });

      // Powerups: Magnet & Speed
      this.powerUpItems.push({ type: 'magnet', x: 520, y: groundY - 200, label: '🧲', name: 'Magnet' });
      this.powerUpItems.push({ type: 'speed', x: 1380, y: groundY - 150, label: '⚡', name: 'Speed Boost' });
      this.powerUpItems.push({ type: 'shield', x: 2050, y: groundY - 160, label: '🛡️', name: 'Shield' });

      this.finishGate.x = 2800;
      this.finishGate.y = groundY - 180;

    } else {
      // Level 3: Starry Birthday Night
      // High flying platforming & Rainbow Wings!
      [
        { x: 250, y: groundY - 90, w: 160 },
        { x: 480, y: groundY - 170, w: 180 },
        { x: 750, y: groundY - 240, w: 180 },
        { x: 1050, y: groundY - 140, w: 200 },
        { x: 1350, y: groundY - 220, w: 180 },
        { x: 1700, y: groundY - 280, w: 220 },
        { x: 2050, y: groundY - 180, w: 200 },
        { x: 2400, y: groundY - 240, w: 220 },
        { x: 2800, y: groundY - 140, w: 220 }
      ].forEach(p => this.platforms.push({ x: p.x, y: p.y, width: p.w, height: 24 }));

      // Moving clouds
      this.platforms.push({ x: 900, y: groundY - 290, width: 140, height: 20, isMoving: true, minX: 800, maxX: 1100, vx: 2.0 });
      this.platforms.push({ x: 1850, y: groundY - 320, width: 140, height: 20, isMoving: true, minX: 1700, maxX: 2050, vx: 2.2 });

      // Collectibles
      [300, 520, 800, 1100, 1400, 1750, 2100, 2460, 2850].forEach(x => {
        this.collectibles.push({ type: 'cake', x, y: groundY - 130, size: 28, points: 10, label: '🎂' });
      });
      [200, 400, 650, 950, 1250, 1550, 1900, 2250, 2650, 3000].forEach(x => {
        this.collectibles.push({ type: 'balloon', x, y: groundY - 220, size: 26, points: 5, label: '🎈' });
      });
      [350, 1000, 1700, 2500].forEach(x => {
        this.collectibles.push({ type: 'gift', x, y: groundY - 45, size: 30, points: 20, label: '🎁' });
      });
      // Lots of golden stars high up!
      [500, 780, 920, 1380, 1720, 1880, 2420, 2820].forEach(x => {
        this.collectibles.push({ type: 'star', x, y: groundY - 300, size: 30, points: 50, label: '⭐' });
      });

      // Obstacles
      this.obstacles.push({ type: 'sleepingcat', x: 500, y: groundY - 36, width: 45, height: 36 });
      this.obstacles.push({ type: 'sleepingcat', x: 1380, y: groundY - 36, width: 45, height: 36 });
      this.obstacles.push({ type: 'sleepingcat', x: 2450, y: groundY - 36, width: 45, height: 36 });

      this.obstacles.push({ type: 'rollingpresent', x: 800, y: groundY - 35, width: 35, height: 35, vx: -2.6, minX: 550, maxX: 950 });
      this.obstacles.push({ type: 'rollingpresent', x: 1600, y: groundY - 35, width: 35, height: 35, vx: -2.8, minX: 1300, maxX: 1750 });
      this.obstacles.push({ type: 'rollingpresent', x: 2700, y: groundY - 35, width: 35, height: 35, vx: -3.0, minX: 2300, maxX: 2850 });

      this.obstacles.push({ type: 'puddle', x: 650, y: groundY - 8, width: 75, height: 16 });
      this.obstacles.push({ type: 'puddle', x: 1950, y: groundY - 8, width: 75, height: 16 });

      // Rainbow Wings featured in Level 3!
      this.powerUpItems.push({ type: 'wings', x: 500, y: groundY - 210, label: '🌈', name: 'Rainbow Wings' });
      this.powerUpItems.push({ type: 'wings', x: 1750, y: groundY - 320, label: '🌈', name: 'Rainbow Wings' });
      this.powerUpItems.push({ type: 'magnet', x: 1100, y: groundY - 180, label: '🧲', name: 'Magnet' });
      this.powerUpItems.push({ type: 'shield', x: 2100, y: groundY - 220, label: '🛡️', name: 'Shield' });

      this.finishGate.x = 3200;
      this.finishGate.y = groundY - 180;
    }
  }

  gameLoop(currentTime = performance.now()) {
    if (this.state !== 'PLAYING' && this.state !== 'PAUSED') {
      this.animReqId = null;
      return;
    }

    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    if (this.state === 'PLAYING') {
      this.update(deltaTime);
    }

    this.render();

    this.animReqId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    const p = this.player;

    // Movement speed multiplier
    let moveSpeed = p.speed;
    if (p.powerUp === 'speed') moveSpeed *= 1.75;

    // Horizontal Movement
    if (this.keys.left) {
      p.vx = -moveSpeed;
      p.facing = 'left';
    } else if (this.keys.right) {
      p.vx = moveSpeed;
      p.facing = 'right';
    } else {
      p.vx *= 0.8;
    }

    // Apply Velocity
    p.x += p.vx;

    // Wings Power-up Flight vs Gravity
    if (p.powerUp === 'wings') {
      if (this.keys.up) {
        p.vy = -6.5;
      } else {
        p.vy += 0.25; // Gentle float
      }
      p.vy = Math.min(p.vy, 4);
    } else {
      // Normal Gravity
      p.vy += 0.55; // Gravity
      p.vy = Math.min(p.vy, 12);
    }

    p.y += p.vy;

    // Boundaries
    if (p.x < 10) p.x = 10;
    if (p.x > this.levelWidth - p.width - 10) p.x = this.levelWidth - p.width - 10;

    // Platform Collisions
    p.isGrounded = false;
    for (const plat of this.platforms) {
      // Moving cloud platform update
      if (plat.isMoving) {
        plat.x += plat.vx;
        if (plat.x < plat.minX || plat.x > plat.maxX) plat.vx *= -1;
      }

      // Check collision from top
      if (
        p.x + p.width > plat.x + 5 &&
        p.x < plat.x + plat.width - 5 &&
        p.y + p.height >= plat.y &&
        p.y + p.height <= plat.y + 20 &&
        p.vy >= 0
      ) {
        p.y = plat.y - p.height;
        p.vy = 0;
        p.isGrounded = true;

        // Carry player on moving platform
        if (plat.isMoving) p.x += plat.vx;
      }
    }

    // Fall below level emergency ground check
    const groundY = this.height - 60;
    if (p.y + p.height > groundY) {
      p.y = groundY - p.height;
      p.vy = 0;
      p.isGrounded = true;
    }

    // Update Player Animation Frame
    if (Math.abs(p.vx) > 0.5 || !p.isGrounded) {
      p.animTimer += dt;
      if (p.animTimer > 0.12) {
        p.animFrame = (p.animFrame + 1) % 4;
        p.animTimer = 0;
      }
    } else {
      p.animFrame = 0;
    }

    // Update Invulnerable Timer
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer -= dt;
    }

    // Camera follow smoothly
    const targetCamX = p.x - this.width * 0.35;
    this.cameraX += (targetCamX - this.cameraX) * 0.1;
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.levelWidth - this.width));

    // Magnet Effect on Collectibles
    if (p.powerUp === 'magnet') {
      const pCenterX = p.x + p.width / 2;
      const pCenterY = p.y + p.height / 2;
      for (const item of this.collectibles) {
        if (!item.collected) {
          const dx = pCenterX - item.x;
          const dy = pCenterY - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 220) {
            item.x += (dx / dist) * 7.5;
            item.y += (dy / dist) * 7.5;
          }
        }
      }
    }

    // Collectibles Pick Up Check
    for (const item of this.collectibles) {
      if (!item.collected) {
        const dx = (p.x + p.width / 2) - item.x;
        const dy = (p.y + p.height / 2) - item.y;
        if (Math.sqrt(dx * dx + dy * dy) < 36) {
          item.collected = true;
          this.score += item.points;
          audioSynth.playCollect(item.type);
          this.addFloatingText(`+${item.points}`, item.x, item.y - 10, '#fde047');
          this.addParticles(item.x, item.y, '#fde047', 8);
          this.onStateChange(this.state, { level: this.currentLevelIndex + 1, score: this.score, lives: this.lives });
        }
      }
    }

    // Power-Up Pick Up Check
    for (const item of this.powerUpItems) {
      if (!item.collected) {
        const dx = (p.x + p.width / 2) - item.x;
        const dy = (p.y + p.height / 2) - item.y;
        if (Math.sqrt(dx * dx + dy * dy) < 38) {
          item.collected = true;
          p.powerUp = item.type;
          p.powerUpTime = item.type === 'wings' ? 10 : item.type === 'magnet' ? 8 : 10;
          audioSynth.playPowerUp();
          this.addFloatingText(`${item.name} Activated!`, item.x, item.y - 15, '#a78bfa');
          this.addParticles(item.x, item.y, '#c084fc', 14);
        }
      }
    }

    // Obstacles Collision & Patrol Update
    for (const obs of this.obstacles) {
      // Rolling present patrol
      if (obs.type === 'rollingpresent') {
        obs.x += obs.vx;
        if (obs.x < obs.minX || obs.x > obs.maxX) obs.vx *= -1;
      }

      // Check player collision with obstacle
      if (
        p.invulnerableTimer <= 0 &&
        p.x + p.width - 8 > obs.x &&
        p.x + 8 < obs.x + obs.width &&
        p.y + p.height - 8 > obs.y &&
        p.y + 8 < obs.y + obs.height
      ) {
        // If player has active shield, shield absorbs hit!
        if (p.powerUp === 'shield') {
          p.powerUp = null;
          p.powerUpTime = 0;
          p.invulnerableTimer = 1.2;
          audioSynth.playHit();
          this.addFloatingText("Shield Absorbed Hit! 🛡️", p.x, p.y - 20, '#fbbf24');
          this.addParticles(p.x + 22, p.y + 30, '#fbbf24', 12);
        } else {
          // Lose a life heart!
          this.lives--;
          p.invulnerableTimer = 1.8;
          p.vy = -6; // Bounce back
          p.vx = p.facing === 'right' ? -4 : 4;

          if (obs.type === 'sleepingcat') {
            audioSynth.playMeow();
            this.addFloatingText("Meow! Cat Woke Up! 🐱", p.x, p.y - 20, '#f472b6');
          } else {
            audioSynth.playHit();
            this.addFloatingText("-1 Heart 💔", p.x, p.y - 20, '#ef4444');
          }

          this.addParticles(p.x + 22, p.y + 30, '#ef4444', 10);
          this.onStateChange(this.state, { level: this.currentLevelIndex + 1, score: this.score, lives: this.lives });

          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
        }
      }
    }

    // Check Finish Gate Collision
    if (
      p.x + p.width > this.finishGate.x &&
      p.x < this.finishGate.x + this.finishGate.width &&
      p.y + p.height > this.finishGate.y
    ) {
      this.levelComplete();
      return;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 0.02;
      if (pt.alpha <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.015;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  levelComplete() {
    this.state = 'LEVEL_WIN';
    audioSynth.playLevelComplete();

    if (this.currentLevelIndex < 2) {
      this.onStateChange('LEVEL_WIN', {
        level: this.currentLevelIndex + 1,
        nextLevel: this.currentLevelIndex + 2,
        score: this.score,
        lives: this.lives
      });
    } else {
      // Completed all 3 levels! Trigger Final Celebration!
      this.state = 'CELEBRATION';
      this.onFinalCelebration({ score: this.score, time: this.levelTime });
    }
  }

  gameOver() {
    this.state = 'GAME_OVER';
    audioSynth.playHit();
    this.onStateChange('GAME_OVER', { score: this.score, level: this.currentLevelIndex + 1 });
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.onStateChange('PAUSED', { score: this.score, level: this.currentLevelIndex + 1 });
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastFrameTime = performance.now();
      this.gameLoop();
      this.onStateChange('PLAYING', { score: this.score, level: this.currentLevelIndex + 1 });
    }
  }

  addParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        color,
        size: Math.random() * 5 + 3,
        alpha: 1
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({ text, x, y, color, alpha: 1.2 });
  }

  /* ==================== RENDERING SYSTEM ==================== */
  render() {
    const ctx = this.ctx;
    const def = this.levelDefs[this.currentLevelIndex];

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, def.bgColor1);
    grad.addColorStop(1, def.bgColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    // Apply Camera Shift
    ctx.translate(-Math.floor(this.cameraX), 0);

    // 2. Parallax Floating Balloons in Background
    this.bgBalloons.forEach(b => {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = b.color;
      const bx = b.x;
      const by = b.y + Math.sin(performance.now() * b.swingSpeed + b.swing) * 12;
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI * 2);
      ctx.fill();
      // string
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, by + b.size);
      ctx.lineTo(bx, by + b.size + 20);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Draw Bunting Festive Banners across top
    for (let bx = 0; bx < this.levelWidth; bx += 180) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.quadraticCurveTo(bx + 90, 45, bx + 180, 20);
      ctx.stroke();

      // Flags
      const colors = ['#f472b6', '#a78bfa', '#38bdf8', '#fde047', '#4ade80'];
      for (let i = 0; i < 4; i++) {
        const fx = bx + 35 + i * 35;
        const fy = 25 + Math.sin(i * 0.8) * 8;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + 22, fy);
        ctx.lineTo(fx + 11, fy + 26);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 4. Platforms & Ground
    for (const plat of this.platforms) {
      if (plat.isGround) {
        // Ground block
        ctx.fillStyle = def.groundColor;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        // Top Grass / Candy trim
        ctx.fillStyle = def.groundTopColor;
        ctx.fillRect(plat.x, plat.y, plat.width, 14);

        // Flower / Scenery details on ground
        for (let fx = 100; fx < plat.width; fx += 250) {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(fx, plat.y - 6, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(fx, plat.y - 6, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Elevated platform (Candy cloud or pastel block)
        ctx.save();
        ctx.fillStyle = plat.isMoving ? '#fce7f3' : '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 8;
        
        // Rounded pill shape platform
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 12);
        ctx.fill();

        // Pastel trim border
        ctx.strokeStyle = plat.isMoving ? '#ec4899' : '#a855f7';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
      }
    }

    // 5. Collectibles
    for (const item of this.collectibles) {
      if (!item.collected) {
        ctx.save();
        const floatY = Math.sin(performance.now() * 0.005 + item.x) * 6;
        ctx.font = `${item.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, item.x, item.y + floatY);

        // Glow ring around stars/cakes
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 10;
        ctx.restore();
      }
    }

    // 6. Power-up Items
    for (const item of this.powerUpItems) {
      if (!item.collected) {
        ctx.save();
        const floatY = Math.sin(performance.now() * 0.006 + item.x) * 8;
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glowing circle background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(item.x, item.y + floatY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillText(item.label, item.x, item.y + floatY);
        ctx.restore();
      }
    }

    // 7. Obstacles
    for (const obs of this.obstacles) {
      ctx.save();
      if (obs.type === 'puddle') {
        // Water puddle
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, obs.y + 8, obs.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (obs.type === 'toyblock') {
        // Toy Block
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('A', obs.x + obs.width / 2, obs.y + obs.height / 2);
      } else if (obs.type === 'sleepingcat') {
        // Sleeping Cat
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🐱', obs.x + obs.width / 2, obs.y + obs.height);
        // ZZZ text
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#8b5cf6';
        ctx.fillText('z Z z', obs.x + obs.width / 2 + 15, obs.y - 5 + Math.sin(performance.now() * 0.004) * 4);
      } else if (obs.type === 'rollingpresent') {
        // Rolling Present
        ctx.save();
        ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
        ctx.rotate(obs.x * 0.05);
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // 8. Finish Gate
    const fg = this.finishGate;
    ctx.save();
    // Arch Pillars
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(fg.x, fg.y, 18, fg.height);
    ctx.fillRect(fg.x + fg.width - 18, fg.y, 18, fg.height);
    // Arch Banner
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(fg.x, fg.y, fg.width, 45);
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH 🎉', fg.x + fg.width / 2, fg.y + 28);
    // Giant Cake in finish arch
    ctx.font = '40px sans-serif';
    ctx.fillText('🎂', fg.x + fg.width / 2, fg.y + fg.height - 40);
    ctx.restore();

    // 9. Draw Player (Khushi)
    const p = this.player;
    ctx.save();

    // Invulnerability blinking
    if (p.invulnerableTimer <= 0 || Math.floor(performance.now() / 100) % 2 === 0) {
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
      if (p.facing === 'left') ctx.scale(-1, 1);

      // Rainbow Wings Powerup Visual
      if (p.powerUp === 'wings') {
        ctx.save();
        const wingFlap = Math.sin(performance.now() * 0.015) * 0.3;
        ctx.rotate(wingFlap);
        ctx.font = '36px sans-serif';
        ctx.fillText('🪽', -25, -10);
        ctx.fillText('🪽', 5, -10);
        ctx.restore();
      }

      // Speed Boost Trail Effect
      if (p.powerUp === 'speed') {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-15, 0, 18, 25, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shield Bubble Aura
      if (p.powerUp === 'shield') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Magnet Spark Aura
      if (p.powerUp === 'magnet') {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 34 + Math.sin(performance.now() * 0.01) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Khushi Animated Cartoon Character Vector Drawing
      // Head & Hair
      ctx.fillStyle = '#331800'; // Dark brown hair
      ctx.beginPath();
      ctx.arc(0, -18, 16, 0, Math.PI * 2); // Main head
      ctx.fill();
      
      // Cute ponytail
      ctx.beginPath();
      ctx.arc(-14, -22, 9, 0, Math.PI * 2);
      ctx.fill();

      // Ribbon bow in hair
      ctx.fillStyle = '#f472b6';
      ctx.font = '14px sans-serif';
      ctx.fillText('🎀', -14, -24);

      // Face skin
      ctx.fillStyle = '#ffdfc4';
      ctx.beginPath();
      ctx.arc(3, -16, 12, 0, Math.PI * 2);
      ctx.fill();

      // Eyes & Blush
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(7, -18, 2.2, 0, Math.PI * 2); // Right eye
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(8, -13, 3, 0, Math.PI * 2); // Blush
      ctx.fill();

      // Joyful smile
      ctx.strokeStyle = '#9f1239';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(5, -16, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Pastel Birthday Dress
      ctx.fillStyle = p.powerUp === 'wings' ? '#c084fc' : '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(10, -4);
      ctx.lineTo(16, 18);
      ctx.lineTo(-16, 18);
      ctx.closePath();
      ctx.fill();

      // Dress polka dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-4, 6, 2, 0, Math.PI * 2);
      ctx.arc(4, 12, 2, 0, Math.PI * 2);
      ctx.fill();

      // Legs with walk animation angle
      const legAngle = Math.sin(p.animFrame * Math.PI / 2) * 0.4;
      ctx.strokeStyle = '#ffdfc4';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(-5, 18);
      ctx.lineTo(-5 - Math.sin(legAngle) * 8, 28);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5, 18);
      ctx.lineTo(5 + Math.sin(legAngle) * 8, 28);
      ctx.stroke();

      // Cute shoes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-8 - Math.sin(legAngle) * 8, 26, 7, 5);
      ctx.fillRect(2 + Math.sin(legAngle) * 8, 26, 7, 5);
    }
    ctx.restore();

    // 10. Draw Particles
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 11. Draw Floating Score Text
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 20px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore(); // Restore Camera
  }
}
