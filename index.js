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

var InterestRateOperator = require("./operators/interest-rate-operator"), ExtraRepaymentOperator = require("./operators/extra-repayment-operator");

// Loan Context class
// Input values used in the calculation ie. `principal`, `term`.
var LoanContext = function LoanContext(context, config) {
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
  _.merge(this, defaults, context);

  this.normalizeValues();
};

LoanContext.prototype.normalizeValues = function () {
  // Calculate the interest rate per period.
  this.effInterestRate = CalculatorEngineMath.effInterestRate(this.interestRate, this.interestRateFrequency, this.repaymentFrequency);

  // Calculate the total number of periods for a given loan.
  this.effTerm = CalculatorEngineMath.effTerm(this.term, this.termFrequency, this.repaymentFrequency);
};

// Loan Summary Item class
// Used to store the calculation results ie. ammortization table
var LoanSummary = function LoanSummary(periodAt) {
  this.period = periodAt;
  this.principalBalance = 0;
  this.interestBalance = 0;
  this.interestPaid = 0;
  this.principalPaid = 0;
  this.repayment = 0;
};

// Loan Calculator Engine class
// Calculates a loan and its ammortization table.
// Example:
// ```
// var LoanCalculatorEngine = require('financial-loan-calculator-engine');
//
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.01,
// 	term: 10
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

    this.use.apply(this, [ExtraRepaymentOperator, InterestRateOperator]);
  };

  _inherits(LoanCalculatorEngine, _CalculatorEngine);

  LoanCalculatorEngine.prototype.context = function (options) {
    return _CalculatorEngine.prototype.context.call(this, new LoanContext(options, this.__config));
  };

  // Calculates a loan and its ammortization table.
  // Calculations is done on per period basis.
  LoanCalculatorEngine.prototype.calculate = function () {
    var summaryList = [], contextList = [];

    this.__preCalculation(contextList, summaryList);

    for (var period = 1; period <= this.__context.effTerm; period++) {
      var prevSummary = _.last(summaryList), prevContext = _.last(contextList);

      // Create new current context
      var context = new LoanContext(this.__context, this.__config);
      context.principal = prevSummary.principalBalance;

      // Select all operators active at this period.
      // Operator start and end periods are inclusive.
      var operators = this.getOperatorsAt(period);
      _.forEach(operators, function (operator) {
        // Attach/merge operator's data into context.
        operator.process(period, context);
      });

      // Calculate current period's results.
      var summary = this.__calculateSummaryAt(period, context, prevContext, prevSummary);

      summaryList.push(summary);
      contextList.push(context);

      // Might not calculate the entire effTerm ie. loan has extra repayment or off set.
      if (!this.__config.isSavingsMode && summary.principalBalance <= 0) {
        break;
      }
    }

    // Sum totals
    var totals = summaryList.reduce(function (previous, current) {
      return {
        repayment: previous.repayment + current.repayment,
        interestPaid: previous.interestPaid + current.interestPaid
      };
    });

    this.__postCalculation(contextList, summaryList, totals);

    return {
      summaryList: summaryList,
      contextList: contextList,
      totals: totals
    };
  };

  LoanCalculatorEngine.prototype.__calculateSummaryAt = function (period, context, prevContext, prevSummary) {
    var principal = context.principal;

    // Repayment
    var repayment = context.repayment || prevSummary.repayment, mustRecalculateRepayment = this.__mustRecalculateRepayment(repayment, prevContext, context);

    if (mustRecalculateRepayment) {
      repayment = this.__calculateRepayment(period, context);
    }

    // Interest
    var effInterestRate = context.effInterestRate, interestPaid = principal * effInterestRate;

    // Principal
    var principalPaid = 0, principalBalance = 0;

    if (this.__config.isSavingsMode) {
      principalBalance = principal + repayment + interestPaid;
    } else {
      if (repayment > principal) {
        repayment = principal + interestPaid;
      }

      principalPaid = repayment - interestPaid;
      principalBalance = principal - principalPaid;
    }

    var summary = new LoanSummary(period);
    summary.repayment = repayment;
    summary.interestPaid = interestPaid;
    summary.principalPaid = principalPaid;
    summary.principalBalance = principalBalance;
    return summary;
  };

  LoanCalculatorEngine.prototype.__calculateRepayment = function (period, context) {
    var repayment = 0;

    var principal = context.principal, effInterestRate = context.effInterestRate, effExtraRepayment = context.effExtraRepayment, effTermRemaining = context.effTerm - period + 1;

    var repaymentType = context.repaymentType, isInterestOnly = repaymentType === LoanCalculatorEngine.repaymentType.interestOnly;

    if (isInterestOnly) {
      repayment = principal * effInterestRate;
    } else {
      repayment = CalculatorEngineMath.pmt(principal, effInterestRate, effTermRemaining);
    }

    // Extra Repayment
    if (effExtraRepayment) {
      repayment += effExtraRepayment;
    }

    return repayment;
  };

  LoanCalculatorEngine.prototype.__mustRecalculateRepayment = function (repayment, prevContext, currentContext) {
    var hasRepayment = !!repayment, hasChangedEffInterestRate = prevContext.effInterestRate !== currentContext.effInterestRate, hasChangedEffExtraRepayment = prevContext.effExtraRepayment !== currentContext.effExtraRepayment;

    return hasChangedEffInterestRate || hasChangedEffExtraRepayment || !hasRepayment;
  };

  LoanCalculatorEngine.prototype.__preCalculation = function (contextList, summaryList) {
    this.__calculateInitialPeriod(contextList, summaryList);
  };

  LoanCalculatorEngine.prototype.__calculateInitialPeriod = function (contextList, summaryList) {
    var context = new LoanContext(this.__context, this.__config);

    var summary = new LoanSummary(0);
    summary.principalBalance = context.principal;

    contextList.push(context);
    summaryList.push(summary);
  };

  LoanCalculatorEngine.prototype.__postCalculation = function (contextList, summaryList, totals) {
    this.__calculateInterestBalance(summaryList, totals);
  };

  LoanCalculatorEngine.prototype.__calculateInterestBalance = function (summaryList, totals) {
    var isSavingsMode = this.__config.isSavingsMode, interestBalance = isSavingsMode ? 0 : totals.interestPaid;

    _.forEach(summaryList, function (summary) {
      interestBalance -= isSavingsMode ? summary.interestPaid * -1 : summary.interestPaid;

      summary.interestBalance = interestBalance;
    });
  };

  return LoanCalculatorEngine;
})();

LoanCalculatorEngine.repaymentType = {
  interestOnly: "IO",
  principalAndInterest: "PI"
};

module.exports = LoanCalculatorEngine;