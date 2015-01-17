/*global describe, it */

'use strict';

var assert = require('assert'),
	_ = require('lodash');

var helper = {
	round: function(number) {
		if (!_.isNumber(number)) return 0;
		return Math.round(number * 100) / 100;
	}
};

var LoanCalculatorEngine = require('../.');

describe('simple loan (principal and interest)', function() {
	var loan = new LoanCalculatorEngine({
		principal: 100000,
		interestRate: 0.1,
		term: 10
	});

	var results = loan.calculate();

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 158580.88);
		assert.equal(helper.round(totals.interestPaid), 58580.88);
	});

	it('should calculate the amortization table (first amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = _.first(amortizationList);

		assert.equal(helper.round(amortization.principalBalance), 100000);
		assert.equal(helper.round(amortization.interestBalance), 58580.88);
		assert.equal(helper.round(amortization.interestPaid), 0);
		assert.equal(helper.round(amortization.principalPaid), 0);
		assert.equal(helper.round(amortization.repayment), 0);
	});

	it('should calculate the amortization table (tenth period amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = amortizationList[10];

		assert.equal(helper.round(amortization.principalBalance), 94931.07);
		assert.equal(helper.round(amortization.interestBalance), 50434.74);
		assert.equal(helper.round(amortization.interestPaid), 795.48);
		assert.equal(helper.round(amortization.principalPaid), 526.03);
		assert.equal(helper.round(amortization.repayment), 1321.51);
	});

	it('should calculate the amortization table (last amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = _.last(amortizationList);

		assert.equal(helper.round(amortization.principalBalance), 0);
		assert.equal(helper.round(amortization.interestBalance), 0);
		assert.equal(helper.round(amortization.interestPaid), 10.92);
		assert.equal(helper.round(amortization.principalPaid), 1310.59);
		assert.equal(helper.round(amortization.repayment), 1321.51);
	});
});

describe('simple loan (interest only)', function() {
	var loan = new LoanCalculatorEngine({
		principal: 100000,
		interestRate: 0.15,
		term: 10,
		repaymentType: 'IO'
	});

	var results = loan.calculate();

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 150000);
		assert.equal(helper.round(totals.interestPaid), 150000);
	});

	it('should calculate the amortization table (first amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = _.first(amortizationList);

		assert.equal(helper.round(amortization.principalBalance), 100000);
		assert.equal(helper.round(amortization.interestBalance), 150000);
		assert.equal(helper.round(amortization.interestPaid), 0);
		assert.equal(helper.round(amortization.principalPaid), 0);
		assert.equal(helper.round(amortization.repayment), 0);
	});

	it('should calculate the amortization table (tenth period amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = amortizationList[10];

		assert.equal(helper.round(amortization.principalBalance), 100000);
		assert.equal(helper.round(amortization.interestBalance), 137500);
		assert.equal(helper.round(amortization.interestPaid), 1250);
		assert.equal(helper.round(amortization.principalPaid), 0);
		assert.equal(helper.round(amortization.repayment), 1250);
	});

	it('should calculate the amortization table (last amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = _.last(amortizationList);

		assert.equal(helper.round(amortization.principalBalance), 100000);
		assert.equal(helper.round(amortization.interestBalance), 0);
		assert.equal(helper.round(amortization.interestPaid), 1250);
		assert.equal(helper.round(amortization.principalPaid), 0);
		assert.equal(helper.round(amortization.repayment), 1250);
	});
});

describe('intro rate (principal and interest)', function() {
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

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 164305.01);
		assert.equal(helper.round(totals.interestPaid), 64305.01);
	});

	it('should calculate the amortization table (first amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = _.first(amortizationList);

		assert.equal(helper.round(amortization.principalBalance), 100000);
		assert.equal(helper.round(amortization.interestBalance), 64305.01);
		assert.equal(helper.round(amortization.interestPaid), 0);
		assert.equal(helper.round(amortization.principalPaid), 0);
		assert.equal(helper.round(amortization.repayment), 0);
	});

	it('should calculate the amortization table (twentieth period amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = amortizationList[20];

		assert.equal(helper.round(amortization.principalBalance), 90815.74);
		assert.equal(helper.round(amortization.interestBalance), 43392.42);
		assert.equal(helper.round(amortization.interestPaid), 761.63);
		assert.equal(helper.round(amortization.principalPaid), 580.45);
		assert.equal(helper.round(amortization.repayment), 1342.08);
	});

	it('should calculate the amortization table (last amortization item)', function() {
		var amortizationList = results.amortizationList,
			amortization = _.last(amortizationList);

		assert.equal(helper.round(amortization.principalBalance), 0);
		assert.equal(helper.round(amortization.interestBalance), 0);
		assert.equal(helper.round(amortization.interestPaid), 11.09);
		assert.equal(helper.round(amortization.principalPaid), 1330.99);
		assert.equal(helper.round(amortization.repayment), 1342.08);
	});
});

describe('intro rate (interest only)', function() {
	var loan = new LoanCalculatorEngine({
		principal: 100000,
		interestRate: 0.1,
		term: 10,
		repaymentType: 'IO'
	});

	var results = loan
		.interestRate({
			endPeriod: 12,
			interestRate: 0.15
		})
		.calculate();

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 105000);
		assert.equal(helper.round(totals.interestPaid), 105000);
	});
});

describe('simple loan + extra repayment (principal and interest)', function() {
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

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 152739.63);
		assert.equal(helper.round(totals.interestPaid), 52739.63);
	});
});

describe('savings', function() {
	var loan = new LoanCalculatorEngine({
		principal: 500,
		interestRate: 0.1,
		term: 10,
		repayment: 100
	});

	var results = loan
		.config({
			isSavingsMode: true
		})
		.calculate();

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 12000);
		assert.equal(helper.round(totals.interestPaid), 9338.02);
	});
});

describe('lump sum', function() {
	var loan = new LoanCalculatorEngine({
		principal: 100000,
		interestRate: 0.1,
		term: 10
	});

	var results = loan
		.lumpSum({
			period: 12,
			lumpSum: 10000
		})
		.calculate();

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 145701.13);
		assert.equal(helper.round(totals.interestPaid), 45701.13);
	});
});

describe('offset', function() {
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

	it('should calculate the totals', function() {
		var totals = results.totals;

		assert.equal(helper.round(totals.repayment), 143483.73);
		assert.equal(helper.round(totals.interestPaid), 43483.73);
	});
});