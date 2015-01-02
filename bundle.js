require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"mintpocket-loan-repayment-engine":[function(require,module,exports){
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

var CalculatorEngine = function CalculatorEngine() {
  this.operatorList = [];

  this.config = {
    frequency: {
      year: 1,
      month: 12,
      fortnight: 26,
      week: 52
    }
  };
};

CalculatorEngine.prototype._addOperator = function (operator) {
  this.operatorList.push(operator);
}

// getContextAt(period) {
// }

// getOperatorsAt(period) {
// }

// removeOperator(id) {
// }
;

var operatorIdCounter = 0;
var Operator = function Operator() {
  this._id = operatorIdCounter++;
  this._type = undefined;
};

var InterestRate = function InterestRate(options) {
  Operator.call(this);

  this._type = "interestRate";
  this.interestRate = options.interestRate;
};

_inherits(InterestRate, Operator);

CalculatorEngine.prototype.interestRate = function (options) {
  this._addOperator(new InterestRate(options));
};

var SummaryItem = function SummaryItem(periodAt) {
  this.period = periodAt;
  this.balanceRemaining = 0;
  this.interestRemaining = 0;
  this.interestPaid = 0;
  this.principalPaid = 0;
};

var LoanEngine = function LoanEngine(options) {
  CalculatorEngine.call(this);

  this.principal = 0;
  this.interestRate = 0;
  this.interestRateFrequency = this.config.frequency.year;
  this.term = 0;
  this.termFrequency = this.config.frequency.year;
  this.repaymentFrequency = this.config.frequency.month;

  // Update default options
  for (var prop in options) {
    if (this.hasOwnProperty(prop)) {
      this[prop] = options[prop];
    }
  }
};

_inherits(LoanEngine, CalculatorEngine);

//
// ## function pmt()
// Calculates the _repayment amount_ for a given loan.
// Formula:
// `p = (i * A) / (1 - (1 + i) ^ -N)`
//
LoanEngine.prototype.getPmt = function () {
  var effInterestRate = this.getEffInterestRate(), effTerm = this.getEffTerm();

  var part1 = effInterestRate * this.principal, part2 = 1 - Math.pow(1 + effInterestRate, -effTerm);

  var result = part1 / part2;

  return result;
};

//
// ## function fv(periodAt)
// Determine the *balance of a loan* at the given period.
// Formula:
// `B = (A * (1 + i) ^ n) - (P / i) * ((1 + i) ^ n - 1)`
//
LoanEngine.prototype.getFv = function (periodAt) {
  var interestRate = this.getEffInterestRate(), pmt = this.getPmt();

  var part1 = this.principal * Math.pow(1 + interestRate, periodAt), part2 = pmt / interestRate, part3 = Math.pow(1 + interestRate, periodAt) - 1;

  var result = part1 - part2 * part3;

  return result;
};

//
// ## function getEffInterestRate()
// Calculate the interest rate per period.
//
LoanEngine.prototype.getEffInterestRate = function () {
  return this.interestRate * this.interestRateFrequency / this.repaymentFrequency;
};

//
// ## function getEffTerm()
// Calculate the total number of periods for a given loan.
//
LoanEngine.prototype.getEffTerm = function () {
  return this.term / this.termFrequency * this.repaymentFrequency;
};

//
// ## function getInterestPaidAt(periodAt)
// Calculate the amount of interest paid at a given period.
//
LoanEngine.prototype.getInterestPaidAt = function (periodAt) {
  var fv = this.getFv(periodAt), effInterestRate = this.getEffInterestRate();

  var result = fv * effInterestRate;

  return result;
};

//
// ## function getTotalPmt()
// Calculate the total amount of the loan (principal + interest).
//
LoanEngine.prototype.getTotalPmt = function () {
  var pmt = this.getPmt(), effTerm = this.getEffTerm();

  var result = pmt * effTerm;

  return result;
};

//
// ## function getTotalInterest()
// Calculate the total amount of interest paid.
//
LoanEngine.prototype.getTotalInterest = function () {
  var totalPmt = this.getTotalPmt();

  var result = totalPmt - this.principal;

  return result;
};

//
// ## function getSummaryItem()
// Builds the amortization summaryItem table.
// Returns an array of objects.
// Example:
// ```
// [{
//		period: 0,
//		balanceRemaining: 0,
//		interestRemaining: 0,
//		interestPaid: 0,
//		principalPaid: 0	
// }]
// ```
//
LoanEngine.prototype.getSummary = function () {
  var effTerm = this.getEffTerm(), effInterestRate = this.getEffInterestRate(), totalInterest = this.getTotalInterest(), pmt = this.getPmt();

  var prevSummaryItem = new SummaryItem(), summary = [];

  for (var periodAt = 0; periodAt < effTerm; periodAt++) {
    var summaryItem = new SummaryItem(periodAt);
    summaryItem.balanceRemaining = this.getFv(periodAt);
    summaryItem.interestRemaining = periodAt === 0 ? totalInterest : prevSummaryItem.interestRemaining - prevSummaryItem.interestPaid;
    summaryItem.interestPaid = summaryItem.balanceRemaining * effInterestRate;
    summaryItem.principalPaid = pmt - summaryItem.interestPaid;

    summary.push(summaryItem);

    prevSummaryItem = summaryItem;
  }

  // Add last period to summary table.
  // This should be the end of the loan's life.
  // All amounts should be zero.
  summary.push(new SummaryItem(effTerm));

  return summary;
};

module.exports = LoanEngine;
},{}]},{},[]);
