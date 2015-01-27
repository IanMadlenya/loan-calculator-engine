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

// Base context handles the calculator initial state set by the user during
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

  // Calculate effective values eg. normalize the repayment frequency.
  this.__normalizeValues();
};

BaseContext.prototype.__normalizeValues = function () {
  // Calculate the interest rate per period.
  this.effInterestRate = CalculatorEngineMath.effInterestRate(this.interestRate, this.interestRateFrequency, this.repaymentFrequency);

  // Calculate the total number of periods for a given loan.
  this.effTerm = CalculatorEngineMath.effTerm(this.term, this.termFrequency, this.repaymentFrequency);
};

// Context for the given period.
var ContextItem = function ContextItem(period, options) {
  this.period = period;

  _.merge(this, options);
};

// Amortization for the given period.
var AmortizationItem = function AmortizationItem(period) {
  this.period = period;
  this.principalBalance = 0;
  this.interestBalance = 0;
  this.interestPaid = 0;
  this.principalPaid = 0;
  this.repayment = 0;
};

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

  LoanCalculatorEngine.prototype.calculate = function () {
    this.__beforeCalculate();
    this.__calculate();
    this.__afterCalculate();

    return {
      totals: this.totals,
      contextList: this.contextList,
      amortizationList: this.amortizationList
    };
  };

  // Calculates a loan and its ammortization table.
  // Calculations is done on per period basis.
  LoanCalculatorEngine.prototype.__calculate = function () {
    for (var period = 1; period <= this.__context.effTerm; period++) {
      var prevAmortization = _.last(this.amortizationList), prevContext = _.last(this.contextList);

      var prevPrincipalBalance = prevAmortization.principalBalance, prevEffInterestRate = prevContext.effInterestRate, prevRepayment = prevContext.repayment;

      var context = this.__calculateContext(period, prevPrincipalBalance, prevEffInterestRate, prevRepayment);

      var amortization = this.__calculateAmortization(context);

      this.contextList.push(context);
      this.amortizationList.push(amortization);

      // Might not calculate the entire effTerm ie. loan has extra repayment or off set.
      if (!this.__config.isSavingsMode && amortization.principalBalance <= 0) {
        break;
      }
    }
  };

  // Create context.
  LoanCalculatorEngine.prototype.__calculateContext = function (period, prevPrincipalBalance, prevEffInterestRate, prevRepayment) {
    // Create new context
    var context = new ContextItem(period, this.__context);

    // Principal amount (pv) is the last amortization's final balance.
    context.principal = prevPrincipalBalance;

    // Select all operators active at this period.
    // Operator start and end periods are inclusive.
    var operators = this.getOperatorsAt(period);
    _.forEach(operators, function (operator) {
      // Merge operator's data into context.
      operator.process(period, context);
    });

    var hasChangedEffInterestRate = prevEffInterestRate !== context.effInterestRate, mustRecalculateRepayment = !prevRepayment || hasChangedEffInterestRate;

    context.repayment = mustRecalculateRepayment ? this.__calculateRepayment(period, context) : prevRepayment;

    return context;
  };

  // Calculate current amortization results for a given period.
  LoanCalculatorEngine.prototype.__calculateAmortization = function (context) {
    var period = context.period;

    // Repayment
    var repayment = context.repayment; // Base repayment
    repayment += context.effExtraRepayment || 0; // Add extra Repayment
    repayment += context.lumpSum || 0; // Add Lump Sum

    // Offset
    // Substract the offset amount from the current principal balance amount.
    // This new balance will be used to calculate the insterest paid.
    var offset = context.offset || 0, consideredPrincipal = context.principal - offset;

    // Interest Paid
    var interestPaid = consideredPrincipal * context.effInterestRate;
    interestPaid = Math.max(interestPaid, 0);

    // Principal Paid and Principal Balance
    var principalPaid = 0, principalBalance = 0;

    if (this.__config.isSavingsMode) {
      // Sum the principal balance amount.
      // No principal paid during savings, only the repayment amount instead (deposit amount).
      principalBalance = context.principal + repayment + interestPaid;
    } else {
      if (repayment > context.principal) {
        repayment = context.principal + interestPaid;
      }

      // Subtract the principal paid from the principal balance amount.
      principalPaid = repayment - interestPaid;
      principalBalance = context.principal - principalPaid;
    }

    // Fee amount is paid on top of the regular repayment and
    // it shouldn't affect the interest paid or principal balance.
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

  LoanCalculatorEngine.prototype.__beforeCalculate = function () {
    this.__clearResults();
    this.__calculateInitialPeriod();
  };

  LoanCalculatorEngine.prototype.__clearResults = function () {
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

  LoanCalculatorEngine.prototype.__afterCalculate = function () {
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

// Interal constants (static object).
LoanCalculatorEngine.repaymentType = {
  interestOnly: "IO",
  principalAndInterest: "PI"
};

module.exports = LoanCalculatorEngine;