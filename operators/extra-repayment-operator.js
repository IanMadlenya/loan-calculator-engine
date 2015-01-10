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
  // Adds extra repayment context to the loan for a given period of time.
  var ExtraRepaymentOperator = (function () {
    var _CalculatorEngineOperator = CalculatorEngineOperator;
    var ExtraRepaymentOperator = function ExtraRepaymentOperator(options) {
      _CalculatorEngineOperator.call(this, "extra-repayment", {
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
    };

    _inherits(ExtraRepaymentOperator, _CalculatorEngineOperator);

    ExtraRepaymentOperator.prototype.process = function (period, context) {
      this.context.effExtraRepayment = CalculatorEngineMath.effExtraRepayment(this.context.extraRepayment, this.context.extraRepaymentFrequency, context.repaymentFrequency);

      _CalculatorEngineOperator.prototype.process.call(this, context);
    };

    return ExtraRepaymentOperator;
  })();

  // Add entry point `extraRepayment()` to the `CalculatorEngine` prototype.
  engine.extraRepayment = function (options) {
    this.addOperator(new ExtraRepaymentOperator(options));
    return this;
  };
};