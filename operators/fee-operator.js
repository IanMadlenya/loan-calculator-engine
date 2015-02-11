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
  var FeeOperator = (function (CalculatorEngineOperator) {
    // Options available:
    // `periodStart`, `periodEnd`, `fee`, `feeFrequency`
    function FeeOperator(options) {
      _get(Object.getPrototypeOf(FeeOperator.prototype), "constructor", this).call(this, "fee", {
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

    _inherits(FeeOperator, CalculatorEngineOperator);

    _prototypeProperties(FeeOperator, null, {
      process: {

        // Add fee information to loan context.
        value: function process(period, context) {
          var feeFrequency = this.context.feeFrequency,
              repaymentFrequency = engine.__context.repaymentFrequency;

          context.fee = context.fee || 0;
          context.fee += this.context.fee * feeFrequency / repaymentFrequency;
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return FeeOperator;
  })(CalculatorEngineOperator);
};