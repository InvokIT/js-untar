define(["untar-worker"], function() {

	var untarWorker = new UntarWorker();

	describe("untar-worker", function() {
		var onmessage;

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

        function loadFile(path) {
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

                r.open("GET", path);
                r.responseType = "arraybuffer";
                r.send();
            });
		}

		function loadTestBuffer() {
        	return loadFile("base/spec/data/test.tar");
		}

		function loadPaxTestBuffer() {
            return loadFile("base/spec/data/test-pax.tar");
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
				for (var i = 0; i < fileNames.length; ++i) {
					expect(fileStream.hasNext()).toBe(true);
					fileStream.next();
				}

				expect(fileStream.hasNext()).toBe(false);
			});

			it("should read files in the correct order with the correct file headers", function() {
				var file;
				var i = 0;
				var isDir;

				while (fileStream.hasNext()) {
					file = fileStream.next();
					isDir = file.name.endsWith("/");

					expect(file.name).toBe(fileNames[i++]);
					expect(file.mode).toBeDefined();
					expect(file.uid).toBeDefined();
					expect(file.gid).toBeDefined();
					expect(file.size).toBeDefined();
					expect(file.mtime).toBeTruthy();
					expect(file.checksum).toBeTruthy();
					expect(file.type).toBe(isDir ? "5" : "0");
					expect(file.linkname).toBe("");
					expect(file.ustarFormat).toBe("ustar");
					expect(file.version).toBe("00");
					expect(file.uname).toBeDefined();
					expect(file.gname).toBeDefined();
					expect(file.devmajor).toBeDefined();
					expect(file.devminor).toBeDefined();
					expect(file.namePrefix).toBeDefined();

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
					expect(fileContent[i++](content)).toBe(true);

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
