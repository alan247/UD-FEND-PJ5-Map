var gulp = require('gulp');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');
var minifyHTML = require('gulp-htmlmin');
var eslint = require('gulp-eslint');
var mainBowerFiles = require('main-bower-files');
var filter = require('gulp-filter');
var sass = require('gulp-sass');
var order = require('gulp-order');

gulp.task('bower-scripts', function(){
	gulp.src(mainBowerFiles())
		.pipe(filter('*.js'))
		.pipe(order([
			'modernizr.js',
			'jquery.js',
			'foundation.js',
			'foundation.joyride.js',
			'jquery.cookie.js',
			'knockout.js'
		]))
		.pipe(concat('vendors.js'))
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js'))
});

gulp.task('bower-styles', function(){
	gulp.src(mainBowerFiles())
		.pipe(filter(['*.scss', '*.css']))
		.pipe(order([
			'normalize.css',
			'*'
		]))
		.pipe(sass().on('error', sass.logError))
		.pipe(concat('vendors.css'))
		.pipe(minifyCSS())
		.pipe(gulp.dest('./dist/css/'));
});


gulp.task('html', function(){
	gulp.src('./src/index.html')
		.pipe(minifyHTML({collapseWhitespace: true}))
		.pipe(gulp.dest('./dist/'))
		.pipe(reload({stream: true}))
});

gulp.task('js', function(){
	gulp.src('./src/js/*.js')
		.pipe(uglify())
		.pipe(concat('app.js'))
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(gulp.dest('./dist/js'))
		.pipe(reload({stream: true}))
});

gulp.task('css', function(){
	gulp.src('./src/css/*.css')
		.pipe(minifyCSS())
		.pipe(gulp.dest('./dist/css'))
		.pipe(reload({stream: true}))
});

gulp.task('img', function() {
	gulp.src('./src/img/*.**')
		.pipe(gulp.dest('./dist/img'))
		.pipe(reload({stream: true}))
});

gulp.task('serve', function(){
	browserSync.init({
		server: {
			baseDir: "./dist/"
		}
	});
	gulp.watch('./src/index.html', ['html']);
	gulp.watch('./src/js/*.js', ['js']);
	gulp.watch('./src/css/*.css', ['css']);
	gulp.watch('./src/img/*.**', ['img']);
});

gulp.task('default', ['bower-styles', 'bower-scripts', 'html', 'js', 'css', 'img', 'serve']);