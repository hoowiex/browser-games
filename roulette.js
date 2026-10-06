// ==========================================
// RUSSIAN ROULETTE - VIRTUAL CASINO GAME
// (needs casino.js loaded first: shared wallet)
// ==========================================

const SPIN_TIME = 1500; // must match the CSS animation (1.5s)

let currentBet = 0;
let previousBets = [];

let streak = 0;

let hasSpun = false;
let isSpinning = false;
let roundActive = false;

const balanceDisplay = document.getElementById("balance");
const currentBetDisplay = document.getElementById("currentBet");
const streakDisplay = document.getElementById("streak");
const multiplierDisplay = document.getElementById("multiplier");

const cylinder = document.getElementById("cylinder");

const spinButton = document.getElementById("spinButton");
const playButton = document.getElementById("playButton");

const resultDisplay = document.getElementById("result");

const undoButton = document.getElementById("undoButton");
const allInButton = document.getElementById("allInButton");
const clearButton = document.getElementById("clearButton");

const historyList = document.getElementById("historyList");


// Tells casino.js when chips are on the table (blocks the $0 reset trick)
window.casinoStakeInPlay = () => roundActive || currentBet > 0;


// ==========================================
// MULTIPLIER
// ==========================================

/*
   Total return on the NEXT win (stake included):
   x1.5 -> x2 -> x2.5 -> x3 (capped)
*/
function nextMultiplier() {

    return Math.min(3, 1 + (streak + 1) * 0.5);

}


// ==========================================
// DISPLAY
// ==========================================

function updateDisplay() {

    updateCasinoBalanceDisplays();

    currentBetDisplay.textContent = formatMoney(currentBet);

    streakDisplay.textContent = streak;

    // Shows what the next win will actually pay
    multiplierDisplay.textContent = nextMultiplier();

}


function setResult(text, type = "") {

    resultDisplay.textContent = text;

    resultDisplay.className = type ? "result " + type : "result";

}


// ==========================================
// BETTING CHIPS
// ==========================================

document.querySelectorAll(".chip").forEach(chip => {

    chip.addEventListener("click", () => {

        if (roundActive) return;

        const value = Number(chip.dataset.value);

        if (!removeBalance(value)) {

            setResult("NOT ENOUGH BALANCE");

            return;
        }

        previousBets.push(value);

        currentBet += value;

        setResult("BET PLACED");

        updateDisplay();

    });

});


// ==========================================
// UNDO
// ==========================================

undoButton.addEventListener("click", () => {

    if (roundActive) return;

    if (previousBets.length === 0) return;

    const lastBet = previousBets.pop();

    currentBet -= lastBet;

    addBalance(lastBet);

    updateDisplay();

});


// ==========================================
// CLEAR BET
// ==========================================

clearButton.addEventListener("click", () => {

    if (roundActive) return;

    addBalance(currentBet);

    currentBet = 0;

    previousBets = [];

    setResult("PLACE YOUR BET");

    updateDisplay();

});


// ==========================================
// ALL IN
// ==========================================

allInButton.addEventListener("click", () => {

    if (roundActive) return;

    const available = getBalance();

    if (available <= 0) return;

    currentBet += available;

    previousBets.push(available);

    setBalance(0);

    setResult("ALL IN");

    updateDisplay();

});


// ==========================================
// SPIN
// ==========================================

spinButton.addEventListener("click", () => {

    if (roundActive || isSpinning) return;

    if (currentBet <= 0) {

        setResult("PLACE A BET FIRST");

        return;
    }

    cylinder.classList.remove("spinning");

    // Restart animation
    void cylinder.offsetWidth;

    cylinder.classList.add("spinning");

    isSpinning = true;
    hasSpun = true;

    setResult("CYLINDER SPINNING...");

    setTimeout(() => {

        cylinder.classList.remove("spinning");

        isSpinning = false;

        if (!roundActive) {
            setResult("READY — PLAY ROUND");
        }

    }, SPIN_TIME);

});


// ==========================================
// PLAY ROUND
// ==========================================

playButton.addEventListener("click", () => {

    if (roundActive) return;

    if (currentBet <= 0) {

        setResult("PLACE A BET FIRST");

        return;
    }

    if (isSpinning) {

        setResult("WAIT FOR THE SPIN");

        return;
    }

    if (!hasSpun) {

        setResult("SPIN THE CYLINDER FIRST");

        return;
    }

    roundActive = true;

    playButton.disabled = true;
    spinButton.disabled = true;

    setResult("WAITING...");

    setTimeout(() => {

        // 1 loaded chamber out of 6
        const chamberLoaded = Math.floor(Math.random() * 6);

        const selectedChamber = Math.floor(Math.random() * 6);

        if (chamberLoaded !== selectedChamber) {

            winRound();

        } else {

            loseRound();

        }

    }, 900);

});


// ==========================================
// WIN
// ==========================================

function winRound() {

    const multiplier = nextMultiplier();

    streak++;

    // The bet was already taken from the wallet, so this is the total
    // return. The message shows the profit.
    const payout = Math.floor(currentBet * multiplier);

    const profit = payout - currentBet;

    addBalance(payout);

    setResult("CLICK — YOU WIN " + formatMoney(profit), "safe");

    addHistory("CLICK", multiplier, true);

    finishRound();

}


// ==========================================
// LOSE
// ==========================================

function loseRound() {

    streak = 0;

    setResult("BANG — BET LOST", "danger");

    addHistory("BANG", 0, false);

    finishRound();

}


// ==========================================
// HISTORY
// ==========================================

function addHistory(type, multiplierValue, safe) {

    const item = document.createElement("div");

    item.className = "history-item";

    const icon = safe ? "✓" : "×";

    const multiplierText = safe ? "x" + multiplierValue : "−";

    item.innerHTML = `
        <span class="${safe ? "safe" : "danger"}">
            ${icon}
        </span>

        ${type}

        <small>
            ${multiplierText}
        </small>
    `;

    historyList.prepend(item);

    while (historyList.children.length > 5) {

        historyList.removeChild(historyList.lastChild);

    }

}


// ==========================================
// FINISH ROUND
// ==========================================

function finishRound() {

    currentBet = 0;
    previousBets = [];

    hasSpun = false;

    roundActive = false;

    playButton.disabled = false;
    spinButton.disabled = false;

    updateDisplay();

}


// ==========================================
// BALANCE RESET (handled by casino.js)
// ==========================================

balanceDisplay.style.cursor = "pointer";

balanceDisplay.title =
    "Click when balance reaches $0 to reset";


// ==========================================
// INITIALIZE
// ==========================================

updateDisplay();
