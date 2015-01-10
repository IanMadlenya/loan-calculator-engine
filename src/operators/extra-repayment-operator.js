'use strict';

var _ = require('lodash');

var CalculatorEngineOperator = require('financial-calculator-engine/lib/operator'),
	CalculatorEngineMath = require('financial-calculator-engine/lib/math');

module.exports = function(engine) {
	// Calculator engine configuration
	var config = engine.config();

	// Extension plugin for the loan repayment calculator.
	// Adds extra repayment context to the loan for a given period of time.
	class ExtraRepaymentOperator extends CalculatorEngineOperator {
		constructor(options) {
			super('extra-repayment', {
				startPeriod: options.startPeriod,
				endPeriod: options.endPeriod
			});

			var defaults = {
				extraRepayment: 0,
				extraRepaymentFrequency: config.frequency.month,
				effExtraRepayment: 0
			};

			this.context = _.merge({}, defaults, {
				extraRepayment: options.extraRepayment,
				extraRepaymentFrequency: options.extraRepaymentFrequency
			});
		}

		process(period, context) {
			this.context.effExtraRepayment = CalculatorEngineMath.effExtraRepayment(
				this.context.extraRepayment,
				this.context.extraRepaymentFrequency,
				context.repaymentFrequency
			);

			super.process(context);
		}
	}

	// Add entry point `extraRepayment()` to the `CalculatorEngine` prototype.
	engine.extraRepayment = function(options) {
		this.addOperator(new ExtraRepaymentOperator(options));
		return this;
	};
};