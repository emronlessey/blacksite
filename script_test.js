"use strict";

/* =========================
   BASIC SETUP
========================= */
const SAVE_KEY = "mini_blacksite_save";
const TOTAL_TIME = 120;

let game = newGame();
let timer = null;

/* =========================
   PAGE ELEMENTS
========================= */
const stepText = document.getElementById("step");
const timeText = document.getElementById("time");
const hintsText = document.getElementById("hints");
const titleText = document.getElementById("title");
const descText = document.getElementById("description");
const gameArea = document.getElementById("gameArea");
const logBox = document.getElementById("log");

const startBtn = document.getElementById("startBtn");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");
const hintBtn = document.getElementById("hintBtn");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const alarmSound = document.getElementById("alarmSound");

/* =========================
   HINTS
========================= */
const hints = [
  "Puzzle 1: Read the code carefully before it disappears.",
  "Puzzle 2: Wait until the message changes to CLICK NOW.",
  "Puzzle 3: Slow down and choose carefully."
];

/* =========================
   NEW GAME
========================= */
function newGame() {
  return {
    started: false,
    ended: false,
    endMessage: "",
    step: 0,
    timeLeft: TOTAL_TIME,
    hintsUsed: 0,
    solved: [false, false, false],
    log: [],

    memoryCode: "",
    memoryInput: "",
    memoryPhase: "ready",

    reactionReady: false,
    reactionDone: false,

    buttonCorrect: 0,
    buttonWrong: 0
  };
}

/* =========================
   SMALL HELPERS
========================= */
function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;

  if (mins < 10) mins = "0" + mins;
  if (secs < 10) secs = "0" + secs;

  return mins + ":" + secs;
}

function addLog(message, className = "") {
  game.log.unshift({ message: message, className: className });
  drawLog();
}

function drawLog() {
  logBox.innerHTML = "";

  for (let i = 0; i < game.log.length && i < 10; i++) {
    const line = document.createElement("div");
    line.className = "log-line " + game.log[i].className;
    line.textContent = game.log[i].message;
    logBox.appendChild(line);
  }
}

function saveGame(showMessage = true) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));

  if (showMessage) {
    addLog("Game saved.", "good");
  }
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);

  if (!saved) {
    return false;
  }

  try {
    game = JSON.parse(saved);
    return true;
  } catch {
    return false;
  }
}

/* =========================
   TIMER
========================= */
function startTimer() {
  clearInterval(timer);

  timer = setInterval(function () {
    if (!game.started || game.ended) {
      return;
    }

    game.timeLeft--;
    timeText.textContent = formatTime(game.timeLeft);

    if (game.timeLeft === 60) {
      addLog("Warning: 60 seconds remaining.", "warn");
      timeText.classList.add("timer-warning");
    }

    if (game.timeLeft === 30) {
      addLog("Warning: 30 seconds remaining.", "warn");
      timeText.classList.add("timer-warning2");
      alarmSound.play();
    }

    if (game.timeLeft <= 0) {
      loseGame("LOCKDOWN! Time ran out.");
    }
  }, 1000);
}

/* =========================
   END / WIN
========================= */
function loseGame(message) {
  game.ended = true;
  game.endMessage = message;
  alarmSound.pause();
  clearInterval(timer);
  addLog(message, "bad");
  drawPage();
  saveGame(false);
}

function winGame() {
  clearInterval(timer);
  alarmSound.pause();
  alarmSound.currentTime = 0;
  window.location.href = "success.html";
}

/* =========================
   TOP DISPLAY
========================= */
function updateTopBar() {
  stepText.textContent = game.step + 1;
  timeText.textContent = formatTime(game.timeLeft);
  hintsText.textContent = game.hintsUsed;

  startBtn.disabled = game.started || game.ended;
  submitBtn.disabled = !game.started || game.ended;
  hintBtn.disabled = !game.started || game.ended || game.hintsUsed >= 3;
  nextBtn.disabled = true;

  if (game.solved[game.step] && game.step < 2 && !game.ended) {
    nextBtn.disabled = false;
  }

  if (game.ended) {
    submitBtn.style.display = "none";
    nextBtn.style.display = "none";
  } else {
    submitBtn.style.display = "inline-block";
    nextBtn.style.display = "inline-block";
  }
}

/* =========================
   MAIN PAGE DRAW
========================= */
function drawPage() {
  updateTopBar();
  drawLog();
  gameArea.innerHTML = "";

  if (game.ended) {
    titleText.textContent = "Session Ended";
    descText.textContent = "The game is over.";

    const box = document.createElement("div");
    box.className = "end-message";
    box.textContent = game.endMessage;
    gameArea.appendChild(box);
    return;
  }

  if (!game.started) {
    titleText.textContent = "Containment Blacksite";
    descText.textContent = "Press Start to begin your escape attempt.";

    const box = document.createElement("div");
    box.className = "end-message";
    box.textContent = "You have 2 minutes to complete 3 puzzles and escape the blacksite.";
    gameArea.appendChild(box);
    return;
  }

  if (game.step === 0) {
    drawPuzzle1();
  }

  if (game.step === 1) {
    drawPuzzle2();
  }

  if (game.step === 2) {
    drawPuzzle3();
  }
}

