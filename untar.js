// var workerScriptUri is compiled in

/**
source	= ArrayBuffer or a url string. If an ArrayBuffer, it will be transfered to the web worker and will thus not be available in the window after.
options	= {
	onComplete,
	onLoading, // When downloading the tar from a url.
	onExtract,
	onError
}
*/
function untar(source, options) {
	if (typeof Promise !== "function") {
		throw new Error("Promise implementation not available in this environment.");
	}

	if (typeof Worker !== "function") {
		throw new Error("Worker implementation not available in this environment.");
	}

	options = options || {};

	function makeTarFile

	return new Promise(function(resolve, reject) {
		var noop = function() { };
		var onComplete = options.onComplete || noop;
		var onLoading = options.onProgress || noop;
		var onExtract = options.onExtract || noop;
		var onError = options.onError || noop;

		var worker = new Worker(workerScriptUri);
		var files = [];

		worker.onmessage = function(message) {
			switch (message.type) {
				case "loading":
					onLoading(message.data);
					break;
				case "extract":
					var file = new TarFile(message.data);
					files.push(file);
					onExtract(file);
					break;
				case "complete":
					onComplete(files);
					resolve(files);
					break;
				case "error":
					var error = message.data;
					onError(error);
					reject(error);
					break;
				default:
					var error = new Error("Unknown message from worker.");
					onError(error);
					reject(error);
					break;
			}
		};

		// Don't transfer if source is a string. Only ArrayBuffer can be transfered.
		worker.postMessage(source, (typeof source === "string" ? undefined : [source]));
	});
}

function TarFile(orig) {
	this._blobUrl = null;

	for (p in orig) {
		switch (p) {
			case "buffer":
				this.blob = new Blob([orig.buffer]);
				break;
			default:
				this[p] = orig[p];
				break;
		}
	}
}

TarFile.prototype = {
	getObjectUrl: function() {
		if (!this._blobUrl) {
			this._blobUrl = URL.createObjectURL(this.blob);
		}

		return this._blobUrl;
	}
};