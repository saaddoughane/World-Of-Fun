document.addEventListener("DOMContentLoaded", () => {
  const SESSION_KEY = "gw_session";
  const HI_SCORES_KEY = "snakeSaharaHiScores";

  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  if (!session) {
    window.location.href = "../../auth.html";
    return;
  }

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const btnRetour = document.getElementById("btnRetour");
  const joystick = document.getElementById("joystick");
  const joystickKnob = document.getElementById("joystickKnob");

  const GAME = {
    MENU: "MENU",
    PLAYING: "PLAYING",
    LEVEL_COMPLETE: "LEVEL_COMPLETE",
    GAME_OVER: "GAME_OVER",
    HI_SCORES: "HI_SCORES",
    VICTORY: "VICTORY"
  };

  const LEVELS = {
    1: { target: 10, cactusMax: 3, cactusSpawnMs: 3500, oasisSpawnMs: 12000, relicSpawnMs: 15000 },
    2: { target: 15, cactusMax: 5, cactusSpawnMs: 2800, oasisSpawnMs: 11000, relicSpawnMs: 14000 },
    3: { target: 20, cactusMax: 7, cactusSpawnMs: 2200, oasisSpawnMs: 10000, relicSpawnMs: 13000 }
  };

  const ASSET_PATHS = {
    desert: "./assets/desert-bg.jpg",
    cobraHead: "./assets/cobra-head.png",
    scarab: "./assets/scarabee.png",
    cactus: "./assets/cactus.png",
    oasis: "./assets/oasis.png",
    relic: "./assets/relic.png"
  };

  const assets = {
    desert: new Image(),
    cobraHead: new Image(),
    scarab: new Image(),
    cactus: new Image(),
    oasis: new Image(),
    relic: new Image()
  };

  Object.entries(ASSET_PATHS).forEach(([key, path]) => {
    assets[key].src = path;
  });

  let gameState = GAME.MENU;
  let level = 1;
  let score = 0;
  let lives = 3;
  let levelScore = 0;
  let hiScores = [];

  let runSaved = false;

  let snake = null;
  let scarab = null;
  let cacti = [];
  let oasis = null;
  let relic = null;

  let currentTime = 0;
  let lastCactusSpawn = 0;
  let lastOasisSpawn = 0;
  let lastRelicSpawn = 0;

  const keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  const pointer = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    active: false
  };

  const joystickState = {
    active: false,
    dx: 0,
    dy: 0
  };

  function resetRun() {
    level = 1;
    score = 0;
    lives = 3;
    levelScore = 0;
    runSaved = false;
    initLevel(level);
  }

  function initLevel(levelNumber) {
    const cfg = LEVELS[levelNumber];
    level = levelNumber;
    levelScore = 0;
    cacti = [];
    oasis = null;
    relic = null;

    snake = createSnake();
    scarab = spawnScarab();

    lastCactusSpawn = currentTime;
    lastOasisSpawn = currentTime;
    lastRelicSpawn = currentTime;
  }

  function createSnake() {
    const startX = canvas.width * 0.28;
    const startY = canvas.height * 0.55;
    const headRadius = 16;

    return {
      x: startX,
      y: startY,
      angle: 0,
      targetAngle: 0,
      speed: 2.35,
      headRadius,
      spacing: 12,
      bodyCount: 5,
      growthPending: 0,
      trail: [],
      invincibleUntil: 0,
      damageCooldownUntil: 0
    };
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function safePointAwayFromSnake(radius = 18) {
    let attempts = 0;
    while (attempts < 200) {
      const x = rand(50, canvas.width - 50);
      const y = rand(70, canvas.height - 50);

      const tooCloseHead = dist(x, y, snake.x, snake.y) < 90;
      const tooCloseScarab = scarab && dist(x, y, scarab.x, scarab.y) < 55;
      const tooCloseCactus = cacti.some(c => dist(x, y, c.x, c.y) < (radius + c.radius + 20));
      const tooCloseOasis = oasis && dist(x, y, oasis.x, oasis.y) < 60;
      const tooCloseRelic = relic && dist(x, y, relic.x, relic.y) < 60;

      if (!tooCloseHead && !tooCloseScarab && !tooCloseCactus && !tooCloseOasis && !tooCloseRelic) {
        return { x, y };
      }
      attempts++;
    }

    return { x: rand(60, canvas.width - 60), y: rand(80, canvas.height - 60) };
  }

  function spawnScarab() {
    const p = safePointAwayFromSnake(12);
    return { x: p.x, y: p.y, radius: 12 };
  }

  function spawnCactus() {
    const p = safePointAwayFromSnake(18);
    return {
      x: p.x,
      y: p.y,
      radius: 18
    };
  }

  function spawnOasis() {
    const p = safePointAwayFromSnake(16);
    return {
      x: p.x,
      y: p.y,
      radius: 16,
      expiresAt: currentTime + 8000
    };
  }

  function spawnRelic() {
    const p = safePointAwayFromSnake(14);
    return {
      x: p.x,
      y: p.y,
      radius: 14,
      expiresAt: currentTime + 7000
    };
  }

  function loadHiScores() {
    try {
      hiScores = JSON.parse(localStorage.getItem(HI_SCORES_KEY)) || [];
    } catch {
      hiScores = [];
    }
  }

  function saveLocalHiScore(newScore) {
    const date = new Date().toLocaleDateString("fr-FR");
    hiScores.push({ score: newScore, date });
    hiScores.sort((a, b) => b.score - a.score);
    hiScores = hiScores.slice(0, 5);
    localStorage.setItem(HI_SCORES_KEY, JSON.stringify(hiScores));
  }

  function saveRunIfNeeded() {
    if (runSaved || score <= 0) return;
    runSaved = true;
    saveLocalHiScore(score);
    if (typeof saveScore === "function") {
      saveScore("snake", score);
    }
  }

  function resetToMenu() {
    gameState = GAME.MENU;
    resetRun();
  }

  function damageSnake() {
    if (currentTime < snake.damageCooldownUntil) return;
    if (currentTime < snake.invincibleUntil) return;

    lives -= 1;
    snake.damageCooldownUntil = currentTime + 1200;

    if (lives <= 0) {
      saveRunIfNeeded();
      gameState = GAME.GAME_OVER;
    }
  }

  function updateTargetAngle() {
    let hasKeyboardDirection = false;
    let dx = 0;
    let dy = 0;

    if (keys.up) { dy -= 1; hasKeyboardDirection = true; }
    if (keys.down) { dy += 1; hasKeyboardDirection = true; }
    if (keys.left) { dx -= 1; hasKeyboardDirection = true; }
    if (keys.right) { dx += 1; hasKeyboardDirection = true; }

    if (joystickState.active && (Math.abs(joystickState.dx) > 0.08 || Math.abs(joystickState.dy) > 0.08)) {
      snake.targetAngle = Math.atan2(joystickState.dy, joystickState.dx);
      return;
    }

    if (hasKeyboardDirection) {
      snake.targetAngle = Math.atan2(dy, dx);
      return;
    }

    if (pointer.active) {
      snake.targetAngle = angleBetween(snake.x, snake.y, pointer.x, pointer.y);
    }
  }

  function updateSnake() {
    updateTargetAngle();

    const diff = normalizeAngle(snake.targetAngle - snake.angle);
    snake.angle += diff * 0.12;

    snake.x += Math.cos(snake.angle) * snake.speed;
    snake.y += Math.sin(snake.angle) * snake.speed;

    snake.trail.unshift({ x: snake.x, y: snake.y });

    const maxTrailLength = (snake.bodyCount + snake.growthPending + 12) * snake.spacing;
    while (snake.trail.length > maxTrailLength) {
      snake.trail.pop();
    }

    if (snake.growthPending > 0) {
      snake.bodyCount += snake.growthPending;
      snake.growthPending = 0;
    }
  }

  function checkWallCollision() {
    if (
      snake.x - snake.headRadius <= 0 ||
      snake.x + snake.headRadius >= canvas.width ||
      snake.y - snake.headRadius <= 0 ||
      snake.y + snake.headRadius >= canvas.height
    ) {
      saveRunIfNeeded();
      gameState = GAME.GAME_OVER;
    }
  }

    function checkSelfCollision() {
        const ignoreSegments = snake.bodyCount * snake.spacing * 0.6;

        for (let i = ignoreSegments; i < snake.trail.length; i += snake.spacing) {
            const part = snake.trail[i];
            if (!part) continue;

            const d = dist(snake.x, snake.y, part.x, part.y);

            // seuil plus strict
            if (d < snake.headRadius * 0.75) {
            saveRunIfNeeded();
            gameState = GAME.GAME_OVER;
            return;
            }
        }
    }
  function checkScarabCollision() {
    if (dist(snake.x, snake.y, scarab.x, scarab.y) < snake.headRadius + scarab.radius) {
      score += 1;
      levelScore += 1;
      snake.growthPending += 1;
      scarab = spawnScarab();

      if (levelScore >= LEVELS[level].target) {
        if (level < 3) {
          gameState = GAME.LEVEL_COMPLETE;
        } else {
          saveRunIfNeeded();
          gameState = GAME.VICTORY;
        }
      }
    }
  }

  function checkCactusCollision() {
    for (let i = cacti.length - 1; i >= 0; i--) {
      const c = cacti[i];
      if (dist(snake.x, snake.y, c.x, c.y) < snake.headRadius + c.radius) {
        if (currentTime < snake.invincibleUntil) {
          continue;
        }
        cacti.splice(i, 1);
        damageSnake();
        return;
      }
    }
  }

  function checkOasisCollision() {
    if (!oasis) return;
    if (dist(snake.x, snake.y, oasis.x, oasis.y) < snake.headRadius + oasis.radius) {
      lives = Math.min(3, lives + 1);
      oasis = null;
    }
  }

  function checkRelicCollision() {
    if (!relic) return;
    if (dist(snake.x, snake.y, relic.x, relic.y) < snake.headRadius + relic.radius) {
      snake.invincibleUntil = currentTime + 3000;
      relic = null;
    }
  }

  function spawnLevelObjects() {
    const cfg = LEVELS[level];

    if (level === 1) return;

    if (level >= 2) {
        if (cacti.length < cfg.cactusMax && currentTime - lastCactusSpawn > cfg.cactusSpawnMs) {
        cacti.push(spawnCactus());
        lastCactusSpawn = currentTime;
        }

        if (!relic && currentTime - lastRelicSpawn > cfg.relicSpawnMs) {
        relic = spawnRelic();
        lastRelicSpawn = currentTime;
        }
    }

    if (level >= 3) {
        if (!oasis && currentTime - lastOasisSpawn > cfg.oasisSpawnMs) {
        oasis = spawnOasis();
        lastOasisSpawn = currentTime;
        }
    }

    if (oasis && currentTime > oasis.expiresAt) oasis = null;
    if (relic && currentTime > relic.expiresAt) relic = null;
    }

  function updatePlaying() {
    updateSnake();
    spawnLevelObjects();
    checkWallCollision();
    if (gameState !== GAME.PLAYING) return;

    checkSelfCollision();
    if (gameState !== GAME.PLAYING) return;

    checkCactusCollision();
    if (gameState !== GAME.PLAYING) return;

    checkOasisCollision();
    checkRelicCollision();
    checkScarabCollision();
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#f3d489");
    grad.addColorStop(0.55, "#e7b866");
    grad.addColorStop(1, "#c9863f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // dunes
    ctx.fillStyle = "rgba(255, 230, 170, 0.26)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const y = 360 + i * 45;
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 60) {
        ctx.quadraticCurveTo(x + 30, y - 20 - i * 3, x + 60, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
    }

    // sun
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 244, 196, 0.55)";
    ctx.arc(canvas.width - 120, 90, 48, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMenu() {
    drawBackground();

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#6a3d1f";
    ctx.font = "bold 42px Fredoka, Montserrat";
    ctx.fillText("GUIDE LE COBRA DANS LE SAHARA", canvas.width / 2, 80);

    ctx.fillStyle = "#fff7e4";
    ctx.font = "600 24px Fredoka, Montserrat";
    ctx.fillText("Mange les scarabées, évite les cactus, survie aux 3 niveaux.", canvas.width / 2, 125);

    drawBigCobraPreview();

    drawPlayButton(canvas.width / 2 - 120, 430, 240, 62, "Jouer");
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "500 17px Fredoka, Montserrat";
    ctx.fillText("ESPACE / clic pour commencer • ESC pour les scores", canvas.width / 2, 530);

    ctx.restore();
  }

  function drawBigCobraPreview() {
    const cx = canvas.width / 2;
    const cy = 265;

    ctx.save();
    ctx.lineCap = "round";

    for (let i = 0; i < 10; i++) {
      const x = cx - i * 28;
      const y = cy + Math.sin(i * 0.6) * 22;
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? "#3f6b2a" : "#567f36";
      ctx.arc(x, y, 18 - i * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // tête
    ctx.beginPath();
    ctx.fillStyle = "#325a21";
    ctx.ellipse(cx + 28, cy, 28, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#f2d27b";
    ctx.ellipse(cx + 34, cy + 4, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx + 38, cy - 5, 4, 0, Math.PI * 2);
    ctx.arc(cx + 48, cy - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.arc(cx + 38, cy - 5, 2, 0, Math.PI * 2);
    ctx.arc(cx + 48, cy - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d45a3c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy + 4);
    ctx.lineTo(cx + 70, cy + 10);
    ctx.moveTo(cx + 70, cy + 10);
    ctx.lineTo(cx + 80, cy + 5);
    ctx.moveTo(cx + 70, cy + 10);
    ctx.lineTo(cx + 80, cy + 15);
    ctx.stroke();

    ctx.restore();
  }

  function drawPlayButton(x, y, w, h, text) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, "rgba(255,244,214,0.96)");
    grad.addColorStop(1, "rgba(255,223,160,0.90)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 30);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#6a3d1f";
    ctx.font = "bold 28px Fredoka, Montserrat";
    ctx.textAlign = "center";
    ctx.fillText(text, x + w / 2, y + 40);
  }

  function drawHUD() {
    ctx.save();

    ctx.fillStyle = "rgba(93, 52, 26, 0.84)";
    ctx.fillRect(0, 0, canvas.width, 54);

    ctx.fillStyle = "#fff3d4";
    ctx.font = "bold 20px Fredoka, Montserrat";
    ctx.textAlign = "center";

    const zone1 = canvas.width * 0.12;
    const zone2 = canvas.width * 0.34;
    const zone3 = canvas.width * 0.56;
    const zone4 = canvas.width * 0.82;

    ctx.fillText("Score : " + score, zone1, 34);
    ctx.fillText("Niveau : " + level, zone2, 34);
    ctx.fillText("Vies : " + lives, zone3, 34);
    ctx.fillText("Objectif : " + levelScore + "/" + LEVELS[level].target, zone4, 34);

    if (currentTime < snake.invincibleUntil) {
      ctx.fillStyle = "#fff19d";
      ctx.font = "bold 18px Fredoka, Montserrat";
      ctx.fillText("INVINCIBLE", canvas.width / 2, 82);
    }

    ctx.restore();
  }

  function drawScarab(s) {
    ctx.save();
    ctx.translate(s.x, s.y);

    ctx.fillStyle = "#2e2b4f";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#5f58a6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 14);
    ctx.moveTo(-10, -6);
    ctx.lineTo(-18, -12);
    ctx.moveTo(10, -6);
    ctx.lineTo(18, -12);
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, 0);
    ctx.moveTo(10, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(-10, 6);
    ctx.lineTo(-18, 12);
    ctx.moveTo(10, 6);
    ctx.lineTo(18, 12);
    ctx.stroke();

    ctx.restore();
  }

  function drawCactus(c) {
    ctx.save();
    ctx.translate(c.x, c.y);

    ctx.fillStyle = "#3f8e3f";
    ctx.beginPath();
    ctx.roundRect(-8, -22, 16, 44, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(-20, -8, 10, 24, 7);
    ctx.roundRect(10, -16, 10, 22, 7);
    ctx.fill();

    ctx.restore();
  }

  function drawOasis(o) {
    ctx.save();
    ctx.translate(o.x, o.y);

    ctx.fillStyle = "#2fbdd5";
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4b8d34";
    ctx.beginPath();
    ctx.arc(-10, -10, 5, 0, Math.PI * 2);
    ctx.arc(12, -9, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawRelic(r) {
    ctx.save();
    ctx.translate(r.x, r.y);

    ctx.fillStyle = "#ffe680";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#fff7cc";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  function drawSnake() {
    ctx.save();
    ctx.lineCap = "round";

    for (let i = snake.bodyCount; i >= 1; i--) {
      const idx = i * snake.spacing;
      const part = snake.trail[idx];
      if (!part) continue;

      const radius = Math.max(7, snake.headRadius - i * 0.45);
      ctx.beginPath();
      ctx.fillStyle = i % 2 === 0 ? "#4f7c2f" : "#648f3d";
      ctx.arc(part.x, part.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(snake.x, snake.y);
    ctx.rotate(snake.angle);

    // tête
    ctx.beginPath();
    ctx.fillStyle = "#375f24";
    ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#e8cd7f";
    ctx.ellipse(4, 3, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(6, -4, 3.6, 0, Math.PI * 2);
    ctx.arc(13, -4, 3.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.arc(6, -4, 1.8, 0, Math.PI * 2);
    ctx.arc(13, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // langue
    ctx.strokeStyle = "#d45544";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(18, 3);
    ctx.lineTo(30, 6);
    ctx.moveTo(30, 6);
    ctx.lineTo(37, 2);
    ctx.moveTo(30, 6);
    ctx.lineTo(37, 10);
    ctx.stroke();

    if (currentTime < snake.invincibleUntil) {
      ctx.strokeStyle = "rgba(255,245,170,0.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawPlaying() {
    drawBackground();
    drawHUD();

    cacti.forEach(drawCactus);
    if (oasis) drawOasis(oasis);
    if (relic) drawRelic(relic);
    if (scarab) drawScarab(scarab);
    drawSnake();
  }

  function drawLevelComplete() {
    drawPlaying();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.60)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cardX = 120;
    const cardY = 150;
    const cardW = canvas.width - 240;
    const cardH = 290;

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 26);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffeab8";
    ctx.font = "bold 52px Fredoka, Montserrat";
    ctx.fillText(`NIVEAU ${level} TERMINÉ`, canvas.width / 2, 225);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 30px Fredoka, Montserrat";
    ctx.fillText(`Score : ${score}`, canvas.width / 2, 295);
    ctx.fillText(`Scarabées : ${levelScore}`, canvas.width / 2, 340);

    ctx.fillStyle = "#fff2c8";
    ctx.font = "600 22px Fredoka, Montserrat";
    ctx.fillText("ESPACE pour continuer", canvas.width / 2, 395);

    ctx.restore();
  }

  function drawGameOver() {
    drawPlaying();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffb095";
    ctx.font = "bold 62px Fredoka, Montserrat";
    ctx.fillText("GAME OVER", canvas.width / 2, 210);

    ctx.fillStyle = "#fff";
    ctx.font = "600 30px Fredoka, Montserrat";
    ctx.fillText(`Score final : ${score}`, canvas.width / 2, 285);
    ctx.fillText(`Niveau atteint : ${level}`, canvas.width / 2, 330);

    ctx.fillStyle = "#ffeab8";
    ctx.font = "600 22px Fredoka, Montserrat";
    ctx.fillText("ESPACE pour rejouer", canvas.width / 2, 395);
    ctx.fillText("ESC pour les meilleurs scores", canvas.width / 2, 430);
    ctx.restore();
  }

  function drawVictory() {
    drawPlaying();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.66)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe9a1";
    ctx.font = "bold 58px Fredoka, Montserrat";
    ctx.fillText("VICTOIRE TOTALE", canvas.width / 2, 210);

    ctx.fillStyle = "#fff";
    ctx.font = "600 30px Fredoka, Montserrat";
    ctx.fillText(`Score final : ${score}`, canvas.width / 2, 290);
    ctx.fillText("45 scarabées avalés à travers le désert", canvas.width / 2, 335);

    ctx.fillStyle = "#fff2c8";
    ctx.font = "600 22px Fredoka, Montserrat";
    ctx.fillText("ESPACE pour revenir au menu", canvas.width / 2, 400);

    ctx.restore();
  }

  function drawHiScores() {
    drawBackground();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe9a1";
    ctx.font = "bold 52px Fredoka, Montserrat";
    ctx.fillText("MEILLEURS SCORES", canvas.width / 2, 95);

    const cardX = 120;
    const cardY = 135;
    const cardW = canvas.width - 240;
    const cardH = 350;

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (hiScores.length === 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "600 26px Fredoka, Montserrat";
      ctx.fillText("Aucun score enregistré", canvas.width / 2, 305);
    } else {
      ctx.font = "600 24px Fredoka, Montserrat";
      hiScores.forEach((entry, index) => {
        ctx.fillStyle = index % 2 === 0 ? "#fff" : "#ffe5a8";
        ctx.fillText(`${entry.score} pts  -  ${entry.date}`, canvas.width / 2, 205 + index * 52);
      });
    }

    ctx.fillStyle = "#fff4d3";
    ctx.font = "600 20px Fredoka, Montserrat";
    ctx.fillText("ESPACE ou ESC pour revenir au menu", canvas.width / 2, 540);

    ctx.restore();
  }

  function draw() {
    switch (gameState) {
      case GAME.MENU:
        drawMenu();
        break;
      case GAME.PLAYING:
        drawPlaying();
        break;
      case GAME.LEVEL_COMPLETE:
        drawLevelComplete();
        break;
      case GAME.GAME_OVER:
        drawGameOver();
        break;
      case GAME.HI_SCORES:
        drawHiScores();
        break;
      case GAME.VICTORY:
        drawVictory();
        break;
    }
  }

  function update() {
    if (gameState === GAME.PLAYING) {
      updatePlaying();
    }
  }

  function gameLoop(time) {
    currentTime = time;
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function onSpace() {
    if (gameState === GAME.MENU) {
      resetRun();
      gameState = GAME.PLAYING;
      return;
    }

    if (gameState === GAME.LEVEL_COMPLETE) {
      initLevel(level + 1);
      gameState = GAME.PLAYING;
      return;
    }

    if (gameState === GAME.GAME_OVER) {
      resetRun();
      gameState = GAME.PLAYING;
      return;
    }

    if (gameState === GAME.VICTORY) {
      resetToMenu();
      return;
    }

    if (gameState === GAME.HI_SCORES) {
      resetToMenu();
    }
  }

  function onEscape() {
    if (gameState === GAME.PLAYING || gameState === GAME.GAME_OVER || gameState === GAME.LEVEL_COMPLETE || gameState === GAME.VICTORY) {
      gameState = GAME.HI_SCORES;
      return;
    }

    if (gameState === GAME.HI_SCORES) {
      resetToMenu();
    }
  }

  function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    pointer.x = (e.clientX - rect.left) * scaleX;
    pointer.y = (e.clientY - rect.top) * scaleY;
    pointer.active = true;

    if (gameState === GAME.MENU) {
      resetRun();
      gameState = GAME.PLAYING;
    }
  }

  function onCanvasMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    pointer.x = (e.clientX - rect.left) * scaleX;
    pointer.y = (e.clientY - rect.top) * scaleY;
    pointer.active = true;
  }

  function updateKeyState(code, isDown) {
    if (code === "ArrowUp" || code === "KeyW" || code === "KeyZ") keys.up = isDown;
    if (code === "ArrowDown" || code === "KeyS") keys.down = isDown;
    if (code === "ArrowLeft" || code === "KeyA" || code === "KeyQ") keys.left = isDown;
    if (code === "ArrowRight" || code === "KeyD") keys.right = isDown;
  }

  function resetJoystick() {
    joystickState.active = false;
    joystickState.dx = 0;
    joystickState.dy = 0;
    joystickKnob.style.left = "50%";
    joystickKnob.style.top = "50%";
    joystickKnob.style.transform = "translate(-50%, -50%)";
  }

  function handleJoystickPointer(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;

    const max = 36;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }

    joystickState.active = true;
    joystickState.dx = dx / max;
    joystickState.dy = dy / max;

    joystickKnob.style.left = `${50 + (dx / rect.width) * 100}%`;
    joystickKnob.style.top = `${50 + (dy / rect.height) * 100}%`;
    joystickKnob.style.transform = "translate(-50%, -50%)";
  }

  function bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        onSpace();
        return;
      }

      if (e.code === "Escape") {
        e.preventDefault();
        onEscape();
        return;
      }

      updateKeyState(e.code, true);
    });

    document.addEventListener("keyup", (e) => {
      updateKeyState(e.code, false);
    });

    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("mousemove", onCanvasMove);

    canvas.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      onCanvasClick(touch);
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      onCanvasMove(touch);
    }, { passive: true });

    btnRetour.addEventListener("click", () => {
      if (gameState === GAME.MENU) {
        window.location.href = "../../index.html";
        return;
      }

      saveRunIfNeeded();
      resetToMenu();
    });

    joystick.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleJoystickPointer(touch.clientX, touch.clientY);
    }, { passive: true });

    joystick.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleJoystickPointer(touch.clientX, touch.clientY);
    }, { passive: true });

    joystick.addEventListener("touchend", resetJoystick, { passive: true });
    joystick.addEventListener("touchcancel", resetJoystick, { passive: true });
  }

  loadHiScores();
  resetRun();
  bindEvents();
  requestAnimationFrame(gameLoop);
});