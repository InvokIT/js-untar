define(["untar"], function(untar) {

	describe("untar", function() {

		console.log("untar: " + JSON.stringify(untar));

		var fileNames = [
			"1.txt",
			"2.txt",
			"3.txt",
			"directory/",
			"directory/1.txt",
			"directory/2.txt",
			"directory/3.txt"
		];

		it("should unpack 3 specific files and a directory with 3 specific files", function(done) {
			var i = 0;

			untar("/base/spec/data/test.tar").then(
				function(files) {
					expect(files.length).toBe(7);
					done();
				},
				function(err) {
					done.fail(JSON.stringify(err));
				},
				function(file) {
					expect(file).toBeDefined();
					expect(file.name).toBe(fileNames[i]);
					i += 1;
				}
			);
		}, 20000);
	});	

});
