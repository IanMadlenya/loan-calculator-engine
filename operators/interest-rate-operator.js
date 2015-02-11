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

var CalculatorEngineOperator = require("financial-calculator-engine/lib/operator"),
    CalculatorEngineMath = require("financial-calculator-engine/lib/math");

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
module.exports = function (engine) {
  // Adds entry point/method `interestRate()` on the `engine` instance.
  engine.interestRate = function (options) {
    this.addOperator(new InterestRateOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds the interest rate value on the loan for a given period of time.
  var InterestRateOperator = (function (CalculatorEngineOperator) {
    // Options available:
    // `startPeriod`, `endPeriod` and
    // `interestRate`, `interestRateFrequency`, `effInterestRate`.
    function InterestRateOperator(options) {
      _get(Object.getPrototypeOf(InterestRateOperator.prototype), "constructor", this).call(this, "interest-rate", {
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

    _inherits(InterestRateOperator, CalculatorEngineOperator);

    _prototypeProperties(InterestRateOperator, null, {
      process: {

        // Adds new information to loan context.
        // Properties: `interestRate`, `interestRateFrequency`, `effInterestRate`.
        value: function process(period, context) {
          this.context.effInterestRate = CalculatorEngineMath.effInterestRate(this.context.interestRate, this.context.interestRateFrequency, context.repaymentFrequency);

          // Merge operator's context into loan's context.
          _get(Object.getPrototypeOf(InterestRateOperator.prototype), "process", this).call(this, context);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return InterestRateOperator;
  })(CalculatorEngineOperator);
};