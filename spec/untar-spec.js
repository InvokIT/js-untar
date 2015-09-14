define(["untar", "../build/dist/untar"], function(untarDev, untarDist) {

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
			}

			r.open("GET", "base/spec/data/test.tar");
			r.responseType = "arraybuffer";
			r.send();
		});
	}

	var fileNames = [
		"1.txt",
		"2.txt",
		"3.txt",
		"directory/",
		"directory/1.txt",
		"directory/2.txt",
		"directory/3.txt"
	];

	var tests = function(untar) {

		return function() {
			it("should unpack 3 specific files and a directory with 3 specific files", function(done) {
				expect(typeof untar).toBe("function");

				var i = 0;
				var files = [];

				loadTestBuffer().then(function(buffer) {
					untar(buffer).then(
						function() {
							expect(files.length).toBe(7);
							done();
						},
						function(err) {
							done.fail(err.message);
						},
						function(file) {
							expect(file).toBeDefined();
							expect(file.name).toBe(fileNames[i]);
							files.push(file);
							i += 1;
						}
					);
				}, done.fail);
			}, 20000);

			it("should throw when not called with an ArrayBuffer", function() {
				expect(untar).toThrow();
				expect(function() { untar("test"); }).toThrow();
			});
		}
	};

	describe("untarDev", tests(untarDev));
	describe("untarDist", tests(untarDist));

});
