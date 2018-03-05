// Parse `src/client/library.json`


/* .build/cdn.track/manifest.json
{
    localBase: "cdn/"
    globalBase: "https://unpkg.com/"
    items: [
        {
            path: string,
            package?: string,    // for js only
            bySystem?: boolean   // should be included in SystemJS
        }
    ]
*/

const gulp = require('gulp');
const del = require('del');
const download = require('gulp-download-stream');
const file = require('gulp-file');
const rename = require('gulp-rename');
const fs = require('fs');
const path = require('path');
const util = require('../util');

const json = JSON.parse(fs.readFileSync(util.workspace('src/client/library.json'), 'utf8'));
const globalBase = (json.base) ? json.base : 'https://unpkg.com/';
const localBase = 'cdn/';
const localDir = '.build/'+localBase;

let items = [];
let downloadTasks = [];

// Process link, system.
// from: unpkg | node_modules
function cdnGroup(paths, from, bySystem) {
    paths.forEach(function(path) {
        let taskName = localDir+path;

        // Download to .build/cdn/
        if (from == 'node_modules') {
            gulp.task(taskName, ['clean:cdn'], function() {
                gulp.src(util.workspace('node_modules/'+path))
                .pipe(rename(path))
                .pipe(gulp.dest(util.workspace(localDir)));
            });
        }
        else {
            gulp.task(taskName, ['clean:cdn'], function() {
                return download(globalBase+path)
                .pipe(rename(path))
                .pipe(gulp.dest(util.workspace(localDir)));
            });
        }
        downloadTasks.push(taskName);

        // Get the package name from path.
        let end;
        if (from == 'node_modules') {
            end = path.indexOf('/');
            if (path.startsWith('@')) {
                end = path.indexOf('/', end + 1);
            }
        }
        else {
            end = path.indexOf('@', 1);
        }
        const package = path.substring(0, end);

        // Push to files
        if (path.endsWith('.js') && bySystem) {
            if (from == 'node_modules') {
                let base = localBase;
                items.push({ path, package, base, bySystem });
            }
            else {
                items.push({ path, package, bySystem });
            }
        }
        else {
            items.push({ path, package });
        }
    })
};

// Generate download tasks.
if (json) {
    if (json.link) {
        cdnGroup(json.link, 'unpkg', false);
    }
    if (json.system) {
        cdnGroup(json.system, 'unpkg', true);
    }
    if (json.node_modules) {
        if (json.node_modules.system) {
            cdnGroup(json.node_modules.system, 'node_modules', true);
        }
    }
}

// Detect if `src/client/library.json` is changed.
let manifest = module.exports = { localBase, globalBase, items };
let manifestContent = JSON.stringify(manifest, null, 2);
let manifestChanged = true;
if (fs.existsSync(util.workspace('.build/cdn.track/manifest.json'))) {
    try {
        let content = fs.readFileSync(util.workspace('.build/cdn.track/manifest.json'), 'utf8');
        if (manifestContent == content) {
            manifestChanged = false;
        }
    }
    catch(e) {
        // Failed to read the file, consider manifestChanged true.
    }
}

// Update `.build/cdn.track/manifest.json` if `src/client/library.json` is changed.
gulp.task('.build/cdn.track/manifest.json', ['clean:cdn'], function() {
    return file('manifest.json', manifestContent, { src: true })
    .pipe(gulp.dest(util.workspace('.build/cdn.track/')));
});

// Download CDN files if `src/client/library.json` is changed.
gulp.task('cdn', downloadTasks.concat(['.build/cdn.track/manifest.json']));

// Execute if changed is dected.
gulp.task('.build/cdn', manifestChanged ? ['cdn'] : []);

// Remove everything of CDN in `.build` directory.
gulp.task('clean:cdn', function(done) {
    del([
        util.workspace('.build/cdn'),
        util.workspace('.build/cdn.track')
    ], { force: true })
    .then(function() {
        done();
    })
    .catch(done);
});