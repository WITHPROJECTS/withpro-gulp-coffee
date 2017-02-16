let path           = require('path');
let notifier       = require('node-notifier');
let colors         = require('colors');
let gulp           = require('gulp');
let gulpIf         = require('gulp-if');
let gulpChanged    = require('gulp-changed');
let gulpSourcemaps = require('gulp-sourcemaps');
let gulpPlumber    = require('gulp-plumber');
let gulpConcat     = require('gulp-concat');
let gulpIgnore     = require('gulp-ignore');
let gulpCoffee     = require('gulp-coffee');
let gulpUglify     = require('gulp-uglify');
let runSequence    = require('run-sequence');
let isWatching     = false;
let conf           = {
    'path'    : {},
    'concat'  : false,
    'options' : {},
    'uglify'  : true
}

// /////////////////////////////////////////////////////////////////////////////
//
// PATH SETTING
//
// /////////////////////////////////////////////////////////////////////////////
conf.path = {
    'project' : '/',
    'src' : {
        'coffee' : 'src/coffee'
    },
    'dest' : {
        'js' : 'build/js'
    }
};

// /////////////////////////////////////////////////////////////////////////////
//
// OPTIONS
//
// /////////////////////////////////////////////////////////////////////////////
// gulp-coffee option
// 
conf.options.coffee = {
    'bare' : true
};
// =============================================================================
// gulp-uglify option
// 
conf.options.uglify = {};
// =============================================================================
// gulp-changed option
// 
conf.options.changed = {
    'extension' : '.coffee'
};
// =============================================================================
// gulp-plumber option
// 
conf.options.plumber = {
    'errorHandler' : function(err){
        let relativePath = err.fileName;
        relativePath = path.relative(process.cwd(), relativePath);
        notifier.notify({
            'title'   : `Coffee ${err.name}`,
            'message' : `${err.name} : ${relativePath}\n{ Line : ${err.loc.line}, Column : ${err.loc.column} }`,
            'sound'   : 'Pop'
        });
        console.log(`---------------------------------------------`.red.bold);
        console.log(`Line: ${err.loc.line}, Column: ${err.loc.column}`.red.bold);
        console.error(err.stack.red.bold);
        console.log(`---------------------------------------------`.red.bold);
        gulp.emit('end');
    }
};



// /////////////////////////////////////////////////////////////////////////////
//
// TASKS
//
// /////////////////////////////////////////////////////////////////////////////
conf.functions = {
    // =========================================================================
    'coffee-concat' : function(done){
        let ops   = conf.options;
        let num   = 0;
        let src   = conf.path.src.coffee;
        let list  = null;
        let cache = isWatching;
        if(!conf.concat){
            done();
            return false;
        }
        num = Object.keys(conf.concat).length;
        for(let key in conf.concat){
            list = [];
            for(let i = 0, l = conf.concat[key].length; i < l; i++){
                list.push(path.join(src, conf.concat[key][i]));
            }
            gulp.src(list)
                .pipe(gulpConcat(key))
                .pipe(gulp.dest(src))
                .on('end', ()=>{
                    num--;
                    if(num === 0) done();
                });
        }
        return false;
    },
    // =========================================================================
    'coffee-build' : function(){
        return runSequence('coffee-concat', ()=>{
            let ops    = conf.options;
            let cache  = isWatching;
            let ignore = '**/_*.coffee';
            let target = path.join(conf.path.src.coffee, '**/*.coffee');
            let dest   = conf.path.dest.js;
            return gulp.src(target)
                .pipe(gulpIgnore(ignore))
                .pipe(gulpIf(cache, gulpChanged(dest, ops.changed)))
                .pipe(gulpPlumber(ops.plumber))
                // .pipe(gulpSourcemaps.init())
                .pipe(gulpCoffee(ops.coffee))
                .pipe(gulpIf(conf.uglify, gulpUglify(ops.uglify)))
                // .pipe(gulpSourcemaps.write('.'))
                .pipe(gulpPlumber.stop())
                .pipe(gulp.dest(dest));
        });
    },
    // =========================================================================
    'coffee-watch' : function(){
        isWatching = true;
        let target = path.join(conf.path.src.coffee, '**/*.coffee');
        gulp.watch(target, ['coffee-build']);
    }
}

// /////////////////////////////////////////////////////////////////////////////
//
// INIT
//
// /////////////////////////////////////////////////////////////////////////////
conf.init = function(){
    let keys = Object.keys(conf.functions);
    keys.forEach((key)=>{
        let f = conf.functions;
        if(Array.isArray(f[key])){
            if(typeof f[key] === 'function'){
                gulp.task(key, f[key][0]);
            }else{
                gulp.task(key, f[key][0], f[key][1]);
            }
        }else{
            gulp.task(key, f[key]);
        }
    });
}

module.exports = conf;
