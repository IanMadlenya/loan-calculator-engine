# loan-calculator-engine [![Build Status](https://travis-ci.org/financial-calcs/loan-calculator-engine.svg?branch=master)](https://travis-ci.org/financial-calcs/loan-calculator-engine)

> Loan repayment calculator engine. Calculates amortization table, repayment amount and interest paid.

## Table of Contents
- [Install](#install)
- [API](#api)
	- [Constructor](#constructor)
	- [Methods](#methods)
	  - [.calculate()](#calculate)
- [Usage](#usage)
	- [Simple Loan (Principal and Interest)](#simple-loan-principal-and-interest)
	- [Simple Loan (Interest Only)](#simple-loan-interest-only)
	- [Multiple Interest Rates](#multiple-interest-rates)
	- [Extra Repayment](#extra-repayment)
	- [Lump Sum](#lump-sum)
	- [Offset](#offset)
	- [Fee (Upfront and Ongoing Fees)](#fee-upfront-and-ongoing-fees)
- [Related Projects](#related-projects)
- [SemVer](#semver)
- [License](#license)

## Install
```
$ npm install --save financial-loan-calculator-engine
```

## API
### Constructor
#### presentValue
Type: `number`  
Default: `0`  
Loan amount to be borrowed aka. principal or present value.
#### interestRate 
Type: `number`  
Default: `0`  
Interest rate in decimals eg. 2% should be set as `0.02`.
#### interestRateFrequency 
Type: `number`  
Default: `1`  
Interest rate frequency where: `1` => yearly, `12` => monthly, `26` => fortnightly, `52` => weekly.
#### term 
Type: `number`  
Default: `0`  
Length of the loan.
#### termFrequency 
Type: `number`  
Default: `1`  
Term frequency where: `1` => years, `12` => months, `26` => fortnights, `52` => weeks.
#### repaymentType 
Type: `string`  
Default: `'PI'`  
Repayment type where: `'PI'` => Principal and Interest, `'IO'` => Interest only.
#### repaymentFrequency
Type: `number`  
Default: `12`  
Amortization frequency where: `1` => yearly, `12` => monthly, `26` => fortnightly, `52` => weekly.

### Methods
#### .calculate() 
Type: `function`  
Calculates the loan and returns the totals, including schedule list which contains the context (inputs) and amortization for each period.  
Returns:  
```json
{
  "totals": {
    "repayment": 0,
    "interestPaid": 0
  },
  "scheduleList": [
    {
      "period": 0,
      "context": {
        "presentValue": 0,
        "interestRate": 0,
        "interestRateFrequency": 0,
        "effInterestRate": 0,
        "term": 0,
        "termFrequency": 0,
        "effTerm": 0,
        "repayment": 0,
        "repaymentType": "",
        "repaymentFrequency": 0
      },
      "amortization": {
        "futureValue": 0,
        "repayment": 0,
        "interestPaid": 0,
        "principalPaid": 0
      }
    }
  ]
}
```

## Usage
```javascript
var LoanCalculatorEngine = require('financial-loan-calculator-engine');
```

### Simple Loan (Principal and Interest)
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
  interestRate: 0.1,
  term: 10
});

var results = loan.calculate();
```

### Simple Loan (Interest Only)
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
  interestRate: 0.1,
  term: 10,
  repaymentType: 'IO'
});

var results = loan.calculate();
```

### Multiple Interest Rates
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
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

#### API
##### startPeriod
Type: `number`  
Default: `1`  
Start period when the given interest rate will be taken into account.
##### endPeriod
Type: `number`  
Default: `Number.POSITIVE_INFINITY`  
End period when the given interest rate will stop being taken into account.
##### interestRate
Type: `number`  
Default: `0`  
Interest rate in decimals (2% => 0.02).
##### interestRateFrequency 
Type: `number`  
Default: `1`  
Interest rate frequency where: `1` => yearly, `12` => monthly, `26` => fortnightly, `52` => weekly.

### Extra Repayment
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
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

#### API
##### startPeriod
Type: `number`  
Default: `1`  
Start period when the given extra repayment amount will be taken into account.
##### endPeriod
Type: `number`  
Default: `Number.POSITIVE_INFINITY`  
End period when the given extra repayment amount will stop being taken into account.
##### extraRepayment
Type: `number`  
Default: `0`  
Extra repayment amount.
##### extraRepaymentFrequency
Type: `number`  
Default: `12`  
Extra repayment frequency where: `1` => yearly, `12` => monthly, `26` => fortnightly, `52` => weekly.

### Lump Sum
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
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

#### API
##### period
Type: `number`  
Default: `0`  
Period when the given lump sum amount will be taken into account.
##### extraRepayment
Type: `number`  
Default: `0`  
Lump sum amount.

### Offset
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
  interestRate: 0.1,
  term: 10
});

var results = loan
  .offset({
    offset: 10000
  })
  .calculate();
```

#### API
##### offset
Type: `number`  
Default: `0`  
Offset amount.

### Fee (Upfront and Ongoing Fees)
```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
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

#### API
##### upfrontFee
Type: `number`  
Default: `0`  
Upfront fee amount paid in the first period.
##### ongoingFee
Type: `number`  
Default: `0`  
Ongoing fee amount.
##### startPeriod
Type: `number`  
Default: `1`  
Start period when the ongoing fee amount will be taken into account.
##### endPeriod
Type: `number`  
Default: `Number.POSITIVE_INFINITY`  
End period when the ongoing fee amount will stop being taken into account.
##### ongoingFeeFrequency
Type: `number`  
Default: `12`  
Ongoing fee frequency where: `1` => yearly, `12` => monthly, `26` => fortnightly, `52` => weekly.

## Related Projects
- [Savings calculator engine.](https://github.com/financial-calcs/savings-calculator-engine)

## SemVer
We follow [Semantic Versioning](http://semver.org/).

## License
MIT © [Pablo De Nadai](http://pablodenadai.com)
