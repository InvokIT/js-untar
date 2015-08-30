/* globals postMessage: false, DataView: false, self: false, onmessage: true */
/* jshint -W097 */
"use strict";

onmessage = function(e) {
	postMessage("test");
};

self.onmessage = function(msg) {
	postLog("info", "Received message.");
	try {
		if (msg.data.type === "extract") {
			untarBuffer(msg.data.buffer);
		} else {
			throw new Error("Unknown message type.");
		}
	} catch (err) {
		postError(err);
	}
};

function postError(err) {
	postMessage({ type: "error", data: err });
}

function postLog(level, msg) {
	postMessage({ type: "log", data: { level: level, msg: msg }});
}

function untarBuffer(arrayBuffer) {
	try {
		postLog("info", "buffer size: " + arrayBuffer.byteLength);
		var tarFileStream = new TarFileStream(arrayBuffer);
		while (tarFileStream.hasNext()) {
			var file = tarFileStream.next();

			if (file.buffer) {
				postMessage({ type: "extract", data: file }, [file.buffer]);
			}
		}

		postMessage({ type: "complete" });
	} catch (err) {
		postError(err);
	}
}

function TarFile() {

}

TarFile.prototype = {

};

function Stream(arrayBuffer) {
	this._bufferView = new DataView(arrayBuffer);
	this._position = 0;
}

Stream.prototype = {
	readString: function(charCount) {
		var charSize = 1;
		var byteCount = charCount * charSize;

		var charCodes = [];

		for (var i = 0; i < charCount; ++i) {
			var charCode = this._bufferView.getUint8(this.position() + (i * charSize));
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
		return this._bufferView.buffer.slice(this._position, byteCount);
	},

	seek: function(byteCount) {
		this._position += byteCount;
	},

	peekUint32: function() {
		return this._bufferView.getUint32(this.position());
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

function TarFileStream(arrayBuffer) {
	this._stream = new Stream(arrayBuffer);
}

TarFileStream.prototype = {
	hasNext: function() {
		return this._stream.position() < this._stream.size() && this._stream.peekUint32() !== 0;
	},

	next: function() {
		var stream = this._stream;
		var file = new TarFile();

		var headerBeginPos = stream.position;
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
		file.linkname = stream.readString(1);
		file.ustarFormat = stream.readString(6);

		if (file.ustarFormat === "ustar") {
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

		// Normal file is either "\0" or 0.
		if (file.type === 0 || file.type === "\0") {
			file.buffer = stream.readBuffer(file.size);
		} else if (file.type == 5) {
			// Directory - should we do anything with this? Nope!
		} else {
			// We only care about real files, not symlinks.
		}

		// File data is padded to reach a 512 byte boundary; skip the padded bytes.
		var bytesToSkipCount = 512 - file.size % 512;
		stream.seek(bytesToSkipCount);

		return file;
	}
};