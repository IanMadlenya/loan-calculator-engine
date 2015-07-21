require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var CalculatorEngine = (function () {
  function CalculatorEngine(options) {
    // List of operators ie. `InterestRate`, `ExtraRepayment`, `LumpSum`...
    //
    // Operators can be used to change the calculator context during its
    // active period (between `startPeriod` and `endPeriod`) when they are invoked
    // during the calculation phase. Note that operator periods are inclusive.
    //
    // The last operator added in has the highest priority in the context and will
    // override others if their properties have the same name.
    //
    // See class `Operator` for more info.
    this.__operatorList = [];

    // Configuration.
    // Can be updated using the method `config()`.
    this.__config = {
      frequency: {
        year: 1,
        month: 12,
        fortnight: 26,
        week: 52
      }
    };

    // Base context.
    // This object holds the user's input data for this calculator ie. `principal`, `term`.
    // It will be reset with the options passed into this constructor - see bellow.
    this.__context = {};

    // Update the base context with the options passed in via the constructor.
    this.context(options);
  }

  _prototypeProperties(CalculatorEngine, null, {
    context: {

      // Updates the base context if options are passed in.
      // Otherwise returns the context.
      value: function context(options) {
        if (options) {
          _.merge(this.__context, options);
          return this;
        }

        return _.clone(this.__context);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    use: {

      // Invokes a function passing `this` instance as a parameter.
      // Used for register new plugins on this engine.
      // Example:
      // ```
      // var fooResolver = function(instance) {
      // 	instance.foo = function() {
      // 		// ...
      // 	};
      // };
      // engine.use(fooResolver);
      // ```
      value: function use() {
        if (arguments) {
          _.forEach(arguments, function (resolver) {
            resolver(this);
          }, this);
        }

        return this;
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    config: {

      // Updates the configuration if `options` are set
      // and returns `this` instance for chaining purpose.
      // Otherwise returns the current configurations.
      value: function config(options) {
        if (options) {
          _.merge(this.__config, options);
          return this;
        }

        return _.clone(this.__config);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    addOperator: {

      // Append an operator to the list
      value: function addOperator(operator) {
        return this.__operatorList.push(operator);
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    getOperatorsAt: {

      // Returns all active operators for a given period.
      // `startPeriod` less than or equal to `period` and
      // `endPeriod` greater than or equal to `period`.
      // Note that the operator period is inclusive.
      value: function getOperatorsAt(period) {
        return this.__operatorList.filter(function (operator) {
          return operator.startPeriod <= period && operator.endPeriod >= period;
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return CalculatorEngine;
})();

module.exports = CalculatorEngine;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
"use strict";

// Defines the most basic calculation functions used by the other calculators.

// Calculate the regular repayment to pay off a loan.
// Formula: `p = i * A / 1 - (1 + i)^ -N`.
var pmt = function (principal, effInterestRate, effTerm) {
  var part1 = effInterestRate * principal,
      part2 = 1 - Math.pow(1 + effInterestRate, -effTerm);

  var result = part1 / part2;

  return result;
};

// Calculates the number of repayment periods
// (at the same frequency as the effInterestRate value)
// required to pay off the loan.
var nper = function (principal, effInterestRate, repayment) {
  var part1 = Math.log(1 - effInterestRate * principal / repayment),
      part2 = Math.log(1 + effInterestRate);

  var result = -part1 / part2;

  return result;
};

// Formula: `r = ((FV / PV) ^ (1 / Y)) - 1`
var rateOfReturn = function (pv, fv, y) {
  var r = Math.pow(fv / pv, 1 / y) - 1;

  return r;
};

// Calculate the interest rate per period.
var effInterestRate = function (interestRate, interestRateFrequency, repaymentFrequency) {
  return interestRate * interestRateFrequency / repaymentFrequency;
};

// Calculate the total number of periods for a given loan.
var effTerm = function (term, termFrequency, repaymentFrequency) {
  return term / termFrequency * repaymentFrequency;
};

// Calculate the extra repayment amount per period.
var effExtraRepayment = function (extraRepayment, extraRepaymentFrequency, repaymentFrequency) {
  return extraRepayment * extraRepaymentFrequency / repaymentFrequency;
};

module.exports = {
  pmt: pmt,
  nper: nper,
  rateOfReturn: rateOfReturn,
  effTerm: effTerm,
  effInterestRate: effInterestRate,
  effExtraRepayment: effExtraRepayment
};
},{}],3:[function(require,module,exports){
(function (global){
"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

// Extension plugin for the calculator engines.

var operatorIdCounter = 0;

var Operator = (function () {
  function Operator(type, options) {
    this.id = operatorIdCounter++;
    this.type = type;
    this.startPeriod = 1;
    this.endPeriod = Number.POSITIVE_INFINITY;
    this.context = {};

    _.merge(this, options);
  }

  _prototypeProperties(Operator, null, {
    process: {
      value: function process(context) {
        _.merge(context, this.context);
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Operator;
})();

module.exports = Operator;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var CalculatorEngineOperator = require("financial-calculator-engine/lib/operator"),
    CalculatorEngineMath = require("financial-calculator-engine/lib/math");

// Example:
// ```
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan
// 	.extraRepayment({
// 		startPeriod: 13,
// 		extraRepayment: 100
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point/method `extraRepayment()` on the `engine` instance.
  engine.extraRepayment = function (options) {
    this.addOperator(new ExtraRepaymentOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds extra repayment context to the loan for a given period of time.
  var ExtraRepaymentOperator = (function (CalculatorEngineOperator) {
    // Options available:
    // `startPeriod`, `endPeriod` and
    // `extraRepayment`, `extraRepaymentFrequency`, `effExtraRepayment`.
    function ExtraRepaymentOperator(options) {
      _get(Object.getPrototypeOf(ExtraRepaymentOperator.prototype), "constructor", this).call(this, "extra-repayment", {
        startPeriod: options.startPeriod,
        endPeriod: options.endPeriod
      });

      // Calculator engine configuration
      var config = engine.config();

      // Default options
      var defaults = {
        extraRepayment: 0,
        extraRepaymentFrequency: config.frequency.month,
        effExtraRepayment: 0
      };

      // Extend the default object with the `options` passed in.
      // Assigns it to the internal context.
      this.context = _.merge({}, defaults, {
        extraRepayment: options.extraRepayment,
        extraRepaymentFrequency: options.extraRepaymentFrequency
      });
    }

    _inherits(ExtraRepaymentOperator, CalculatorEngineOperator);

    _prototypeProperties(ExtraRepaymentOperator, null, {
      process: {

        // Adds new information to loan context.
        // Properties: `extraRepayment`, `extraRepaymentFrequency`, `effExtraRepayment`.
        value: function process(period, context) {
          this.context.effExtraRepayment = CalculatorEngineMath.effExtraRepayment(this.context.extraRepayment, this.context.extraRepaymentFrequency, context.repaymentFrequency);

          // Merge operator's context into loan's context.
          _get(Object.getPrototypeOf(ExtraRepaymentOperator.prototype), "process", this).call(this, context);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return ExtraRepaymentOperator;
  })(CalculatorEngineOperator);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"financial-calculator-engine/lib/math":2,"financial-calculator-engine/lib/operator":3}],5:[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"financial-calculator-engine/lib/operator":3}],6:[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

var CalculatorEngineOperator = require("financial-calculator-engine/lib/operator"),
    CalculatorEngineMath = require("financial-calculator-engine/lib/math");

// Example:
// ```
// var loan = new LoanCalculatorEngine({
// 	principal: 100000,
// 	interestRate: 0.1,
// 	term: 10
// });
//
// var results = loan
// 	.interestRate({
// 		endPeriod: 12,
// 		interestRate: 0.15
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point/method `interestRate()` on the `engine` instance.
  engine.interestRate = function (options) {
    this.addOperator(new InterestRateOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds the interest rate value on the loan for a given period of time.
  var InterestRateOperator = (function (CalculatorEngineOperator) {
    // Options available:
    // `startPeriod`, `endPeriod` and
    // `interestRate`, `interestRateFrequency`, `effInterestRate`.
    function InterestRateOperator(options) {
      _get(Object.getPrototypeOf(InterestRateOperator.prototype), "constructor", this).call(this, "interest-rate", {
        startPeriod: options.startPeriod,
        endPeriod: options.endPeriod
      });

      // Calculator engine configuration
      var config = engine.config();

      // Default options
      var defaults = {
        interestRate: 0,
        interestRateFrequency: config.frequency.year,
        effInterestRate: 0
      };

      // Extend the default object with the `options` passed in.
      // Assigns it to the internal context.
      this.context = _.merge({}, defaults, {
        interestRate: options.interestRate,
        interestRateFrequency: options.interestRateFrequency
      });
    }

    _inherits(InterestRateOperator, CalculatorEngineOperator);

    _prototypeProperties(InterestRateOperator, null, {
      process: {

        // Adds new information to loan context.
        // Properties: `interestRate`, `interestRateFrequency`, `effInterestRate`.
        value: function process(period, context) {
          this.context.effInterestRate = CalculatorEngineMath.effInterestRate(this.context.interestRate, this.context.interestRateFrequency, context.repaymentFrequency);

          // Merge operator's context into loan's context.
          _get(Object.getPrototypeOf(InterestRateOperator.prototype), "process", this).call(this, context);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return InterestRateOperator;
  })(CalculatorEngineOperator);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"financial-calculator-engine/lib/math":2,"financial-calculator-engine/lib/operator":3}],7:[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
// 	.lumpSum({
// 		period: 12,
// 		lumpSum: 10000
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point `lumpSum()` on the `engine` instance.
  engine.lumpSum = function (options) {
    this.addOperator(new LumpSumOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds lump sum context to the loan for a given period of time.
  var LumpSumOperator = (function (CalculatorEngineOperator) {
    // Options available:
    // `period` and `lumpSum`
    function LumpSumOperator(options) {
      _get(Object.getPrototypeOf(LumpSumOperator.prototype), "constructor", this).call(this, "lump-sum", {
        startPeriod: options.period,
        endPeriod: options.period
      });

      // Default options
      var defaults = {
        lumpSum: 0
      };

      // Extend the default object with the `options` passed in.
      // Assigns it to the internal context.
      this.context = _.merge({}, defaults, {
        lumpSum: options.lumpSum });
    }

    _inherits(LumpSumOperator, CalculatorEngineOperator);

    _prototypeProperties(LumpSumOperator, null, {
      process: {

        // Adds new information to loan context.
        // Properties: `lumpSum`.
        value: function process(period, context) {
          // Merge operator's context into loan's context.
          _get(Object.getPrototypeOf(LumpSumOperator.prototype), "process", this).call(this, context);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return LumpSumOperator;
  })(CalculatorEngineOperator);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"financial-calculator-engine/lib/operator":3}],8:[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
// 	.offset({
// 		offset: 10000
// 	})
// 	.calculate();
// ```

// Exports the `resolver` method.
// Takes the `engine` instance as a parameter.
module.exports = function (engine) {
  // Adds entry point `offset()` on the `engine` instance.
  engine.offset = function (options) {
    this.addOperator(new OffsetOperator(options));
    return this;
  };

  // Extension plugin for the loan repayment calculator.
  // Adds offset context to the loan for a given period of time.
  var OffsetOperator = (function (CalculatorEngineOperator) {
    // Options available: `offset`
    function OffsetOperator(options) {
      _get(Object.getPrototypeOf(OffsetOperator.prototype), "constructor", this).call(this, "offset");

      // Default options
      var defaults = {
        offset: 0
      };

      // Extend the default object with the `options` passed in.
      // Assigns it to the internal context.
      this.context = _.merge({}, defaults, {
        offset: options.offset });
    }

    _inherits(OffsetOperator, CalculatorEngineOperator);

    _prototypeProperties(OffsetOperator, null, {
      process: {

        // Adds new information to loan context.
        // Properties: `offset`.
        value: function process(period, context) {
          // Merge operator's context into loan's context.
          _get(Object.getPrototypeOf(OffsetOperator.prototype), "process", this).call(this, context);
        },
        writable: true,
        enumerable: true,
        configurable: true
      }
    });

    return OffsetOperator;
  })(CalculatorEngineOperator);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"financial-calculator-engine/lib/operator":3}],"financial-loan-calculator-engine":[function(require,module,exports){
(function (global){
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

var _ = (typeof window !== "undefined" ? window._ : typeof global !== "undefined" ? global._ : null);

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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./operators/extra-repayment-operator":4,"./operators/fee-operator":5,"./operators/interest-rate-operator":6,"./operators/lump-sum-operator":7,"./operators/offset-operator":8,"financial-calculator-engine":1,"financial-calculator-engine/lib/math":2}]},{},[]);
