"use strict";

const SAVE_KEY = "mini_blacksite_save";
const TOTAL_TIME = 120;

let game = createNewGame();
let timer = null;

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

const hintMessages = [
  "Puzzle 1: Read the code carefully before it disappears.",
  "Puzzle 2: Wait until the message changes to CLICK NOW.",
  "Puzzle 3: Slow down and choose carefully."
];

function createNewGame() {
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

function pad(number) {
  return String(number).padStart(2, "0");
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return pad(mins) + ":" + pad(secs);
}

function addLog(message, className = "") {
  game.log.unshift({ message, className: className });
  renderLog();
}

function renderLog() {
  logBox.innerHTML = "";

  for (let i = 0; i < game.log.length && i < 10; i++) {
    const line = document.createElement("div");
    line.className = "log-line " + game.log[i].className;
    line.textContent = game.log[i].message;
    logBox.appendChild(line);
  }
}

function saveGame(silent = false) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  if (!silent) {
    addLog("Game saved.", "good");
  }
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);

  if (!saved) {
    return false;
  }

  try {
    const loadedGame = JSON.parse(saved);
    game = loadedGame;
    return true;
  } catch (error) {
    return false;
  }
}

function startTimer() {
  clearInterval(timer);

  timer = setInterval(function () {
    if (!game.started || game.ended) {
      return;
    }

    game.timeLeft--;
    timeText.textContent = formatTime(game.timeLeft);

if(game.timeLeft === 60){
  addLog("Warning: 60 seconds remaining.", "warn");
  document.getElementById("time").classList.add("timer-warning");
}
if(game.timeLeft === 30){
  addLog("Warning: 30 seconds remaining.", "warn");
  document.getElementById("time").classList.add("timer-warning2");
  
   const alarm = document.getElementById("alarmSound");
  alarm.play();
}
  /*   if (game.timeLeft === 30) {
      addLog("Warning: 30 seconds remaining.", "warn");
    } */

    if (game.timeLeft <= 0) {
      endGame("LOCKDOWN! Time ran out.", "bad");
    }
  }, 1000);
}

function endGame(message, className) {
  game.ended = true;
  game.endMessage = message;
   document.getElementById("alarmSound").pause(); // alarmSound pause
  addLog(message, className);
  clearInterval(timer);
  render();
  saveGame(true);
}

function winGame() {
   clearInterval(timer);

  const alarm = document.getElementById("alarmSound");
  alarm.pause();
  alarm.currentTime = 0;

  window.location.href = "success.html";

}

function updateHud() {
  stepText.textContent = game.step + 1;
  timeText.textContent = formatTime(game.timeLeft);
  hintsText.textContent = game.hintsUsed;

  startBtn.disabled = game.started || game.ended;
  submitBtn.disabled = !game.started || game.ended;
  hintBtn.disabled = !game.started || game.ended || game.hintsUsed >= 3;
  nextBtn.disabled = true;

  if (game.started && !game.ended && game.solved[game.step] && game.step < 2) {
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

function render() {
  updateHud();
  renderLog();
  gameArea.innerHTML = "";

  if (game.ended) {
    titleText.textContent = "Session Ended";
    descText.textContent = "The game is over.";
    const endBox = document.createElement("div");
    endBox.className = "end-message";
    endBox.textContent = game.endMessage;
    gameArea.appendChild(endBox);
    return;
  }

  if (!game.started) {
    titleText.textContent = "Containment Blacksite";
    descText.textContent = "Press Start to begin your escape attempt.";

    const intro = document.createElement("div");
    intro.className = "end-message";
    intro.textContent = "You have 2 minutes to complete 3 puzzles and escape the blacksite.";
    gameArea.appendChild(intro);
    return;
  }

  if (game.step === 0) {
    renderPuzzleOne();
  } else if (game.step === 1) {
    renderPuzzleTwo();
  } else if (game.step === 2) {
    renderPuzzleThree();
  }
}

function renderPuzzleOne() {
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
      if (game.step === 0 && game.started && !game.ended && game.memoryPhase === "showing") {
        game.memoryPhase = "input";
        render();
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

function renderPuzzleTwo() {
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
        render();
      }
    }, waitTime);

    return;
  }

  if (game.reactionReady && !game.reactionDone) {
    box.textContent = "CLICK NOW!";
    gameArea.appendChild(box);
  }

  if (game.reactionDone) {
    box.textContent = "Reaction test complete.";
    gameArea.appendChild(box);
  }
}

function renderPuzzleThree() {
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
        render();

        setTimeout(function () {
          winGame();
        }, 400);
      } else {
        game.buttonWrong++;
        addLog("Wrong button selected.", "bad");

        if (game.buttonWrong >= 2) {
          endGame("Too many wrong choices. Security system locked.", "bad");
        } else {
          render();
        }
      }
    };

    grid.appendChild(button);
  }

  gameArea.appendChild(grid);
}

function handleSubmit() {
  if (!game.started || game.ended) {
    return;
  }

  if (game.step === 0) {
    const input = document.getElementById("memoryInput");
    const value = input ? input.value.trim() : game.memoryInput.trim();

    if (value === game.memoryCode) {
      game.solved[0] = true;
      addLog("Puzzle 1 solved please click next.", "good");
	  
      render();
	  submitBtn.disabled = true;   // disable submit after correct answer
	   hintBtn.disabled = true;   // disable submit after correct answer
    } else {
      addLog("Incorrect code.", "bad");
    }
  }

  else if (game.step === 1) {
    if (game.reactionReady && !game.reactionDone) {
      game.reactionDone = true;
      game.solved[1] = true;
      addLog("Puzzle 2 solved please click next.", "good");
      render();
	   submitBtn.disabled = true;   // disable submit after correct answer
	   hintBtn.disabled = true;   // disable submit after correct answer
    } else {
      addLog("Too early. Wait for the signal.", "warn");
    }
  }
}

function handleNext() {
  if (game.ended) {
    return;
  }

  if (game.solved[game.step] && game.step < 2) {
    game.step++;
	

    if (game.step === 2 && game.buttonCorrect === 0) {
      game.buttonCorrect = Math.floor(Math.random() * 6) + 1;
    }

    addLog("Moved to next puzzle.", "good");
    render();
  }
}

function handleHint() {
  if (!game.started || game.ended || game.hintsUsed >= 3) {
    return;
  }

  game.hintsUsed++;
  addLog(hintMessages[game.step], "warn");
  render();
}

function handleReset() {
  const okay = confirm("Reset the game?");
  if (!okay) {
    return;
  }

  clearInterval(timer);
  localStorage.removeItem(SAVE_KEY);
  game = createNewGame();
  addLog("Game reset.", "warn");
  render();
}

function startGame() {
  if (game.started || game.ended) {
    return;
  }

  game.started = true;
  addLog("Escape attempt started.", "good");
  startTimer();
  render();
}

startBtn.addEventListener("click", startGame);
submitBtn.addEventListener("click", handleSubmit);
nextBtn.addEventListener("click", handleNext);
hintBtn.addEventListener("click", handleHint);
saveBtn.addEventListener("click", function () {
  saveGame(false);
});
resetBtn.addEventListener("click", handleReset);

if (loadGame()) {
  addLog("Saved game loaded.", "good");

  if (game.started && !game.ended) {
    startTimer();
  }
}

render();