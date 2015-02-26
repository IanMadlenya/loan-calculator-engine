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

gulp.task('lint', ['6to5'], function() {
  return gulp.src(['src/**/*.js'])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('test', ['lint'], function() {
  return gulp.src('test/**/*.js', {
      read: false
    })
    .pipe(mocha());
});

var browserify = require('browserify'),
  source = require('vinyl-source-stream');

gulp.task('browserify', ['test'], function() {
  return browserify()
    .require('./index.js', {
      expose: 'financial-loan-calculator-engine'
    })
    .transform('browserify-shim', {
      global: true
    })
    .bundle()
    .pipe(source('index.browser.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['browserify']);
