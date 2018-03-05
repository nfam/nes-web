const gulp = require('gulp');
const changed = require('gulp-changed');
const del = require('del');
const exec = require('child_process').exec;
const fs = require('fs');
const rename = require('gulp-rename');
const ts = require('gulp-typescript');
const util = require('./util');

/*************************************
 * Production NPM modules
 *************************************/
// Dectect change on package.json
let packageChanged = true;
let packageSrc = util.workspace('package.json');
let packageCache = util.workspace('.build/server/_package.json');
if (fs.existsSync(packageSrc)
&& fs.existsSync(packageCache)
&& fs.readFileSync(packageSrc, 'utf8') == fs.readFileSync(packageCache, 'utf8')) {
    packageChanged = false;
}

gulp.task('.build/server/node_modules', packageChanged ? ['npm'] : []);

gulp.task('.build/server/_package.json', () => {
    return gulp.src(packageSrc)
    .pipe(rename((path) => {
        path.basename = '_package.json';
    }))
    .pipe(gulp.dest(util.workspace('.build/server/')));
});

gulp.task('.build/server/package.json', ['.build/server/_package.json'], (done) => {
    fs.readFile(packageSrc, 'utf8', (error, data) => {
        if (error) {
            done(error);
            return
        }
        var json = JSON.parse(data);
        json.name = json.name + ".server";
        fs.writeFile(util.workspace('.build/server/package.json'), JSON.stringify(json), done);
    })
});

gulp.task('npm', ['.build/server/package.json'], (cb) => {
    exec('npm install --prefix '+util.workspace('.build/server/')+' --production', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});
gulp.task('clean:npm', function(done) {
    del(util.workspace('.build/server'))
    .then(() => {
        done();
    })
    .catch(done)
});


/*************************************
 * Building Server
 *************************************/
let serverTsProject = ts.createProject(util.workspace('src/server/tsconfig.json'));

gulp.task('server', ['server:build', 'server:config', 'server:node_modules']);

gulp.task('dist/server', ['server']);

gulp.task('server:build', () => {
    return gulp.src(util.workspace('src/server/**/*.ts'))
    .pipe(serverTsProject())
    .pipe(gulp.dest(util.workspace('dist/server/')));
});

gulp.task('server:config', () => {
    return gulp.src(util.workspace('src/server/config/*.json'))
    .pipe(changed(util.workspace('dist/server/node_modules/')))
    .pipe(gulp.dest(util.workspace('dist/server/config/')));
});

gulp.task('server:node_modules', ['.build/server/node_modules'], () => {
    return gulp.src(util.workspace('.build/server/node_modules/**/*'))
    .pipe(changed(util.workspace('dist/server/node_modules/')))
    .pipe(gulp.dest(util.workspace('dist/server/node_modules/')));
});

gulp.task('clean:server', function(done) {
    del(util.workspace('dist/server'))
    .then(() => {
        done();
    })
    .catch(done)
});
