var gulp = require("gulp"),
	umd = require("gulp-umd"),
	sourcemaps = require("gulp-sourcemaps"),
	uglify = require("gulp-uglify"),
	insert = require("gulp-insert"),
	addSrc = require("gulp-add-src"),
	concat = require("gulp-concat"),
	jshint = require("gulp-jshint"),
	KarmaServer = require('karma').Server,
	path = require("path"),
	filter = require("gulp-filter"),
    webserver = require('gulp-webserver');

gulp.task("build:dev", function() {
	var f = filter(['*', '!untar-worker.js'], { restore: true });

	return gulp.src(["src/untar.js"])
		.pipe(sourcemaps.init())
		.pipe(insert.append("\nworkerScriptUri = '/base/build/dev/untar-worker.js';"))
		.pipe(addSrc(["src/ProgressivePromise.js", "src/untar-worker.js"]))
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(jshint.reporter("fail"))
		.pipe(insert.prepend('"use strict";\n'))
		.pipe(f)
		.pipe(umd({
			dependencies: function(file) {
				if (path.basename(file.path) === "untar.js") {
					return ["ProgressivePromise"];
				} else {
					return [];
				}
			},
			exports: function(file) {
				return path.basename(file.path, path.extname(file.path));
			},
			namespace: function(file) {
				return path.basename(file.path, path.extname(file.path));
			}
		}))
		.pipe(f.restore)
		.pipe(sourcemaps.write())
		.pipe(gulp.dest("build/dev"));
});

gulp.task("build:dist", function() {
	return gulp.src("src/untar-worker.js")
        .pipe(sourcemaps.init())
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(jshint.reporter("fail"))
		.pipe(insert.prepend('"use strict";\n'))
		.pipe(uglify())
		.pipe(insert.transform(function(contents, file) {
			var str = ['\nworkerScriptUri = (window||this).URL.createObjectURL(new Blob(["'];
			str.push(contents.replace(/\\/g, "\\\\").replace(/"/g, '\\"'));
			str.push('"]));');

			return str.join("");
		}))
		.pipe(addSrc(["src/ProgressivePromise.js", "src/untar.js"]))
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(jshint.reporter("fail"))
		.pipe(concat("untar.js"))
		.pipe(insert.prepend('"use strict";\n'))
		.pipe(umd({
			exports: function() { return "untar"; },
			namespace: function() { return "untar"; }
		}))
		.pipe(uglify())
        .pipe(sourcemaps.write("./"))
		.pipe(gulp.dest("build/dist"));
});

gulp.task("jshint:specs", function() {
	return gulp.src("spec/**/*.js")
		.pipe(jshint())
		.pipe(jshint.reporter("default"))
		.pipe(jshint.reporter("fail"));
});

gulp.task("default", ["build:dev", "build:dist"]);

gulp.task("test", ["jshint:specs", "build:dev", "build:dist"], function(done) {
	new KarmaServer({
	    configFile: __dirname + '/karma.conf.js',
	    singleRun: true
	  }, done).start();
});

gulp.task("example", ["build:dev"], function() {
	gulp.src("./")
		.pipe(webserver({
            directoryListing: false,
			livereload: true,
			open: "example/",
            proxies: [
                { source: "/base", target: "http://localhost:8000/"}
            ],
            port: 8000
		}));
});
