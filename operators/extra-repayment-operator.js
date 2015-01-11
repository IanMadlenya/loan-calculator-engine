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

var CalculatorEngineOperator = require("financial-calculator-engine/lib/operator"), CalculatorEngineMath = require("financial-calculator-engine/lib/math");

// Example:
// ```
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan
// 	.extraRepayment({
// 		startPeriod: 13,
// 		extraRepayment: 100
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point/method `extraRepayment()` on the `engine` instance.
  engine.extraRepayment = function (options) {
    this.addOperator(new ExtraRepaymentOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds extra repayment context to the loan for a given period of time.
  var ExtraRepaymentOperator = (function () {
    var _CalculatorEngineOperator = CalculatorEngineOperator;
    var ExtraRepaymentOperator = (
      // Options available:
      // `startPeriod`, `endPeriod` and
      // `extraRepayment`, `extraRepaymentFrequency`, `effExtraRepayment`.
      function ExtraRepaymentOperator(options) {
        _CalculatorEngineOperator.call(this, "extra-repayment", {
          startPeriod: options.startPeriod,
          endPeriod: options.endPeriod
        });

        // Calculator engine configuration
        var config = engine.config();

        // Default options
        var defaults = {
          extraRepayment: 0,
          extraRepaymentFrequency: config.frequency.month,
          effExtraRepayment: 0
        };

        // Extend the default object with the `options` passed in.
        // Assigns it to the internal context.
        this.context = _.merge({}, defaults, {
          extraRepayment: options.extraRepayment,
          extraRepaymentFrequency: options.extraRepaymentFrequency
        });
      }
    );

    _inherits(ExtraRepaymentOperator, _CalculatorEngineOperator);

    // Adds new information to loan context.
    // Properties: `extraRepayment`, `extraRepaymentFrequency`, `effExtraRepayment`.
    ExtraRepaymentOperator.prototype.process = function (period, context) {
      this.context.effExtraRepayment = CalculatorEngineMath.effExtraRepayment(this.context.extraRepayment, this.context.extraRepaymentFrequency, context.repaymentFrequency);

      // Merge operator's context into loan's context.
      _CalculatorEngineOperator.prototype.process.call(this, context);
    };

    return ExtraRepaymentOperator;
  })();
};