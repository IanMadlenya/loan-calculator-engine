var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
	mocha = require('gulp-mocha'),
	to5 = require('gulp-6to5'),
	rename = require('gulp-rename');

gulp.task('6to5', function() {
	return gulp.src('src/**/*.js')
		.pipe(to5())
		.pipe(gulp.dest('./'));
});

gulp.task('jshint', ['6to5'], function() {
	return gulp.src(['src/**/*.js'])
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('mocha', ['jshint'], function() {
	return gulp.src('test/*.js', {
			read: false
		})
		.pipe(mocha({
			reporter: 'progress'
		}));
});

// var browserify = require('browserify'),
// 	source = require('vinyl-source-stream');

// gulp.task('browserify', ['mocha'], function() {
// 	return browserify()
// 		.require('./index.js', {
// 			expose: 'financial-loan-calculator-engine'
// 		})
// 		.bundle()
// 		.pipe(source('bundle.js'))
// 		.pipe(gulp.dest('./'));
// });

gulp.task('default', ['mocha']);