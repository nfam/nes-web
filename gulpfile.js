let gulp = require('gulp');

require('./tasks/client');
require('./tasks/server');

gulp.task('default', ['client', 'server']);
gulp.task('update', ['dist/client', 'dist/server']);


/*************************************
 * Watch
 *************************************/
gulp.task('watch', function () {
    gulp.watch([
        'src/client/**/*.ts',
        'src/client/**/*.html',
        'src/client/**/*.css',
        'src/client/**/*.svg'
    ], ['dist/client']);
});
