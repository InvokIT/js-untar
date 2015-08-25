var untar = require("../build/dev/untar.js");

describe("untar", function() {
	it("should unpack 3 files and a directory with 3 files", function() {
		untar("data/test.tar").then(function(files) {
			expect(files.length).toBe(6);
		});
	});
})