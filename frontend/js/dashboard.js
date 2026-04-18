(function () {
  const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
  const guard = document.querySelector("[data-auth-guard]");

  if (!user || !user.email) {
    if (guard) guard.style.display = "block";
    setTimeout(() => window.location.href = "auth.html", 700);
    return;
  }

  if (guard) guard.style.display = "none";

  const GAME_ALIASES = {
    memory: ["memory"],
    banana: ["banana", "typing"],
    snake: ["snake", "geo"]
  };

  function safeParse(raw, fallback) {
    try {
      const value = JSON.parse(raw);
      return value === null || value === undefined ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function dateMs(iso) {
    const time = new Date(iso || 0).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  function getEmail(entry) {
    return String(
      entry?.email ??
      entry?.utilisateur ??
      entry?.player ??
      entry?.name ??
      entry?.user ??
      entry?.username ??
      "Invit\u00e9"
    ).trim() || "Invit\u00e9";
  }

  function normalizeGameKey(game) {
    const key = String(game || "").trim().toLowerCase();

    if (key === "typing") return "banana";
    if (key === "geo") return "snake";

    return key;
  }

  function genericToPoints(entry) {
    const value = Number(entry?.score ?? entry?.points ?? entry?.value ?? entry?.total ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  function memoryToPoints(entry) {
    const directScore = genericToPoints(entry);
    if (directScore > 0) return directScore;

    const niveau = Number(entry?.niveau ?? 1);
    const coups = Number(entry?.coups ?? 0);
    const temps = Number(entry?.temps ?? 999);

    return Math.max(0, Math.min(500, Math.round((niveau * 100) + Math.max(0, 200 - temps) - (coups * 5))));
  }

  function scoreForGame(gameKey, entry) {
    return gameKey === "memory" ? memoryToPoints(entry) : genericToPoints(entry);
  }

  function readGameScores(gameKey) {
    const aliases = GAME_ALIASES[gameKey] || [gameKey];
    const allScores = safeParse(localStorage.getItem("gw_scores"), []);

    return allScores.filter((entry) => aliases.includes(normalizeGameKey(entry?.game)));
  }

  function bestByPlayer(entries, gameKey) {
    const bestScores = new Map();

    for (const entry of entries) {
      const email = getEmail(entry);
      const score = scoreForGame(gameKey, entry);
      const previous = bestScores.get(email);

      if (!previous || score > previous.score || (score === previous.score && dateMs(entry?.date) > previous.dateMs)) {
        bestScores.set(email, {
          score,
          dateMs: dateMs(entry?.date)
        });
      }
    }

    return new Map(Array.from(bestScores.entries()).map(([email, data]) => [email, data.score]));
  }

  function renderTop10FromMap(tbodyId, scoreMap) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    const rows = Array.from(scoreMap.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score || a.player.localeCompare(b.player))
      .slice(0, 10);

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="opacity:.75;">-</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.player)}</td>
        <td>${row.score}</td>
      </tr>
    `).join("");
  }

  const memoryBest = bestByPlayer(readGameScores("memory"), "memory");
  const bananaBest = bestByPlayer(readGameScores("banana"), "banana");
  const snakeBest = bestByPlayer(readGameScores("snake"), "snake");

  renderTop10FromMap("t-memory", memoryBest);
  renderTop10FromMap("t-banana", bananaBest);
  renderTop10FromMap("t-snake", snakeBest);

  const players = new Set([
    ...memoryBest.keys(),
    ...bananaBest.keys(),
    ...snakeBest.keys()
  ]);

  const globalScores = new Map();
  for (const player of players) {
    globalScores.set(
      player,
      (memoryBest.get(player) ?? 0) +
      (bananaBest.get(player) ?? 0) +
      (snakeBest.get(player) ?? 0)
    );
  }

  renderTop10FromMap("t-global", globalScores);
})();
