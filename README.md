# Stop! This is an experimental project and it's only early days. Please come back in a couple of days. :-)

# loan-calculator-engine

> Loan repayment calculator engine. Calculates amortization table, repayment amount and interest paid.

## Install

```
$ npm install --save financial-loan-calculator-engine
```

## Usage


```javascript
var LoanCalculatorEngine = require('financial-loan-calculator-engine');
```

### Simple Loan (Principal and Interest)

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

var results = loan.calculate();
```

### Simple Loan (Interest only)

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10,
	repaymentType: 'IO'
});

var results = loan.calculate();
```

### Multiple Interest Rates - Intro Rate

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

var results = loan
	.interestRate({
		endPeriod: 12,
		interestRate: 0.15
	})
	.calculate(); 
```

### Extra Repayments

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

var results = loan
	.extraRepayment({
		startPeriod: 13,
		extraRepayment: 100
	})
	.calculate();
```

### Savings (It will have its own Engine later on)

```javascript
var savings = new LoanCalculatorEngine({
	principal: 500,
	interestRate: 0.1,
	term: 10,
	repayment: 100
});

var results = savings
	.config({
		isSavingsMode: true
	})
	.calculate();
```

## License

MIT © [Pablo De Nadai](http://pablodenadai.com)
