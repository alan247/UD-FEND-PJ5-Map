var gulp = require('gulp');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');

gulp.task('copy', function(){
	gulp.src('./src/index.html')
		.pipe(gulp.dest('./dist/'))
		.pipe(reload({stream: true}))
});

gulp.task('js', function(){
	gulp.src('./src/js/*.js')
		.pipe(uglify())
		.pipe(concat('app.js'))
		.pipe(gulp.dest('./dist/js'))
		.pipe(reload({stream: true}))
});

gulp.task('css', function(){
	gulp.src('./src/css/*.css')
		.pipe(minifyCSS())
		.pipe(gulp.dest('./dist/css'))
		.pipe(reload({stream: true}))
});

gulp.task('serve', function() {
	browserSync.init({
		server: {
			baseDir: "./dist/"
		}
	});
	gulp.watch('./src/index.html', ['copy']);
	gulp.watch('./src/js/*.js', ['js']);
	gulp.watch('./src/css/*.css', ['css']);
});

gulp.task('default', ['copy', 'js', 'css']);