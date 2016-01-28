;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.untar = factory();
  }
}(this, function() {
"use strict";

workerScriptUri = (window||this).URL.createObjectURL(new Blob(["\"use strict\";function UntarWorker(){}function TarFile(){}function UntarStream(e){this._bufferView=new DataView(e),this._position=0}function UntarFileStream(e){this._stream=new UntarStream(e)}if(UntarWorker.prototype={onmessage:function(e){try{if(\"extract\"!==e.data.type)throw new Error(\"Unknown message type: \"+e.data.type);this.untarBuffer(e.data.buffer)}catch(t){this.postError(t)}},postError:function(e){this.postMessage({type:\"error\",data:{message:e.message}})},postLog:function(e,t){this.postMessage({type:\"log\",data:{level:e,msg:t}})},untarBuffer:function(e){try{for(var t=new UntarFileStream(e);t.hasNext();){var r=t.next();this.postMessage({type:\"extract\",data:r},[r.buffer])}this.postMessage({type:\"complete\"})}catch(i){this.postError(i)}},postMessage:function(e,t){self.postMessage(e,t)}},\"undefined\"!=typeof self){var worker=new UntarWorker;self.onmessage=function(e){worker.onmessage(e)}}UntarStream.prototype={readString:function(e){for(var t=1,r=e*t,i=[],n=0;e>n;++n){var s=this._bufferView.getUint8(this.position()+n*t,!0);if(0===s)break;i.push(s)}return this.seek(r),String.fromCharCode.apply(null,i)},readBuffer:function(e){var t;if(\"function\"==typeof ArrayBuffer.prototype.slice)t=this._bufferView.buffer.slice(this.position(),this.position()+e);else{t=new ArrayBuffer(e);var r=new Uint8Array(t),i=new Uint8Array(this._bufferView.buffer,this.position(),e);r.set(i)}return this.seek(e),t},seek:function(e){this._position+=e},peekUint32:function(){return this._bufferView.getUint32(this.position(),!0)},position:function(e){return void 0===e?this._position:void(this._position=e)},size:function(){return this._bufferView.byteLength}},UntarFileStream.prototype={hasNext:function(){return this._stream.position()+4<this._stream.size()&&0!==this._stream.peekUint32()},next:function(){var e=this._stream,t=new TarFile,r=e.position(),i=r+512;t.name=e.readString(100),t.mode=e.readString(8),t.uid=e.readString(8),t.gid=e.readString(8),t.size=parseInt(e.readString(12),8),t.modificationTime=parseInt(e.readString(12),8),t.checksum=e.readString(8),t.type=e.readString(1),t.linkname=e.readString(1),t.ustarFormat=e.readString(6),\"ustar\"===t.ustarFormat&&(t.version=e.readString(2),t.uname=e.readString(32),t.gname=e.readString(32),t.devmajor=e.readString(8),t.devminor=e.readString(8),t.namePrefix=e.readString(155),t.namePrefix.length>0&&(t.name=t.namePrefix+t.name)),e.position(i),\"0\"===t.type||\"\x00\"===t.type?t.buffer=e.readBuffer(t.size):5==t.type,void 0===t.buffer&&(t.buffer=new ArrayBuffer(0));var n=i+(t.size>0?t.size+(512-t.size%512):0);return e.position(n),t}};"]));
/* globals window: false, Promise: false */

/**
Returns a Promise decorated with a progress() event.
*/
function ProgressivePromise(fn) {
	if (typeof Promise !== "function") {
		throw new Error("Promise implementation not available in this environment.");
	}

	var progressCallbacks = [];
	var progressHistory = [];

	function doProgress(value) {
		for (var i = 0, l = progressCallbacks.length; i < l; ++i) {
			progressCallbacks[i](value);
		}

		progressHistory.push(value);
	}

	var promise = new Promise(function(resolve, reject) {
		fn(resolve, reject, doProgress);
	});

	promise.progress = function(cb) {
		if (typeof cb !== "function") {
			throw new Error("cb is not a function.");
		}

		// Report the previous progress history
		for (var i = 0, l = progressHistory.length; i < l; ++i) {
			cb(progressHistory[i]);
		}

		progressCallbacks.push(cb);
		return promise;
	};

	var origThen = promise.then;

	promise.then = function(onSuccess, onFail, onProgress) {
		origThen.call(promise, onSuccess, onFail);

		if (onProgress !== undefined) {
			promise.progress(onProgress);
		}

		return promise;
	};

	return promise;
}
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

return untar;
}));
