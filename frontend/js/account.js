(function () {
  const SESSION_KEY = "gw_currentUser";
  const USERS_KEY = "gw_users";

  function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

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

  // ------- Guard -------
  const user = getCurrentUser();
  const guard = document.querySelector("[data-auth-guard]");
  if (!user || !user.email) {
    if (guard) guard.style.display = "block";
    setTimeout(() => { window.location.href = "auth.html"; }, 700);
    return;
  }
  if (guard) guard.style.display = "none";

    // ------- Password eye toggles -------
  document.querySelectorAll(".pwd-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;

      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "🙈" : "🐵";
    });
  });

  // ------- Scoring helpers -------
  // Score Mémoire: borné dans [0,500]
  function memoryToPoints(entry) {
    const niveau = Number(entry.niveau ?? 1);
    const coups = Number(entry.coups ?? 0);
    const temps = Number(entry.temps ?? 999);

    const bonusNiveau = niveau * 100;
    const bonusTemps = Math.max(0, 200 - temps);
    const penalite = coups * 5;

    const score = bonusNiveau + bonusTemps - penalite;
    return Math.max(0, Math.min(500, Math.round(score)));
  }

  function genericToPoints(entry) {
    const v = Number(entry.score ?? entry.points ?? entry.value ?? entry.total ?? 0);
    return Number.isFinite(v) ? v : 0;
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR");
  }

    function dateMs(iso) {
    const t = new Date(iso || 0).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  function top3MostRecent(arr) {
    return [...arr].sort((a, b) => dateMs(b.date) - dateMs(a.date)).slice(0, 3);
  }

  function readGameScores(gameKey) {
    const candidates = [
      `gw_scores_${gameKey}`,
      `gw_${gameKey}_scores`,
      `${gameKey}_scores`,
      `scores_${gameKey}`,
      `scores-${gameKey}`
    ];

    for (const k of candidates) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const arr = safeParse(raw, []);
      if (Array.isArray(arr)) return arr;
    }

    // Fallback: ancien stockage du jeu mémoire dans sessionStorage("scores")
    const ss = safeParse(sessionStorage.getItem("scores"), []);
    if (Array.isArray(ss) && ss.length) {
      const key = String(gameKey).toLowerCase();
      return ss.filter(s => {
        const n = String(s.nomJeu || "").toLowerCase();
        if (key === "memory") return n.includes("mémoire") || n.includes("memoire") || n.includes("memory");
        return n.includes(key);
      });
    }

    return [];
  }

  function normalizeEmail(entry) {
    return String(
      entry?.email ??
      entry?.utilisateur ??
      entry?.player ??
      entry?.user ??
      entry?.username ??
      ""
    ).trim();
  }

  function bestScoreForEmail(entries, email, scorerFn) {
    let best = null;
    for (const e of entries) {
      if (normalizeEmail(e) !== email) continue;
      const s = scorerFn(e);
      if (best === null || s > best) best = s;
    }
    return best;
  }

  function bestScoreWithDateForEmail(entries, email, scorerFn) {
    let bestScore = null;
    let bestDate = "";

    for (const e of entries) {
      if (normalizeEmail(e) !== email) continue;

      const s = scorerFn(e);
      const d = e?.date || "";

      if (bestScore === null || s > bestScore) {
        bestScore = s;
        bestDate = d;
      } else if (bestScore !== null && s === bestScore) {
        // si égalité, on garde la plus récente
        if (dateMs(d) > dateMs(bestDate)) bestDate = d;
      }
    }

    return { score: bestScore ?? 0, date: bestDate };
  }

  // ------- Render: My scores -------
  const email = user.email;
  const accEmail = document.getElementById("accEmail");
  if (accEmail) accEmail.textContent = email;

  const memAll = readGameScores("memory");
  const typAll = readGameScores("typing");
  const geoAll = readGameScores("geo");

  const memMine = memAll.filter(e => normalizeEmail(e) === email);
  const typMine = typAll.filter(e => normalizeEmail(e) === email);
  const geoMine = geoAll.filter(e => normalizeEmail(e) === email);

  const bestMem = bestScoreForEmail(memAll, email, memoryToPoints) ?? 0;
  const bestTyp = bestScoreForEmail(typAll, email, genericToPoints) ?? 0;
  const bestGeo = bestScoreForEmail(geoAll, email, genericToPoints) ?? 0;

  const bestMemoryEl = document.getElementById("bestMemory");
  const bestTypingEl = document.getElementById("bestTyping");
  const bestGeoEl = document.getElementById("bestGeo");
  if (bestMemoryEl) bestMemoryEl.textContent = String(bestMem || "—");
  if (bestTypingEl) bestTypingEl.textContent = String(bestTyp || "—");
  if (bestGeoEl) bestGeoEl.textContent = String(bestGeo || "—");

  const memBest = bestScoreWithDateForEmail(memAll, email, memoryToPoints);
  const typBest = bestScoreWithDateForEmail(typAll, email, genericToPoints);
  const geoBest = bestScoreWithDateForEmail(geoAll, email, genericToPoints);

  const total = (memBest.score || 0) + (typBest.score || 0) + (geoBest.score || 0);

  const globalMostRecent = [memBest.date, typBest.date, geoBest.date]
    .filter(Boolean)
    .sort((a, b) => dateMs(b) - dateMs(a))[0] || "";

  const accTotal = document.getElementById("accTotal");
  if (accTotal) {
    accTotal.textContent = globalMostRecent
      ? `${total} — ${fmtDate(globalMostRecent)}`
      : String(total || "—");
  }

  function renderEmptyRow(tbodyId, colspan) {
    const tb = document.getElementById(tbodyId);
    if (!tb) return;
    tb.innerHTML = `<tr><td colspan="${colspan}">—</td></tr>`;
  }

  function renderMemoryRows() {
    const tb = document.getElementById("myMemoryRows");
    if (!tb) return;
    if (!memMine.length) return renderEmptyRow("myMemoryRows", 5);

    const rows = top3MostRecent(memMine)
      .map(e => ({
        date: fmtDate(e.date),
        niveau: Number(e.niveau ?? 1),
        coups: Number(e.coups ?? 0),
        temps: Number(e.temps ?? 0),
        score: memoryToPoints(e)
      }));

    tb.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td>${r.niveau}</td>
        <td>${r.coups}</td>
        <td>${r.temps}</td>
        <td>${r.score}</td>
      </tr>
    `).join("");
  }

  function renderGenericRows(tbodyId, mine, scorerFn) {
    const tb = document.getElementById(tbodyId);
    if (!tb) return;
    if (!mine.length) return renderEmptyRow(tbodyId, 2);

    const rows = top3MostRecent(mine)
      .map(e => ({ date: fmtDate(e.date), score: scorerFn(e) }));


    tb.innerHTML = rows.map(r => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td>${r.score}</td>
      </tr>
    `).join("");
  }

  renderMemoryRows();
  renderGenericRows("myTypingRows", typMine, genericToPoints);
  renderGenericRows("myGeoRows", geoMine, genericToPoints);

  // ------- Account updates -------
  const emailForm = document.getElementById("emailForm");
  const pwdForm = document.getElementById("pwdForm");
  const emailErr = document.getElementById("emailErr");
  const emailOk = document.getElementById("emailOk");
  const pwdErr = document.getElementById("pwdErr");
  const pwdOk = document.getElementById("pwdOk");

  function showMsg(okEl, errEl, okMsg, errMsg) {
    if (okEl) {
      okEl.textContent = okMsg || "";
      okEl.style.display = okMsg ? "block" : "none";
      okEl.classList.remove("err");
    }
    if (errEl) {
      errEl.textContent = errMsg || "";
      errEl.style.display = errMsg ? "block" : "none";
      if (errMsg) errEl.classList.add("err");
    }
  }

  function readUsers() {
    return safeParse(localStorage.getItem(USERS_KEY), []);
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function updateEmailEverywhere(oldEmail, newEmail) {
    // Update localStorage scores arrays
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!k.startsWith("gw_scores") && !k.endsWith("_scores") && !k.includes("scores")) continue;

      const arr = safeParse(localStorage.getItem(k), null);
      if (!Array.isArray(arr)) continue;

      let changed = false;
      for (const e of arr) {
        if (!e || typeof e !== "object") continue;
        const fields = ["email", "utilisateur", "player", "user", "username"];
        for (const f of fields) {
          if (String(e[f] ?? "") === oldEmail) {
            e[f] = newEmail;
            changed = true;
          }
        }
      }

      if (changed) localStorage.setItem(k, JSON.stringify(arr));
    }

    // Update sessionStorage "scores" (ancienne version du mémoire)
    const ss = safeParse(sessionStorage.getItem("scores"), null);
    if (Array.isArray(ss)) {
      let changed = false;
      for (const e of ss) {
        if (!e || typeof e !== "object") continue;
        if (String(e.utilisateur ?? "") === oldEmail) {
          e.utilisateur = newEmail;
          changed = true;
        }
        if (String(e.email ?? "") === oldEmail) {
          e.email = newEmail;
          changed = true;
        }
      }
      if (changed) sessionStorage.setItem("scores", JSON.stringify(ss));
    }
  }

  if (emailForm) {
    emailForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showMsg(emailOk, emailErr, "", "");

      const input = document.getElementById("newEmail");
      const newEmail = String(input?.value || "").trim();
      if (!newEmail || !newEmail.includes("@")) {
        return showMsg(emailOk, emailErr, "", "Email invalide.");
      }

      const users = readUsers();
      const already = users.some(u => String(u.email || "") === newEmail);
      if (already) {
        return showMsg(emailOk, emailErr, "", "Cet email est déjà utilisé.");
      }

      const idx = users.findIndex(u => String(u.email || "") === email);
      if (idx === -1) {
        return showMsg(emailOk, emailErr, "", "Utilisateur introuvable.");
      }

      users[idx].email = newEmail;
      writeUsers(users);

      // Update session + scores
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: newEmail }));
      updateEmailEverywhere(email, newEmail);

      showMsg(emailOk, emailErr, "Email mis à jour ✅", "");
      setTimeout(() => window.location.reload(), 300);
    });
  }

  if (pwdForm) {
    pwdForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showMsg(pwdOk, pwdErr, "", "");

      const currentPwd = String(document.getElementById("currentPwd")?.value || "");
      const newPwd = String(document.getElementById("newPwd")?.value || "");
      const newPwd2 = String(document.getElementById("newPwd2")?.value || "");

      if (!newPwd || newPwd.length < 4) {
        return showMsg(pwdOk, pwdErr, "", "Mot de passe trop court (min 4 caractères).");
      }
      if (newPwd !== newPwd2) {
        return showMsg(pwdOk, pwdErr, "", "Les deux mots de passe ne correspondent pas.");
      }

      const users = readUsers();
      const idx = users.findIndex(u => String(u.email || "") === email);
      if (idx === -1) {
        return showMsg(pwdOk, pwdErr, "", "Utilisateur introuvable.");
      }

      if (String(users[idx].password || "") !== currentPwd) {
        return showMsg(pwdOk, pwdErr, "", "Mot de passe actuel incorrect.");
      }

      users[idx].password = newPwd;
      writeUsers(users);

      showMsg(pwdOk, pwdErr, "Mot de passe mis à jour ✅", "");
      pwdForm.reset();
    });
  }
})();