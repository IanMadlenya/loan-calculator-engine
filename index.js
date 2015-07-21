"use strict";

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

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _ = require("lodash");

var CalculatorEngine = require("financial-calculator-engine"),
    CalculatorEngineMath = require("financial-calculator-engine/lib/math");

var FeeOperator = require("./operators/fee-operator"),
    OffsetOperator = require("./operators/offset-operator"),
    LumpSumOperator = require("./operators/lump-sum-operator"),
    InterestRateOperator = require("./operators/interest-rate-operator"),
    ExtraRepaymentOperator = require("./operators/extra-repayment-operator");

// Base context handles the calculator initial state set by the user during
// the engine initialization.
var Context = (function () {
  function Context(options, config) {
    var defaults = {
      presentValue: 0,

      interestRate: 0,
      interestRateFrequency: config.frequency.year,
      effInterestRate: 0,

      term: 0,
      termFrequency: config.frequency.year,
      effTerm: 0,

      repayment: 0,
      repaymentType: LoanCalculatorEngine.repaymentType.principalAndInterest,
      repaymentFrequency: config.frequency.month
    };

    // Extend default values with the options passed in.
    _.merge(this, defaults, options);

    // Calculate effective values eg. normalize the repayment frequency.
    this.__normalizeValues();
  }

  _prototypeProperties(Context, null, {
    __normalizeValues: {
      value: function NormalizeValues() {
        // Calculate the interest rate per period.
        this.effInterestRate = CalculatorEngineMath.effInterestRate(this.interestRate, this.interestRateFrequency, this.repaymentFrequency);

        // Calculate the term if not available.
        // Useful for calculating dynamic term
        // based on principal, interest and repayment.
        if (!this.term) {
          var nper = CalculatorEngineMath.nper(this.presentValue, this.effInterestRate, this.repayment);

          this.term = nper / this.repaymentFrequency;
        }

        // Calculate the total number of periods for a given loan.
        this.effTerm = CalculatorEngineMath.effTerm(this.term, this.termFrequency, this.repaymentFrequency);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Context;
})();

var Amortization = function Amortization() {
  this.futureValue = 0;
  this.repayment = 0;
  this.interestPaid = 0;
  this.principalPaid = 0;
};

// Loan Calculator Engine
// Calculates a loan and its amortization table.
// Example:
// ```
// var LoanCalculatorEngine = require('financial-loan-calculator-engine');
//
// var loan = new LoanCalculatorEngine({
//  principal: 100000,
//  interestRate: 0.1,
//  term: 10
// });
//
// var results = loan.calculate();
// ```
var LoanCalculatorEngine = (function (CalculatorEngine) {
  function LoanCalculatorEngine(options) {
    _get(Object.getPrototypeOf(LoanCalculatorEngine.prototype), "constructor", this).call(this, options);

    this.use.apply(this, [FeeOperator, OffsetOperator, LumpSumOperator, InterestRateOperator, ExtraRepaymentOperator]);

    this.totals = null;
    this.scheduleList = null;
  }

  _inherits(LoanCalculatorEngine, CalculatorEngine);

  _prototypeProperties(LoanCalculatorEngine, null, {
    context: {
      value: function context(options) {
        if (options) {
          var config = this.config();
          options = new Context(options, config);
        }

        return _get(Object.getPrototypeOf(LoanCalculatorEngine.prototype), "context", this).call(this, options);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    calculate: {
      value: function calculate() {
        this.__beforeCalculate();
        this.__calculate();
        this.__afterCalculate();

        return {
          totals: this.totals,
          scheduleList: this.scheduleList
        };
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __calculate: {

      // Calculates a loan and its ammortization table.
      // Calculations is done on per period basis.
      value: function Calculate() {
        var period = 1,
            effTerm = this.__context.effTerm;

        for (; period <= effTerm; period++) {
          var prevScheduleItem = _.last(this.scheduleList);

          var context = this.__calculateContext(period, prevScheduleItem);
          var amortization = this.__calculateAmortization(context);

          this.scheduleList.push({
            period: period,
            context: context,
            amortization: amortization
          });

          // Might not calculate the entire effTerm ie. loan has extra repayment or off set.
          if (amortization.futureValue <= 0) {
            break;
          }
        }
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __calculateContext: {

      // Create context.
      value: function CalculateContext(period, prevScheduleItem) {
        var prevFutureValue = prevScheduleItem.amortization.futureValue,
            prevEffInterestRate = prevScheduleItem.context.effInterestRate,
            prevRepayment = prevScheduleItem.context.repayment;

        // Create new context
        var context = this.context();

        // Present value is the last amortization's future value.
        context.presentValue = prevFutureValue;

        // Select all operators active at this period.
        // Operator start and end periods are inclusive.
        var operators = this.getOperatorsAt(period);
        _.forEach(operators, function (operator) {
          // Merge operator's data into context.
          operator.process(period, context);
        });

        // Calculate Repayment
        var hasChangedEffInterestRate = prevEffInterestRate !== context.effInterestRate,
            mustRecalculateRepayment = !prevRepayment || hasChangedEffInterestRate;

        context.repayment = mustRecalculateRepayment ? this.__calculateRepayment(period, context) : prevRepayment;

        return context;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __calculateAmortization: {

      // Calculate current amortization results for a given period.
      value: function CalculateAmortization(context) {
        // Repayment
        var repayment = context.repayment; // Base repayment
        repayment += context.effExtraRepayment || 0; // Add extra Repayment
        repayment += context.lumpSum || 0; // Add Lump Sum

        // Offset
        // Substract the offset amount from the current principal balance amount.
        // This new balance will be used to calculate the insterest paid.
        var offset = context.offset || 0,
            consideredPrincipal = context.presentValue - offset;

        // Interest Paid
        var interestPaid = consideredPrincipal * context.effInterestRate;
        interestPaid = Math.max(interestPaid, 0);

        // Cap Max Repayment
        if (repayment > context.presentValue) {
          repayment = context.presentValue + interestPaid;
        }

        // Principal Paid
        var principalPaid = repayment - interestPaid;

        // Principal Balance
        var futureValue = context.presentValue - principalPaid;

        // Fee amount is paid on top of the regular repayment and
        // it shouldn't affect the interest paid or principal balance.
        repayment += context.fee || 0;

        var amortization = new Amortization();
        amortization.repayment = repayment;
        amortization.interestPaid = interestPaid;
        amortization.principalPaid = principalPaid;
        amortization.futureValue = futureValue;
        return amortization;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __calculateRepayment: {
      value: function CalculateRepayment(period, context) {
        var repayment = 0;

        var presentValue = context.presentValue,
            effInterestRate = context.effInterestRate,
            effTermRemaining = context.effTerm - period + 1;

        var isInterestOnly = context.repaymentType === LoanCalculatorEngine.repaymentType.interestOnly;

        if (isInterestOnly) {
          repayment = presentValue * effInterestRate;
        } else {
          repayment = CalculatorEngineMath.pmt(presentValue, effInterestRate, effTermRemaining);
        }

        return repayment;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __beforeCalculate: {
      value: function BeforeCalculate() {
        this.__clearResults();
        this.__calculateInitialPeriod();
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __clearResults: {
      value: function ClearResults() {
        this.totals = null;
        this.scheduleList = [];
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __calculateInitialPeriod: {
      value: function CalculateInitialPeriod() {
        var context = this.context();

        var amortization = new Amortization();
        amortization.futureValue = context.presentValue;

        this.scheduleList.push({
          period: 0,
          context: context,
          amortization: amortization
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __afterCalculate: {
      value: function AfterCalculate() {
        this.__calculateTotals();
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    __calculateTotals: {
      value: function CalculateTotals() {
        var amortizationList = this.scheduleList.map(function (scheduleItem) {
          return scheduleItem.amortization;
        });

        // Sum totals
        this.totals = amortizationList.reduce(function (previous, current) {
          return {
            repayment: previous.repayment + current.repayment,
            interestPaid: previous.interestPaid + current.interestPaid
          };
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return LoanCalculatorEngine;
})(CalculatorEngine);

// Interal constants (static object).
LoanCalculatorEngine.repaymentType = {
  interestOnly: "IO",
  principalAndInterest: "PI"
};

module.exports = LoanCalculatorEngine;