/*global describe, it */

'use strict';

var assert = require('assert');

var LoanCalculatorEngine = require('../.');

describe('LoanCalculatorEngine', function() {
	it('must calculate total pmt', function() {
		var loan = new LoanCalculatorEngine({
			principal: 100000,
			interestRate: 0.01,
			term: 10
		});

		var results = loan.calculate();

		assert.equal(105124.94564418306, results.totals.pmt);
	});
});