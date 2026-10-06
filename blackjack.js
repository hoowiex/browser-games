// ==========================================
// ROYAL BLACKJACK
// ==========================================

let deck = [];

let dealerHand = [];

let playerHands = [];

let currentHand = 0;

let mainBet = 0;

let insuranceBet = 0;

let betHistory = [];

let roundActive = false;    // a hand is in progress (player OR dealer turn)

let playerTurn = false;     // the player is allowed to act right now

let actionLocked = false;   // short lock while a double-down animates

let dealerPeeked = false;   // dealer blackjack has been checked this round

let settled = false;        // payouts already paid this round

let dealerHidden = true;


// Tells casino.js when chips are on the table (blocks the $0 reset trick)
window.casinoStakeInPlay = () => roundActive || mainBet > 0;


// ==========================================
// ELEMENTS
// ==========================================

const dealerCards = document.getElementById("dealerCards");
const dealerScore = document.getElementById("dealerScore");
const playerHandsElement = document.getElementById("playerHands");
const gameMessage = document.getElementById("gameMessage");
const betDisplay = document.getElementById("betDisplay");
const insuranceDisplay = document.getElementById("insuranceDisplay");

const hitButton = document.getElementById("hitButton");
const standButton = document.getElementById("standButton");
const doubleButton = document.getElementById("doubleButton");
const splitButton = document.getElementById("splitButton");
const insuranceButton = document.getElementById("insuranceButton");
const dealButton = document.getElementById("dealButton");
const newRoundButton = document.getElementById("newRoundButton");


// ==========================================
// CARDS
// ==========================================

const suits = ["♠", "♥", "♦", "♣"];

const ranks = [
    "2", "3", "4", "5", "6", "7", "8",
    "9", "10", "J", "Q", "K", "A"
];


function createDeck() {

    deck = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }

    shuffle(deck);
}


function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];

    }

}


function drawCard() {

    // A fresh deck is built at the start of every round, so this is only a
    // safety net. (It used to reshuffle at <10 cards, which could put cards
    // that were already on the table back into the deck.)
    if (deck.length === 0) {
        createDeck();
    }

    return deck.pop();

}


// ==========================================
// CARD VALUE
// ==========================================

function cardValue(card) {

    if (["J", "Q", "K"].includes(card.rank)) {
        return 10;
    }

    if (card.rank === "A") {
        return 11;
    }

    return Number(card.rank);
}


function handValue(hand) {

    let total = 0;
    let aces = 0;

    for (const card of hand) {

        total += cardValue(card);

        if (card.rank === "A") {
            aces++;
        }

    }

    while (total > 21 && aces > 0) {

        total -= 10;
        aces--;

    }

    return total;
}


function isBlackjack(hand) {

    return hand.length === 2 && handValue(hand) === 21;

}


function sameValue(card1, card2) {

    return cardValue(card1) === cardValue(card2);

}


// ==========================================
// DISPLAY CARDS
// ==========================================

function renderCard(card, hidden = false) {

    if (hidden) {

        return `
            <div class="playing-card hidden-card">
                <div class="card-back">
                    ♠
                </div>
            </div>
        `;

    }

    const red =
        card.suit === "♥" ||
        card.suit === "♦";

    return `
        <div class="playing-card ${red ? "red-card" : ""}">

            <div class="card-corner">
                ${card.rank}
                ${card.suit}
            </div>

            <div class="card-symbol">
                ${card.suit}
            </div>

            <div class="card-corner bottom">
                ${card.rank}
                ${card.suit}
            </div>

        </div>
    `;

}


