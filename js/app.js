'use strict';

// DOM Elements
const form = document.querySelector('.form');
const mortgageResultContainer = document.querySelector('.mortgage__result');
const mortgageResultEmpty = document.querySelector('.result__empty--state');
const calculatedMortgageAmount = document.querySelector('.mortgage--calculated-amount');
const calculatedMortgageTotal = document.querySelector('.mortgage--calculated-total');
const btn = document.querySelector('.mortgage__btn');
const clearAll = document.querySelector('.clear__all');

// Input Fields
const mortgageAmountInput = document.getElementById('mortgage__amount');
const mortgageTermInput = document.getElementById('mortgage__term');
const mortgageInterestInput = document.getElementById('mortgage__interest-rate');

// Error Elements
const mortgageAmountError = document.querySelector('.mortgage__amount-error');
const mortgageTermError = document.querySelector('.mortgage__term-error');
const mortgageInterestRateError = document.querySelector('.mortgage__interest-error');
const mortgageTypeError = document.querySelector('.mortgage__type-error');
const iconSign = document.querySelector('.icon-sign');
const iconTerm = document.querySelector('.icon-term');
const iconRate = document.querySelector('.icon-rate');

const isValidDecimalNumber = /^(?!0$)(?!0\d)\d+(\.\d+)?$/;
const isValidWholeNumber = /^[1-9]\d*$/;

const MIN_TERM = 5;
const MAX_TERM = 40;
const MAX_RATE = 100;

/////////////////////////////////////////////////////////////////////
const helper = function () {
    return {
        showError(input, icon, textInput, message) {
            textInput.textContent = message;
            input.classList.add('mortgage__error');
            icon.classList.add('icon-error');
        },

        showMortgageTypeError(textInput, message) {
            textInput.textContent = message;
        },

        clearMortgageTypeError(textInput) {
            textInput.textContent = '';
        },

        clearError(input, icon, textInput) {
            textInput.textContent = '';
            input.classList.remove('mortgage__error');
            icon.classList.remove('icon-error');
        }
    };
};

const validate = function () {
    return {
        validateAmount(amount) {
            if (!isValidWholeNumber.test(amount)) {
                helper().showError(mortgageAmountInput, iconSign, mortgageAmountError, 'Enter a valid amount');
                return false;
            }

            helper().clearError(mortgageAmountInput, iconSign, mortgageAmountError);
            return true;
        },

        validateTerm(term) {
            if (!isValidWholeNumber.test(term)) {
                helper().showError(mortgageTermInput, iconTerm, mortgageTermError, 'Enter a valid year');
                return false;
            }

            if (term < MIN_TERM || term > MAX_TERM) {
                helper().showError(mortgageTermInput, iconTerm, mortgageTermError, 'Must be 5 - 40 years');
                return false;
            }

            helper().clearError(mortgageTermInput, iconTerm, mortgageTermError);
            return true;
        },

        validateInterestRate(rate) {
            if (!isValidDecimalNumber.test(rate)) {
                helper().showError(mortgageInterestInput, iconRate, mortgageInterestRateError, 'Invalid rate format');
                return false;
            }

            if (rate > MAX_RATE) {
                helper().showError(
                    mortgageInterestInput,
                    iconRate,
                    mortgageInterestRateError,
                    'Must be less than 100%'
                );
                return false;
            }

            helper().clearError(mortgageInterestInput, iconRate, mortgageInterestRateError);
            return true;
        }
    };
};

const calculate = function () {
    return {
        calculateMonthlyPayment(amount, term, rate) {
            const monthlyRate = rate / 12 / 100;
            const numberOfPayments = term * 12;

            return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numberOfPayments));
        },

        calculateTotalPayment(monthlyPayment, term) {
            return monthlyPayment * term * 12;
        }
    };
};

const format = function () {
    return {
        formatWithComma(value) {
            const formattedValue = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return formattedValue;
        }
    };
};

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
class Mortgage {
    constructor(inputs) {
        this.amount = inputs.amount;
        this.term = inputs.term;
        this.rate = inputs.rate;
        this.type = inputs.type;
    }
}

class MortgageCalculator {
    constructor(mortgage) {
        this.mortgage = mortgage;

        Object.assign(this, calculate());
    }

    _getMonthlyPayment() {
        const { amount, term, rate, type } = this.mortgage;

        if (type === 'repayment') {
            return this.calculateMonthlyPayment(amount, term, rate);
        }

        if (type === 'interest') {
            const monthlyRate = rate / 12 / 100;
            return amount * monthlyRate;
        }
    }

    _getTotalPayment() {
        const { term, type } = this.mortgage;
        const monthlyPayment = this._getMonthlyPayment();

        if (type === 'repayment') {
            return this.calculateTotalPayment(monthlyPayment, term);
        }

        if (type === 'interest') {
            return monthlyPayment * term * 12;
        }
    }
}

