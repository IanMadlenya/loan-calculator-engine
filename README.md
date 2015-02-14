# loan-calculator-engine [![Build Status](https://travis-ci.org/financial-calcs/loan-calculator-engine.svg?branch=master)](https://travis-ci.org/financial-calcs/loan-calculator-engine)

> Loan repayment calculator engine. Calculates amortization table, repayment amount and interest paid.

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
### .calculate() 
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

### Simple Loan (Interest only)

```javascript
var loan = new LoanCalculatorEngine({
  presentValue: 100000,
  interestRate: 0.1,
  term: 10,
  repaymentType: 'IO'
});

var results = loan.calculate();
```

### Interest Intro Rate

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

### Fee (Upfront and Ongoing fees)

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

### Savings
[See Savings calculator engine.](https://github.com/financial-calcs/savings-calculator-engine)


## To do

- Expand API documentation.

## SemVer

We follow [Semantic Versioning](http://semver.org/).

## License

MIT © [Pablo De Nadai](http://pablodenadai.com)
