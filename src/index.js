'use strict';

var _ = require('lodash');

var CalculatorEngine = require('./../calculator-engine'),
	CalculatorEngineMath = require('./../calculator-engine/lib/math'),
	InterestRateOperator = require('./../interest-rate-operator'),
	ExtraRepaymentOperator = require('./../extra-repayment-operator');

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

		// TODO: Review eff calc. Can it be done is a more module fashion?
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
	constructor(options) {
		super(options);

		this.config({
			isSavingsMode: false
		});

		this.use.apply(this, [
			ExtraRepaymentOperator,
			InterestRateOperator
		]);
	}

	context(options) {
		return super.context(new LoanContext(options, this.__config));
	}

	// Calculates a loan and its ammortization table.
	// Calculations is done on per period basis.
	calculate() {
		var principalBalance = this.__context.principal;

		var summaryList = [],
			contextList = [];

		for (var period = 0; period <= this.__context.effTerm; period++) {
			var context = new LoanContext(this.__context, this.__config);


			var operators = this.getOperatorsAt(period);
			operators.forEach(function(operator) {
				operator.process(period, context, principalBalance);
			});

			var summary = this.__calculateAt(period, context, principalBalance);

			summaryList.push(summary);
			contextList.push(context);

			principalBalance = summary.principalBalance;

			// Might not calculate the entire effTerm ie. loan has extra repayment or off set. 
			if (!this.__config.isSavingsMode && principalBalance <= 0) {
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

	__calculateAt(period, context, principalBalance) {
		var summary = new LoanSummary(period);

		var isInitialPeriod = (period === 0);
		if (isInitialPeriod) {
			summary.principalBalance = principalBalance;
			return summary;
		}

		var effInterestRate = context.effInterestRate,
			effExtraRepayment = context.effExtraRepayment,
			effTermRemaining = context.effTerm - period + 1;

		// Repayment
		var repayment = context.repayment,
			hasRepayment = (!!repayment);

		if (!hasRepayment) {
			var isInterestOnlyRepayment =
				(context.repaymentType === LoanCalculatorEngine.repaymentType.interestOnly);

			if (isInterestOnlyRepayment) {
				repayment = principalBalance * effInterestRate;
			} else {
				repayment = CalculatorEngineMath.pmt(
					principalBalance,
					effInterestRate,
					effTermRemaining
				);
			}
		}

		repayment += effExtraRepayment;

		// Interest and Principal Paid
		var interestPaid = principalBalance * effInterestRate,
			principalPaid = 0;

		if (!this.__config.isSavingsMode) {
			if (repayment > principalBalance) {
				repayment = principalBalance + interestPaid;
			}

			principalPaid = repayment - interestPaid;
			principalBalance = principalBalance - principalPaid;
		} else {
			principalBalance = principalBalance + repayment + interestPaid;
		}

		summary.repayment = repayment;
		summary.interestPaid = interestPaid;
		summary.principalPaid = principalPaid;
		summary.principalBalance = principalBalance;
		return summary;
	}

	__postCalculation(summaryList, contextList, totals) {
		this.__calculateInterestBalance(summaryList, totals);
	}

	__calculateInterestBalance(summaryList, totals) {
		var isSavingsMode = this.__config.isSavingsMode;

		var interestBalance = isSavingsMode ? 0 : totals.interestPaid;

		summaryList.forEach(function(summary) {
			interestBalance -= isSavingsMode ?
				summary.interestPaid * -1 :
				summary.interestPaid;

			summary.interestBalance = interestBalance;
		});
	}
}

LoanCalculatorEngine.repaymentType = {
	interestOnly: 'IO',
	principalAndInterest: 'PI'
};

module.exports = LoanCalculatorEngine;