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

module.exports = function (engine) {
  // Calculator engine configuration
  var config = engine.config();

  // Extension plugin for the loan repayment calculator.
  // Adds the interest rate value on the loan for a given period of time.
  var InterestRateOperator = (function () {
    var _CalculatorEngineOperator = CalculatorEngineOperator;
    var InterestRateOperator = function InterestRateOperator(options) {
      _CalculatorEngineOperator.call(this, "interest-rate", {
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
    };

    _inherits(InterestRateOperator, _CalculatorEngineOperator);

    InterestRateOperator.prototype.process = function (period, context) {
      this.context.effInterestRate = CalculatorEngineMath.effInterestRate(this.context.interestRate, this.context.interestRateFrequency, context.repaymentFrequency);

      _CalculatorEngineOperator.prototype.process.call(this, context);
    };

    return InterestRateOperator;
  })();

  // Add entry point `interestRate()` to the `CalculatorEngine` prototype.
  engine.interestRate = function (options) {
    this.addOperator(new InterestRateOperator(options));
    return this;
  };
};