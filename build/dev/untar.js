;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['ProgressivePromise'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('ProgressivePromise'));
  } else {
    root.untar = factory(root.ProgressivePromise);
  }
}(this, function(ProgressivePromise) {
"use strict";
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
	var blob;
	var blobUrl;
	Object.defineProperties(file, {
		blob: {
			get: function() {
				return blob || (blob = new Blob([this.buffer]));
			}
		},
		getObjectUrl: {
			value: function() {
				return blobUrl || (blubUrl = URL.createObjectURL(blob));
			}
		}
	});

	return file;
}

workerScriptUri = '/base/build/dev/untar-worker.js';
return untar;
}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1bnRhci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIHdpbmRvdzogZmFsc2UsIEJsb2I6IGZhbHNlLCBQcm9taXNlOiBmYWxzZSwgY29uc29sZTogZmFsc2UsIFdvcmtlcjogZmFsc2UsIFByb2dyZXNzaXZlUHJvbWlzZTogZmFsc2UgKi9cblxudmFyIHdvcmtlclNjcmlwdFVyaTsgLy8gSW5jbHVkZWQgYXQgY29tcGlsZSB0aW1lXG5cbnZhciBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cbi8qKlxuUmV0dXJucyBhIFByb2dyZXNzaXZlUHJvbWlzZS5cbiovXG5mdW5jdGlvbiB1bnRhcihhcnJheUJ1ZmZlcikge1xuXHRpZiAoIShhcnJheUJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcnJheUJ1ZmZlciBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgQXJyYXlCdWZmZXIuXCIpO1xuXHR9XG5cblx0aWYgKCF3aW5kb3cuV29ya2VyKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiV29ya2VyIGltcGxlbWVudGF0aW9uIG5vdCBhdmFpbGFibGUgaW4gdGhpcyBlbnZpcm9ubWVudC5cIik7XG5cdH1cblxuXHRyZXR1cm4gbmV3IFByb2dyZXNzaXZlUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QsIHByb2dyZXNzKSB7XG5cdFx0dmFyIHdvcmtlciA9IG5ldyBXb3JrZXIod29ya2VyU2NyaXB0VXJpKTtcblxuXHRcdHZhciBmaWxlcyA9IFtdO1xuXG5cdFx0d29ya2VyLm9uZXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcblx0XHRcdHJlamVjdChlcnIpO1xuXHRcdH07XG5cblx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UuZGF0YTtcblxuXHRcdFx0c3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcblx0XHRcdFx0Y2FzZSBcImxvZ1wiOlxuXHRcdFx0XHRcdGNvbnNvbGVbbWVzc2FnZS5kYXRhLmxldmVsXShcIldvcmtlcjogXCIgKyBtZXNzYWdlLmRhdGEubXNnKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImV4dHJhY3RcIjpcblx0XHRcdFx0XHR2YXIgZmlsZSA9IGRlY29yYXRlRXh0cmFjdGVkRmlsZShtZXNzYWdlLmRhdGEpO1xuXHRcdFx0XHRcdGZpbGVzLnB1c2goZmlsZSk7XG5cdFx0XHRcdFx0cHJvZ3Jlc3MoZmlsZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJjb21wbGV0ZVwiOlxuXHRcdFx0XHRcdHJlc29sdmUoZmlsZXMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiZXJyb3JcIjpcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiZXJyb3IgbWVzc2FnZVwiKTtcblx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKG1lc3NhZ2UuZGF0YS5tZXNzYWdlKSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihcIlVua25vd24gbWVzc2FnZSBmcm9tIHdvcmtlcjogXCIgKyBtZXNzYWdlLnR5cGUpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly9jb25zb2xlLmluZm8oXCJTZW5kaW5nIGFycmF5YnVmZmVyIHRvIHdvcmtlciBmb3IgZXh0cmFjdGlvbi5cIik7XG5cdFx0d29ya2VyLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJleHRyYWN0XCIsIGJ1ZmZlcjogYXJyYXlCdWZmZXIgfSwgW2FycmF5QnVmZmVyXSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBkZWNvcmF0ZUV4dHJhY3RlZEZpbGUoZmlsZSkge1xuXHR2YXIgYmxvYjtcblx0dmFyIGJsb2JVcmw7XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGZpbGUsIHtcblx0XHRibG9iOiB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gYmxvYiB8fCAoYmxvYiA9IG5ldyBCbG9iKFt0aGlzLmJ1ZmZlcl0pKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGdldE9iamVjdFVybDoge1xuXHRcdFx0dmFsdWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gYmxvYlVybCB8fCAoYmx1YlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0cmV0dXJuIGZpbGU7XG59XG4iXSwiZmlsZSI6InVudGFyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=