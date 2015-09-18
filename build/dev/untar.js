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

var decoratedFileProps = {
	blob: {
		get: function() {
			return this._blob || (this._blob = new Blob([this.buffer]));
		}
	},
	getBlobUrl: {
		value: function() {
			return this._blobUrl || (this._blubUrl = URL.createObjectURL(blob));
		}
	},
	readAsString: {
		value: function() {
			var buffer = this.buffer;
			var charCount = buffer.byteLength;
			var charSize = 1;
			var byteCount = charCount * charSize;
			var bufferView = new DataView(buffer);

			var charCodes = [];

			for (var i = 0; i < charCount; ++i) {
				var charCode = bufferView.getUint8(i * charSize, true);
				charCodes.push(charCode);
			}

			return (this._string = String.fromCharCode.apply(null, charCodes));
		}
	},
	readAsJSON: {
		value: function() {
			return JSON.parse(this.readAsString());
		}
	}
};

function decorateExtractedFile(file) {
	Object.defineProperties(file, decoratedFileProps);
	return file;
}

workerScriptUri = '/base/build/dev/untar-worker.js';
return untar;
}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1bnRhci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIHdpbmRvdzogZmFsc2UsIEJsb2I6IGZhbHNlLCBQcm9taXNlOiBmYWxzZSwgY29uc29sZTogZmFsc2UsIFdvcmtlcjogZmFsc2UsIFByb2dyZXNzaXZlUHJvbWlzZTogZmFsc2UgKi9cblxudmFyIHdvcmtlclNjcmlwdFVyaTsgLy8gSW5jbHVkZWQgYXQgY29tcGlsZSB0aW1lXG5cbnZhciBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cbi8qKlxuUmV0dXJucyBhIFByb2dyZXNzaXZlUHJvbWlzZS5cbiovXG5mdW5jdGlvbiB1bnRhcihhcnJheUJ1ZmZlcikge1xuXHRpZiAoIShhcnJheUJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcnJheUJ1ZmZlciBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgQXJyYXlCdWZmZXIuXCIpO1xuXHR9XG5cblx0aWYgKCF3aW5kb3cuV29ya2VyKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiV29ya2VyIGltcGxlbWVudGF0aW9uIG5vdCBhdmFpbGFibGUgaW4gdGhpcyBlbnZpcm9ubWVudC5cIik7XG5cdH1cblxuXHRyZXR1cm4gbmV3IFByb2dyZXNzaXZlUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QsIHByb2dyZXNzKSB7XG5cdFx0dmFyIHdvcmtlciA9IG5ldyBXb3JrZXIod29ya2VyU2NyaXB0VXJpKTtcblxuXHRcdHZhciBmaWxlcyA9IFtdO1xuXG5cdFx0d29ya2VyLm9uZXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcblx0XHRcdHJlamVjdChlcnIpO1xuXHRcdH07XG5cblx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UuZGF0YTtcblxuXHRcdFx0c3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcblx0XHRcdFx0Y2FzZSBcImxvZ1wiOlxuXHRcdFx0XHRcdGNvbnNvbGVbbWVzc2FnZS5kYXRhLmxldmVsXShcIldvcmtlcjogXCIgKyBtZXNzYWdlLmRhdGEubXNnKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImV4dHJhY3RcIjpcblx0XHRcdFx0XHR2YXIgZmlsZSA9IGRlY29yYXRlRXh0cmFjdGVkRmlsZShtZXNzYWdlLmRhdGEpO1xuXHRcdFx0XHRcdGZpbGVzLnB1c2goZmlsZSk7XG5cdFx0XHRcdFx0cHJvZ3Jlc3MoZmlsZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJjb21wbGV0ZVwiOlxuXHRcdFx0XHRcdHJlc29sdmUoZmlsZXMpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiZXJyb3JcIjpcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiZXJyb3IgbWVzc2FnZVwiKTtcblx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKG1lc3NhZ2UuZGF0YS5tZXNzYWdlKSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihcIlVua25vd24gbWVzc2FnZSBmcm9tIHdvcmtlcjogXCIgKyBtZXNzYWdlLnR5cGUpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Ly9jb25zb2xlLmluZm8oXCJTZW5kaW5nIGFycmF5YnVmZmVyIHRvIHdvcmtlciBmb3IgZXh0cmFjdGlvbi5cIik7XG5cdFx0d29ya2VyLnBvc3RNZXNzYWdlKHsgdHlwZTogXCJleHRyYWN0XCIsIGJ1ZmZlcjogYXJyYXlCdWZmZXIgfSwgW2FycmF5QnVmZmVyXSk7XG5cdH0pO1xufVxuXG52YXIgZGVjb3JhdGVkRmlsZVByb3BzID0ge1xuXHRibG9iOiB7XG5cdFx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9ibG9iIHx8ICh0aGlzLl9ibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSkpO1xuXHRcdH1cblx0fSxcblx0Z2V0QmxvYlVybDoge1xuXHRcdHZhbHVlOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9ibG9iVXJsIHx8ICh0aGlzLl9ibHViVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG5cdFx0fVxuXHR9LFxuXHRyZWFkQXNTdHJpbmc6IHtcblx0XHR2YWx1ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgYnVmZmVyID0gdGhpcy5idWZmZXI7XG5cdFx0XHR2YXIgY2hhckNvdW50ID0gYnVmZmVyLmJ5dGVMZW5ndGg7XG5cdFx0XHR2YXIgY2hhclNpemUgPSAxO1xuXHRcdFx0dmFyIGJ5dGVDb3VudCA9IGNoYXJDb3VudCAqIGNoYXJTaXplO1xuXHRcdFx0dmFyIGJ1ZmZlclZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblxuXHRcdFx0dmFyIGNoYXJDb2RlcyA9IFtdO1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJDb3VudDsgKytpKSB7XG5cdFx0XHRcdHZhciBjaGFyQ29kZSA9IGJ1ZmZlclZpZXcuZ2V0VWludDgoaSAqIGNoYXJTaXplLCB0cnVlKTtcblx0XHRcdFx0Y2hhckNvZGVzLnB1c2goY2hhckNvZGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gKHRoaXMuX3N0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgY2hhckNvZGVzKSk7XG5cdFx0fVxuXHR9LFxuXHRyZWFkQXNKU09OOiB7XG5cdFx0dmFsdWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIEpTT04ucGFyc2UodGhpcy5yZWFkQXNTdHJpbmcoKSk7XG5cdFx0fVxuXHR9XG59O1xuXG5mdW5jdGlvbiBkZWNvcmF0ZUV4dHJhY3RlZEZpbGUoZmlsZSkge1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyhmaWxlLCBkZWNvcmF0ZWRGaWxlUHJvcHMpO1xuXHRyZXR1cm4gZmlsZTtcbn1cbiJdLCJmaWxlIjoidW50YXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==