// Main Application Controller for Khushi's Memory Keeper

import confetti from 'canvas-confetti';
import './style.css';
import { getMemories, saveMemory, INITIAL_PHOTOS, INITIAL_VIDEOS, INITIAL_WISHES } from './memoriesData.js';
import { generateAIResponse } from './aiCompanion.js';
import { audioSynth } from './audioSynth.js';
import { BirthdayQuestGame } from './birthdayQuestGame.js';

// Global State
let currentPhotos = [...INITIAL_PHOTOS];
let currentWishes = [...INITIAL_WISHES];
let candlesBlown = false;
let gameInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem("khushi_memories");
  initAmbientCanvas();
  initTabNavigation();
  initBirthdayQuestGame();
  initAIChat();
  renderTimeline('all');
  renderPhotoGallery();
  renderVideoGallery();
  renderWishesWall();
  initModals();
  initSurpriseVault();
  initAudioControls();

  // Trigger welcoming celebration confetti burst on load!
  triggerConfettiBurst();
});

/* ==================== CONFETTI BURST UTILITY ==================== */
function triggerConfettiBurst() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#e8a598', '#9d8ec7', '#d4af37', '#ffb6c1']
  });
  audioSynth.playConfettiPop();
}

/* ==================== AMBIENT PARTICLE BACKGROUND CANVAS ==================== */
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = 35;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 4,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      color: i % 2 === 0 ? 'rgba(232, 165, 152, ' : 'rgba(157, 142, 199, '
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < -20) p.y = height + 20;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.opacity + ')';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

/* ==================== TAB NAVIGATION ==================== */
function switchToTab(targetId) {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(t => {
    if (t.getAttribute('data-tab') === targetId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  panes.forEach(p => {
    if (p.id === targetId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });
}

function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      audioSynth.playButtonClick();
      const targetId = tab.getAttribute('data-tab');
      switchToTab(targetId);
    });
  });
}

