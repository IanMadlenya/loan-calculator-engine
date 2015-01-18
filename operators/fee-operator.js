"use strict";

var _inherits = function (child, parent) {
  child.prototype = Object.create(parent && parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (parent) child.__proto__ = parent;
};

"use strict";

var _ = require("lodash");

var CalculatorEngineOperator = require("financial-calculator-engine/lib/operator");

// Example:
// ```
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan
// 	.fee({
//		upfrontFee: 100,
//		ongoingFee: 100
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point `fee()` on the `engine` instance.
  engine.fee = function (options) {
    if (options.upfrontFee) {
      var upfrontFee = new FeeOperator({
        startPeriod: 1,
        endPeriod: 1,
        fee: options.upfrontFee,
        feeFrequency: engine.__context.repaymentFrequency
      });

      this.addOperator(upfrontFee);
    }

    if (options.ongoingFee) {
      var ongoingFee = new FeeOperator({
        startPeriod: options.startPeriod,
        endPeriod: options.endPeriod,
        fee: options.ongoingFee,
        feeFrequency: options.ongoingFeeFrequency
      });

      this.addOperator(ongoingFee);
    }

    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds fee context to the loan for a given period of time.
  var FeeOperator = (function () {
    var _CalculatorEngineOperator = CalculatorEngineOperator;
    var FeeOperator = (
      // Options available:
      // `periodStart`, `periodEnd`, `fee`, `feeFrequency`
      function FeeOperator(options) {
        _CalculatorEngineOperator.call(this, "fee", {
          startPeriod: options.startPeriod,
          endPeriod: options.endPeriod
        });

        // Calculator engine configuration
        var config = engine.config();

        // Default options
        var defaults = {
          fee: 0,
          feeFrequency: config.frequency.month
        };

        // Extend the default object with the `options` passed in.
        // Assigns it to the internal context.
        this.context = _.merge({}, defaults, {
          fee: options.fee,
          feeFrequency: options.feeFrequency
        });
      }
    );

    _inherits(FeeOperator, _CalculatorEngineOperator);

    // Add fee information to loan context.
    FeeOperator.prototype.process = function (period, context) {
      var feeFrequency = this.context.feeFrequency, repaymentFrequency = engine.__context.repaymentFrequency;

      context.fee = context.fee || 0;
      context.fee += this.context.fee * feeFrequency / repaymentFrequency;
    };

    return FeeOperator;
  })();
};