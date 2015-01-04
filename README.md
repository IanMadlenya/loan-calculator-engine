# loan-calculator-engine

> Loan repayment calculator engine. Calculates amortization table, repayment amount and interest paid.

## Install

```
$ npm install --save financial-loan-calculator-engine
```

## Usage

```javascript
var LoanCalculatorEngine = require('financial-loan-calculator-engine'),
	InterestRateOperator = require('financial-interest-rate-operator');

LoanCalculatorEngine
	.use(InterestRateOperator)
	.config({
		frequency: {
			fortnight: 26.1,
			week: 52.2
		}
	});

var loan = new LoanCalculatorEngine({
	principal: 100000,
	interestRate: 0.1,
	term: 10
});

loan.interestRate({
	startPeriod: 0,
	endPeriod: 12,
	interestRate: 0.15
});

var results = loan.calculate();
```

## License

MIT © [Pablo De Nadai](www.pablodenadai.com)