/* ==================== TAB 1: AI COMPANION CHAT ==================== */
function initAIChat() {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const promptChips = document.querySelectorAll('.prompt-chip');

  // Prompt Chips Click Action
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      chatInput.value = promptText;
      handleSendMessage(promptText);
    });
  });

  // Chat Form Submit Action
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const userText = chatInput.value.trim();
    if (!userText) return;
    handleSendMessage(userText);
    chatInput.value = '';
  });

  function handleSendMessage(userText) {
    audioSynth.playButtonClick();
    appendUserBubble(userText);

    // Simulated Typing Delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(userText);
      appendAIBubble(aiResponse);
    }, 400);
  }

  function appendUserBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user-bubble';
    bubble.innerHTML = `
      <div class="bubble-avatar">👑</div>
      <div class="bubble-content">
        <p>${escapeHTML(text)}</p>
      </div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendAIBubble(aiResponse) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai-bubble';

    let mediaHTML = '';
    if (aiResponse.mediaCards && aiResponse.mediaCards.length > 0) {
      mediaHTML = `
        <div class="inline-media-grid">
          ${aiResponse.mediaCards.map(m => `
            <div class="chat-media-card" onclick="openLightbox('${m.url}', '${escapeHTML(m.title)}', '${escapeHTML(m.caption)}')">
              <img src="${m.url}" alt="${escapeHTML(m.title)}" />
              <div class="card-caption">🖼️ ${escapeHTML(m.title)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="bubble-avatar">🌸</div>
      <div class="bubble-content">
        <p>${aiResponse.text.replace(/\n/g, '<br>')}</p>
        ${mediaHTML}
      </div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

/* ==================== TAB 2: MEMORY TIMELINE ==================== */
function renderTimeline(categoryFilter = 'all') {
  const container = document.getElementById('timeline-stream');
  if (!container) return;

  const memories = getMemories();
  const filtered = categoryFilter === 'all' ? memories : memories.filter(m => m.category === categoryFilter);

  container.innerHTML = '';

  filtered.forEach(mem => {
    const card = document.createElement('div');
    card.className = 'timeline-card glass-card';
    
    let imgHTML = '';
    if (mem.mediaUrl) {
      imgHTML = `<img src="${mem.mediaUrl}" alt="${escapeHTML(mem.title)}" class="timeline-img" onclick="openLightbox('${mem.mediaUrl}', '${escapeHTML(mem.title)}', '${escapeHTML(mem.caption || mem.story)}')" />`;
    }

    card.innerHTML = `
      <div class="timeline-node"></div>
      <div class="timeline-inner">
        <span class="timeline-date-badge">${escapeHTML(mem.date)}</span>
        <h3>${escapeHTML(mem.title)}</h3>
        ${imgHTML}
        <p>${escapeHTML(mem.story)}</p>
        <span class="timeline-author">✨ Shared by ${escapeHTML(mem.addedBy)}</span>
      </div>
    `;
    container.appendChild(card);
  });

  // Timeline Filter Event Listeners
  const filterBtns = document.querySelectorAll('.timeline-filters .filter-btn');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      renderTimeline(cat);
    };
  });
}

/* ==================== TAB 3: PHOTO GALLERY ==================== */
function renderPhotoGallery() {
  const container = document.getElementById('photo-grid');
  if (!container) return;

  container.innerHTML = '';
  currentPhotos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'photo-card glass-card';
    card.innerHTML = `
      <div class="photo-card-img-wrapper" onclick="openLightbox('${p.url}', '${escapeHTML(p.title)}', '${escapeHTML(p.caption)}')">
        <img src="${p.url}" alt="${escapeHTML(p.title)}" />
      </div>
      <div class="photo-card-body">
        <h4 class="photo-card-title">${escapeHTML(p.title)}</h4>
        <p class="photo-card-date">${escapeHTML(p.date)}</p>
        <div class="photo-card-actions">
          <button class="like-btn" onclick="likePhoto('${p.id}', this)">
            ❤️ <span class="like-count">${p.likes}</span>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

window.likePhoto = function(id, btnElement) {
  audioSynth.playTone(600, 0.1, 'sine', 0.08);
  const photo = currentPhotos.find(p => p.id === id);
  if (photo) {
    photo.likes += 1;
    const countSpan = btnElement.querySelector('.like-count');
    if (countSpan) countSpan.textContent = photo.likes;
  }
};

/* ==================== TAB 4: VIDEO MEMORIES ==================== */
function renderVideoGallery() {
  const container = document.getElementById('video-grid');
  if (!container) return;

  container.innerHTML = '';
  INITIAL_VIDEOS.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card glass-card';
    card.innerHTML = `
      <div class="video-thumb-wrapper" onclick="openVideoPlayer('${v.id}')">
        <img src="${v.thumbnail}" alt="${escapeHTML(v.title)}" />
        <div class="play-badge-icon">▶</div>
        <span class="duration-tag">${v.duration}</span>
      </div>
      <div class="video-card-body">
        <h4 class="video-card-title">${escapeHTML(v.title)}</h4>
        <p class="video-speaker">From: ${escapeHTML(v.speaker)}</p>
        <p class="video-quote">${escapeHTML(v.quote)}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

window.openVideoPlayer = function(id) {
  audioSynth.playButtonClick();
  const video = INITIAL_VIDEOS.find(v => v.id === id);
  if (!video) return;

  document.getElementById('video-screen-img').src = video.thumbnail;
  document.getElementById('video-player-title').textContent = video.title;
  document.getElementById('video-player-speaker').textContent = `From: ${video.speaker}`;
  document.getElementById('video-player-desc').textContent = video.description;
  document.getElementById('video-sub-text').textContent = video.quote;

  const overlay = document.getElementById('video-play-overlay');
  overlay.style.display = 'flex';

  const modal = document.getElementById('modal-video-player');
  modal.classList.remove('hidden');

  const playBtn = document.getElementById('btn-play-simulated-video');
  playBtn.onclick = () => {
    overlay.style.display = 'none';
    audioSynth.playTone(440, 1.5, 'sine', 0.1);
  };
};

/* ==================== TAB 5: BIRTHDAY WISHES WALL ==================== */
function renderWishesWall() {
  const container = document.getElementById('wishes-wall');
  if (!container) return;

  container.innerHTML = '';
  currentWishes.forEach(w => {
    const card = document.createElement('div');
    card.className = 'wish-card glass-card';
    card.innerHTML = `
      <div class="wish-header">
        <div class="wish-avatar">💌</div>
        <div class="wish-sender-info">
          <h4>${escapeHTML(w.sender)}</h4>
          <span class="wish-relation">${escapeHTML(w.relation)}</span>
        </div>
      </div>
      <p class="wish-text">${escapeHTML(w.message)}</p>
      <div class="wish-footer">
        <button class="audio-wish-btn" onclick="playAudioWish('${escapeHTML(w.audioNote)}')">
          🔊 Voice Message
        </button>
        <button class="like-btn" onclick="likeWish('${w.id}', this)">
          ❤️ <span class="wish-like-count">${w.likes}</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.playAudioWish = function(text) {
  audioSynth.playTone(523.25, 0.4, 'sine', 0.08);
  setTimeout(() => audioSynth.playTone(659.25, 0.5, 'sine', 0.08), 200);
  alert(`🔊 Voice Note: "${text}"`);
};

window.likeWish = function(id, btnElement) {
  audioSynth.playTone(700, 0.1, 'sine', 0.08);
  const wish = currentWishes.find(w => w.id === id);
  if (wish) {
    wish.likes += 1;
    const countSpan = btnElement.querySelector('.wish-like-count');
    if (countSpan) countSpan.textContent = wish.likes;
  }
};

/* ==================== MODALS MANAGEMENT ==================== */
function initModals() {
  // Close buttons handler
  const closeBtns = document.querySelectorAll('.modal-close');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      audioSynth.playButtonClick();
      const targetId = btn.getAttribute('data-close');
      const targetModal = document.getElementById(targetId);
      if (targetModal) targetModal.classList.add('hidden');
    });
  });

  // 1. Add Memory Modal Triggers
  const openAddMemBtn = document.getElementById('btn-open-add-memory');
  const modalAddMem = document.getElementById('modal-add-memory');
  const formAddMem = document.getElementById('form-add-memory');

  if (openAddMemBtn) {
    openAddMemBtn.onclick = () => {
      audioSynth.playButtonClick();
      modalAddMem.classList.remove('hidden');
    };
  }

  if (formAddMem) {
    formAddMem.onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById('mem-title').value;
      const category = document.getElementById('mem-category').value;
      const story = document.getElementById('mem-story').value;
      const date = document.getElementById('mem-date').value;
      const addedBy = document.getElementById('mem-addedby').value;

      saveMemory({ title, category, story, date, addedBy });
      renderTimeline('all');
      modalAddMem.classList.add('hidden');
      formAddMem.reset();
      triggerConfettiBurst();
      alert("✨ Memory added successfully to Khushi's Memory Keeper!");
    };
  }

  // 2. Add Wish Modal Triggers
  const openAddWishBtn = document.getElementById('btn-open-add-wish');
  const modalAddWish = document.getElementById('modal-add-wish');
  const formAddWish = document.getElementById('form-add-wish');

  if (openAddWishBtn) {
    openAddWishBtn.onclick = () => {
      audioSynth.playButtonClick();
      modalAddWish.classList.remove('hidden');
    };
  }

  if (formAddWish) {
    formAddWish.onsubmit = (e) => {
      e.preventDefault();
      const sender = document.getElementById('wish-sender').value;
      const relation = document.getElementById('wish-relation').value;
      const message = document.getElementById('wish-message').value;

      currentWishes.unshift({
        id: "w-" + Date.now(),
        sender,
        relation,
        message,
        audioNote: `Happy Birthday from ${sender}!`,
        likes: 1,
        date: "Just now"
      });

      renderWishesWall();
      modalAddWish.classList.add('hidden');
      formAddWish.reset();
      triggerConfettiBurst();
    };
  }
}

