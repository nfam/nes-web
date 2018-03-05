const gulp = require('gulp');
const concat = require('gulp-concat');
const del = require('del');
const fs = require('fs');
const changed = require('gulp-changed');
const cleanCSS = require('gulp-clean-css');
const gulpif = require('gulp-if');
const htmlMinifier = require('html-minifier');
const inlineNg2Template = require('gulp-inline-ng2-template');
const manifest = require('gulp-manifest');
const replace = require('gulp-replace');
const ts = require('gulp-typescript');
const uglify = require('gulp-uglify');
const wrapper = require('gulp-wrapper');
const util = require('./util');

const minifying = true;

// Load cdn, favicon, and icons gulp tasks
const cdn = require('./client/cdn');
require('./client/favicon');
require('./client/icons');
require('./client/scss');

// Load compiltion configuration.
let clientTsProject = ts.createProject(
    util.workspace('src/client/tsconfig.json'), {
        outFile: util.workspace('.build/client/app.js')
    }
);

// Build everything for client.
gulp.task('client', [
    'client/html',
    'client/manifest',
    'client/css',
    'client/js',
    'client/favicon',
    'client/cdn'
]);
gulp.task('clean:client', function(done) {
    del(util.workspace('dist/client'), { force: true })
    .then(function() {
        done();
    })
    .catch(done)
});
gulp.task('dist/client', [
    'dist/client/index.html',
    'dist/client/app.manifest',
    'dist/client/assets/app.css',
    'dist/client/assets/app.js',
    'dist/client/assets/favicon',
    'dist/client/cdn'
]);

// ********************************************************
// client/manifest
// ********************************************************
{
    gulp.task('client/manifest', ['dist/client/app.manifest']);
    gulp.task('client/manifest:rehash', buildManifest);
    gulp.task('dist/client/app.manifest', [
        'dist/client/assets/favicon',
        'dist/client/assets/app.css',
        'dist/client/assets/app.js',
        'dist/client/cdn',
    ], buildManifest);

    function buildManifest() {
        return gulp.src([
            util.workspace('dist/client/**/*.js'),
            util.workspace('dist/client/**/*.css'),
            util.workspace('dist/client/**/*.ico'),
            util.workspace('dist/client/**/*.png'),
            util.workspace('dist/client/**/*.svg')
        ], { base: util.workspace('dist/client/') })
        .pipe(manifest({
            hash: true,
            network: [],
            fallback: [],
            network: ['*'],
            filename: 'app.manifest'
         }))
        .pipe(gulp.dest(util.workspace('dist/client/')));
    }
}

// ********************************************************
// client/html
// ********************************************************
{
    let htmlIcons = '';
    let htmlStyles = '';
    let htmlScripts = '';

    gulp.task('client/html', ['dist/client/index.html']);
    gulp.task('dist/client/index.html', [
        'dist/client/index.html:icons',
        'dist/client/index.html:styles',
        'dist/client/index.html:scripts'
    ], function() {
        return gulp.src(util.workspace('src/client/index.html'))
        .pipe(replace('<html lang="en">', '<html lang="en" manifest="app.manifest">'))
        .pipe(replace('<!-- icons -->', htmlIcons))
        .pipe(replace('<!-- styles -->', htmlStyles))
        .pipe(replace('<!-- scripts -->', htmlScripts))
        .pipe(gulp.dest(util.workspace('dist/client/')));
    });
    gulp.task('dist/client/index.html:icons', [
        'dist/client/assets/favicon'
    ], function(done) {
        fs.exists(util.workspace('dist/client/assets/favicon'), function(exists) {
            if (exists) {
                fs.readdir(util.workspace('dist/client/assets/favicon'), function(error, filenames) {
                    if (error) {
                        done(error);
                    }
                    else {
                        htmlIcons = filenames
                            .filter(name => name.endsWith('.png') || name.endsWith('.ico') || name.endsWith('.svg'))
                            .map(name => 'assets/favicon/'+name)
                            .map(util.iconLink)
                            .join('');
                        done();
                    }
                });
            }
            else {
                done();
            }
        });
    });
    gulp.task('dist/client/index.html:styles', function(done) {
        htmlStyles += util.styleLink(cdn.items
            .filter(item => item.path.endsWith('.css'))
            .map(item => (item.base || cdn.localBase) + item.path)
            .concat('assets/app.css')
        );
        done();
    });
    gulp.task('dist/client/index.html:scripts', function(done) {
        htmlScripts += util.scriptLink(cdn.items
            .filter(item => item.path.endsWith('.js') && !item.bySystem)
            .map(item => (item.base || cdn.localBase) + item.path)
            .concat('assets/app.js')
        );
        if (fs.existsSync(util.workspace('src/client/system.config.js'))) {
            try {
                let content = fs.readFileSync(util.workspace('src/client/system.config.js'), 'utf8')
                    .replace('"{{path}}": "{{path}}"', `"${cdn.localBase}":"${cdn.localBase}"`)
                    .replace('"{{map}}": "{{map}}"',cdn.items
                        .filter(item => item.bySystem)
                        .map(item => `"${item.package}":"${cdn.localBase+item.path}"`)
                        .join(',\n')
                    );

                htmlScripts += util.scriptContent(content);
                done();
            }
            catch (error) {
                done(error);
            }
        }
        else {
            done();
        }
    });
}

