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

### Interest Intro Rate

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

### Extra Repayment

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

### Lump Sum

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

var results = loan
	.lumpSum({
		period: 12,
		lumpSum: 100000
	})
	.calculate();
```

### Offset

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

var results = loan
	.offset({
		offset: 10000
	})
	.calculate();
```

### Fee (Upfront and Ongoing fees)

```javascript
var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

var results = loan
	.fee({
		upfrontFee: 500,
		ongoingFee: 100,
	})
	.calculate();
```

### Savings
[See Savings calculator engine.](https://github.com/financial-calcs/savings-calculator-engine)

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

## To do

- Expand API documentation.

## License

MIT © [Pablo De Nadai](http://pablodenadai.com)
