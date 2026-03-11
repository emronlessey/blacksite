(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmt = (sec) => `${pad2(Math.floor(sec / 60))}:${pad2(sec % 60)}`;

  const SAVE_KEY = "mb3_save_v2";
  const TOTAL = 120;

  let st = fresh();
  let timer = null;

  function fresh() {
    return {
      step: 0,
      remaining: TOTAL,
      hints: 0,
      solved: [false, false, false],
      log: [],
      ended: false,
      endMsg: "",
      started: false, // ✅ NEW

      // Step 1
      memCode: null,
      memShown: false,
      memInput: "",

      // Step 2
      reactStarted: false,
      armed: false,

      // Step 3
      correctBtn: null,
      wrong: 0
    };
  }

  function addLog(msg, cls = "") {
    st.log.unshift({ msg, cls });
    renderLog();
  }

  function renderLog() {
    const logEl = $("#log");
    if (!logEl) return;
    logEl.innerHTML = st.log.slice(0, 8)
      .map(l => `<div class="line ${l.cls || ""}">${l.msg}</div>`)
      .join("");
  }

  function safeSetText(sel, text) {
    const el = $(sel);
    if (el) el.textContent = text;
  }

  function saveSilent() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(st));
  }
  function saveLoud() {
    saveSilent();
    addLog("Saved ✅", "good");
  }

  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      st = Object.assign(fresh(), d);
      if (st.ended && !st.endMsg) st.endMsg = "Session ended. Press Reset.";
      return true;
    } catch {
      return false;
    }
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      if (st.ended || !st.started) return; // ✅ only tick when started
      st.remaining = Math.max(0, st.remaining - 1);
      safeSetText("#time", fmt(st.remaining));

      if (st.remaining === 0) {
        gameOver("💥 LOCKDOWN! Time ran out.");
        return;
      }
      if (st.remaining % 10 === 0) saveSilent();
    }, 1000);
  }

  function gameOver(msg) {
    st.ended = true;
    st.endMsg = msg;
    addLog(msg, "bad");
    stopTimer();
    render();
    saveSilent();
  }

  function win() {
    st.ended = true;
    st.endMsg = `🎉 You escaped! Time left: ${fmt(st.remaining)} • Hints: ${st.hints}/3`;
    addLog("Escape successful ✅", "good");
    stopTimer();
    render();
    saveSilent();
  }

  // ---------- Hints ----------
  const H = [
    "Memory: code shows for 1 second. Say it once in your head.",
    "Reaction: wait until STOP unlocks, then click immediately.",
    "Buttons: 2 wrong clicks max. It’s random—slow down."
  ];

  function hint() {
    if (st.ended || !st.started) return;
    if (st.hints >= 3) return;
    st.hints++;
    safeSetText("#hints", String(st.hints));
    addLog("Hint: " + H[st.step], "warn");
    saveSilent();
  }

  // ---------- Render ----------
  function renderHUD() {
    safeSetText("#step", String(st.step + 1));
    safeSetText("#time", fmt(st.remaining));
    safeSetText("#hints", String(st.hints));

    $("#submitBtn") && ($("#submitBtn").disabled = st.ended || !st.started);
    $("#nextBtn") && ($("#nextBtn").disabled = st.ended || !st.started || !st.solved[st.step]);
    if ($("#nextBtn") && st.step === 2) $("#nextBtn").disabled = true;

    // Start button state
    if ($("#startBtn")) {
      $("#startBtn").disabled = st.started || st.ended;
      $("#startBtn").textContent = st.started ? "Started" : "Start";
    }

    // Hint disabled before start
    if ($("#hintBtn")) $("#hintBtn").disabled = st.ended || !st.started || st.hints >= 3;
  }

  function render() {
    renderHUD();
    renderLog();

    const h1 = $("#h1"), p = $("#p"), game = $("#game");
    if (!h1 || !p || !game) return;

    game.innerHTML = "";

    // Pre-start screen
    if (!st.started && !st.ended) {
      h1.textContent = "Ready?";
      p.textContent = "Press Start to begin the 2-minute escape run.";
      game.innerHTML = `<p class="muted">Tip: Step 1 shows the code for only 1 second.</p>`;
      return;
    }

    if (st.ended) {
      h1.textContent = "SESSION END";
      p.textContent = st.endMsg || "Ended. Press Reset.";
      game.innerHTML = `<p class="${st.endMsg?.includes("LOCKDOWN") ? "bad" : "good"}">${p.textContent}</p>`;
      return;
    }

    if (st.step === 0) renderMemory(game, h1, p);
    if (st.step === 1) renderReaction(game, h1, p);
    if (st.step === 2) renderButtons(game, h1, p);
  }

  // ---------- Step 1 ----------
  function renderMemory(game, h1, p) {
    h1.textContent = "Step 1: Memory Flash 🧠";
    p.textContent = "Memorise the 3-digit code (shown for 1 second).";

    if (!st.memShown) {
      st.memCode = String(Math.floor(100 + Math.random() * 900));
      st.memShown = true;

      game.innerHTML = `<div class="pill">CODE: <b style="color:var(--text)">${st.memCode}</b></div>`;

      setTimeout(() => {
        if (st.step !== 0 || st.ended || !st.started) return;
        render();
      }, 1000);

      saveSilent();
      return;
    }

    const label = document.createElement("div");
    label.className = "muted";
    label.textContent = "Enter code:";
    game.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "3 digits";
    input.value = st.memInput || "";
    input.oninput = (e) => (st.memInput = e.target.value);
    game.appendChild(input);
  }

  function checkMemory() {
    const ok = (st.memInput || "").trim() === (st.memCode || "");
    if (ok) {
      st.solved[0] = true;
      addLog("Memory correct ✅ Moving on…", "good");
      st.step = 1;
      render();
      saveSilent();
    } else {
      addLog("Wrong code ❌ Try again.", "bad");
      renderLog();
    }
  }

  // ---------- Step 2 ----------
  function renderReaction(game, h1, p) {
    h1.textContent = "Step 2: Reaction Stop ⚡";
    p.textContent = "Wait until STOP unlocks, then click.";

    const info = document.createElement("div");
    info.className = "pill";
    info.innerHTML = st.armed ? "<b>UNLOCKED!</b> Click STOP now." : "Locked… wait.";
    game.appendChild(info);

    const btn = document.createElement("button");
    btn.textContent = "STOP";
    btn.disabled = !st.armed;
    btn.onclick = () => {
      if (!st.armed) return;
      st.solved[1] = true;
      addLog("Great reaction ✅ Moving on…", "good");
      st.step = 2;
      render();
      saveSilent();
    };
    game.appendChild(btn);

    if (!st.reactStarted) {
      st.reactStarted = true;
      st.armed = false;
      saveSilent();

      const delay = Math.floor(1000 + Math.random() * 2000);
      setTimeout(() => {
        if (st.step !== 1 || st.ended || !st.started) return;
        st.armed = true;
        render();
        saveSilent();
      }, delay);
    }
  }

  // ---------- Step 3 ----------
  function renderButtons(game, h1, p) {
    h1.textContent = "Step 3: Find the REAL Button 🕵️";
    p.textContent = "Pick the real one. More than 2 wrong clicks = auto reset.";

    if (st.correctBtn === null) st.correctBtn = Math.floor(Math.random() * 9);

    const info = document.createElement("div");
    info.className = "pill";
    info.innerHTML = `Wrong tries: <b>${st.wrong}</b>/2`;
    game.appendChild(info);

    const grid = document.createElement("div");
    grid.className = "grid";

    for (let i = 0; i < 9; i++) {
      const b = document.createElement("button");
      b.className = "tile";
      b.textContent = "???";
      b.onclick = () => {
        if (i === st.correctBtn) {
          st.solved[2] = true;
          addLog("You found it ✅", "good");
          win();
          return;
        }
        st.wrong++;
        addLog("Wrong button ❌", "bad");
        saveSilent();

        if (st.wrong > 2) {
          addLog("Too many wrong clicks → auto reset…", "warn");
          render();
          setTimeout(() => reset(true), 800);
          return;
        }
        render();
      };
      grid.appendChild(b);
    }
    game.appendChild(grid);
  }

  function reset(auto = false) {
  stopTimer();
  st = fresh();
  localStorage.removeItem(SAVE_KEY);
  $("#log").innerHTML = "";
  st.log = [];
  addLog(auto ? "Auto reset after too many mistakes 😵" : "Reset ✅", auto ? "warn" : "good");
  start();
}

  // ---------- bind ----------
  function bind() {
    $("#startBtn")?.addEventListener("click", () => {
      if (st.started || st.ended) return;
      st.started = true;
      addLog("Run started! Go go go 🚀", "good");
      // ensure step 1 shows code fresh
      st.step = 0;
      st.memShown = false;
      st.memInput = "";
      render();
      saveSilent();
    });

    $("#hintBtn")?.addEventListener("click", hint);
    $("#saveBtn")?.addEventListener("click", saveLoud);
    $("#resetBtn")?.addEventListener("click", () => reset(false));
    $("#btnClearLog")?.addEventListener("click", () => { st.log = []; renderLog(); addLog("Log cleared.", "warn"); });

    $("#submitBtn")?.addEventListener("click", () => {
      if (st.ended || !st.started) return;
      if (st.step === 0) checkMemory();
      else addLog("No submit needed here — use the puzzle buttons.", "warn");
      saveSilent();
    });

    $("#nextBtn")?.addEventListener("click", () => {
      if (st.ended || !st.started) return;
      if (!st.solved[st.step]) { addLog("Solve this step first.", "warn"); return; }
      st.step = Math.min(2, st.step + 1);
      render();
      saveSilent();
    });
  }

  function start() {
    render();
    startTimer();
  }

  // boot
  bind();
  if (load()) addLog("Save loaded ✅ (Press Start to run)", "warn");
  else addLog("Ready ✅ Press Start", "warn");
  start();
})();