function renderGame() {

    dealerCards.innerHTML = "";

    dealerHand.forEach((card, index) => {

        dealerCards.innerHTML +=
            renderCard(card, dealerHidden && index === 0);

    });


    dealerScore.textContent =
        dealerHidden
            ? "?"
            : handValue(dealerHand);


    playerHandsElement.innerHTML = "";

    playerHands.forEach((hand, index) => {

        const wrapper = document.createElement("div");

        wrapper.className = "player-hand";

        if (index === currentHand && roundActive && playerTurn) {
            wrapper.classList.add("active-hand");
        }

        wrapper.innerHTML = `

            <div class="hand-title">
                HAND ${index + 1}
                <span>BET $${hand.bet}</span>
            </div>

            <div class="cards">
                ${hand.cards.map(card => renderCard(card)).join("")}
            </div>

            <div class="hand-score">
                ${handValue(hand.cards)}
            </div>

        `;

        playerHandsElement.appendChild(wrapper);

    });


    betDisplay.textContent = "$" + mainBet;

    insuranceDisplay.textContent = "$" + insuranceBet;


    updateButtons();

}


// ==========================================
// BETTING
// ==========================================

document
    .querySelectorAll(".chip")
    .forEach(chip => {

        chip.addEventListener("click", () => {

            if (roundActive) return;

            const value = Number(chip.dataset.value);

            if (!removeBalance(value)) {

                message("NOT ENOUGH BALANCE");

                return;
            }

            mainBet += value;

            betHistory.push(value);

            message("BET: $" + mainBet);

            renderGame();

        });

    });


document
    .getElementById("undoBetButton")
    .addEventListener("click", () => {

        if (roundActive) return;

        if (betHistory.length === 0) return;

        const last = betHistory.pop();

        mainBet -= last;

        addBalance(last);

        renderGame();

    });


document
    .getElementById("clearBetButton")
    .addEventListener("click", () => {

        if (roundActive) return;

        addBalance(mainBet);

        mainBet = 0;

        betHistory = [];

        renderGame();

    });


document
    .getElementById("allInButton")
    .addEventListener("click", () => {

        if (roundActive) return;

        const available = getBalance();

        if (available <= 0) return;

        mainBet += available;

        betHistory.push(available);

        setBalance(0);

        renderGame();

    });


// ==========================================
// HELPERS
// ==========================================

function canAct() {

    return roundActive && playerTurn && !actionLocked;

}


function message(text) {

    gameMessage.textContent = text;

}


// ==========================================
// DEAL
// ==========================================

dealButton.addEventListener("click", startRound);


function startRound() {

    if (roundActive) return;

    if (mainBet <= 0) {

        message("PLACE YOUR BET FIRST");

        return;
    }


    createDeck();

    dealerHand = [drawCard(), drawCard()];

    playerHands = [
        {
            cards: [drawCard(), drawCard()],
            bet: mainBet,
            finished: false,
            doubled: false,
            splitAces: false
        }
    ];

    currentHand = 0;
    insuranceBet = 0;
    dealerHidden = true;

    roundActive = true;
    playerTurn = true;
    actionLocked = false;
    dealerPeeked = false;
    settled = false;


    message("YOUR MOVE");

    renderGame();


    // Natural blackjack
    if (isBlackjack(playerHands[0].cards)) {

        finishInitialBlackjack();

        return;
    }


    // Dealer's up card is index 1 (index 0 is the face-down card).
    // With an Ace showing, insurance must be offered BEFORE the dealer
    // peeks. Otherwise the peek happens immediately.
    if (dealerHand[1].rank === "A") {

        message("DEALER SHOWS AN ACE — INSURANCE?");

    } else {

        peekForDealerBlackjack();

    }

}


// ==========================================
// INITIAL BLACKJACK
// ==========================================

function finishInitialBlackjack() {

    dealerPeeked = true;

    dealerHidden = false;


    if (isBlackjack(dealerHand)) {

        // Push: return original bet
        addBalance(mainBet);

        message("PUSH — BOTH HAVE BLACKJACK");

        endRound();

        return;
    }


    // 3:2 blackjack payout (stake + 1.5x)
    addBalance(Math.floor(mainBet * 2.5));

    message("BLACKJACK! +$" + Math.floor(mainBet * 1.5));

    endRound();

}


// ==========================================
// DEALER PEEK
// ==========================================

