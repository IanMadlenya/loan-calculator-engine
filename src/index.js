'use strict';

var _ = require('lodash');

var CalculatorEngine = require('financial-calculator-engine'),
	CalculatorEngineMath = require('financial-calculator-engine/lib/math');

var LumpSumOperator = require('./operators/lump-sum-operator'),
	InterestRateOperator = require('./operators/interest-rate-operator'),
	ExtraRepaymentOperator = require('./operators/extra-repayment-operator');

// Loan Context
// Holds the input values used in this calculator ie. `principal`, `interestRate`.
class BaseContext {
	constructor(options, config) {
		var defaults = {
			principal: 0,

			interestRate: 0,
			interestRateFrequency: config.frequency.year,
			effInterestRate: 0,

			term: 0,
			termFrequency: config.frequency.year,
			effTerm: 0,

			repayment: 0,
			repaymentType: LoanCalculatorEngine.repaymentType.principalAndInterest,
			repaymentFrequency: config.frequency.month
		};

		// Extend default values with the options passed in.
		_.merge(this, defaults, options);

		this.normalizeValues();
	}

	normalizeValues() {
		// Calculate the interest rate per period.
		this.effInterestRate = CalculatorEngineMath.effInterestRate(
			this.interestRate, this.interestRateFrequency, this.repaymentFrequency
		);

		// Calculate the total number of periods for a given loan.
		this.effTerm = CalculatorEngineMath.effTerm(
			this.term, this.termFrequency, this.repaymentFrequency
		);
	}
}

class SummaryItem {
	constructor(period) {
		this.period = period;
	}
}

class ContextItem extends SummaryItem {
	constructor(period, context) {
		super(period);

		_.merge(this, context);
	}
}

class AmortizationItem extends SummaryItem {
	constructor(period) {
		super(period);

		this.principalBalance = 0;
		this.interestBalance = 0;
		this.interestPaid = 0;
		this.principalPaid = 0;
		this.repayment = 0;
	}
}

// Loan Calculator Engine
// Calculates a loan and its ammortization table.
// Example:
// ```
// var LoanCalculatorEngine = require('financial-loan-calculator-engine');
//
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan.calculate();
// ```
class LoanCalculatorEngine extends CalculatorEngine {
	constructor(options) {
		super(options);

		this.config({
			isSavingsMode: false
		});

		this.use.apply(this, [
			LumpSumOperator,
			InterestRateOperator,
			ExtraRepaymentOperator,
		]);

		this.contextList = null;
		this.amortizationList = null;
		this.totals = null;
	}

	context(options) {
		return super.context(new BaseContext(options, this.__config));
	}

	// Calculates a loan and its ammortization table.
	// Calculations is done on per period basis.
	calculate() {
		this.__startCalculation();

		for (var period = 1; period <= this.__context.effTerm; period++) {
			// 
			var context = this.__calculateContextAt(period),
				amortization = this.__calculateAmortizationAt(period, context);

			this.contextList.push(context);
			this.amortizationList.push(amortization);

			// Might not calculate the entire effTerm ie. loan has extra repayment or off set. 
			if (!this.__config.isSavingsMode && amortization.principalBalance <= 0) {
				break;
			}
		}

		this.__endCalculation();

		return {
			totals: this.totals,
			contextList: this.contextList,
			amortizationList: this.amortizationList
		};
	}

	// Create new context
	__calculateContextAt(period) {
		var prevAmortization = _.last(this.amortizationList);

		// Create new context
		// Set period and principal amount
		// Principal amount (pv) is the last amortization's final balance.
		var context = new ContextItem(period, this.__context);
		context.principal = prevAmortization.principalBalance;

		// Select all operators active at this period.
		// Operator start and end periods are inclusive.
		var operators = this.getOperatorsAt(period);
		_.forEach(operators, function(operator) {
			// Merge operator's data into context.
			operator.process(period, context);
		});

		return context;
	}

	// Calculate current period's results.
	__calculateAmortizationAt(period, context) {
		var prevContext = _.last(this.contextList);

		var isInitialPeriod = period === 1,
			hasChangedEffInterestRate = prevContext.effInterestRate !== context.effInterestRate;

		// Repayment
		var repayment = 0;

		if (this.__config.isSavingsMode) {
			repayment = context.repayment;
		} else if (isInitialPeriod || hasChangedEffInterestRate) {
			repayment = this.__calculateRepayment(period, context);
		} else {
			repayment = prevContext.repayment;
		}

		context.repayment = repayment;

		// Extra Repayment and Lump Sum
		repayment += context.effExtraRepayment || 0;
		repayment += context.lumpSum || 0;

		// Interest Paid
		var interestPaid = context.principal * context.effInterestRate;

		// Principal Paid and Final Balance
		var principalPaid = 0,
			principalBalance = 0;

		if (this.__config.isSavingsMode) {
			principalBalance = context.principal + repayment + interestPaid;
		} else {
			if (repayment > context.principal) {
				repayment = context.principal + interestPaid;
			}

			principalPaid = repayment - interestPaid;
			principalBalance = context.principal - principalPaid;
		}

		var amortization = new AmortizationItem(period);
		amortization.repayment = repayment;
		amortization.interestPaid = interestPaid;
		amortization.principalPaid = principalPaid;
		amortization.principalBalance = principalBalance;
		return amortization;
	}

	__calculateRepayment(period, context) {
		var repayment = 0;

		var principal = context.principal,
			effInterestRate = context.effInterestRate,
			effTermRemaining = context.effTerm - period + 1;

		var isInterestOnly = context.repaymentType === LoanCalculatorEngine.repaymentType.interestOnly;

		if (isInterestOnly) {
			repayment = principal * effInterestRate;
		} else {
			repayment = CalculatorEngineMath.pmt(
				principal,
				effInterestRate,
				effTermRemaining
			);
		}

		return repayment;
	}

	__startCalculation() {
		this.__resetResults();
		this.__calculateInitialPeriod();
	}

	__resetResults() {
		this.amortizationList = [];
		this.contextList = [];
		this.totals = null;
	}

	__calculateInitialPeriod() {
		var context = new ContextItem(0, this.__context);

		var amortization = new AmortizationItem(0);
		amortization.principalBalance = context.principal;

		this.contextList.push(context);
		this.amortizationList.push(amortization);
	}

	__endCalculation() {
		this.__calculateTotals();
		this.__calculateInterestBalance();
	}

	__calculateTotals() {
		// Sum totals
		this.totals = this.amortizationList.reduce(function(previous, current) {
			return {
				repayment: previous.repayment + current.repayment,
				interestPaid: previous.interestPaid + current.interestPaid
			};
		});
	}

	__calculateInterestBalance() {
		var isSavingsMode = this.__config.isSavingsMode,
			interestBalance = isSavingsMode ? 0 : this.totals.interestPaid;

		_.forEach(this.amortizationList, function(amortization) {
			interestBalance -= isSavingsMode ?
				amortization.interestPaid * -1 :
				amortization.interestPaid;

			amortization.interestBalance = interestBalance;
		});
	}
}

// Consts - static objects.
LoanCalculatorEngine.repaymentType = {
	interestOnly: 'IO',
	principalAndInterest: 'PI'
};

module.exports = LoanCalculatorEngine;