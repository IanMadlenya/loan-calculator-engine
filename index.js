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

var CalculatorEngine = require("financial-calculator-engine"), CalculatorEngineMath = require("financial-calculator-engine/lib/math");

var FeeOperator = require("./operators/fee-operator"), OffsetOperator = require("./operators/offset-operator"), LumpSumOperator = require("./operators/lump-sum-operator"), InterestRateOperator = require("./operators/interest-rate-operator"), ExtraRepaymentOperator = require("./operators/extra-repayment-operator");

// BaseContext class.
// Handles the calculator initial state set by the user during
// the engine initialization.
var BaseContext = function BaseContext(options, config) {
  var defaults = {
    principal: 0,

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

  this.__normalizeValues();
};

BaseContext.prototype.__normalizeValues = function () {
  // Calculate the interest rate per period.
  this.effInterestRate = CalculatorEngineMath.effInterestRate(this.interestRate, this.interestRateFrequency, this.repaymentFrequency);

  // Calculate the total number of periods for a given loan.
  this.effTerm = CalculatorEngineMath.effTerm(this.term, this.termFrequency, this.repaymentFrequency);
};

// Base class for `ContextItem` and `AmortizationItem`.
// Must have a period.
var SummaryItem = function SummaryItem(period) {
  if (_.isUndefined(period)) {
    throw new Error("SummaryItem: `period` is undefined.");
  }

  if (_.isNaN(period)) {
    throw new Error("SummaryItem: `period` must be a number.");
  }

  this.period = period;
};

// Loan info for the given period.
var ContextItem = (function () {
  var _SummaryItem = SummaryItem;
  var ContextItem = function ContextItem(period, context) {
    _SummaryItem.call(this, period);

    _.merge(this, context);
  };

  _inherits(ContextItem, _SummaryItem);

  return ContextItem;
})();

// Loan result for the given period.
var AmortizationItem = (function () {
  var _SummaryItem2 = SummaryItem;
  var AmortizationItem = function AmortizationItem(period) {
    _SummaryItem2.call(this, period);

    this.principalBalance = 0;
    this.interestBalance = 0;
    this.interestPaid = 0;
    this.principalPaid = 0;
    this.repayment = 0;
  };

  _inherits(AmortizationItem, _SummaryItem2);

  return AmortizationItem;
})();

// Loan Calculator Engine
// Calculates a loan and its ammortization table.
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
var LoanCalculatorEngine = (function () {
  var _CalculatorEngine = CalculatorEngine;
  var LoanCalculatorEngine = function LoanCalculatorEngine(options) {
    _CalculatorEngine.call(this, options);

    this.config({
      isSavingsMode: false
    });

    this.use.apply(this, [FeeOperator, OffsetOperator, LumpSumOperator, InterestRateOperator, ExtraRepaymentOperator]);

    this.contextList = null;
    this.amortizationList = null;
    this.totals = null;
  };

  _inherits(LoanCalculatorEngine, _CalculatorEngine);

  LoanCalculatorEngine.prototype.context = function (options) {
    return _CalculatorEngine.prototype.context.call(this, new BaseContext(options, this.__config));
  };

  // Calculates a loan and its ammortization table.
  // Calculations is done on per period basis.
  LoanCalculatorEngine.prototype.calculate = function () {
    this.__startCalculation();

    for (var period = 1; period <= this.__context.effTerm; period++) {
      // Calculate context and amortization
      var context = this.__calculateContextAt(period), amortization = this.__calculateAmortizationAt(period, context);

      this.contextList.push(context);
      this.amortizationList.push(amortization);

      // Might not calculate the entire effTerm ie. loan has extra repayment or off set.
      if (!this.__config.isSavingsMode && amortization.principalBalance <= 0) {
        break;
      }
    }

    this.__endCalculation();

    return {
      totals: this.totals,
      contextList: this.contextList,
      amortizationList: this.amortizationList
    };
  };

  // Create new context
  LoanCalculatorEngine.prototype.__calculateContextAt = function (period) {
    var prevAmortization = _.last(this.amortizationList);

    // Create new context
    // Principal amount (pv) is the last amortization's final balance.
    var context = new ContextItem(period, this.__context);
    context.principal = prevAmortization.principalBalance;

    // Select all operators active at this period.
    // Operator start and end periods are inclusive.
    var operators = this.getOperatorsAt(period);
    _.forEach(operators, function (operator) {
      // Merge operator's data into context.
      operator.process(period, context);
    });

    return context;
  };

  // Calculate current period's results.
  LoanCalculatorEngine.prototype.__calculateAmortizationAt = function (period, context) {
    var prevContext = _.last(this.contextList);

    var isInitialPeriod = period === 1, hasChangedEffInterestRate = prevContext.effInterestRate !== context.effInterestRate;

    // Repayment
    var repayment = prevContext.repayment;

    // Only update the repayment if:
    // Savings mode is off - Savings will always use the initial set repayment AND
    // Current period is the initial period OR interest rate has changed.
    if (!this.__config.isSavingsMode && (isInitialPeriod || hasChangedEffInterestRate)) {
      repayment = this.__calculateRepayment(period, context);
    }

    // Update current context
    context.repayment = repayment;

    // Extra Repayment and Lump Sum
    repayment += context.effExtraRepayment || 0;
    repayment += context.lumpSum || 0;

    // Offset
    var offset = context.offset || 0, consideredPrincipal = context.principal - offset;

    // Interest Paid
    var interestPaid = Math.max(consideredPrincipal * context.effInterestRate, 0);

    // Principal Paid and Final Balance
    var principalPaid = 0, principalBalance = 0;

    if (this.__config.isSavingsMode) {
      principalBalance = context.principal + repayment + interestPaid;
    } else {
      if (repayment > context.principal) {
        repayment = context.principal + interestPaid;
      }

      principalPaid = repayment - interestPaid;
      principalBalance = context.principal - principalPaid;
    }

    // Fee
    repayment += context.fee || 0;

    var amortization = new AmortizationItem(period);
    amortization.repayment = repayment;
    amortization.interestPaid = interestPaid;
    amortization.principalPaid = principalPaid;
    amortization.principalBalance = principalBalance;
    return amortization;
  };

  LoanCalculatorEngine.prototype.__calculateRepayment = function (period, context) {
    var repayment = 0;

    var principal = context.principal, effInterestRate = context.effInterestRate, effTermRemaining = context.effTerm - period + 1;

    var isInterestOnly = context.repaymentType === LoanCalculatorEngine.repaymentType.interestOnly;

    if (isInterestOnly) {
      repayment = principal * effInterestRate;
    } else {
      repayment = CalculatorEngineMath.pmt(principal, effInterestRate, effTermRemaining);
    }

    return repayment;
  };

  LoanCalculatorEngine.prototype.__startCalculation = function () {
    this.__resetResults();
    this.__calculateInitialPeriod();
  };

  LoanCalculatorEngine.prototype.__resetResults = function () {
    this.amortizationList = [];
    this.contextList = [];
    this.totals = null;
  };

  LoanCalculatorEngine.prototype.__calculateInitialPeriod = function () {
    var context = new ContextItem(0, this.__context);

    var amortization = new AmortizationItem(0);
    amortization.principalBalance = context.principal;

    this.contextList.push(context);
    this.amortizationList.push(amortization);
  };

  LoanCalculatorEngine.prototype.__endCalculation = function () {
    this.__calculateTotals();
    this.__calculateInterestBalance();
  };

  LoanCalculatorEngine.prototype.__calculateTotals = function () {
    // Sum totals
    this.totals = this.amortizationList.reduce(function (previous, current) {
      return {
        repayment: previous.repayment + current.repayment,
        interestPaid: previous.interestPaid + current.interestPaid
      };
    });
  };

  LoanCalculatorEngine.prototype.__calculateInterestBalance = function () {
    var isSavingsMode = this.__config.isSavingsMode, interestBalance = isSavingsMode ? 0 : this.totals.interestPaid;

    _.forEach(this.amortizationList, function (amortization) {
      interestBalance -= isSavingsMode ? amortization.interestPaid * -1 : amortization.interestPaid;

      amortization.interestBalance = interestBalance;
    });
  };

  return LoanCalculatorEngine;
})();

// Consts - static objects.
LoanCalculatorEngine.repaymentType = {
  interestOnly: "IO",
  principalAndInterest: "PI"
};

module.exports = LoanCalculatorEngine;