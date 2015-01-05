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

// Loan Context class
// Input values used in the calculation ie. `principal`, `term`...
var LoanContext = function LoanContext(context) {
  var config = CalculatorEngine.config();

  var defaults = {
    principal: 0,

    interestRate: 0,
    interestRateFrequency: config.frequency.year,
    effInterestRate: 0,

    term: 0,
    termFrequency: config.frequency.year,
    effTerm: 0,

    repaymentFrequency: config.frequency.month
  };

  // Extend default values with the options passed in.
  _.merge(this, defaults, context);

  // Calculate the total number of periods for a given loan.
  this.effTerm = CalculatorEngineMath.effTerm(this.term, this.termFrequency, this.repaymentFrequency);

  // Calculate the interest rate per period.
  this.effInterestRate = CalculatorEngineMath.effInterestRate(this.interestRate, this.interestRateFrequency, this.repaymentFrequency);
};

// Loan Summary Item class
// Used to store the calculation results ie. ammortization table
var LoanSummaryItem = function LoanSummaryItem(periodAt) {
  this.period = periodAt;
  this.principalInitialBalance = 0;
  this.principalFinalBalance = 0;
  this.interestPaid = 0;
  this.principalPaid = 0;
  this.pmt = 0;
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
  var LoanCalculatorEngine = function LoanCalculatorEngine(context) {
    _CalculatorEngine.call(this, context);

    this.__baseContext = new LoanContext(context);
  };

  _inherits(LoanCalculatorEngine, _CalculatorEngine);

  // Calculates a loan and its ammortization table.
  // Calculations is done on per period basis.
  LoanCalculatorEngine.prototype.calculate = function () {
    var currentPeriod = 1, principalBalance = this.__baseContext.principal;

    var summaryList = [];

    while (principalBalance > 0.001) {
      var currentContext = _.clone(this.__baseContext);

      var operators = this.getOperatorsAt(currentPeriod);
      operators.forEach(function (operator) {
        operator.process(currentContext);
      });

      var summaryItem = this.__calculateSummaryItem(currentPeriod, currentContext, principalBalance);
      summaryList.push(summaryItem);

      principalBalance = summaryItem.principalFinalBalance;
      currentPeriod++;
    }

    // Sum totals
    var totals = summaryList.reduce(function (previous, current) {
      return {
        pmt: previous.pmt + current.pmt,
        interestPaid: previous.interestPaid + current.interestPaid
      };
    });

    return {
      summaryList: summaryList,
      totals: totals
    };
  };

  LoanCalculatorEngine.prototype.__calculateSummaryItem = function (currentPeriod, currentContext, principalBalance) {
    var effInterestRate = currentContext.effInterestRate, effExtraRepayment = currentContext.effExtraRepayment, effTermRemaining = currentContext.effTerm - currentPeriod + 1;

    var pmt = CalculatorEngineMath.pmt(principalBalance, effInterestRate, effTermRemaining);

    pmt += effExtraRepayment ? effExtraRepayment : 0;

    // Create summary item
    var summaryItem = new LoanSummaryItem(currentPeriod);
    summaryItem.principalInitialBalance = principalBalance;
    summaryItem.pmt = pmt;
    summaryItem.interestPaid = summaryItem.principalInitialBalance * effInterestRate;
    summaryItem.principalPaid = summaryItem.pmt - summaryItem.interestPaid;
    summaryItem.principalFinalBalance = summaryItem.principalInitialBalance - summaryItem.principalPaid;

    return summaryItem;
  };

  return LoanCalculatorEngine;
})();

module.exports = LoanCalculatorEngine;