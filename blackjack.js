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

let roundActive = false;

let dealerHidden = true;


// ==========================================
// ELEMENTS
// ==========================================

const dealerCards =
    document.getElementById("dealerCards");

const dealerScore =
    document.getElementById("dealerScore");

const playerHandsElement =
    document.getElementById("playerHands");

const gameMessage =
    document.getElementById("gameMessage");

const betDisplay =
    document.getElementById("betDisplay");

const insuranceDisplay =
    document.getElementById("insuranceDisplay");

const hitButton =
    document.getElementById("hitButton");

const standButton =
    document.getElementById("standButton");

const doubleButton =
    document.getElementById("doubleButton");

const splitButton =
    document.getElementById("splitButton");

const insuranceButton =
    document.getElementById("insuranceButton");

const dealButton =
    document.getElementById("dealButton");

const newRoundButton =
    document.getElementById("newRoundButton");


// ==========================================
// CARDS
// ==========================================

const suits = [
    "♠",
    "♥",
    "♦",
    "♣"
];

const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A"
];


function createDeck() {

    deck = [];

    for (const suit of suits) {

        for (const rank of ranks) {

            deck.push({
                suit,
                rank
            });

        }

    }

    shuffle(deck);
}


function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }

}


function drawCard() {

    if (deck.length < 10) {
        createDeck();
    }

    return deck.pop();

}


// ==========================================
// CARD VALUE
// ==========================================

function cardValue(card) {

    if (
        ["J", "Q", "K"].includes(card.rank)
    ) {
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

    while (
        total > 21 &&
        aces > 0
    ) {

        total -= 10;
        aces--;

    }

    return total;
}


function isBlackjack(hand) {

    return (
        hand.length === 2 &&
        handValue(hand) === 21
    );

}


function sameValue(card1, card2) {

    if (
        ["J", "Q", "K"].includes(card1.rank) &&
        ["J", "Q", "K"].includes(card2.rank)
    ) {
        return true;
    }

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
            renderCard(
                card,
                dealerHidden && index === 0
            );

    });


    dealerScore.textContent =
        dealerHidden
            ? "?"
            : handValue(dealerHand);


    playerHandsElement.innerHTML = "";


    playerHands.forEach(
        (hand, index) => {

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "player-hand";

            if (index === currentHand) {
                wrapper.classList.add("active-hand");
            }


            wrapper.innerHTML = `

                <div class="hand-title">
                    HAND ${index + 1}
                    <span>
                        BET $${hand.bet}
                    </span>
                </div>

                <div class="cards">

                    ${hand.cards
                        .map(card =>
                            renderCard(card)
                        )
                        .join("")
                    }

                </div>

                <div class="hand-score">

                    ${handValue(hand.cards)}

                </div>

            `;


            playerHandsElement.appendChild(
                wrapper
            );

        }
    );


    betDisplay.textContent =
        "$" + mainBet;

    insuranceDisplay.textContent =
        "$" + insuranceBet;


    updateButtons();

}


// ==========================================
// BETTING
// ==========================================

document
    .querySelectorAll(".chip")
    .forEach(chip => {

        chip.addEventListener(
            "click",
            () => {

                if (roundActive) return;

                const value =
                    Number(chip.dataset.value);

                if (
                    getBalance() < value
                ) {

                    message(
                        "NOT ENOUGH BALANCE"
                    );

                    return;
                }


                removeBalance(value);

                mainBet += value;

                betHistory.push(value);

                message(
                    "BET: $" + mainBet
                );

                renderGame();

            }
        );

    });


document
    .getElementById("undoBetButton")
    .addEventListener(
        "click",
        () => {

            if (roundActive) return;

            if (betHistory.length === 0) {
                return;
            }

            const last =
                betHistory.pop();

            mainBet -= last;

            addBalance(last);

            renderGame();

        }
    );


document
    .getElementById("clearBetButton")
    .addEventListener(
        "click",
        () => {

            if (roundActive) return;

            addBalance(mainBet);

            mainBet = 0;

            betHistory = [];

            renderGame();

        }
    );


document
    .getElementById("allInButton")
    .addEventListener(
        "click",
        () => {

            if (roundActive) return;

            const available =
                getBalance();

            if (available <= 0) return;

            mainBet += available;

            betHistory.push(
                available
            );

            setBalance(0);

            renderGame();

        }
    );