class UI {
    #parentEl = mortgageResultContainer;
    _form = form;
    _amountInput = mortgageAmountInput;
    _termInput = mortgageTermInput;
    _interestRateInput = mortgageInterestInput;
    _clearInputs = clearAll;
    _btn = btn;

    constructor() {
        this.inputs = {
            amount: null,
            term: null,
            rate: null,
            type: null
        };

        Object.assign(this, format(), helper(), validate());
        this._addInputListeners();
    }

    _addInputListeners() {
        this._amountInput.addEventListener('input', e => this._handleAmountInput('amount', e.target.value.trim()));
        this._termInput.addEventListener('input', e => this._handleTermInput('term', e.target.value.trim()));
        this._interestRateInput.addEventListener('input', e =>
            this._handleInterestRateInput('rate', e.target.value.trim())
        );

        this._btn.addEventListener('click', e => {
            e.preventDefault();
            this._init();
        });

        this._clearInputs.addEventListener('click', e => {
            this._form.reset();
            this._clearMortgageResults();
            mortgageResultEmpty.style.display = 'flex';
        });
    }

    _getSelectedMortgageType() {
        const mortgageType = document.querySelector('input[name=radio]:checked');

        if (!mortgageType) {
            this.showMortgageTypeError(mortgageTypeError, 'This field is required');
            return null;
        }

        this.clearMortgageTypeError(mortgageTypeError);
        return mortgageType.dataset.type;
    }

    _clearMortgageResults() {
        const existingResult = this.#parentEl.querySelector('.result__display');
        if (existingResult) existingResult.remove();
    }

    _init() {
        // Get selected mortgage type
        const selectedMortgageType = this._getSelectedMortgageType();

        // Check if all inputs are valid
        if (this.inputs.amount && this.inputs.term && this.inputs.rate && selectedMortgageType) {
            // Store selected mortgage type
            this.inputs.type = selectedMortgageType;

            //Create a mortgage instance
            const mortgage = new Mortgage(this.inputs);

            // Create a MortgageCalculator instance
            const mortgageCalculator = new MortgageCalculator(mortgage);

            // Render results
            this.renderMortgageResults(mortgageCalculator);
        } else {
            this.validateAmount(this.inputs.amount);
            this.validateTerm(this.inputs.term);
            this.validateInterestRate(this.inputs.rate);
            return;
        }
    }

    _handleAmountInput() {
        // Remove commas from raw value
        const rawValue = this._amountInput.value.replace(/,/g, '');

        // Validate and parse input
        const isvalid = this.validateAmount(rawValue);
        const parsedValue = isvalid ? parseInt(rawValue, 10) : null;

        // Check if input value is valid
        if (!isvalid) return;

        // Store validated input
        this.inputs.amount = parsedValue;

        // Format input value and display on input field
        const formattedValue = this.formatWithComma(this.inputs.amount);
        this._amountInput.value = formattedValue;
    }

    _handleTermInput() {
        const rawValue = this._termInput.value.trim();

        // Validate and parse input
        const isvalid = this.validateTerm(rawValue);
        const parsedValue = isvalid ? parseInt(rawValue, 10) : null;

        if (isvalid) {
            // Store validated input
            this.inputs.term = parsedValue;
        } else {
            // Reset formatted input value
            this.inputs.term = null;
        }
    }

    _handleInterestRateInput() {
        const rawValue = this._interestRateInput.value.trim();

        // Validate and parse input
        const isvalid = this.validateInterestRate(rawValue);
        const parsedValue = isvalid ? parseFloat(rawValue, 10) : null;

        if (isvalid) {
            // Store validated input
            this.inputs.rate = parsedValue;
        } else {
            // Reset formatted input value
            this.inputs.rate = null;
        }
    }

    _displayFormattedAmount(amount) {
        return this.formatWithComma(amount);
    }

    renderMortgageResults(mortgageCalculator) {
        mortgageResultEmpty.style.display = 'none';

        // Remove any existing result
        this._clearMortgageResults();

        // Get calculated values
        const monthlyPayment = mortgageCalculator._getMonthlyPayment().toFixed(2);
        const totalPayment = mortgageCalculator._getTotalPayment().toFixed(2);

        const html = `
        <div class="result__display">
            <h2 class="display__header">Your results</h2>
            <p class="display__header--description">
                Your results are shown below based on the information you provided. To adjust the results,
                edit the form and click “calculate repayments” again.
            </p>

            <div class="display__mortgage--calculated">
                <p class="mortgage--calculated-title">Your monthly repayments</p>
                <h3
                class="mortgage--calculated-amount">£${this._displayFormattedAmount(monthlyPayment)}</h3>

                <p class="mortgage--calculated-description">Total you'll repay over the term</p>
                <h4
                class="mortgage--calculated-total">£${this._displayFormattedAmount(totalPayment)}</h4>
            </div>
        </div>
    `;

        this.#parentEl.insertAdjacentHTML('afterbegin', html);
    }
}

const uiInstance = new UI();
