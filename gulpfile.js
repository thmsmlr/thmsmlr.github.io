var gulp = require('gulp')
  , notify = require('gulp-notify')
  , watch = require('gulp-watch')
  , plumber = require('gulp-plumber')
  , sass = require('gulp-sass')
  , livereload = require('gulp-livereload')
  , prefix = require('gulp-autoprefixer')
  , lr = require('tiny-lr')
  , server = lr()
  , wintersmith = require('gulp-wintersmith');

gulp.task('preview', function() {
  // LiveReload Server
  server.listen(35729, function (err) {
    if (err) {
      return console.log(err)
    };

    // Sass
    gulp.src('./sass/**/*.scss', { read : false })
        .pipe(watch({ emit : 'all' }))
        .pipe(plumber())
        .pipe(sass())
        .pipe(prefix("last 2 version", "> 1%", "ie 8", "ie 7"))
        .pipe(gulp.dest('./contents/css'))
        .pipe(livereload(server));

    // Markdown or HTML
    gulp.src('./{templates,contents}/**/*.{md,json,html}', { read : false })
        .pipe(watch())
        .pipe(plumber())
        .pipe(livereload(server));

    gulp.src('./config.json')
        .pipe(wintersmith('preview'));
  });
});

gulp.task('build', function() {
  return gulp.src('./config.json')
             .pipe(wintersmith('build'));
});


