'use strict';

var _ = require('lodash');

var CalculatorEngineOperator = require('financial-calculator-engine/lib/operator'),
	CalculatorEngineMath = require('financial-calculator-engine/lib/math');

// Example:
// ```
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan
// 	.interestRate({
// 		endPeriod: 12,
// 		interestRate: 0.15
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function(engine) {
	// Adds entry point/method `interestRate()` on the `engine` instance.
	engine.interestRate = function(options) {
		this.addOperator(new InterestRateOperator(options));
		return this;
	};

	// Extension plugin for the loan repayment calculator.
	// Adds the interest rate value on the loan for a given period of time.
	class InterestRateOperator extends CalculatorEngineOperator {
		// Options available:
		// `startPeriod`, `endPeriod` and
		// `interestRate`, `interestRateFrequency`, `effInterestRate`.
		constructor(options) {
			super('interest-rate', {
				startPeriod: options.startPeriod,
				endPeriod: options.endPeriod
			});

			// Calculator engine configuration
			var config = engine.config();

			// Default options
			var defaults = {
				interestRate: 0,
				interestRateFrequency: config.frequency.year,
				effInterestRate: 0
			};

			// Extend the default object with the `options` passed in.
			// Assigns it to the internal context.
			this.context = _.merge({}, defaults, {
				interestRate: options.interestRate,
				interestRateFrequency: options.interestRateFrequency
			});
		}

		// Adds new information to loan context.
		// Properties: `interestRate`, `interestRateFrequency`, `effInterestRate`.
		process(period, context) {
			this.context.effInterestRate = CalculatorEngineMath.effInterestRate(
				this.context.interestRate,
				this.context.interestRateFrequency,
				context.repaymentFrequency
			);

			// Merge operator's context into loan's context.
			super.process(context);
		}
	}
};