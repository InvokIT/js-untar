var gulp = require("gulp"),
	umd = require("gulp-umd"),
	sourcemaps = require("gulp-sourcemaps"),
	uglify = require("gulp-uglify"),
	insert = require("gulp-insert"),
	addSrc = require("gulp-add-src"),
	concat = require("gulp-concat"),
	jshint = require("gulp-jshint"),
	KarmaServer = require('karma').Server;

gulp.task("default", function() {
	return gulp.src("untar-worker.js")
		.pipe(sourcemaps.init())
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(jshint.reporter("fail"))
		.pipe(uglify())
		.pipe(insert.transform(function(contents, file) {
			var str = ["\nvar workerScriptUri = URL.createObjectURL(createBlob([\""];
			str.push(contents.replace(/"/g, '\\"'));
			str.push("\"]));");

			return str.join("");
		}))
		.pipe(addSrc("untar.js"))
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(jshint.reporter("fail"))
		.pipe(concat("untar.js"))
		.pipe(umd({
			exports: function() { return "untar"; },
			namespace: function() { return "untar"; }
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("build/dev"))
		.pipe(uglify())
		.pipe(gulp.dest("build/dist"));
});

gulp.task("test", ["default"], function(done) {
	new KarmaServer({
	    configFile: __dirname + '/karma.conf.js',
	    singleRun: true
	  }, done).start();
});