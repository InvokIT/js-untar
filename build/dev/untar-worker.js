"use strict";
/* globals postMessage: false, DataView: false, self: false, window: false, ArrayBuffer: false, Uint8Array: false */

function UntarWorker() {

}

UntarWorker.prototype = {
	onmessage: function(msg) {
		try {
			if (msg.data.type === "extract") {
				this.untarBuffer(msg.data.buffer);
			} else {
				throw new Error("Unknown message type: " + msg.data.type);
			}
		} catch (err) {
			this.postError(err);
		}
	},

 	postError: function(err) {
 		//console.info("postError(" + err.message + ")" + " " + JSON.stringify(err));
		this.postMessage({ type: "error", data: { message: err.message } });
	},

	postLog: function(level, msg) {
 		//console.info("postLog");
 		this.postMessage({ type: "log", data: { level: level, msg: msg }});
	},

	untarBuffer: function(arrayBuffer) {
		try {
			var tarFileStream = new UntarFileStream(arrayBuffer);
			while (tarFileStream.hasNext()) {
				var file = tarFileStream.next();

				this.postMessage({ type: "extract", data: file }, [file.buffer]);
			}

			this.postMessage({ type: "complete" });
		} catch (err) {
			this.postError(err);
		}
	},

	postMessage: function(msg, transfers) {
 		//console.info("postMessage(" + msg + ", " + JSON.stringify(transfers) + ")");
		self.postMessage(msg, transfers);
	}
};

if (typeof self !== "undefined") {
	// We're running in a worker thread
	var worker = new UntarWorker();
	self.onmessage = function(msg) { worker.onmessage(msg); };
}

function TarFile() {

}

function UntarStream(arrayBuffer) {
	this._bufferView = new DataView(arrayBuffer);
	this._position = 0;
}

UntarStream.prototype = {
	readString: function(charCount) {
		//console.log("readString: position " + this.position() + ", " + charCount + " chars");
		var charSize = 1;
		var byteCount = charCount * charSize;

		var charCodes = [];

		for (var i = 0; i < charCount; ++i) {
			var charCode = this._bufferView.getUint8(this.position() + (i * charSize), true);
			if (charCode !== 0) {
				charCodes.push(charCode);
			} else {
				break;
			}
		}

		this.seek(byteCount);

		return String.fromCharCode.apply(null, charCodes);
	},

	readBuffer: function(byteCount) {
		var buf;

		if (typeof ArrayBuffer.prototype.slice === "function") {
			buf = this._bufferView.buffer.slice(this.position(), this.position() + byteCount);
		} else {
			buf = new ArrayBuffer(byteCount);
			var target = new Uint8Array(buf);
			var src = new Uint8Array(this._bufferView.buffer, this.position(), byteCount);
			target.set(src);
		}

		this.seek(byteCount);
		return buf;
	},

	seek: function(byteCount) {
		this._position += byteCount;
	},

	peekUint32: function() {
		return this._bufferView.getUint32(this.position(), true);
	},

	position: function(newpos) {
		if (newpos === undefined) {
			return this._position;
		} else {
			this._position = newpos;
		}
	},

	size: function() {
		return this._bufferView.byteLength;
	}
};

function UntarFileStream(arrayBuffer) {
	this._stream = new UntarStream(arrayBuffer);
}

UntarFileStream.prototype = {
	hasNext: function() {
		// A tar file ends with 4 zero bytes
		return this._stream.position() + 4 < this._stream.size() && this._stream.peekUint32() !== 0;
	},

	next: function() {
		var stream = this._stream;
		var file = new TarFile();

		var headerBeginPos = stream.position();
		var dataBeginPos = headerBeginPos + 512;

		// Read header
		file.name = stream.readString(100);
		file.mode = stream.readString(8);
		file.uid = stream.readString(8);
		file.gid = stream.readString(8);
		file.size = parseInt(stream.readString(12), 8);
		file.modificationTime = parseInt(stream.readString(12), 8);
		file.checksum = stream.readString(8);
		file.type = stream.readString(1);
		file.linkname = stream.readString(100);
		file.ustarFormat = stream.readString(6);

		if (file.ustarFormat.indexOf("ustar") > -1) {
			file.version = stream.readString(2);
			file.uname = stream.readString(32);
			file.gname = stream.readString(32);
			file.devmajor = stream.readString(8);
			file.devminor = stream.readString(8);
			file.namePrefix = stream.readString(155);

			if (file.namePrefix.length > 0) {
				file.name = file.namePrefix + file.name;
			}
		}

		stream.position(dataBeginPos);

		// Normal file is either "0" or "\0".
		// In case of "\0", readString returns an empty string, that is "".
		if (file.type === "0" || file.type === "") {
			file.buffer = stream.readBuffer(file.size);
		} else if (file.type == 5) {
			// Directory - should we do anything with this? Nope!
		} else {
			// We only care about real files, not symlinks.
		}

		if (file.buffer === undefined) {
			file.buffer = new ArrayBuffer(0);
		}

		var dataEndPos = dataBeginPos + file.size;

		// File data is padded to reach a 512 byte boundary; skip the padded bytes too.
		if (file.size % 512 !== 0) {
			dataEndPos += 512 - (file.size % 512);
		}

		stream.position(dataEndPos);

		return file;
	}
};
