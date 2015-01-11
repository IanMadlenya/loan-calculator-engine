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

	it('should calculate the summary table (first amortization item)', function() {
		var summaryList = results.summaryList,
			summary = _.first(summaryList);

		assert.equal(helper.round(summary.principalBalance), 100000);
		assert.equal(helper.round(summary.interestBalance), 58580.88);
		assert.equal(helper.round(summary.interestPaid), 0);
		assert.equal(helper.round(summary.principalPaid), 0);
		assert.equal(helper.round(summary.repayment), 0);
	});

	it('should calculate the summary table (tenth period amortization item)', function() {
		var summaryList = results.summaryList,
			summary = summaryList[10];

		assert.equal(helper.round(summary.principalBalance), 94931.07);
		assert.equal(helper.round(summary.interestBalance), 50434.74);
		assert.equal(helper.round(summary.interestPaid), 795.48);
		assert.equal(helper.round(summary.principalPaid), 526.03);
		assert.equal(helper.round(summary.repayment), 1321.51);
	});

	it('should calculate the summary table (last amortization item)', function() {
		var summaryList = results.summaryList,
			summary = _.last(summaryList);

		assert.equal(helper.round(summary.principalBalance), 0);
		assert.equal(helper.round(summary.interestBalance), 0);
		assert.equal(helper.round(summary.interestPaid), 10.92);
		assert.equal(helper.round(summary.principalPaid), 1310.59);
		assert.equal(helper.round(summary.repayment), 1321.51);
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

	it('should calculate the summary table (first amortization item)', function() {
		var summaryList = results.summaryList,
			summary = _.first(summaryList);

		assert.equal(helper.round(summary.principalBalance), 100000);
		assert.equal(helper.round(summary.interestBalance), 150000);
		assert.equal(helper.round(summary.interestPaid), 0);
		assert.equal(helper.round(summary.principalPaid), 0);
		assert.equal(helper.round(summary.repayment), 0);
	});

	it('should calculate the summary table (tenth period amortization item)', function() {
		var summaryList = results.summaryList,
			summary = summaryList[10];

		assert.equal(helper.round(summary.principalBalance), 100000);
		assert.equal(helper.round(summary.interestBalance), 137500);
		assert.equal(helper.round(summary.interestPaid), 1250);
		assert.equal(helper.round(summary.principalPaid), 0);
		assert.equal(helper.round(summary.repayment), 1250);
	});

	it('should calculate the summary table (last amortization item)', function() {
		var summaryList = results.summaryList,
			summary = _.last(summaryList);

		assert.equal(helper.round(summary.principalBalance), 100000);
		assert.equal(helper.round(summary.interestBalance), 0);
		assert.equal(helper.round(summary.interestPaid), 1250);
		assert.equal(helper.round(summary.principalPaid), 0);
		assert.equal(helper.round(summary.repayment), 1250);
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

	it('should calculate the summary table (first amortization item)', function() {
		var summaryList = results.summaryList,
			summary = _.first(summaryList);

		assert.equal(helper.round(summary.principalBalance), 100000);
		assert.equal(helper.round(summary.interestBalance), 64305.01);
		assert.equal(helper.round(summary.interestPaid), 0);
		assert.equal(helper.round(summary.principalPaid), 0);
		assert.equal(helper.round(summary.repayment), 0);
	});

	it('should calculate the summary table (twentieth period amortization item)', function() {
		var summaryList = results.summaryList,
			summary = summaryList[20];

		assert.equal(helper.round(summary.principalBalance), 90815.74);
		assert.equal(helper.round(summary.interestBalance), 43392.42);
		assert.equal(helper.round(summary.interestPaid), 761.63);
		assert.equal(helper.round(summary.principalPaid), 580.45);
		assert.equal(helper.round(summary.repayment), 1342.08);
	});

	it('should calculate the summary table (last amortization item)', function() {
		var summaryList = results.summaryList,
			summary = _.last(summaryList);

		assert.equal(helper.round(summary.principalBalance), 0);
		assert.equal(helper.round(summary.interestBalance), 0);
		assert.equal(helper.round(summary.interestPaid), 11.09);
		assert.equal(helper.round(summary.principalPaid), 1330.99);
		assert.equal(helper.round(summary.repayment), 1342.08);
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