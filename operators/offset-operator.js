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
// 	.offset({
// 		offset: 10000
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point `offset()` on the `engine` instance.
  engine.offset = function (options) {
    this.addOperator(new OffsetOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds offset context to the loan for a given period of time.
  var OffsetOperator = (function () {
    var _CalculatorEngineOperator = CalculatorEngineOperator;
    var OffsetOperator = (
      // Options available: `offset`
      function OffsetOperator(options) {
        _CalculatorEngineOperator.call(this, "offset");

        // Default options
        var defaults = {
          offset: 0
        };

        // Extend the default object with the `options` passed in.
        // Assigns it to the internal context.
        this.context = _.merge({}, defaults, {
          offset: options.offset });
      }
    );

    _inherits(OffsetOperator, _CalculatorEngineOperator);

    // Adds new information to loan context.
    // Properties: `offset`.
    OffsetOperator.prototype.process = function (period, context) {
      // Merge operator's context into loan's context.
      _CalculatorEngineOperator.prototype.process.call(this, context);
    };

    return OffsetOperator;
  })();
};