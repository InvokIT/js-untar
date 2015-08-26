define(["build/dev/untar"], function(untar) {
	describe("untar", function() {
		it("should unpack 3 files and a directory with 3 files", function(done) {
			untar("/base/spec/data/test.tar", {
				onExtract: function(file) { done(); }
			}).then(
				function(files) {
					expect(files.length).toBe(6);
					done();
				},
				function(err) {
					done.fail(JSON.stringify(err));
				}
			);
		}, 20000);
	});	
});

