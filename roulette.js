// ==========================================
// RUSSIAN ROULETTE - VIRTUAL CASINO GAME
// ==========================================

let balance = Number(localStorage.getItem("casinoBalance")) || 1000;

let currentBet = 0;
let previousBets = [];

let streak = 0;
let multiplier = 1;

let hasSpun = false;
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


// ==========================================
// DISPLAY
// ==========================================

function updateDisplay() {

    balanceDisplay.textContent =
        "$" + balance.toLocaleString();

    currentBetDisplay.textContent =
        "$" + currentBet.toLocaleString();

    streakDisplay.textContent = streak;

    multiplierDisplay.textContent = multiplier;

    localStorage.setItem("casinoBalance", balance);

}


// ==========================================
// BETTING CHIPS
// ==========================================

document.querySelectorAll(".chip").forEach(chip => {

    chip.addEventListener("click", () => {

        if (roundActive) return;

        const value = Number(chip.dataset.value);

        if (value > balance) {
            resultDisplay.textContent = "NOT ENOUGH BALANCE";
            return;
        }

        previousBets.push(value);

        currentBet += value;
        balance -= value;

        resultDisplay.textContent = "BET PLACED";

        resultDisplay.className = "result";

        updateDisplay();

    });

});


// ==========================================
// UNDO
// ==========================================

undoButton.addEventListener("click", () => {

    if (roundActive) return;

    if (previousBets.length === 0) return;

    const lastBet =
        previousBets.pop();

    currentBet -= lastBet;
    balance += lastBet;

    updateDisplay();

});


// ==========================================
// CLEAR BET
// ==========================================

clearButton.addEventListener("click", () => {

    if (roundActive) return;

    balance += currentBet;

    currentBet = 0;

    previousBets = [];

    resultDisplay.textContent = "PLACE YOUR BET";

    resultDisplay.className = "result";

    updateDisplay();

});


// ==========================================
// ALL IN
// ==========================================

allInButton.addEventListener("click", () => {

    if (roundActive) return;

    if (balance <= 0) return;

    currentBet += balance;

    previousBets.push(balance);

    balance = 0;

    resultDisplay.textContent = "ALL IN";

    updateDisplay();

});


// ==========================================
// SPIN
// ==========================================

spinButton.addEventListener("click", () => {

    if (roundActive) return;

    if (currentBet <= 0) {

        resultDisplay.textContent =
            "PLACE A BET FIRST";

        return;
    }

    cylinder.classList.remove("spinning");

    // Restart animation
    void cylinder.offsetWidth;

    cylinder.classList.add("spinning");

    hasSpun = true;

    resultDisplay.textContent =
        "CYLINDER SPINNING...";

});


// ==========================================
// PLAY ROUND
// ==========================================

playButton.addEventListener("click", () => {

    if (roundActive) return;

    if (currentBet <= 0) {

        resultDisplay.textContent =
            "PLACE A BET FIRST";

        return;
    }

    if (!hasSpun) {

        resultDisplay.textContent =
            "SPIN THE CYLINDER FIRST";

        return;
    }

    roundActive = true;

    playButton.disabled = true;
    spinButton.disabled = true;

    resultDisplay.textContent =
        "WAITING...";

    // Give the animation some time
    setTimeout(() => {

        const chamberLoaded =
            Math.floor(Math.random() * 6);

        const selectedChamber =
            Math.floor(Math.random() * 6);

        const survived =
            chamberLoaded !== selectedChamber;

        if (survived) {

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

    streak++;

    /*
       Every consecutive safe round increases
       the multiplier.

       x1 -> x1.5 -> x2 -> x2.5 -> x3
    */

    multiplier =
        Math.min(3, 1 + streak * 0.5);

    const winnings =
        Math.floor(currentBet * multiplier);

    balance += winnings;

    resultDisplay.textContent =
        "CLICK — YOU WIN $" + winnings;

    resultDisplay.className =
        "result safe";

    addHistory("CLICK", multiplier, true);

    finishRound();

}


// ==========================================
// LOSE
// ==========================================

function loseRound() {

    streak = 0;
    multiplier = 1;

    resultDisplay.textContent =
        "BANG — BET LOST";

    resultDisplay.className =
        "result danger";

    addHistory("BANG", 0, false);

    finishRound();

}


// ==========================================
// HISTORY
// ==========================================

function addHistory(type, multiplierValue, safe) {

    const item =
        document.createElement("div");

    item.className =
        "history-item";

    const icon =
        safe ? "✓" : "×";

    const multiplierText =
        safe
            ? "x" + multiplierValue
            : "−";

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

        historyList.removeChild(
            historyList.lastChild
        );

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
// BALANCE RESET
// ==========================================

balanceDisplay.style.cursor = "pointer";

balanceDisplay.title =
    "Click when balance reaches $0 to reset";

balanceDisplay.addEventListener("click", () => {

    if (balance === 0 && !roundActive) {

        balance = 1000;

        updateDisplay();

        resultDisplay.textContent =
            "BALANCE RESET TO $1,000";

    }

});


// ==========================================
// INITIALIZE
// ==========================================

updateDisplay();