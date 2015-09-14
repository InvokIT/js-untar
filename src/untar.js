/* globals window: false, Blob: false, Promise: false, console: false, Worker: false, ProgressivePromise: false */

var workerScriptUri; // Included at compile time

var URL = window.URL || window.webkitURL;

/**
Returns a ProgressivePromise.
*/
function untar(arrayBuffer) {
	if (!(arrayBuffer instanceof ArrayBuffer)) {
		throw new TypeError("arrayBuffer is not an instance of ArrayBuffer.");
	}

	if (!window.Worker) {
		throw new Error("Worker implementation not available in this environment.");
	}

	return new ProgressivePromise(function(resolve, reject, progress) {
		var worker = new Worker(workerScriptUri);

		var files = [];

		worker.onerror = function(err) {
			reject(err);
		};

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
					//console.log("error message");
					reject(new Error(message.data.message));
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
	file.blob = new Blob([file.buffer]);
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