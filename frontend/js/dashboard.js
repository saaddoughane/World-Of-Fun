(function () {
  // ---- Auth guard (utilise main.js) ----
  const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
  const guard = document.querySelector("[data-auth-guard]");

  if (!user || !user.email) {
    if (guard) guard.style.display = "block";
    setTimeout(() => window.location.href = "auth.html", 700);
    return;
  } else {
    if (guard) guard.style.display = "none";
  }

  // ---- Utils ----
  function safeParse(raw, fallback) {
    try {
      const v = JSON.parse(raw);
      return (v === null || v === undefined) ? fallback : v;
    } catch {
      return fallback;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function getEmail(entry) {
    return String(
      entry?.email ??
      entry?.utilisateur ??
      entry?.player ??
      entry?.name ??
      entry?.user ??
      "Invité"
    ).trim() || "Invité";
  }

  // ---- Scoring (Mémoire) ----
  // Plus grand = meilleur
  function memoryToPoints(entry) {
    const niveau = Number(entry.niveau ?? 1);
    const coups  = Number(entry.coups ?? 0);
    const temps  = Number(entry.temps ?? 999);

    const bonusNiveau = niveau * 100;          // max 300
    const bonusTemps  = Math.max(0, 200 - temps);
    const penalite    = coups * 5;

    const score = bonusNiveau + bonusTemps - penalite;

    return Math.max(0, Math.min(500, Math.round(score)));
  }

  // ---- Generic points (Typing/Geo) ----
  // Si tes jeux stockent déjà "score" numérique, on le prend.
  function genericToPoints(entry) {
    const v = Number(entry.score ?? entry.points ?? entry.value ?? entry.total ?? 0);
    return Number.isFinite(v) ? v : 0;
  }

  // ---- Read scores per game (tolérant sur les clés) ----
  function readGameScores(gameKey) {
    const candidates = [
      `gw_scores_${gameKey}`,
      `${gameKey}_scores`,
      `scores_${gameKey}`,
      `gw_${gameKey}_scores`
    ];

    for (const k of candidates) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const arr = safeParse(raw, []);
      if (Array.isArray(arr)) return arr;
    }

    // Fallback : ancienne version (sessionStorage "scores") filtrée par nomJeu
    const ss = safeParse(sessionStorage.getItem("scores"), []);
    if (Array.isArray(ss) && ss.length) {
      const key = String(gameKey).toLowerCase();
      return ss.filter(s => String(s.nomJeu || "").toLowerCase().includes(key) || (
        key === "memory" && String(s.nomJeu || "").toLowerCase().includes("mémoire")
      ));
    }

    return [];
  }

  // ---- Best score per player for one game ----
  function bestByPlayer(entries, scorerFn) {
    const best = new Map(); // email -> bestScore
    for (const e of entries) {
      const email = getEmail(e);
      const score = scorerFn(e);
      const prev = best.get(email);
      if (prev === undefined || score > prev) best.set(email, score);
    }
    return best;
  }

  // ---- Render helpers ----
  function renderTop10FromMap(tbodyId, bestMap) {
    const tb = document.getElementById(tbodyId);
    if (!tb) return;

    const rows = Array.from(bestMap.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (rows.length === 0) {
      tb.innerHTML = `<tr><td colspan="3" style="opacity:.75;">—</td></tr>`;
      return;
    }

    tb.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r.player)}</td>
        <td>${r.score}</td>
      </tr>
    `).join("");
  }

  // ---- Compute best per game ----
  const memoryBest = bestByPlayer(readGameScores("memory"), memoryToPoints);
  const typingBest = bestByPlayer(readGameScores("typing"), genericToPoints);
  const geoBest    = bestByPlayer(readGameScores("geo"), genericToPoints);

  // ---- Per-game tables ----
  renderTop10FromMap("t-memory", memoryBest);
  renderTop10FromMap("t-typing", typingBest);
  renderTop10FromMap("t-geo", geoBest);

  // ---- Global (sum of best per game) ----
  const players = new Set([
    ...memoryBest.keys(),
    ...typingBest.keys(),
    ...geoBest.keys()
  ]);

  const globalMap = new Map(); // email -> total
  for (const p of players) {
    const total =
      (memoryBest.get(p) ?? 0) +
      (typingBest.get(p) ?? 0) +
      (geoBest.get(p) ?? 0);
    globalMap.set(p, total);
  }

  // Render global in tbody "t-global" (3 cols: #, Player, Total)
  const tg = document.getElementById("t-global");
  if (tg) {
    const rows = Array.from(globalMap.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (rows.length === 0) {
      tg.innerHTML = `<tr><td colspan="3" style="opacity:.75;">—</td></tr>`;
    } else {
      tg.innerHTML = rows.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeHtml(r.player)}</td>
          <td>${r.score}</td>
        </tr>
      `).join("");
    }
  }
})();
