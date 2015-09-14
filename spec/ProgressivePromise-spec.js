define(["ProgressivePromise"], function(ProgressivePromise) {

	describe("ProgressivePromise", function() {
		it("should report progress events as they happen", function(done) {
			var p = new ProgressivePromise(function(resolve, reject, progress) {
				setTimeout(function() { progress(1); }, 5);
				setTimeout(function() { progress(2); }, 10);
				setTimeout(resolve, 15);
			});

			var r = [];

			p.progress(function(value) {
				r.push(value);
			});

			p.then(function() {
				if (r[0] === 1 && r[1] === 2) {
					done();
				} else {
					done.fail();
				}
			});
		});

		it("should report progress events after they've happened", function(done) {
			var p = new ProgressivePromise(function(resolve, reject, progress) {
				progress(1);
				progress(2);
				resolve();
			});

			setTimeout(function() {
				var r = [];

				p.progress(function(value) {
					r.push(value);
				});

				p.then(function() {
					if (r[0] === 1 && r[1] === 2) {
						done();
					} else {
						done.fail();
					}
				});
			}, 5);
		});
	});

});
