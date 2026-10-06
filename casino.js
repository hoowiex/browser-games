// ==========================================
// ROYAL CASINO - SHARED WALLET
// ==========================================

const CASINO_BALANCE_KEY = "royalCasinoBalance";

const DEFAULT_BALANCE = 1000;


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

    return Number(saved);
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

    return "$" + Number(amount).toLocaleString();
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

    if (getBalance() === 0) {

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
// INITIALIZE
// ------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    updateCasinoBalanceDisplays
);