define(["lodash", "untar", "../build/dist/untar"], function(_, untarDev, untarDist) {

	function loadTestBuffer() {
		return new Promise(function(resolve, reject) {
			var r = new XMLHttpRequest();

			r.onload = function(e) {
				if (r.status >= 200 && r.status < 400) {
					var buffer = r.response;
					resolve(buffer);
				} else {
					reject(r.status + " " + r.statusText);
				}
			};

			r.open("GET", "base/spec/data/test.tar");
			r.responseType = "arraybuffer";
			r.send();
		});
	}

    var fileNames = [
        "1.txt",
        "2.txt",
        "3.txt",
        "511.txt",
        "512.txt",
        "513.txt",
        "directory/",
        "directory/1.txt",
        "directory/2.txt",
        "directory/3.txt",
        "object.json"
    ];

    var fileContent = [
        function(ct) { return ct === "one"; },
        function(ct) { return ct === "two"; },
        function(ct) { return ct === "three"; },
        function(ct) { return ct.length === 511; },
        function(ct) { return ct.length === 512; },
        function(ct) { return ct.length === 513; },
        function(ct) { return ct === ""; },
        function(ct) { return ct === "one"; },
        function(ct) { return ct === "two"; },
        function(ct) { return ct === "three"; },
        function(ct) { return ct === '{"prop":"value"}'; }
    ];

	var tests = function(untar) {

		return function() {
			it("should unpack 4 specific files and a directory with 3 specific files", function(done) {
				expect(typeof untar).toBe("function");

				var i = 0;

				loadTestBuffer().then(function(buffer) {
					untar(buffer).then(
						function(files) {
                            //console.log(files.map(function(f) { return f.name; }));
							expect(i).toBe(fileNames.length);
							expect(files.length).toBe(fileNames.length);
							done();
						},
						function(err) {
							done.fail(err.message);
						},
						function(file) {
							expect(file).toBeDefined();
							expect(file.name).toBe(fileNames[i]);
							i += 1;
						}
					);
				}, done.fail);
			}, 20000);

			it("should throw when not called with an ArrayBuffer", function() {
				expect(untar).toThrow();
				expect(function() { untar("test"); }).toThrow();
			});

			describe("UntarFile", function() {

				describe("readAsString()", function() {
					it("should read contents as a string", function(done) {
						var i = 0;

						loadTestBuffer().then(function(buffer) {
							untar(buffer)
							.progress(function(file) {
								expect(fileContent[i++](file.readAsString())).toBe(true);
							})
							.then(done);
						});
					});
				});

				describe("readAsJSON()", function() {
					it("should read file contents as a JSON object", function(done) {
						loadTestBuffer().then(function(buffer) {
							untar(buffer)
							.progress(function(file) {
								if (/\.json$/.test(file.name)) {
									var o;
									expect(function() { o = file.readAsJSON(); }).not.toThrow();
									expect(o).toEqual({ prop: "value" });
								}
							})
							.then(done);
						});
					});
				});

				describe("getBlobUrl()", function() {
					it("should return a unique ObjectURL for each file.", function(done) {
						return loadTestBuffer().then(function(buffer) {
							return untar(buffer)
							.then(function(files) {
								//console.debug("'getBlobUrl() should return a unique ObjectURL for each file' loaded and untar'ed the test buffer.");

								var urls = _.map(files, function(file) { return file.getBlobUrl(); });

								expect(_.some(urls, function(url) { return url === null; } )).toBe(false);

								expect(_.uniq(urls).length).toBe(urls.length);

								urlsCopy = _.map(files, function(file) { return file.getBlobUrl(); });
								expect(urlsCopy).toEqual(urls);

								//console.debug("'getBlobUrl() should return a unique ObjectURL for each file' ran all expectations");
							});
						})
						.then(done)
						.catch(done.fail);
					});
				});

			});
		};
	};

	describe("untarDev", tests(untarDev));
	describe("untarDist", tests(untarDist));

});
