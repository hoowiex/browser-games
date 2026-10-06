// ==========================================
// ROYAL CASINO - SHARED WALLET
// ==========================================

const CASINO_BALANCE_KEY = "royalCasinoBalance";

const DEFAULT_BALANCE = 1000;


// Games override this so the wallet knows when chips are on the table.
// The $0 -> $1,000 reset is blocked while it returns true, otherwise you
// could go all-in, click the balance and get a free $1,000.
window.casinoStakeInPlay = function () {
    return false;
};


// ------------------------------------------
// GET BALANCE
// ------------------------------------------

function getBalance() {

    const saved =
        localStorage.getItem(CASINO_BALANCE_KEY);

    if (saved === null) {
        localStorage.setItem(
            CASINO_BALANCE_KEY,
            DEFAULT_BALANCE
        );

        return DEFAULT_BALANCE;
    }

    const value = Number(saved);

    // Guard against a corrupted / hand-edited value
    return Number.isFinite(value) && value >= 0
        ? value
        : DEFAULT_BALANCE;
}


// ------------------------------------------
// SET BALANCE
// ------------------------------------------

function setBalance(amount) {

    amount = Math.max(0, Math.floor(amount));

    localStorage.setItem(
        CASINO_BALANCE_KEY,
        amount
    );

    updateCasinoBalanceDisplays();

    return amount;
}


// ------------------------------------------
// ADD MONEY
// ------------------------------------------

function addBalance(amount) {

    return setBalance(
        getBalance() + amount
    );
}


// ------------------------------------------
// REMOVE MONEY
// ------------------------------------------

function removeBalance(amount) {

    const balance = getBalance();

    if (amount > balance) {
        return false;
    }

    setBalance(balance - amount);

    return true;
}


// ------------------------------------------
// FORMAT MONEY
// ------------------------------------------

function formatMoney(amount) {

    // en-US so every page shows $1,000 (not $1.000 on German browsers)
    return "$" + Number(amount).toLocaleString("en-US");
}


// ------------------------------------------
// UPDATE BALANCE UI
// ------------------------------------------

function updateCasinoBalanceDisplays() {

    const balance =
        getBalance();

    document
        .querySelectorAll("[data-casino-balance]")
        .forEach(element => {

            element.textContent =
                formatMoney(balance);

        });
}


// ------------------------------------------
// RESET BALANCE
// ------------------------------------------

function resetCasinoBalance() {

    setBalance(DEFAULT_BALANCE);

}


// ------------------------------------------
// CLICK BALANCE AT $0 TO RESET
// ------------------------------------------

document.addEventListener("click", event => {

    const balanceElement =
        event.target.closest("[data-casino-balance]");

    if (!balanceElement) return;

    // $0 only counts as "broke" when nothing is staked
    if (
        getBalance() === 0 &&
        !window.casinoStakeInPlay()
    ) {

        resetCasinoBalance();

        balanceElement.classList.add("balance-reset");

        setTimeout(() => {

            balanceElement.classList.remove(
                "balance-reset"
            );

        }, 600);

    }

});


// ------------------------------------------
// KEEP OPEN TABS IN SYNC
// ------------------------------------------

window.addEventListener("storage", event => {

    if (event.key === CASINO_BALANCE_KEY) {
        updateCasinoBalanceDisplays();
    }

});


// ------------------------------------------
// INITIALIZE
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    updateCasinoBalanceDisplays
);
