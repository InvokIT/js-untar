define(["untar-worker"], function() {

	var untarWorker = new UntarWorker();

	describe("untar-worker", function() {
		var onmessage;

		var fileNames = [
			"1.txt",
			"2.txt",
			"3.txt",
			"directory/",
			"directory/1.txt",
			"directory/2.txt",
			"directory/3.txt"
		];

		var fileContent = [
			"one",
			"two",
			"three",
			"",
			"one",
			"two",
			"three"
		];

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

		beforeEach(function() {
			onmessage = null;
			untarWorker.postMessage = function(msg, transfers) {
				if (typeof onmessage === "function") {
					onmessage(msg, transfers);
				}
			};
		});

		describe("UntarStream", function() {
			var s;

			beforeEach(function(done) {
				var n = new Uint32Array(1);
				n[0] = 42;
				var blob = new Blob([n.buffer, "String of 18 chars"]);
				var fileReader = new FileReader();

				fileReader.onload = function(e) {
					var buf = fileReader.result;
					s = new UntarStream(buf);
					done();
				};	

				fileReader.readAsArrayBuffer(blob);
			});

			it("should peek at uint32", function() {
				expect(s.peekUint32()).toBe(42);
			});

			it("should read a string", function() {
				s.seek(4);
				expect(s.readString(18)).toBe("String of 18 chars");
			});
		});

		describe("UntarFileStream", function() {
			var buffer;
			var fileStream;

			beforeEach(function(done) {
				loadTestBuffer().then(function(b) {
					buffer = b;
					fileStream = new UntarFileStream(b);
				}).then(done, done.fail);
			});

			afterEach(function() {
				buffer = null;
				fileStream = null;
			});

			it("should use hasNext() to indicate more files", function() {
				for (var i = 0; i < 7; ++i) {
					expect(fileStream.hasNext()).toBe(true);
					fileStream.next();
				}

				expect(fileStream.hasNext()).toBe(false);
			});

			it("should extract files in a specific order", function() {
				var file;
				var i = 0;

				while (fileStream.hasNext()) {
					file = fileStream.next();
					expect(file.name).toBe(fileNames[i++]);

					if (i > fileNames.length) fail("i > fileNames.length");
				}
			});

			it("should extract the correct content", function() {
				function readString(buffer) {
					if (!buffer) {
						return "";
					}

					//console.log("readString: position " + this.position() + ", " + charCount + " chars");
					var charCount = buffer.byteLength;
					var charSize = 1;
					var byteCount = charCount * charSize;
					var bufferView = new DataView(buffer);

					var charCodes = [];

					for (var i = 0; i < charCount; ++i) {
						var charCode = bufferView.getUint8(i * charSize, true);
						charCodes.push(charCode);
					}

					return String.fromCharCode.apply(null, charCodes);
				}


				var file;
				var i = 0;

				while (fileStream.hasNext()) {
					file = fileStream.next();

					var content = readString(file.buffer);
					expect(content).toBe(fileContent[i++]);

					if (i > fileContent.length) fail("i > fileContent.length");
				}
			});
		});

		describe("UntarWorker", function() {
			var buffer;
			var worker;

			beforeEach(function(done) {
				worker = new UntarWorker();

				loadTestBuffer().then(function(b) {
					buffer = b;
				}).then(done, done.fail);
			});

			it("receives messages to extract from a buffer", function() {
				var filesExtracted = 0;
				onmessage = function(msg, transfers) {
					var file;
					msg = msg.data;
					switch (msg.type) {
						case "extract":
							file = msg.data;
							expect(file.name).toBe(fileNames[filesExtracted++]);
							expect(transfers[0]).toBe(file.buffer);
							break;
						case "complete":
							expect(filesExtracted).toBe(7);
							expect(msg.data.length).toBe(7);

							for (var x = 0; x < msg.data.length; ++x) {
								expect(msg.data[x].name).toBe(fileNames[x]);
							}
							break;
						case "error":
							fail(msg.data);
							break;
					}
				};

				untarWorker.onmessage({type: "extract", buffer: buffer});
			});
		});
	});

});
