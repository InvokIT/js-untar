/* globals window: false, Blob: false, Promise: false, console: false, Worker: false, ProgressivePromise: false */

var workerScriptUri; // Included at compile time

var URL = window.URL || window.webkitURL;

var createBlob = (function() {
	if (typeof window.Blob === "function") {
		return function(dataArray) { return new Blob(dataArray); };
	} else {
		var BBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

		return function(dataArray) {
			var builder = new BBuilder();

			for (var i = 0; i < dataArray.length; ++i) {
				var v = dataArray[i];
				builder.append(v);
			}

			return builder.getBlob();
		};
	}
}());

/**
Returns a ProgressivePromise.
*/
function untar(arrayBuffer) {
	if (!window.Worker) {
		throw new Error("Worker implementation not available in this environment.");
	}

	return new ProgressivePromise(function(resolve, reject, progress) {
		var worker = new Worker(workerScriptUri);

		var files = [];

		worker.onmessage = function(message) {
			message = message.data;

			switch (message.type) {
				case "log":
					console[message.data.level]("Worker: " + message.data.msg);
					break;
				case "extract":
					var file = decorateExtractedFile(message.data);
					files.push(file);
					progress(file);
					break;
				case "complete":
					resolve(files);
					break;
				case "error":
					reject(message.data);
					break;
				default:
					reject(new Error("Unknown message from worker: " + message.type));
					break;
			}
		};

		//console.info("Sending arraybuffer to worker for extraction.");
		worker.postMessage({ type: "extract", buffer: arrayBuffer }, [arrayBuffer]);
	});
}

function decorateExtractedFile(file) {
	file.blob = createBlob([file.buffer]);
	delete file.buffer;

	var blobUrl;
	file.getObjectUrl = function() {
		if (!blobUrl) {
			blobUrl = URL.createObjectURL(file.blob);
		}

		return blobUrl;
	};

	return file;
}