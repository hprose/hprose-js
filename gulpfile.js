var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    jshint = require("gulp-jshint"),
    del = require('del');

gulp.task('clear', function(){
    del(['dist/hprose.js']);
});

gulp.task('compress', ['clear'], function() {
    return gulp.src(['src/Init.js',
                     'src/Helper.js',
                     'src/Polyfill.js',
                     'src/HarmonyMaps.js',
                     'src/TimeoutError.js',
                     'src/setImmediate.js',
                     'src/Future.js',
                     'src/BinaryString.js',
                     'src/StringIO.js',
                     'src/Tags.js',
                     'src/ClassManager.js',
                     'src/Writer.js',
                     'src/Reader.js',
                     'src/ResultMode.js',
                    //  'src/hproseIO.js',
                    //  'src/hproseHttpRequest.js',
                    //  'src/hproseHttpClient.js',
                    //  'src/JSONRPCClientFilter.js',
                     'src/Loader.js'])
        .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(concat('hprose.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['compress'], function() {
    return gulp.src(['src/CopyRight.js', 'dist/hprose.js'])
           .pipe(concat('hprose.js'))
           .pipe(gulp.dest('dist'))
           .pipe(gulp.dest('test'));
});