// Checks for dealer blackjack ONCE per round. Returns true if the dealer
// has it (round is over). This runs before the player's first action, so
// you can no longer double or split into a dealer blackjack and lose extra.
function peekForDealerBlackjack() {

    if (dealerPeeked) return false;

    dealerPeeked = true;


    if (!isBlackjack(dealerHand)) {

        // Insurance (if any) loses
        insuranceBet = 0;

        return false;
    }


    let text = "DEALER BLACKJACK";

    if (insuranceBet > 0) {

        // 2:1 profit + the insurance stake back
        addBalance(insuranceBet * 3);

        text += " — INSURANCE PAYS 2:1";

    }

    dealerHidden = false;

    message(text);

    endRound();

    return true;

}


// ==========================================
// HIT
// ==========================================

hitButton.addEventListener("click", hit);


function hit() {

    if (!canAct()) return;

    if (peekForDealerBlackjack()) return;


    const hand = playerHands[currentHand];

    // Split Aces only receive one card
    if (hand.splitAces) return;


    hand.cards.push(drawCard());

    renderGame();


    if (handValue(hand.cards) >= 21) {

        advanceHand();

    }

}


// ==========================================
// STAND
// ==========================================

standButton.addEventListener("click", stand);


function stand() {

    if (!canAct()) return;

    if (peekForDealerBlackjack()) return;

    advanceHand();

}


// Finish the current hand and move to the next one (or the dealer).
function advanceHand() {

    playerHands[currentHand].finished = true;


    if (currentHand < playerHands.length - 1) {

        currentHand++;

        message("HAND " + (currentHand + 1) + " — YOUR MOVE");

        renderGame();

        return;
    }


    dealerTurn();

}


// ==========================================
// DOUBLE
// ==========================================

doubleButton.addEventListener("click", () => {

    if (!canAct()) return;

    if (peekForDealerBlackjack()) return;


    const hand = playerHands[currentHand];

    if (hand.cards.length !== 2 || hand.splitAces) return;


    if (!removeBalance(hand.bet)) {

        message("NOT ENOUGH BALANCE");

        return;
    }


    hand.bet *= 2;

    hand.doubled = true;

    // Exactly one card, then the hand is over. All buttons stay locked
    // during the short delay so you can't hit/stand on top of it.
    hand.cards.push(drawCard());

    actionLocked = true;

    renderGame();


    setTimeout(() => {

        actionLocked = false;

        advanceHand();

    }, 400);

});


// ==========================================
// SPLIT
// ==========================================

splitButton.addEventListener("click", splitHand);


function splitHand() {

    if (!canAct()) return;

    if (peekForDealerBlackjack()) return;

    if (playerHands.length >= 2) return;


    const hand = playerHands[0];

    if (hand.cards.length !== 2) return;

    if (!sameValue(hand.cards[0], hand.cards[1])) return;


    if (!removeBalance(hand.bet)) {

        message("NOT ENOUGH BALANCE TO SPLIT");

        return;
    }


    const [card1, card2] = hand.cards;

    const isAceSplit = card1.rank === "A";


    playerHands = [card1, card2].map(card => ({
        cards: [card, drawCard()],
        bet: hand.bet,
        finished: false,
        doubled: false,
        splitAces: isAceSplit
    }));


    currentHand = 0;


    // Split aces get one card each and automatically stand
    if (isAceSplit) {

        playerHands.forEach(h => h.finished = true);

        currentHand = 1;

        dealerTurn();

        return;
    }


    message("HAND 1 — YOUR MOVE");

    renderGame();

}


// ==========================================
// INSURANCE
// ==========================================

insuranceButton.addEventListener("click", takeInsurance);


function takeInsurance() {

    // Only before the first action, while the dealer hasn't peeked yet
    if (!canAct() || dealerPeeked) return;

    if (dealerHand[1].rank !== "A") return;

    if (insuranceBet > 0) return;


    const amount = Math.floor(mainBet / 2);

    if (amount <= 0) return;


    if (!removeBalance(amount)) {

        message("NOT ENOUGH BALANCE");

        return;
    }


    insuranceBet = amount;


    // Resolve it right away: dealer peeks now
    if (!peekForDealerBlackjack()) {

        message("NO DEALER BLACKJACK — INSURANCE LOST");

        renderGame();

    }

}


