'use strict';

var _ = require('lodash');

var CalculatorEngineOperator = require('financial-calculator-engine/lib/operator'),
	CalculatorEngineMath = require('financial-calculator-engine/lib/math');

module.exports = function(engine) {
	// Calculator engine configuration
	var config = engine.config();

	// Extension plugin for the loan repayment calculator.
	// Adds the interest rate value on the loan for a given period of time.
	class InterestRateOperator extends CalculatorEngineOperator {
		constructor(options) {
			super('interest-rate', {
				startPeriod: options.startPeriod,
				endPeriod: options.endPeriod
			});

			var defaults = {
				interestRate: 0,
				interestRateFrequency: config.frequency.year,
				effInterestRate: 0
			};

			this.context = _.merge({}, defaults, {
				interestRate: options.interestRate,
				interestRateFrequency: options.interestRateFrequency
			});
		}

		process(period, context) {
			this.context.effInterestRate = CalculatorEngineMath.effInterestRate(
				this.context.interestRate,
				this.context.interestRateFrequency,
				context.repaymentFrequency
			);

			super.process(context);
		}
	}

	// Add entry point `interestRate()` to the `CalculatorEngine` prototype.
	engine.interestRate = function(options) {
		this.addOperator(new InterestRateOperator(options));
		return this;
	};
};