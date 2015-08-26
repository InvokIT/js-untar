/* globals window: false, Blob: false, Promise: false, console: false, XMLHttpRequest: false, Worker: false */
/* jshint -W097 */
"use strict";

var workerScriptUri; // Included at compile time

var URL = window.URL || window.webkitURL;

var createBlob = (function() {
	if (typeof window.Blob === "function") {
		return function(dataArray) { return new Blob(dataArray); };
	} else {
		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

		return function(dataArray) {
			var builder = new BlobBuilder();

			for (var i = 0; i < dataArray.length; ++i) {
				builder.append(dataArray[i]);
			}

			return builder.getBlob();
		};
	}
}());

function createBlob(dataArray) {
	if (typeof window.Blob === "function") {
		return new Blob(dataArray);
	} else {
		var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;
		var builder = new BlobBuilder();

		for (var i = 0; i < dataArray.length; ++i) {
			builder.append(dataArray[i]);
		}

		return builder.getBlob();
	}
}

function loadArrayBuffer(uri) {
	console.info("loadArrayBuffer called");

	return new Promise(function(resolve, reject) {
		var request = new XMLHttpRequest();

		/*
		request.addEventListener("progress", function(e) {
			postMessage({ type: "loading", data: e });
		});
		*/

		request.addEventListener("load", function(e) {
			if (request.status >= 200 && request.status < 400) {
				resolve(request.response);
			} else {
				reject(new Error(request.status + " " + request.statusText));
			}
		});

		request.addEventListener("error", function(err) { reject(err); });
		request.addEventListener("abort", function(err) { reject(err); });

		request.open("GET", uri, true);
		request.responseType = "arraybuffer";
		request.send();
	});
}

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
	console.info("untar called");

	if (typeof Promise !== "function") {
		throw new Error("Promise implementation not available in this environment.");
	}

	if (!window.Worker) {
		throw new Error("Worker implementation not available in this environment.");
	}

	options = options || {};

	return new Promise(function(resolve, reject) {
		var noop = function() { };
		var onComplete = options.onComplete || noop;
		var onLoading = options.onProgress || noop;
		var onExtract = options.onExtract || noop;
		var onError = options.onError || noop;

		var worker = new Worker(workerScriptUri);

		function initWorker() {
			// Is source a string? Then assume it's a URL and download it.
			if (typeof source === "string") {
				loadArrayBuffer(source).then(
					function(buffer) {
						console.info("Loaded tar file, extracting.");
						worker.postMessage({ type: "extract", buffer: buffer }, [buffer]);
					},
					function(err) {
						onError(err);
						reject(err);
					}
				);
			} else {
				console.info("Extracting tar file.");
				worker.postMessage({ type: "extract", buffer: source }, [source]);
			}
		}

		var files = [];
		var msgData;

		worker.onmessage = function(message) {
			message = message.data;

			switch (message.type) {
				case "ready":
					console.info("Worker is ready.");
					initWorker();
					break;
				case "log":
					console[message.data.level]("Worker: " + message.data.msg);
					break;
				case "loading":
					onLoading(message.data);
					break;
				case "extract":
					msgData = new TarFile(message.data);
					files.push(msgData);
					onExtract(msgData);
					break;
				case "complete":
					onComplete(files);
					resolve(files);
					break;
				case "error":
					msgData = message.data;
					onError(msgData);
					reject(msgData);
					break;
				default:
					msgData = new Error("Unknown message from worker: " + message.type);
					onError(msgData);
					reject(msgData);
					break;
			}
		};
	});
}

function TarFile(orig) {
	this._blobUrl = null;

	for (var p in orig) {
		switch (p) {
			case "buffer":
				this.blob = createBlob([orig.buffer]);
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
