/*global describe, it */

'use strict';

var assert = require('assert');

var LoanCalculatorEngine = require('../.');

// Savings
// var results = loan
// 	.config({
// 		isSavingsMode: true
// 	})
// 	.context({
// 		principal: 500,
// 		interestRate: 0.1,
// 		term: 10,
// 		repayment: 100
// 	})
// 	.calculate();


// ---


// Simple Loan + PI
// var results = loan
// 	.context({
// 		principal: 100000,
// 		interestRate: 0.1,
// 		term: 10
// 	})
// 	.calculate();


// Simple Loan + IO
// var results = loan
// 	.context({
// 		principal: 100000,
// 		interestRate: 0.1,
// 		term: 10,
// 		repaymentType: 'IO'
// 	})
// 	.calculate();


// ---


// Intro Rate + PI
// var results = loan
// 	.context({
// 		principal: 100000,
// 		interestRate: 0.1,
// 		term: 10
// 	})
// 	.interestRate({
// 		endPeriod: 12,
// 		interestRate: 0.15
// 	})
// 	.calculate();


// Intro Rate + IO
// var results = loan
// 	.context({
// 		principal: 100000,
// 		interestRate: 0.1,
// 		term: 10,
// 		repaymentType: 'IO'
// 	})
// 	.interestRate({
// 		endPeriod: 12,
// 		interestRate: 0.15
// 	})
// 	.calculate();


// ---


// Simple Loan + Extra Repayment + PI
// var results = loan
// 	.context({
// 		principal: 100000,
// 		interestRate: 0.1,
// 		term: 10
// 	})
// 	.extraRepayment({
// 		startPeriod: 13,
// 		extraRepayment: 100
// 	})
// 	.calculate();


// ---


// Intro Rate + Extra Repayment + PI
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
	.interestRate({
		endPeriod: 24,
		interestRate: 0.15
	})
	.calculate();

require('console.table');
console.log('\n', 'summaryList');
console.table(results.summaryList);

console.log('\n', 'contextList');
console.log(results.contextList[0]);

console.log('\n', 'totals')
console.log(results.totals);