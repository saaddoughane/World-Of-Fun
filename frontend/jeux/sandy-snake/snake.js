document.addEventListener("DOMContentLoaded", () => {
  // Initialise tout le jeu apres le chargement du DOM.
  const SESSION_KEY = "gw_session";
  const HI_SCORES_KEY = "snakeSaharaHiScores";
  let DEBUG_HITBOX = false;

  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    session = null;
  }
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

  // Decrit les objectifs et les rythmes d'apparition de chaque niveau.
  const LEVELS = {
    1: { target: 10, cactusMax: 3, cactusSpawnMs: 3500, oasisSpawnMs: 12000, relicSpawnMs: 15000 },
    2: { target: 15, cactusMax: 5, cactusSpawnMs: 2800, oasisSpawnMs: 11000, relicSpawnMs: 14000 },
    3: { target: 20, cactusMax: 7, cactusSpawnMs: 2200, oasisSpawnMs: 10000, relicSpawnMs: 13000 }
  };

  // Centralise les chemins des assets du jeu.
  const ASSET_PATHS = {
    desert: "./assets/desert-bg.jpg",
    cobraHead: "./assets/cobra-head.png",
    body: "./assets/body.png",
    tail: "./assets/tail.png",
    scarab: "./assets/scarabee.png",
    cactus: "./assets/cactus.png",
    oasis: "./assets/oasis.png",
    relic: "./assets/relic.png"
  };

  // Prepare les images chargees en memoire.
  const assets = {
    desert: new Image(),
    cobraHead: new Image(),
    body: new Image(),
    tail: new Image(),
    scarab: new Image(),
    cactus: new Image(),
    oasis: new Image(),
    relic: new Image()
  };
  const backgroundMusic = new Audio("./assets/sounds/desert-bg.wav");
  let hasUnlockedAudio = false;

  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.09;
  backgroundMusic.preload = "auto";

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

  // Reinitialise toute la progression d'une partie complete.
  function resetRun() {
    level = 1;
    score = 0;
    lives = 3;
    levelScore = 0;
    runSaved = false;
    initLevel(level);
  }

  // Prepare les objets et les compteurs d'un niveau.
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

  // Cree l'etat initial du serpent joueur.
  function createSnake() {
    const startX = canvas.width * 0.28;
    const startY = canvas.height * 0.55;
    const headRadius = 25;

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

  // Ramene un angle dans l'intervalle utile des rotations.
  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  // Calcule l'angle entre deux points.
  function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  // Calcule une distance euclidienne entre deux points.
  function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  // Tire un flottant aleatoire dans un intervalle.
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Tire un entier aleatoire dans un intervalle.
  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  // Cherche un point libre pour les objets du niveau.
  function safePointAwayFromSnake(radius = 18) {
    let attempts = 0;
    while (attempts < 200) {
      const x = rand(50, canvas.width - 50);
      const y = rand(70, canvas.height - 50);

      // Les marges eviten une apparition trop proche du joueur ou d'un autre objet.
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

  // Fait apparaitre un scarabee dans une zone sure.
  function spawnScarab() {
    const p = safePointAwayFromSnake(12);
    return { x: p.x, y: p.y, radius: 12 };
  }

  // Fait apparaitre un cactus dans une zone sure.
  function spawnCactus() {
    const p = safePointAwayFromSnake(18);
    return {
      x: p.x,
      y: p.y,
      radius: 18
    };
  }

  // Fait apparaitre une oasis temporaire.
  function spawnOasis() {
    const p = safePointAwayFromSnake(16);
    return {
      x: p.x,
      y: p.y,
      radius: 16,
      expiresAt: currentTime + 8000
    };
  }

  // Fait apparaitre une relique temporaire.
  function spawnRelic() {
    const p = safePointAwayFromSnake(14);
    return {
      x: p.x,
      y: p.y,
      radius: 14,
      expiresAt: currentTime + 7000
    };
  }

  // Charge les meilleurs scores locaux du jeu.
  function loadHiScores() {
    try {
      hiScores = JSON.parse(localStorage.getItem(HI_SCORES_KEY)) || [];
    } catch {
      hiScores = [];
    }
  }

  // Sauvegarde un score dans le top local du jeu.
  function saveLocalHiScore(newScore) {
    const date = new Date().toLocaleDateString("fr-FR");
    hiScores.push({ score: newScore, date });
    hiScores.sort((a, b) => b.score - a.score);
    hiScores = hiScores.slice(0, 5);
    localStorage.setItem(HI_SCORES_KEY, JSON.stringify(hiScores));
  }

  // Sauvegarde la partie une seule fois quand elle est valide.
  function saveRunIfNeeded() {
    if (runSaved || score <= 0) return;
    runSaved = true;
    saveLocalHiScore(score);
    if (typeof saveScore === "function") {
      saveScore("snake", score);
    }
  }

  // Revient au menu en reinitialisant la partie.
  function resetToMenu() {
    gameState = GAME.MENU;
    resetRun();
  }

  // Lance la musique de fond apres une action utilisateur.
  function startBackgroundMusic() {
    hasUnlockedAudio = true;

    if (!backgroundMusic.paused) return;

    backgroundMusic.play().catch(() => {
      hasUnlockedAudio = false;
    });
  }

  // Coupe proprement la musique de fond.
  function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }

  // Applique les degats et bascule en fin de partie si besoin.
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

  // Met a jour la direction voulue selon les controles actifs.
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

  // Avance le serpent et met a jour sa trainee.
  function updateSnake() {
    updateTargetAngle();

    // Le coefficient 0.12 lisse la rotation pour eviter les virages brusques.
    const diff = normalizeAngle(snake.targetAngle - snake.angle);
    snake.angle += diff * 0.12;

    snake.x += Math.cos(snake.angle) * snake.speed;
    snake.y += Math.sin(snake.angle) * snake.speed;

    snake.trail.unshift({ x: snake.x, y: snake.y });

    // La longueur max garde assez d'historique pour tous les segments du corps.
    const maxTrailLength = (snake.bodyCount + snake.growthPending + 12) * snake.spacing;
    while (snake.trail.length > maxTrailLength) {
      snake.trail.pop();
    }

    if (snake.growthPending > 0) {
      snake.bodyCount += snake.growthPending;
      snake.growthPending = 0;
    }
  }

  // Detecte une sortie des limites du terrain.
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

  // Calcule la distance minimale entre un point et un segment.
  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    return Math.hypot(px - xx, py - yy);
  }

  // Reconstruit les positions visibles des segments du corps.
  function getSnakeBodyPositions() {
    const bodyPositions = [];
    // Le facteur 0.42 garde des hitbox de corps plus fines que la tete.
    const bodyRadius = snake.headRadius * 0.42;

    for (let i = 1; i <= snake.bodyCount; i++) {
      // Le facteur 0.6 rapproche les segments pour suivre le rendu du corps.
      const idx = Math.floor(i * snake.spacing * 0.6);
      const part = snake.trail[idx];

      if (!part) continue;

      bodyPositions.push({
        x: part.x,
        y: part.y,
        radius: bodyRadius
      });
    }

    return bodyPositions;
  }

  // Detecte une collision entre la tete et le corps.
  function checkSelfCollision() {
    const bodyPositions = getSnakeBodyPositions();
    // On ignore les premiers segments et la queue pour eviter les faux positifs.
    const ignoredBodyParts = 3;
    const ignoredTailParts = 1;
    // La tete utilise une hitbox reduite pour coller au rendu visuel.
    const headCollisionRadius = snake.headRadius * 0.34;

    for (let i = ignoredBodyParts; i < bodyPositions.length - ignoredTailParts; i++) {
      const part = bodyPositions[i];
      const d = dist(snake.x, snake.y, part.x, part.y);
      const collisionRadius = headCollisionRadius + part.radius;

      if (d < collisionRadius) {
        saveRunIfNeeded();
        gameState = GAME.GAME_OVER;
        return;
      }

      if (DEBUG_HITBOX) {
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Gere la collecte du scarabee et la progression de niveau.
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

  // Gere les collisions avec les cactus.
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

  // Gere la collecte d'une oasis.
  function checkOasisCollision() {
    if (!oasis) return;
    if (dist(snake.x, snake.y, oasis.x, oasis.y) < snake.headRadius + oasis.radius) {
      lives = Math.min(3, lives + 1);
      oasis = null;
    }
  }

  // Gere la collecte d'une relique d'invincibilite.
  function checkRelicCollision() {
    if (!relic) return;
    if (dist(snake.x, snake.y, relic.x, relic.y) < snake.headRadius + relic.radius) {
      snake.invincibleUntil = currentTime + 3000;
      relic = null;
    }
  }

  // Fait apparaitre les objets du niveau selon les temporisations.
  function spawnLevelObjects() {
    const cfg = LEVELS[level];

    if (!cfg) return;

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

  // Met a jour toute la logique de jeu active.
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

  // Dessine le decor de fond du terrain.
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#f3d489");
    grad.addColorStop(0.55, "#e7b866");
    grad.addColorStop(1, "#c9863f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 230, 170, 0.26)";
    // Les vagues successives donnent une profondeur simple au sable.
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

    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 244, 196, 0.55)";
    ctx.arc(canvas.width - 120, 90, 48, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dessine l'ecran de menu principal.
  function drawMenu() {
    drawBackground();

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#6a3d1f";
    ctx.font = "bold 42px Changa";
    ctx.fillText("GUIDE LE COBRA DANS LE SAHARA", canvas.width / 2, 80);

    ctx.fillStyle = "#fff7e4";
    ctx.font = "600 24px Changa";
    ctx.fillText("Mange les scarabées, évite les cactus, survie aux 3 niveaux.", canvas.width / 2, 125);

    drawBigCobraPreview();

    drawPlayButton(canvas.width / 2 - 120, 430, 240, 62, "Jouer");
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "500 17px Changa";
    ctx.fillText("ESPACE / clic pour commencer • ESC pour les scores", canvas.width / 2, 530);

    ctx.restore();
  }

  // Affiche un grand cobra decoratif dans le menu.
  function drawBigCobraPreview() {
    const cx = canvas.width/1.45;
    const cy = 265;

    // L'espacement et l'onde sinusoidale donnent une courbe souple au corps.
    const spacing =35;
    const radius = 50;
    const segments = 12;

    for (let i = segments; i >= 1; i--) {
      const x = cx - i * spacing;
      const y = cy + Math.sin(i * 0.5) * 30;

      const size = radius * 2;

      ctx.save();
      ctx.translate(x, y);

      const nextX = cx - (i - 1) * spacing;
      const nextY = cy + Math.sin((i - 1) * 0.5) * 18;
      const angle = Math.atan2(nextY - y, nextX - x);
      ctx.rotate(angle - 0.9);

      if (i === segments) {
        if (assets.tail.complete) {
          ctx.drawImage(assets.tail, -size/1.45, -size/2, size, size);
        }
      } else {
        if (assets.body.complete) {
          ctx.drawImage(assets.body, -size/2, -size/2, size, size);
        }
      }

      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, cy);

    if (assets.cobraHead.complete) {
      ctx.scale(-1, 1);
      ctx.drawImage(
        assets.cobraHead,
        -radius,
        -radius * 1.2,
        radius * 2,
        radius * 2
      );
    }

    ctx.restore();
  }

  // Dessine un grand bouton de menu sur le canvas.
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
    ctx.font = "bold 28px Changa";
    ctx.textAlign = "center";
    ctx.fillText(text, x + w / 2, y + 40);
  }

  // Dessine le bandeau d'informations en haut du terrain.
  function drawHUD() {
    ctx.save();

    ctx.fillStyle = "rgba(93, 52, 26, 0.84)";
    ctx.fillRect(0, 0, canvas.width, 54);

    ctx.fillStyle = "#fff3d4";
    ctx.font = "bold 20px Changa";
    ctx.textAlign = "center";

    // Les zones repartissent les indicateurs a largeur relative du canvas.
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
      ctx.font = "bold 18px Changa";
      ctx.fillText("INVINCIBLE", canvas.width / 2, 82);
    }

    ctx.restore();
  }

  // Dessine le scarabee collectible.
  function drawScarab(s) {
    if (!assets.scarab.complete) return;

    ctx.drawImage(
      assets.scarab,
      s.x - s.radius,
      s.y - s.radius,
      s.radius * 2.5,
      s.radius * 2.5
    );
  }

  // Dessine un cactus obstacle.
  function drawCactus(c) {
    if (!assets.cactus.complete) return;

    ctx.drawImage(
      assets.cactus,
      c.x - c.radius,
      c.y - c.radius,
      c.radius * 2,
      c.radius * 2
    );
  }

  // Dessine une oasis de soin.
  function drawOasis(o) {
    if (!assets.oasis.complete) return;

    ctx.drawImage(
      assets.oasis,
      o.x - o.radius,
      o.y - o.radius,
      o.radius * 2,
      o.radius * 2
    );
  }

  // Dessine une relique d'invincibilite.
  function drawRelic(r) {
    if (!assets.relic.complete) return;

    ctx.drawImage(
      assets.relic,
      r.x - r.radius,
      r.y - r.radius,
      r.radius * 2,
      r.radius * 2
    );
  }

  // Dessine la tete et les segments du serpent.
  function drawSnake() {
    ctx.save();
    ctx.lineCap = "round";

    const bodyPositions = getSnakeBodyPositions();

    // Calcule l'orientation visuelle d'un segment selon ses voisins.
    function getBodyPartAngle(index) {
      const part = bodyPositions[index];
      const tailwardNeighbor = bodyPositions[index + 1];

      if (part && tailwardNeighbor) {
        return Math.atan2(tailwardNeighbor.y - part.y, tailwardNeighbor.x - part.x);
      }

      const headwardNeighbor = bodyPositions[index - 1];

      if (part && headwardNeighbor) {
        return Math.atan2(part.y - headwardNeighbor.y, part.x - headwardNeighbor.x);
      }

      return snake.angle;
    }

    for (let i = snake.bodyCount; i >= 1; i--) {
      const partIndex = i - 1;
      const part = bodyPositions[partIndex];
      if (!part) continue;

      const size = snake.headRadius * 2;

      ctx.save();
      ctx.translate(part.x, part.y);

      if (DEBUG_HITBOX) {
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, part.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.rotate(getBodyPartAngle(partIndex));

      if (i === snake.bodyCount) {
        if (assets.tail.complete && assets.tail.naturalWidth !== 0) {
          ctx.scale(-1, -1);

          ctx.drawImage(
            assets.tail,
            -size/1.5,
            -size/1.5,
            size * 1.2,
            size * 1.2
          );

          ctx.scale(-1, -1);
        }
      } else {
        if (assets.body.complete && assets.body.naturalWidth !== 0) {
          ctx.drawImage(
            assets.body,
            -size / 2,
            -size / 2,
            size,
            size
          );
        }
      }

      ctx.restore();
    }

    ctx.translate(snake.x, snake.y);
    ctx.rotate(snake.angle);

    if (assets.cobraHead.complete && assets.cobraHead.naturalWidth !== 0) {
      ctx.scale(-1, 1);
      
      ctx.drawImage(
        assets.cobraHead,
        -snake.headRadius,
        -snake.headRadius * 1.5,
        snake.headRadius * 2,
        snake.headRadius * 2
      );

      ctx.scale(-1, 1);
    } else {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(0, 0, snake.headRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (DEBUG_HITBOX) {
      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, snake.headRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (currentTime < snake.invincibleUntil) {
      ctx.strokeStyle = "rgba(255,245,170,0.95)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Dessine le terrain de jeu actif.
  function drawPlaying() {
    drawBackground();
    drawHUD();

    cacti.forEach(drawCactus);
    if (oasis) drawOasis(oasis);
    if (relic) drawRelic(relic);
    if (scarab) drawScarab(scarab);
    drawSnake();
  }

  // Dessine l'ecran de fin de niveau.
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
    ctx.font = "bold 52px Changa";
    ctx.fillText(`NIVEAU ${level} TERMINÉ`, canvas.width / 2, 225);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 30px Changa";
    ctx.fillText(`Score : ${score}`, canvas.width / 2, 295);
    ctx.fillText(`Scarabées : ${levelScore}`, canvas.width / 2, 340);

    ctx.fillStyle = "#fff2c8";
    ctx.font = "600 22px Changa";
    ctx.fillText("ESPACE pour continuer", canvas.width / 2, 395);

    ctx.restore();
  }

  // Dessine l'ecran de defaite.
  function drawGameOver() {
    drawPlaying();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffb095";
    ctx.font = "bold 62px Changa";
    ctx.fillText("GAME OVER", canvas.width / 2, 210);

    ctx.fillStyle = "#fff";
    ctx.font = "600 30px Changa";
    ctx.fillText(`Score final : ${score}`, canvas.width / 2, 285);
    ctx.fillText(`Niveau atteint : ${level}`, canvas.width / 2, 330);

    ctx.fillStyle = "#ffeab8";
    ctx.font = "600 22px Changa";
    ctx.fillText("ESPACE pour rejouer", canvas.width / 2, 395);
    ctx.fillText("ESC pour les meilleurs scores", canvas.width / 2, 430);
    ctx.restore();
  }

  // Dessine l'ecran de victoire finale.
  function drawVictory() {
    drawPlaying();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.66)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe9a1";
    ctx.font = "bold 58px Changa";
    ctx.fillText("VICTOIRE TOTALE", canvas.width / 2, 210);

    ctx.fillStyle = "#fff";
    ctx.font = "600 30px Changa";
    ctx.fillText(`Score final : ${score}`, canvas.width / 2, 290);
    ctx.fillText("45 scarabées avalés à travers le désert", canvas.width / 2, 335);

    ctx.fillStyle = "#fff2c8";
    ctx.font = "600 22px Changa";
    ctx.fillText("ESPACE pour revenir au menu", canvas.width / 2, 400);

    ctx.restore();
  }

  // Dessine l'ecran des meilleurs scores.
  function drawHiScores() {
    drawBackground();

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe9a1";
    ctx.font = "bold 52px Changa";
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
      ctx.font = "600 26px Changa";
      ctx.fillText("Aucun score enregistré", canvas.width / 2, 305);
    } else {
      ctx.font = "600 24px Changa";
      hiScores.forEach((entry, index) => {
        ctx.fillStyle = index % 2 === 0 ? "#fff" : "#ffe5a8";
        ctx.fillText(`${entry.score} pts  -  ${entry.date}`, canvas.width / 2, 205 + index * 52);
      });
    }

    ctx.fillStyle = "#fff4d3";
    ctx.font = "600 20px Changa";
    ctx.fillText("ESPACE ou ESC pour revenir au menu", canvas.width / 2, 540);

    ctx.restore();
  }

  // Choisit quel ecran dessiner selon l'etat courant.
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

  // Met a jour la logique continue du jeu.
  function update() {
    if (gameState === GAME.PLAYING) {
      updatePlaying();
    }
  }

  // Lance la boucle principale d'animation.
  function gameLoop(time) {
    currentTime = time;
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Gere l'action principale liee a la touche espace.
  function onSpace() {
    if (!hasUnlockedAudio) startBackgroundMusic();

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

  // Gere la bascule vers l'ecran des scores.
  function onEscape() {
    if (gameState === GAME.PLAYING || gameState === GAME.GAME_OVER || gameState === GAME.LEVEL_COMPLETE || gameState === GAME.VICTORY) {
      gameState = GAME.HI_SCORES;
      return;
    }

    if (gameState === GAME.HI_SCORES) {
      resetToMenu();
    }
  }

  // Gere un clic sur le canvas et active le pointage.
  function onCanvasClick(e) {
    if (!hasUnlockedAudio) startBackgroundMusic();

    // Le ratio convertit les pixels ecran en coordonnees internes du canvas.
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

  // Met a jour la cible du pointeur pendant le mouvement.
  function onCanvasMove(e) {
    // Le ratio conserve des coordonnees justes meme si le canvas est redimensionne.
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    pointer.x = (e.clientX - rect.left) * scaleX;
    pointer.y = (e.clientY - rect.top) * scaleY;
    pointer.active = true;
  }

  // Mappe les touches clavier vers les directions du serpent.
  function updateKeyState(code, isDown) {
    if (code === "ArrowUp" || code === "KeyW" || code === "KeyZ") keys.up = isDown;
    if (code === "ArrowDown" || code === "KeyS") keys.down = isDown;
    if (code === "ArrowLeft" || code === "KeyA" || code === "KeyQ") keys.left = isDown;
    if (code === "ArrowRight" || code === "KeyD") keys.right = isDown;
  }

  // Recentre visuellement et logiquement le joystick tactile.
  function resetJoystick() {
    joystickState.active = false;
    joystickState.dx = 0;
    joystickState.dy = 0;
    joystickKnob.style.left = "50%";
    joystickKnob.style.top = "50%";
    joystickKnob.style.transform = "translate(-50%, -50%)";
  }

  // Convertit la position tactile en direction de joystick.
  function handleJoystickPointer(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;

    // La longueur est bornee pour garder le bouton dans la base du joystick.
    const max = 36;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }

    joystickState.active = true;
    joystickState.dx = dx / max;
    joystickState.dy = dy / max;

    // Les pourcentages recentrent le bouton dans son conteneur CSS.
    joystickKnob.style.left = `${50 + (dx / rect.width) * 100}%`;
    joystickKnob.style.top = `${50 + (dy / rect.height) * 100}%`;
    joystickKnob.style.transform = "translate(-50%, -50%)";
  }

  // Branche tous les evenements clavier, souris et tactile.
  function bindEvents() {
    document.addEventListener("keydown", (e) => {
      if (!hasUnlockedAudio) startBackgroundMusic();

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

      if (e.code === "KeyH") {
        DEBUG_HITBOX = !DEBUG_HITBOX;
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
      onSpace();
      onCanvasClick(touch);
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      onCanvasMove(touch);
    }, { passive: true });

    btnRetour.addEventListener("click", () => {
      stopBackgroundMusic();

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
      if (!hasUnlockedAudio) startBackgroundMusic();
      handleJoystickPointer(touch.clientX, touch.clientY);
    }, { passive: true });

    joystick.addEventListener("touchmove", (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      handleJoystickPointer(touch.clientX, touch.clientY);
    }, { passive: true });

    joystick.addEventListener("touchend", resetJoystick, { passive: true });
    joystick.addEventListener("touchcancel", resetJoystick, { passive: true });
    window.addEventListener("beforeunload", stopBackgroundMusic);
  }

  // Charge l'etat initial puis lance la boucle du jeu.
  loadHiScores();
  resetRun();
  bindEvents();
  requestAnimationFrame(gameLoop);
});
