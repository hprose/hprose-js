var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    jshint = require("gulp-jshint"),
    lzmajs = require("gulp-lzmajs"),
    del = require('del');

gulp.task('clear', function(){
    del(['dist/hprose.js']);
});

gulp.task('uglify', ['clear'], function() {
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
                     'src/Formatter.js',
                     'src/ResultMode.js',
                     'src/Client.js',
                     'src/FlashHttpRequest.js',
                     'src/HttpClient.js',
                     'src/WebSocketClient.js',
                     'src/ChromeTcpSocket.js',
                     'src/TcpClient.js',
                     'src/Loader.js'])
        .pipe(jshint())
        .pipe(jshint.reporter())
        .pipe(concat('hprose.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('compress', ['uglify'], function() {
    return gulp.src(['dist/hprose.js'])
        .pipe(concat('hprose.min.js'))
        .pipe(lzmajs())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['compress'], function() {
    return gulp.src(['src/CopyRight.js', 'dist/hprose.js'])
        .pipe(concat('hprose.js'))
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest('example'))
        .pipe(gulp.dest('test'));
});
