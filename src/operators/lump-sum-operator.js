'use strict';

var _ = require('lodash');

var CalculatorEngineOperator = require('financial-calculator-engine/lib/operator');

// Example:
// ```
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan
// 	.lumpSum({
// 		period: 12,
// 		lumpSum: 10000
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function(engine) {
	// Adds entry point `lumpSum()` on the `engine` instance.
	engine.lumpSum = function(options) {
		this.addOperator(new LumpSumOperator(options));
		return this;
	};

	// Extension plugin for the loan repayment calculator.
	// Adds lump sum context to the loan for a given period of time.
	class LumpSumOperator extends CalculatorEngineOperator {
		// Options available:
		// `period` and `lumpSum`
		constructor(options) {
			super('lump-sum', {
				startPeriod: options.period,
				endPeriod: options.period
			});

			// Default options
			var defaults = {
				lumpSum: 0
			};

			// Extend the default object with the `options` passed in.
			// Assigns it to the internal context.
			this.context = _.merge({}, defaults, {
				lumpSum: options.lumpSum,
			});
		}

		// Adds new information to loan context.
		// Properties: `lumpSum`.
		process(period, context) {
			// Merge operator's context into loan's context.
			super.process(context);
		}
	}
};