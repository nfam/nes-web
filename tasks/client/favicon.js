const gulp = require('gulp');
const del = require('del');
const fs = require('fs');
const realFavicon = require ('gulp-real-favicon');
const rename = require('gulp-rename');
const util = require('../util');

// Dectect change on src/client/assets/favicon
let monoChanged = true;
let colorChanged = true;

let monoSrc = util.workspace('src/client/assets/favicon/favicon.svg');
let monoDest = util.workspace('.build/favicon/safari-pinned-tab.svg');
if (fs.existsSync(monoDest)) {
    if (fs.readFileSync(monoSrc, 'utf8') == fs.readFileSync(monoDest, 'utf8')) {
        monoChanged = false;
    }
}
let colorSrc = util.workspace('src/client/assets/favicon/favicon.svg');
let colorDest = util.workspace('.build/favicon.track/favicon.svg');
if (fs.existsSync(colorDest)) {
    if (fs.readFileSync(colorSrc, 'utf8') == fs.readFileSync(colorDest, 'utf8')) {
        colorChanged = false;
    }
}

gulp.task('.build/favicon', 
    colorChanged ? ['favicon']
    : (monoChanged ? ['.build/favicon/safari-pinned-tab.svg|noclean']
    : [])
);

gulp.task('favicon', [
    'real-favicon',
    '.build/favicon/safari-pinned-tab.svg'
]);

gulp.task('clean:favicon', function(done) {
    del([
        util.workspace('.build/favicon'),
        util.workspace('.build/favicon.track')
    ], { force: true })
    .then(function() {
        done();
    })
    .catch(done)
});

// ********************************************************
// Sub TASKS
// ********************************************************
gulp.task('real-favicon', ['.build/favicon.track'], function(done) {
    realFavicon.generateFavicon({
        masterPicture: colorSrc,
        dest: util.workspace('.build/favicon'),
        iconsPath: '/',
        design: {
            ios: {
                pictureAspect: 'backgroundAndMargin',
                backgroundColor: '#ffffff',
                margin: '10%',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: true,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {}
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false
        },
        markupFile: util.workspace('.build/favicon.track/markup.json')
    }, function() {
        done();
    });
});

gulp.task('.build/favicon.track', ['clean:favicon'], function() {
    return gulp.src([colorSrc])
    .pipe(gulp.dest(util.workspace('.build/favicon.track/')));
});

gulp.task('.build/favicon/safari-pinned-tab.svg', ['clean:favicon'], function() {
    return gulp.src([monoSrc])
    .pipe(rename((path) => {
        path.basename = 'safari-pinned-tab';
    }))
    .pipe(gulp.dest(util.workspace('.build/favicon/')));
});

gulp.task('.build/favicon/safari-pinned-tab.svg|noclean', function() {
    return gulp.src([monoSrc])
    .pipe(rename((path) => {
        path.basename = 'safari-pinned-tab';
    }))
    .pipe(gulp.dest(util.workspace('.build/favicon/')));
});
