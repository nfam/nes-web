/* .build/icons.track/symbol.json
{
*/

const gulp = require('gulp');
const del = require('del');
const concat = require('gulp-concat');
const intercept = require('gulp-intercept');
const file = require('gulp-file');
const path = require('path');
const rename = require('gulp-rename');
const svgmin = require('gulp-svgmin');
const wrapper = require('gulp-wrapper');

const util = require('../util');

// Execute if changed is dected.
gulp.task('.build/icons', ['icons']);

// Generate icons.css
let iconContents = [];  // icons file content (without <svg>) after injected symbols
let iconNames = [];     // icons' file basename without '.svg'
gulp.task('icons', [
    '.build/icons/_icons'
], function(done) {
    let sb = [];
    iconNames.forEach((name, index) => {
        let before = '';
        let b = name.indexOf('(');
        let e = name.lastIndexOf(')');
        if (b > 0 && e > 0 && b < e) {
            before = name.substring(b + 1, e) + ' ';
            name = name.substring(0, b) + name.substring(e + 1);
        }
        name = before + 'i.icon-' + name.trim();
        sb.push(name +
            ' { background-image: url(\'data:image/svg+xml;charset=utf-8,'+
            iconContents[index] +
            '\'); }');
    });
    return file('icons.css', sb.join('\n'), { src: true })
    .pipe(gulp.dest(util.workspace('.build/icons/')));
});

// Remove everything of CDN in `.build` directory.
gulp.task('clean:icons', function(done) {
    del(util.workspace('.build/icons'), { force: true })
    .then(function() {
        done();
    })
    .catch(done)
});

// ********************************************************
// Sub TASKS
// ********************************************************
let symbolFiles = {};   // symbol file content indexed `symbol/${filename}.svg` -> Content
gulp.task('.build/icons/_icons', [
    '.build/icons/_symbols'
], function() {
    return gulp.src(util.workspace('src/client/assets/icons/*.svg'))
    .pipe(intercept(file => {
        let content = file.contents.toString();

        let sb = [];
        let symbolsToInject = [];

        // Modify href.
        while (content.indexOf('href="') >= 0) {
            
            // Get href value.
            let start = content.indexOf('href="') + 6;
            let end = content.indexOf('"', start);
            let hrefValue = content.substring(start, end).trim();

            // Modify href
            sb.push(content.substring(0, start));
            if (hrefValue.startsWith('symbol/')) {
                let symbolFileName = hrefValue.substring(0, hrefValue.indexOf('#'));
                let symbolFileContent = symbolFiles[symbolFileName];
                if (symbolFileContent) {
                    symbolsToInject.push(symbolFileContent);
                }
                hrefValue = hrefValue.substring(hrefValue.indexOf('#'));
            }

            sb.push(hrefValue);
            content = content.substring(end);
        }

        // Inject symbols.
        content = content.substring(0, content.lastIndexOf('</svg>'));
        sb.push(content);
        sb.push(symbolsToInject.join('\n'));
        sb.push('\n</svg>');

        file.contents = new Buffer(sb.join(''));
        return file;
    }))
    .pipe(svgmin())
    .pipe(intercept(file => {
        iconNames.push(path.basename(file.path, '.svg'));
        iconContents.push(file.contents.toString());
        return file;
    }));
    //.pipe(gulp.dest(util.workspace('.build/icons.track/')));
});

gulp.task('.build/icons/_symbols', function() {
    return gulp.src(util.workspace('src/client/assets/icons/symbol/*.svg'))
    .pipe(intercept(file => {
        let content = file.contents.toString();
        content = content.substring(
            content.indexOf('<symbol'),
            content.lastIndexOf('</symbol>') + '</symbol>'.length
        );
        symbolFiles['symbol/'+path.basename(file.path)] = content;
        return file;
    }));
});