// ==========================================
// DEALER
// ==========================================

function dealerTurn() {

    // The player is done; nothing can be clicked from here on
    playerTurn = false;

    dealerHidden = false;

    renderGame();


    // If every hand busted the dealer doesn't need to draw
    const allBust = playerHands.every(
        hand => handValue(hand.cards) > 21
    );

    if (allBust) {

        settleHands();

        return;
    }


    setTimeout(dealerDraw, 500);

}


function dealerDraw() {

    if (!roundActive || settled) return;


    if (handValue(dealerHand) < 17) {

        dealerHand.push(drawCard());

        renderGame();

        setTimeout(dealerDraw, 500);

        return;

    }


    settleHands();

}


// ==========================================
// SETTLEMENT
// ==========================================

function settleHands() {

    // Never pay out twice
    if (settled) return;

    settled = true;


    const dealerValue = handValue(dealerHand);

    let totalBet = 0;
    let totalReturn = 0;
    let busted = 0;


    for (const hand of playerHands) {

        const playerValue = handValue(hand.cards);

        totalBet += hand.bet;


        if (playerValue > 21) {

            busted++;

            continue;
        }


        if (dealerValue > 21 || playerValue > dealerValue) {

            totalReturn += hand.bet * 2;

        } else if (playerValue === dealerValue) {

            totalReturn += hand.bet;

        }

    }


    addBalance(totalReturn);


    const net = totalReturn - totalBet;

    if (busted === playerHands.length) {

        message("BUST — DEALER WINS");

    } else if (net > 0) {

        message("YOU WIN +$" + net);

    } else if (net < 0) {

        message("DEALER WINS −$" + Math.abs(net));

    } else {

        message(playerHands.length > 1 ? "BREAK EVEN" : "PUSH");

    }


    endRound();

}


// ==========================================
// END ROUND
// ==========================================

function endRound() {

    roundActive = false;

    playerTurn = false;

    dealerHidden = false;

    insuranceBet = 0;

    // This round's stake has been paid out or lost. Clearing it stops the
    // old bet from being re-dealt for free, refunded by CLEAR/UNDO, or
    // added on top of the next chips.
    mainBet = 0;

    betHistory = [];

    renderGame();

}


// ==========================================
// NEW ROUND
// ==========================================

newRoundButton.addEventListener("click", () => {

    // Mid-hand this would silently throw away your stake
    if (roundActive) return;


    // Chips placed but not dealt yet: give them back
    if (mainBet > 0) {

        addBalance(mainBet);

    }


    dealerHand = [];

    playerHands = [];

    currentHand = 0;

    mainBet = 0;

    insuranceBet = 0;

    betHistory = [];

    dealerHidden = true;

    playerTurn = false;

    message("PLACE YOUR BET");

    renderGame();

});


// ==========================================
// BUTTONS
// ==========================================

function updateButtons() {

    const hand = playerHands[currentHand];

    const canPlay = canAct() && !!hand;


    hitButton.disabled =
        !canPlay ||
        hand.splitAces;


    standButton.disabled =
        !canPlay;


    doubleButton.disabled =
        !canPlay ||
        hand.cards.length !== 2 ||
        hand.splitAces ||
        getBalance() < hand.bet;


    splitButton.disabled =
        !canPlay ||
        playerHands.length >= 2 ||
        hand.cards.length !== 2 ||
        !sameValue(hand.cards[0], hand.cards[1]) ||
        getBalance() < hand.bet;


    insuranceButton.disabled =
        !canPlay ||
        dealerPeeked ||
        dealerHand.length < 2 ||
        dealerHand[1].rank !== "A" ||
        insuranceBet > 0 ||
        Math.floor(mainBet / 2) <= 0;


    dealButton.disabled =
        roundActive ||
        mainBet <= 0;


    newRoundButton.disabled =
        roundActive;

}


// ==========================================
// START
// ==========================================

renderGame();
