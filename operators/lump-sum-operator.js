"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _get = function get(object, property, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    return desc.value;
  } else {
    var getter = desc.get;
    if (getter === undefined) {
      return undefined;
    }
    return getter.call(receiver);
  }
};

var _inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) subClass.__proto__ = superClass;
};

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
  var LumpSumOperator = (function (CalculatorEngineOperator) {
    // Options available:
    // `period` and `lumpSum`
    function LumpSumOperator(options) {
      _get(Object.getPrototypeOf(LumpSumOperator.prototype), "constructor", this).call(this, "lump-sum", {
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

    _inherits(LumpSumOperator, CalculatorEngineOperator);

    _prototypeProperties(LumpSumOperator, null, {
      process: {

        // Adds new information to loan context.
        // Properties: `lumpSum`.
        value: function process(period, context) {
          // Merge operator's context into loan's context.
          _get(Object.getPrototypeOf(LumpSumOperator.prototype), "process", this).call(this, context);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return LumpSumOperator;
  })(CalculatorEngineOperator);
};