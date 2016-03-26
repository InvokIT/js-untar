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
/* globals Blob: false, Promise: false, console: false, Worker: false, ProgressivePromise: false */

var workerScriptUri; // Included at compile time

var global = window || this;

var URL = global.URL || global.webkitURL;

/**
Returns a ProgressivePromise.
*/
function untar(arrayBuffer) {
	if (!(arrayBuffer instanceof ArrayBuffer)) {
		throw new TypeError("arrayBuffer is not an instance of ArrayBuffer.");
	}

	if (!global.Worker) {
		throw new Error("Worker implementation is not available in this environment.");
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
			return this._blobUrl || (this._blobUrl = URL.createObjectURL(this.blob));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1bnRhci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIEJsb2I6IGZhbHNlLCBQcm9taXNlOiBmYWxzZSwgY29uc29sZTogZmFsc2UsIFdvcmtlcjogZmFsc2UsIFByb2dyZXNzaXZlUHJvbWlzZTogZmFsc2UgKi9cclxuXHJcbnZhciB3b3JrZXJTY3JpcHRVcmk7IC8vIEluY2x1ZGVkIGF0IGNvbXBpbGUgdGltZVxyXG5cclxudmFyIGdsb2JhbCA9IHdpbmRvdyB8fCB0aGlzO1xyXG5cclxudmFyIFVSTCA9IGdsb2JhbC5VUkwgfHwgZ2xvYmFsLndlYmtpdFVSTDtcclxuXHJcbi8qKlxyXG5SZXR1cm5zIGEgUHJvZ3Jlc3NpdmVQcm9taXNlLlxyXG4qL1xyXG5mdW5jdGlvbiB1bnRhcihhcnJheUJ1ZmZlcikge1xyXG5cdGlmICghKGFycmF5QnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpKSB7XHJcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJyYXlCdWZmZXIgaXMgbm90IGFuIGluc3RhbmNlIG9mIEFycmF5QnVmZmVyLlwiKTtcclxuXHR9XHJcblxyXG5cdGlmICghZ2xvYmFsLldvcmtlcikge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiV29ya2VyIGltcGxlbWVudGF0aW9uIGlzIG5vdCBhdmFpbGFibGUgaW4gdGhpcyBlbnZpcm9ubWVudC5cIik7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbmV3IFByb2dyZXNzaXZlUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QsIHByb2dyZXNzKSB7XHJcblx0XHR2YXIgd29ya2VyID0gbmV3IFdvcmtlcih3b3JrZXJTY3JpcHRVcmkpO1xyXG5cclxuXHRcdHZhciBmaWxlcyA9IFtdO1xyXG5cclxuXHRcdHdvcmtlci5vbmVycm9yID0gZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdHJlamVjdChlcnIpO1xyXG5cdFx0fTtcclxuXHJcblx0XHR3b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xyXG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5kYXRhO1xyXG5cclxuXHRcdFx0c3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcclxuXHRcdFx0XHRjYXNlIFwibG9nXCI6XHJcblx0XHRcdFx0XHRjb25zb2xlW21lc3NhZ2UuZGF0YS5sZXZlbF0oXCJXb3JrZXI6IFwiICsgbWVzc2FnZS5kYXRhLm1zZyk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlIFwiZXh0cmFjdFwiOlxyXG5cdFx0XHRcdFx0dmFyIGZpbGUgPSBkZWNvcmF0ZUV4dHJhY3RlZEZpbGUobWVzc2FnZS5kYXRhKTtcclxuXHRcdFx0XHRcdGZpbGVzLnB1c2goZmlsZSk7XHJcblx0XHRcdFx0XHRwcm9ncmVzcyhmaWxlKTtcclxuXHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdGNhc2UgXCJjb21wbGV0ZVwiOlxyXG5cdFx0XHRcdFx0cmVzb2x2ZShmaWxlcyk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRjYXNlIFwiZXJyb3JcIjpcclxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJlcnJvciBtZXNzYWdlXCIpO1xyXG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcihtZXNzYWdlLmRhdGEubWVzc2FnZSkpO1xyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoXCJVbmtub3duIG1lc3NhZ2UgZnJvbSB3b3JrZXI6IFwiICsgbWVzc2FnZS50eXBlKSk7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHJcblx0XHQvL2NvbnNvbGUuaW5mbyhcIlNlbmRpbmcgYXJyYXlidWZmZXIgdG8gd29ya2VyIGZvciBleHRyYWN0aW9uLlwiKTtcclxuXHRcdHdvcmtlci5wb3N0TWVzc2FnZSh7IHR5cGU6IFwiZXh0cmFjdFwiLCBidWZmZXI6IGFycmF5QnVmZmVyIH0sIFthcnJheUJ1ZmZlcl0pO1xyXG5cdH0pO1xyXG59XHJcblxyXG52YXIgZGVjb3JhdGVkRmlsZVByb3BzID0ge1xyXG5cdGJsb2I6IHtcclxuXHRcdGdldDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiB0aGlzLl9ibG9iIHx8ICh0aGlzLl9ibG9iID0gbmV3IEJsb2IoW3RoaXMuYnVmZmVyXSkpO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0Z2V0QmxvYlVybDoge1xyXG5cdFx0dmFsdWU6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fYmxvYlVybCB8fCAodGhpcy5fYmxvYlVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwodGhpcy5ibG9iKSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHRyZWFkQXNTdHJpbmc6IHtcclxuXHRcdHZhbHVlOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xyXG5cdFx0XHR2YXIgY2hhckNvdW50ID0gYnVmZmVyLmJ5dGVMZW5ndGg7XHJcblx0XHRcdHZhciBjaGFyU2l6ZSA9IDE7XHJcblx0XHRcdHZhciBieXRlQ291bnQgPSBjaGFyQ291bnQgKiBjaGFyU2l6ZTtcclxuXHRcdFx0dmFyIGJ1ZmZlclZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcclxuXHJcblx0XHRcdHZhciBjaGFyQ29kZXMgPSBbXTtcclxuXHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2hhckNvdW50OyArK2kpIHtcclxuXHRcdFx0XHR2YXIgY2hhckNvZGUgPSBidWZmZXJWaWV3LmdldFVpbnQ4KGkgKiBjaGFyU2l6ZSwgdHJ1ZSk7XHJcblx0XHRcdFx0Y2hhckNvZGVzLnB1c2goY2hhckNvZGUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gKHRoaXMuX3N0cmluZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgY2hhckNvZGVzKSk7XHJcblx0XHR9XHJcblx0fSxcclxuXHRyZWFkQXNKU09OOiB7XHJcblx0XHR2YWx1ZTogZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBKU09OLnBhcnNlKHRoaXMucmVhZEFzU3RyaW5nKCkpO1xyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIGRlY29yYXRlRXh0cmFjdGVkRmlsZShmaWxlKSB7XHJcblx0T2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZmlsZSwgZGVjb3JhdGVkRmlsZVByb3BzKTtcclxuXHRyZXR1cm4gZmlsZTtcclxufVxyXG4iXSwiZmlsZSI6InVudGFyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