// Lightbox Trigger
window.openLightbox = function(url, title, caption) {
  audioSynth.playButtonClick();
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox-title').textContent = title;
  document.getElementById('lightbox-caption').textContent = caption;
  document.getElementById('lightbox-date').textContent = "Memory Archive";
  document.getElementById('modal-photo-lightbox').classList.remove('hidden');
};

/* ==================== SECRET BIRTHDAY CAKE VAULT ==================== */
function initSurpriseVault() {
  const surpriseBtn = document.getElementById('btn-quick-surprise');
  const vaultModal = document.getElementById('modal-surprise-vault');
  const stepLocked = document.getElementById('surprise-step-locked');
  const stepUnlocked = document.getElementById('surprise-step-unlocked');
  const feedback = document.getElementById('unlock-feedback');
  const answerBtns = document.querySelectorAll('.answer-btn');

  if (surpriseBtn) {
    surpriseBtn.onclick = () => {
      audioSynth.playButtonClick();
      vaultModal.classList.remove('hidden');
    };
  }

  // Question Answer Handler
  answerBtns.forEach(btn => {
    btn.onclick = () => {
      const type = btn.getAttribute('data-ans');
      if (type === 'correct') {
        audioSynth.playTone(800, 0.3, 'sine', 0.1);
        feedback.style.color = '#27ae60';
        feedback.textContent = "🎉 Bingo! You unlocked Khushi's Secret Birthday Vault!";
        triggerConfettiBurst();

        setTimeout(() => {
          stepLocked.classList.add('hidden');
          stepUnlocked.classList.remove('hidden');
        }, 800);
      } else {
        audioSynth.playTone(200, 0.2, 'sawtooth', 0.08);
        feedback.style.color = '#e74c3c';
        feedback.textContent = "❌ Oops! That's not Khushi's favorite sweet. Try again!";
      }
    };
  });

  // Candle Blowing & Cake Cutting Logic
  const blowBtn = document.getElementById('btn-blow-candles');
  const cutBtn = document.getElementById('btn-cut-cake');
  const candlesOverlay = document.getElementById('candles-overlay');
  const letter = document.getElementById('secret-family-letter');

  if (blowBtn) {
    blowBtn.onclick = () => {
      audioSynth.playCandleBlowSFX();
      candlesOverlay.classList.add('candles-extinguished');
      candlesBlown = true;
      blowBtn.textContent = "✨ Candles Extinguished!";
      blowBtn.disabled = true;
      cutBtn.classList.remove('disabled');
      cutBtn.disabled = false;
      triggerConfettiBurst();
    };
  }

  if (cutBtn) {
    cutBtn.onclick = () => {
      if (!candlesBlown) return;
      audioSynth.playTone(880, 0.5, 'sine', 0.12);
      triggerConfettiBurst();
      letter.classList.remove('hidden');
      cutBtn.textContent = "🎂 Cake Cut & Shared with Love!";
      cutBtn.disabled = true;
    };
  }
}