// ==========================================
// DEAL
// ==========================================

dealButton.addEventListener(
    "click",
    startRound
);


function startRound() {

    if (roundActive) return;

    if (mainBet <= 0) {

        message(
            "PLACE YOUR BET FIRST"
        );

        return;
    }


    createDeck();


    dealerHand = [
        drawCard(),
        drawCard()
    ];


    playerHands = [
        {
            cards: [
                drawCard(),
                drawCard()
            ],

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


    message("YOUR MOVE");

    renderGame();


    // Natural blackjack

    if (
        isBlackjack(
            playerHands[0].cards
        )
    ) {

        finishInitialBlackjack();

    }

}


// ==========================================
// INITIAL BLACKJACK
// ==========================================

function finishInitialBlackjack() {

    dealerHidden = false;

    renderGame();


    if (isBlackjack(dealerHand)) {

        // Push: return original bet
        addBalance(mainBet);

        message(
            "PUSH — BOTH HAVE BLACKJACK"
        );

        endRound();

        return;
    }


    // 3:2 blackjack payout
    const payout =
        Math.floor(
            mainBet * 2.5
        );

    addBalance(payout);


    message(
        "BLACKJACK! +$" +
        Math.floor(mainBet * 1.5)
    );


    endRound();

}


// ==========================================
// HIT
// ==========================================

hitButton.addEventListener(
    "click",
    hit
);


function hit() {

    if (!roundActive) return;

    const hand =
        playerHands[currentHand];


    // Split Aces only receive one card
    if (hand.splitAces) return;


    hand.cards.push(
        drawCard()
    );


    const value =
        handValue(hand.cards);


    renderGame();


    if (value >= 21) {

        stand();

    }

}


// ==========================================
// STAND
// ==========================================

standButton.addEventListener(
    "click",
    stand
);


function stand() {

    if (!roundActive) return;


    playerHands[currentHand]
        .finished = true;


    if (
        currentHand <
        playerHands.length - 1
    ) {

        currentHand++;

        message(
            "HAND " +
            (currentHand + 1) +
            " — YOUR MOVE"
        );

        renderGame();

        return;

    }


    dealerTurn();

}


// ==========================================
// DOUBLE
// ==========================================

doubleButton.addEventListener(
    "click",
    () => {

        if (!roundActive) return;

        const hand =
            playerHands[currentHand];


        if (
            hand.cards.length !== 2
        ) {
            return;
        }


        const extraBet =
            hand.bet;


        if (
            getBalance() < extraBet
        ) {

            message(
                "NOT ENOUGH BALANCE"
            );

            return;
        }


        removeBalance(extraBet);

        hand.bet += extraBet;

        hand.doubled = true;


        // Exactly one card
        hand.cards.push(
            drawCard()
        );


        renderGame();


        setTimeout(
            stand,
            400
        );

    }
);


// ==========================================
// SPLIT
// ==========================================

splitButton.addEventListener(
    "click",
    splitHand
);


function splitHand() {

    if (!roundActive) return;

    if (playerHands.length >= 2) {
        return;
    }


    const hand =
        playerHands[0];


    if (
        hand.cards.length !== 2
    ) {
        return;
    }


    if (
        !sameValue(
            hand.cards[0],
            hand.cards[1]
        )
    ) {
        return;
    }


    if (
        getBalance() < hand.bet
    ) {

        message(
            "NOT ENOUGH BALANCE TO SPLIT"
        );

        return;
    }


    removeBalance(hand.bet);


    const card1 =
        hand.cards[0];

    const card2 =
        hand.cards[1];


    const isAceSplit =
        card1.rank === "A";


    playerHands = [

        {
            cards: [
                card1,
                drawCard()
            ],

            bet: hand.bet,

            finished: false,

            doubled: false,

            splitAces: isAceSplit
        },

        {
            cards: [
                card2,
                drawCard()
            ],

            bet: hand.bet,

            finished: false,

            doubled: false,

            splitAces: isAceSplit
        }

    ];


    currentHand = 0;


    // Split aces automatically stand
    if (isAceSplit) {

        playerHands[0].finished = true;

    }


    renderGame();


    if (isAceSplit) {

        currentHand = 1;

        playerHands[1].finished = true;

        dealerTurn();

    }

}


// ==========================================
// INSURANCE
// ==========================================

insuranceButton.addEventListener(
    "click",
    takeInsurance
);


function takeInsurance() {

    if (!roundActive) return;

    if (
        dealerHand[1].rank !== "A"
    ) {
        return;
    }


    if (insuranceBet > 0) {
        return;
    }


    const amount =
        Math.floor(
            mainBet / 2
        );


    if (
        getBalance() < amount
    ) {

        message(
            "NOT ENOUGH BALANCE"
        );

        return;
    }


    removeBalance(amount);

    insuranceBet = amount;


    message(
        "INSURANCE: $" + amount
    );


    renderGame();

}


// ==========================================
// DEALER
// ==========================================

function dealerTurn() {

    dealerHidden = false;

    renderGame();


    // Insurance settlement
    if (
        isBlackjack(dealerHand)
    ) {

        if (insuranceBet > 0) {

            // 2:1 profit + original insurance
            addBalance(
                insuranceBet * 3
            );

        }


        settleDealerBlackjack();

        return;

    }


    // Insurance loses
    insuranceBet = 0;


    setTimeout(
        dealerDraw,
        500
    );

}


function dealerDraw() {

    const value =
        handValue(dealerHand);


    if (value < 17) {

        dealerHand.push(
            drawCard()
        );

        renderGame();


        setTimeout(
            dealerDraw,
            500
        );

        return;

    }


    settleHands();

}


// ==========================================
// DEALER BLACKJACK
// ==========================================

function settleDealerBlackjack() {

    for (const hand of playerHands) {

        if (
            isBlackjack(hand.cards)
        ) {

            // Push
            addBalance(hand.bet);

        }

    }


    message(
        "DEALER BLACKJACK"
    );


    endRound();

}


// ==========================================
// SETTLEMENT
// ==========================================

function settleHands() {

    const dealerValue =
        handValue(dealerHand);


    for (const hand of playerHands) {

        const playerValue =
            handValue(hand.cards);


        if (playerValue > 21) {

            // Lose
            continue;

        }


        if (dealerValue > 21) {

            // Player wins
            addBalance(
                hand.bet * 2
            );

            continue;

        }


        if (playerValue > dealerValue) {

            addBalance(
                hand.bet * 2
            );

        }

        else if (
            playerValue === dealerValue
        ) {

            // Push
            addBalance(
                hand.bet
            );

        }

    }


    const playerBest =
        Math.max(
            ...playerHands.map(
                hand =>
                    handValue(hand.cards)
            )
        );


    if (playerBest > dealerValue) {

        message("YOU WIN");

    }

    else if (
        playerBest === dealerValue
    ) {

        message("PUSH");

    }

    else {

        message("DEALER WINS");

    }


    endRound();

}


// ==========================================
// END ROUND
// ==========================================

function endRound() {

    roundActive = false;

    dealerHidden = false;

    insuranceBet = 0;

    renderGame();

    updateButtons();

}


// ==========================================
// NEW ROUND
// ==========================================

newRoundButton.addEventListener(
    "click",
    () => {

        dealerHand = [];

        playerHands = [];

        currentHand = 0;

        mainBet = 0;

        insuranceBet = 0;

        betHistory = [];

        roundActive = false;

        dealerHidden = true;

        message(
            "PLACE YOUR BET"
        );

        renderGame();

    }
);


// ==========================================
// MESSAGE
// ==========================================

function message(text) {

    gameMessage.textContent = text;

}


// ==========================================
// BUTTONS
// ==========================================

function updateButtons() {

    const hand =
        playerHands[currentHand];


    hitButton.disabled =
        !roundActive ||
        !hand ||
        hand.splitAces;


    standButton.disabled =
        !roundActive ||
        !hand;


    doubleButton.disabled =
        !roundActive ||
        !hand ||
        hand.cards.length !== 2 ||
        getBalance() < hand.bet ||
        hand.splitAces;


    splitButton.disabled =
        !roundActive ||
        playerHands.length >= 2 ||
        !hand ||
        hand.cards.length !== 2 ||
        !sameValue(
            hand.cards[0],
            hand.cards[1]
        ) ||
        getBalance() < hand.bet;


    insuranceButton.disabled =
        !roundActive ||
        dealerHand.length < 2 ||
        dealerHand[1].rank !== "A" ||
        insuranceBet > 0;


    dealButton.disabled =
        roundActive ||
        mainBet <= 0;


}


// ==========================================
// START
// ==========================================

renderGame();