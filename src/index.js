'use strict';

var _ = require('lodash');

// var CalculatorEngine = require('./../calculator-engine'),
// 	CalculatorEngineMath = require('./../calculator-engine/lib/math');

var CalculatorEngine = require('financial-calculator-engine'),
	CalculatorEngineMath = require('financial-calculator-engine/lib/math');

// Loan Context class
// Input values used in the calculation ie. `principal`, `term`...
class LoanContext {
	constructor(context, config) {
		var defaults = {
			principal: 0,

			interestRate: 0,
			interestRateFrequency: config.frequency.year,
			effInterestRate: 0,

			term: 0,
			termFrequency: config.frequency.year,
			effTerm: 0,

			extraRepayment: 0,
			extraRepaymentFrequency: config.frequency.month,
			effExtraRepayment: 0,

			repayment: 0,
			repaymentType: LoanCalculatorEngine.repaymentType.principalAndInterest,
			repaymentFrequency: config.frequency.month
		};

		// Extend default values with the options passed in.
		_.merge(this, defaults, context);

		// Calculate the total number of periods for a given loan.
		this.effTerm = CalculatorEngineMath.effTerm(
			this.term,
			this.termFrequency,
			this.repaymentFrequency
		);

		// Calculate the interest rate per period.
		this.effInterestRate = CalculatorEngineMath.effInterestRate(
			this.interestRate,
			this.interestRateFrequency,
			this.repaymentFrequency
		);

		this.effExtraRepayment = CalculatorEngineMath.effExtraRepayment(
			this.extraRepayment,
			this.extraRepaymentFrequency,
			this.repaymentFrequency
		);
	}
}

// Loan Summary Item class
// Used to store the calculation results ie. ammortization table
class LoanSummary {
	constructor(periodAt) {
		this.period = periodAt;
		this.principalBalance = 0;
		this.effPrincipalBalance = 0;
		this.interestBalance = 0;
		this.interestPaid = 0;
		this.principalPaid = 0;
		this.repayment = 0;
	}
}

// Loan Calculator Engine class
// Calculates a loan and its ammortization table.
// Example:
// ```
// var LoanCalculatorEngine = require('financial-loan-calculator-engine');
//
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.01,
// 	term: 10
// });
//
// var results = loan.calculate();
// ```
class LoanCalculatorEngine extends CalculatorEngine {
	constructor() {
		super();

		this.config({
			stopAtZeroPV: true
		});
	}

	context(options) {
		return super.context(new LoanContext(options, this.__config));
	}

	// Calculates a loan and its ammortization table.
	// Calculations is done on per period basis.
	calculate() {
		var period = 1,
			principalBalance = this.__context.principal,
			effPrincipalBalance = this.__context.principal,
			effTerm = this.__context.effTerm;

		var summaryList = [],
			contextList = [];

		for (var period = 0; period <= effTerm; period++) {
			var context = new LoanContext(this.__context, this.__config);

			var operators = this.getOperatorsAt(period);
			operators.forEach(function(operator) {
				operator.process(context);
			});

			var summary = this.__calculateAt(period, context, principalBalance, effPrincipalBalance);

			summaryList.push(summary);
			contextList.push(context);

			principalBalance = summary.principalBalance;
			effPrincipalBalance = summary.effPrincipalBalance;

			// Might not calculate the entire effTerm ie. loan has extra repayment or off set. 
			if (this.__config.stopAtZeroPV && principalBalance <= 0) {
				break;
			}
		}

		// Sum totals
		var totals = summaryList.reduce(function(previous, current) {
			return {
				repayment: previous.repayment + current.repayment,
				interestPaid: previous.interestPaid + current.interestPaid
			};
		});

		this.__postCalculation(summaryList, contextList, totals);

		return {
			summaryList,
			contextList,
			totals
		};
	}

	__calculateAt(period, context, principalBalance, effPrincipalBalance) {
		var summary = new LoanSummary(period),
			isInitialPeriod = (period == 0);

		if (isInitialPeriod) {
			summary.principalBalance = principalBalance;
			summary.effPrincipalBalance = principalBalance;
			return summary;
		}

		var effInterestRate = context.effInterestRate,
			effExtraRepayment = context.effExtraRepayment,
			effTermRemaining = context.effTerm - period + 1,
			repayment = context.repayment;

		// Repayment
		var hasRepayment = (!!context.repayment);

		if (!hasRepayment) {
			var isInterestOnlyRepayment =
				(context.repaymentType === LoanCalculatorEngine.repaymentType.interestOnly);

			if (isInterestOnlyRepayment) {
				repayment = effPrincipalBalance * effInterestRate;
			} else {
				repayment = CalculatorEngineMath.pmt(
					effPrincipalBalance,
					effInterestRate,
					effTermRemaining
				);
			}
		}

		repayment += effExtraRepayment;

		// Interest Paid
		var interestPaid = effPrincipalBalance * effInterestRate;

		// Principal Paid
		var principalPaid =
			Math.min(
				principalBalance,
				repayment - interestPaid
			);

		summary.repayment = repayment;
		summary.interestPaid = interestPaid;
		summary.principalPaid = principalPaid;
		summary.principalBalance = principalBalance - principalPaid;
		summary.effPrincipalBalance = effPrincipalBalance - principalPaid + effExtraRepayment;
		return summary;
	}

	__postCalculation(summaryList, contextList, totals) {
		this.__calculateInterestBalance(summaryList, totals);
	}

	__calculateInterestBalance(summaryList, totals) {
		var interestBalance = totals.interestPaid;

		summaryList.forEach(function(summary) {
			interestBalance -= summary.interestPaid;
			summary.interestBalance = interestBalance;
		});
	}
}

LoanCalculatorEngine.repaymentType = {
	interestOnly: 'IO',
	principalAndInterest: 'PI'
};

module.exports = LoanCalculatorEngine;