// ********************************************************
// client/js
// ********************************************************
{
    gulp.task('client/js', ['dist/client/assets/app.js']);
    gulp.task('dist/client/assets/app.js', [
        '.build/client/app.js'
    ], function() {
        gulp.src(util.workspace('.build/client/app.js'))
        .pipe(gulpif(minifying, uglify()))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(util.workspace('dist/client/assets/')));
    });
    gulp.task('.build/client/app.js', () => {
        return gulp.src(util.workspace('src/client/**/*.ts'))
        .pipe(inlineNg2Template({
            useRelativePaths: true,
            templateProcessor: function minifyTemplate(path, ext, file, cb) {
                try {
                    var minifiedFile = htmlMinifier.minify(file, {
                        collapseWhitespace: true,
                        caseSensitive: true,
                        removeComments: true,
                        removeRedundantAttributes: true
                    });
                    cb(null, minifiedFile);
                }
                catch (err) {
                    cb(err);
                }
            }
        }))
        .pipe(clientTsProject())
        .js
        .pipe(gulp.dest(util.workspace('.build/client/')));
    });
}

// ********************************************************
// client/css
// ********************************************************
{
    gulp.task('client/css', ['dist/client/assets/app.css']);
    gulp.task('dist/client/assets/app.css', [
        '.build/scss',
        '.build/icons'
    ], function() {
        return gulp.src(util.workspace([
            '.build/scss/all.css',
            '.build/icons/icons.css',
        ]))
        .pipe(gulpif(minifying, cleanCSS({compatibility: 'ie8'})))
        .pipe(concat('app.css'))
        .pipe(gulp.dest(util.workspace('dist/client/assets/')));
    });
}

// ********************************************************
// client/favicon
// ********************************************************
{
    gulp.task('client/favicon', ['dist/client/assets/favicon']);
    gulp.task('clean:client/favicon', function(done) {
        del(util.workspace('dist/client/assets/favicon'), { force: true })
        .then(function() {
            done();
        })
        .catch(done)
    });
    gulp.task('dist/client/assets/favicon', [
        '.build/favicon'
    ], function() {
        return gulp.src([
            util.workspace('.build/favicon/*.png'),
            util.workspace('.build/favicon/*.ico'),
            util.workspace('.build/favicon/*.svg')
        ])
        .pipe(changed(util.workspace('dist/client/assets/favicon/')))
        .pipe(gulp.dest(util.workspace('dist/client/assets/favicon/')));
    });
}

// ********************************************************
// client/cdn
// ********************************************************
{
    gulp.task('client/cdn', ['dist/client/cdn']);
    gulp.task('clean:client/cdn', function(done) {
        del(util.workspace('dist/client/cdn'), { force: true })
        .then(function() {
            done();
        })
        .catch(done)
    });
    gulp.task('dist/client/cdn', [
        '.build/cdn'
    ], function() {
        return gulp.src(util.workspace('.build/cdn/**/*'))
        .pipe(changed(util.workspace('dist/client/cdn/')))
        .pipe(gulp.dest(util.workspace('dist/client/cdn/')));
    });
}
