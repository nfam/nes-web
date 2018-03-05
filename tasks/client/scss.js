const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
let util = require('../util');

gulp.task('scss', ['.build/scss']);
gulp.task('.build/scss', function () {
    return gulp.src(util.workspace('src/client/assets/scss/**/*.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('all.css'))
        .pipe(gulp.dest(util.workspace('.build/scss/')));
});