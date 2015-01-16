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
// 	.lumpSum({
// 		period: 12,
// 		lumpSum: 10000
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point `lumpSum()` on the `engine` instance.
  engine.lumpSum = function (options) {
    this.addOperator(new LumpSumOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds lump sum context to the loan for a given period of time.
  var LumpSumOperator = (function () {
    var _CalculatorEngineOperator = CalculatorEngineOperator;
    var LumpSumOperator = (
      // Options available:
      // `period` and `lumpSum`
      function LumpSumOperator(options) {
        _CalculatorEngineOperator.call(this, "lump-sum", {
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
          lumpSum: options.lumpSum });
      }
    );

    _inherits(LumpSumOperator, _CalculatorEngineOperator);

    // Adds new information to loan context.
    // Properties: `lumpSum`.
    LumpSumOperator.prototype.process = function (period, context) {
      // Merge operator's context into loan's context.
      _CalculatorEngineOperator.prototype.process.call(this, context);
    };

    return LumpSumOperator;
  })();
};