/* ==================== AUDIO CONTROLS ==================== */
function initAudioControls() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  const statusText = document.getElementById('audio-status-text');

  if (audioBtn) {
    audioBtn.onclick = () => {
      const isMuted = audioSynth.toggleMute();
      if (isMuted) {
        audioBtn.classList.add('muted');
        statusText.textContent = "Music OFF";
      } else {
        audioBtn.classList.remove('muted');
        statusText.textContent = "Music ON";
      }
    };
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

/* ==================== KHUSHI'S BIRTHDAY QUEST GAME CONTROLLER ==================== */
function initBirthdayQuestGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  const scoreEl = document.getElementById('game-score');
  const levelNameEl = document.getElementById('game-level-name');
  const livesEl = document.getElementById('game-lives');
  const timerEl = document.getElementById('game-timer');
  const powerupBadge = document.getElementById('game-powerup-badge');
  const powerupIcon = document.getElementById('powerup-icon');
  const powerupLabel = document.getElementById('powerup-label');

  const startOverlay = document.getElementById('game-start-overlay');
  const pauseOverlay = document.getElementById('game-pause-overlay');
  const levelwinOverlay = document.getElementById('game-levelwin-overlay');
  const gameoverOverlay = document.getElementById('game-over-overlay');
  const celebrationModal = document.getElementById('modal-final-celebration');

  // Initialize Canvas Game Engine
  gameInstance = new BirthdayQuestGame(canvas, {
    onStateChange: (state, info) => {
      // Update HUD
      if (scoreEl) scoreEl.textContent = info.score || 0;
      if (livesEl && info.lives !== undefined) {
        livesEl.textContent = "💖".repeat(Math.max(0, info.lives)) || "🖤";
      }
      if (levelNameEl && info.level) {
        const names = [
          "Level 1: Balloon Garden 🎈",
          "Level 2: Candy Cloud Kingdom ☁️",
          "Level 3: Starry Birthday Night ⭐"
        ];
        levelNameEl.textContent = names[info.level - 1] || `Level ${info.level}`;
      }

      // Update Power-up badge
      if (gameInstance.player.powerUp) {
        powerupBadge.classList.remove('hidden');
        const p = gameInstance.player.powerUp;
        powerupIcon.textContent = p === 'wings' ? '🌈' : p === 'speed' ? '⚡' : p === 'magnet' ? '🧲' : '🛡️';
        powerupLabel.textContent = `${p.toUpperCase()} (${gameInstance.player.powerUpTime}s)`;
      } else {
        powerupBadge.classList.add('hidden');
      }

      // Handle Overlay Visibilities
      pauseOverlay.classList.toggle('hidden', state !== 'PAUSED');
      gameoverOverlay.classList.toggle('hidden', state !== 'GAME_OVER');

      if (state === 'LEVEL_WIN') {
        levelwinOverlay.classList.remove('hidden');
        triggerConfettiBurst();
        const levelMsg = document.getElementById('levelwin-msg');
        if (levelMsg) {
          levelMsg.textContent = `Woohoo! Level ${info.level} complete! Score: ${info.score} pts 🎉`;
        }
      } else {
        levelwinOverlay.classList.add('hidden');
      }
    },
    onFinalCelebration: (results) => {
      // Open Final Celebration Modal on Level 3 Completion!
      if (celebrationModal) {
        celebrationModal.classList.remove('hidden');
      }
      audioSynth.playVictorySong();
      triggerConfettiBurst();
      setTimeout(triggerConfettiBurst, 800);
      setTimeout(triggerConfettiBurst, 1600);

      const statsEl = document.getElementById('celebration-stats');
      if (statsEl) {
        statsEl.textContent = `🌟 Final Score: ${results.score} points | Total Time: ${results.time}s 🌟`;
      }

      // Start Fireworks Canvas Animation
      initCelebrationFireworks();
    }
  });

  // HUD Timer Update Interval
  setInterval(() => {
    if (gameInstance && gameInstance.state === 'PLAYING' && timerEl) {
      timerEl.textContent = `${gameInstance.levelTime}s`;
    }
  }, 500);

  // Button Handlers
  const startBtn = document.getElementById('btn-start-game');
  if (startBtn) {
    startBtn.onclick = () => {
      startOverlay.classList.add('hidden');
      gameInstance.startLevel(0);
    };
  }

  const pauseBtn = document.getElementById('btn-game-pause');
  if (pauseBtn) {
    pauseBtn.onclick = () => gameInstance.togglePause();
  }

  const resumeBtn = document.getElementById('btn-resume-game');
  if (resumeBtn) {
    resumeBtn.onclick = () => gameInstance.togglePause();
  }

  const restartBtn = document.getElementById('btn-restart-level');
  if (restartBtn) {
    restartBtn.onclick = () => {
      pauseOverlay.classList.add('hidden');
      gameInstance.startLevel(gameInstance.currentLevelIndex);
    };
  }

  const nextLevelBtn = document.getElementById('btn-next-level');
  if (nextLevelBtn) {
    nextLevelBtn.onclick = () => {
      levelwinOverlay.classList.add('hidden');
      gameInstance.startLevel(gameInstance.currentLevelIndex + 1);
    };
  }

  const retryBtn = document.getElementById('btn-retry-game');
  if (retryBtn) {
    retryBtn.onclick = () => {
      gameoverOverlay.classList.add('hidden');
      gameInstance.score = 0;
      gameInstance.lives = 3;
      gameInstance.startLevel(0);
    };
  }

  // Mobile Touch Controls
  const setupTouchBtn = (id, dir) => {
    const btn = document.getElementById(id);
    if (!btn) return;

    const startHandler = (e) => {
      e.preventDefault();
      btn.classList.add('active');
      gameInstance.setControlState(dir, true);
    };

    const endHandler = (e) => {
      e.preventDefault();
      btn.classList.remove('active');
      gameInstance.setControlState(dir, false);
    };

    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
    btn.addEventListener('mouseleave', endHandler);
  };

  setupTouchBtn('btn-touch-left', 'left');
  setupTouchBtn('btn-touch-right', 'right');
  setupTouchBtn('btn-touch-jump', 'jump');

  // Final Celebration Modal Buttons
  const playAgainBtn = document.getElementById('btn-celebration-play-again');
  if (playAgainBtn) {
    playAgainBtn.onclick = () => {
      if (celebrationModal) celebrationModal.classList.add('hidden');
      gameInstance.score = 0;
      gameInstance.lives = 3;
      gameInstance.startLevel(0);
    };
  }

  const galleryBtn = document.getElementById('btn-celebration-gallery');
  if (galleryBtn) {
    galleryBtn.onclick = () => {
      if (celebrationModal) celebrationModal.classList.add('hidden');
      switchToTab('tab-gallery');
    };
  }
}

/* ==================== CELEBRATION FIREWORKS SIMULATION ==================== */
function initCelebrationFireworks() {
  const canvas = document.getElementById('celebration-fireworks-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const particles = [];
  const colors = ['#f472b6', '#a78bfa', '#38bdf8', '#fde047', '#4ade80', '#fbbf24'];

  function createFirework() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.5) + 40;
    const count = 40;
    const color = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const speed = Math.random() * 4 + 2;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: Math.random() * 3 + 2
      });
    }
  }

  // Spawn fireworks
  const interval = setInterval(createFirework, 400);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.alpha -= 0.015;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const modal = document.getElementById('modal-final-celebration');
    if (modal && !modal.classList.contains('hidden')) {
      requestAnimationFrame(animate);
    } else {
      clearInterval(interval);
    }
  }

  createFirework();
  animate();
}