/* =========================
   PUZZLE 1
========================= */
function drawPuzzle1() {
  titleText.textContent = "Puzzle 1: Memory Test";
  descText.textContent = "Memorise the 3-digit code and type it back.";

  if (game.memoryPhase === "ready") {
    game.memoryCode = String(Math.floor(100 + Math.random() * 900));
    game.memoryPhase = "showing";

    const codeBox = document.createElement("div");
    codeBox.className = "code-display";
    codeBox.textContent = game.memoryCode;
    gameArea.appendChild(codeBox);

    setTimeout(function () {
      if (game.step === 0 && game.started && !game.ended) {
        game.memoryPhase = "input";
        drawPage();
      }
    }, 1000);

    return;
  }

  if (game.memoryPhase === "input") {
    const label = document.createElement("label");
    label.textContent = "Enter code:";
    gameArea.appendChild(label);

    const input = document.createElement("input");
    input.id = "memoryInput";
    input.type = "text";
    input.maxLength = 3;
    input.value = game.memoryInput;

    input.oninput = function () {
      game.memoryInput = input.value;
    };

    gameArea.appendChild(input);
  }
}

/* =========================
   PUZZLE 2
========================= */
function drawPuzzle2() {
  titleText.textContent = "Puzzle 2: Reaction Test";
  descText.textContent = "Wait for the signal, then press Submit quickly.";

  const box = document.createElement("div");
  box.className = "reaction-box";

  if (!game.reactionReady) {
    box.textContent = "Stand by...";
    gameArea.appendChild(box);

    const waitTime = Math.floor(Math.random() * 2000) + 1000;

    setTimeout(function () {
      if (game.step === 1 && game.started && !game.ended && !game.reactionDone) {
        game.reactionReady = true;
        drawPage();
      }
    }, waitTime);

    return;
  }

  if (game.reactionReady && !game.reactionDone) {
    box.textContent = "CLICK NOW!";
  }

  if (game.reactionDone) {
    box.textContent = "Reaction test complete.";
  }

  gameArea.appendChild(box);
}

/* =========================
   PUZZLE 3
========================= */
function drawPuzzle3() {
  titleText.textContent = "Puzzle 3: Find the Safe Button";
  descText.textContent = "Only one button is correct. You can only be wrong 2 times.";

  const info = document.createElement("p");
  info.className = "muted";
  info.textContent = "Wrong tries: " + game.buttonWrong + "/2";
  gameArea.appendChild(info);

  const grid = document.createElement("div");
  grid.className = "grid";

  for (let i = 1; i <= 6; i++) {
    const button = document.createElement("button");
    button.className = "tile";
    button.textContent = i;

    if (i === game.buttonCorrect) {
      button.classList.add("correct-flash");
    }

    button.onclick = function () {
      if (game.ended || game.solved[2]) {
        return;
      }

      if (i === game.buttonCorrect) {
        game.solved[2] = true;
        addLog("Correct button found.", "good");
        drawPage();

        setTimeout(function () {
          winGame();
        }, 400);
      } else {
        game.buttonWrong++;
        addLog("Wrong button selected.", "bad");

        if (game.buttonWrong >= 2) {
          loseGame("Too many wrong choices. Security system locked.");
        } else {
          drawPage();
        }
      }
    };

    grid.appendChild(button);
  }

  gameArea.appendChild(grid);
}

/* =========================
   BUTTON ACTIONS
========================= */
function submitAnswer() {
  if (!game.started || game.ended) {
    return;
  }

  if (game.step === 0) {
    const input = document.getElementById("memoryInput");
    const value = input ? input.value.trim() : game.memoryInput.trim();

    if (value === game.memoryCode) {
      game.solved[0] = true;
      addLog("Puzzle 1 solved please click next.", "good");
      drawPage();
      submitBtn.disabled = true;
      hintBtn.disabled = true;
    } else {
      addLog("Incorrect code.", "bad");
    }
  } else if (game.step === 1) {
    if (game.reactionReady && !game.reactionDone) {
      game.reactionDone = true;
      game.solved[1] = true;
      addLog("Puzzle 2 solved please click next.", "good");
      drawPage();
      submitBtn.disabled = true;
      hintBtn.disabled = true;
    } else {
      addLog("Too early. Wait for the signal.", "warn");
    }
  }
}

function nextPuzzle() {
  if (game.ended) {
    return;
  }

  if (game.solved[game.step] && game.step < 2) {
    game.step++;

    if (game.step === 2 && game.buttonCorrect === 0) {
      game.buttonCorrect = Math.floor(Math.random() * 6) + 1;
    }

    addLog("Moved to next puzzle.", "good");
    drawPage();
  }
}

function useHint() {
  if (!game.started || game.ended || game.hintsUsed >= 3) {
    return;
  }

  game.hintsUsed++;
  addLog(hints[game.step], "warn");
  drawPage();
}

function resetGame() {
  const okay = confirm("Reset the game?");

  if (!okay) {
    return;
  }

  clearInterval(timer);
  localStorage.removeItem(SAVE_KEY);
  game = newGame();
  addLog("Game reset.", "warn");
  drawPage();
}

function startGame() {
  if (game.started || game.ended) {
    return;
  }

  game.started = true;
  addLog("Escape attempt started.", "good");
  startTimer();
  drawPage();
}

/* =========================
   BUTTON EVENTS
========================= */
startBtn.addEventListener("click", startGame);
submitBtn.addEventListener("click", submitAnswer);
nextBtn.addEventListener("click", nextPuzzle);
hintBtn.addEventListener("click", useHint);
saveBtn.addEventListener("click", function () {
  saveGame(true);
});
resetBtn.addEventListener("click", resetGame);

/* =========================
   LOAD SAVE ON PAGE OPEN
========================= */
if (loadGame()) {
  addLog("Saved game loaded.", "good");

  if (game.started && !game.ended) {
    startTimer();
  }
}

/* =========================
   FIRST DRAW
========================= */
drawPage();