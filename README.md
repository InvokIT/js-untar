# js-untar
Library for extracting tar files in the browser.

## Browser feature requirements
* [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).
* [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).
* [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and the [Blob() constructor](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob).

As of September 2015 this includes Chrome>=20, Firefox>=13, IE>=10, Opera>=12.10 and Safari>=8.
[Web Worker transfarable objects](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) are used when available, increasing speed greatly. This is supported in Chrome>=21, Firefox>=18, Opera>=15 and Safari.

## Documentation
Load the module with RequireJS or similar. The module is a function that returns a modified Promise with a progress callback. 
This callback is executed every time a file is extracted. 
The standard Promise.then method is also called when extraction is done, with all extracted files as argument. 
The extraction is done in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to allow the main UI thread to continue.

### Example:

	define(["untar"], function(untar) {
		// Load the source ArrayBuffer from a XMLHttpRequest or any other way.
		var sourceBuffer = ...;
		
		// Listening to progress events
		untar(sourceBuffer)
			.progress(function(extractedFile) {
				...
			})
			.then(function(extractedFiles) {
				...
			});

		untar(sourceBuffer).then(
			function(extractedFiles) { // onSuccess
				...
			},
			function(err) { // onError
				...
			},
			function(extractedFile) { // onProgress
				...
			}
		);
	});

### File object
The returned file object(s) has the following properties. Most of these are explained in the [Tar wikipedia entry](https://en.wikipedia.org/wiki/Tar_(computing)#File_format).

* name = The full filename (including path and ustar filename prefix).
* mode
* uid
* gid
* size
* modificationTime
* checksum
* type
* linkname
* ustarFormat
* blob A [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) object with the contens of the file.
* getObjectUrl()
  A unique [ObjectUrl](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) to the data can be retrieved with this method for easy usage of extracted data in <img> tags etc.
  		document.getElementById("targetImageElement").src = file.getObjectUrl();

If the .tar file was in the ustar format (which most are), the following properties are also defined:

* version
* uname
* gname
* devmajor
* devminor
* namePrefix
