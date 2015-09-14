"use strict";

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