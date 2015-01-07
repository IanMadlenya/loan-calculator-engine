/*global describe, it */

'use strict';

var assert = require('assert');

var LoanCalculatorEngine = require('../.');

describe('LoanCalculatorEngine', function() {
	it('must calculate total pmt', function() {
		var loan = new LoanCalculatorEngine();

		var results = loan
			// .use(function(instance) {})
			// .config({})
			.context({
				principal: 100000,
				interestRate: 0.1,
				term: 10
			})
			// .interestRate({})
			.calculate();

		require('console.table');
		console.log('\n', 'summaryList');
		console.table(results.summaryList);

		console.log('\n', 'contextList');
		console.log(results.contextList[0]);

		console.log('\n', 'totals')
		console.log(results.totals);

		assert(true);
	});
});