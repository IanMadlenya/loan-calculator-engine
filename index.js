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

var Amortization = function Amortization() {
  this.futureValue = 0;
  this.repayment = 0;
  this.interestPaid = 0;
  this.principalPaid = 0;
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

    this.use.apply(this, [FeeOperator, OffsetOperator, LumpSumOperator, InterestRateOperator, ExtraRepaymentOperator]);

    this.totals = null;
    this.scheduleList = null;
  };

  _inherits(LoanCalculatorEngine, _CalculatorEngine);

  LoanCalculatorEngine.prototype.context = function (options) {
    if (!options) {
      return _CalculatorEngine.prototype.context.call(this);
    }

    var config = this.config();

    var defaultsOptions = {
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

    options = _.merge({}, defaultsOptions, options);

    // Calculate the interest rate per period.
    options.effInterestRate = CalculatorEngineMath.effInterestRate(options.interestRate, options.interestRateFrequency, options.repaymentFrequency);

    // Calculate the total number of periods for a given loan.
    options.effTerm = CalculatorEngineMath.effTerm(options.term, options.termFrequency, options.repaymentFrequency);

    return _CalculatorEngine.prototype.context.call(this, options);
  };

  LoanCalculatorEngine.prototype.calculate = function () {
    this.__beforeCalculate();
    this.__calculate();
    this.__afterCalculate();

    return {
      totals: this.totals,
      scheduleList: this.scheduleList
    };
  };

  // Calculates a loan and its ammortization table.
  // Calculations is done on per period basis.
  LoanCalculatorEngine.prototype.__calculate = function () {
    var period = 1, effTerm = this.__context.effTerm;

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
  };

  // Create context.
  LoanCalculatorEngine.prototype.__calculateContext = function (period, prevScheduleItem) {
    var prevFutureValue = prevScheduleItem.amortization.futureValue, prevEffInterestRate = prevScheduleItem.context.effInterestRate, prevRepayment = prevScheduleItem.context.repayment;

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
    var hasChangedEffInterestRate = prevEffInterestRate !== context.effInterestRate, mustRecalculateRepayment = !prevRepayment || hasChangedEffInterestRate;

    context.repayment = mustRecalculateRepayment ? this.__calculateRepayment(period, context) : prevRepayment;

    return context;
  };

  // Calculate current amortization results for a given period.
  LoanCalculatorEngine.prototype.__calculateAmortization = function (context) {
    // Repayment
    var repayment = context.repayment; // Base repayment
    repayment += context.effExtraRepayment || 0; // Add extra Repayment
    repayment += context.lumpSum || 0; // Add Lump Sum

    // Offset
    // Substract the offset amount from the current principal balance amount.
    // This new balance will be used to calculate the insterest paid.
    var offset = context.offset || 0, consideredPrincipal = context.presentValue - offset;

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
  };

  LoanCalculatorEngine.prototype.__calculateRepayment = function (period, context) {
    var repayment = 0;

    var presentValue = context.presentValue, effInterestRate = context.effInterestRate, effTermRemaining = context.effTerm - period + 1;

    var isInterestOnly = context.repaymentType === LoanCalculatorEngine.repaymentType.interestOnly;

    if (isInterestOnly) {
      repayment = presentValue * effInterestRate;
    } else {
      repayment = CalculatorEngineMath.pmt(presentValue, effInterestRate, effTermRemaining);
    }

    return repayment;
  };

  LoanCalculatorEngine.prototype.__beforeCalculate = function () {
    this.__clearResults();
    this.__calculateInitialPeriod();
  };

  LoanCalculatorEngine.prototype.__clearResults = function () {
    this.totals = null;
    this.scheduleList = [];
  };

  LoanCalculatorEngine.prototype.__calculateInitialPeriod = function () {
    var context = this.context();

    var amortization = new Amortization();
    amortization.futureValue = context.presentValue;

    this.scheduleList.push({
      period: 0,
      context: context,
      amortization: amortization
    });
  };

  LoanCalculatorEngine.prototype.__afterCalculate = function () {
    this.__calculateTotals();
  };

  LoanCalculatorEngine.prototype.__calculateTotals = function () {
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
  };

  return LoanCalculatorEngine;
})();

// Interal constants (static object).
LoanCalculatorEngine.repaymentType = {
  interestOnly: "IO",
  principalAndInterest: "PI"
};

module.exports = LoanCalculatorEngine;