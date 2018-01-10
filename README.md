# js-untar
Library for extracting tar files in the browser. 
Useful when packing all your application images/sound/json/etc. data in a standard .tar file and serving to clients as one gzipped bundle.

## Browser feature requirements
* [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). ([IE polyfill](https://www.npmjs.com/package/promise)).
* [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).
* [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).
* [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) and the [Blob() constructor](https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob).

As of September 2015 this includes Chrome>=20, Firefox>=13, IE>=10, Opera>=12.10 and Safari>=8. 
[Web Worker transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage) are used when available, increasing speed greatly. This is supported in Chrome>=21, Firefox>=18, Opera>=15 and Safari. 

**Web Workers are not implemented in Node.js, so js-untar is not Node-compatible. Use a Node-compatible library such as [tar-stream](https://www.npmjs.com/package/tar-stream).**

## Installation
### NPM
	npm install js-untar
### Bower
	bower install js-untar

## Documentation
Supports AMD, CommonJS or simply load with a script tag, which will provide a global untar function. 
The module is a function that returns a modified Promise with a progress callback.
This callback is executed every time a file is extracted. 
The standard Promise.then method is also called when extraction is done, with all extracted files as argument. 
The extraction is done in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to allow the main UI thread to continue.

### Example:

	// Load the source ArrayBuffer from a XMLHttpRequest (or any other way you may need).
	var sourceBuffer = [...];
	
	untar(sourceBuffer)
	.progress(function(extractedFile) {
		... // Do something with a single extracted file.
	})
	.then(function(extractedFiles) {
		... // Do something with all extracted files.
	});

	// or

	untar(sourceBuffer).then(
		function(extractedFiles) { // onSuccess
			... // Do something with all extracted files.
		},
		function(err) { // onError
			... // Handle the error.
		},
		function(extractedFile) { // onProgress
			... // Do something with a single extracted file.
		}
	);

### File object
The returned file object(s) has the following properties. Most of these are explained in the [Tar wikipedia entry](https://en.wikipedia.org/wiki/Tar_(computing)#File_format).

* name = The full filename (including path and ustar filename prefix).
* mode
* uid
* gid
* size
* mtime
* checksum
* type
* linkname
* ustarFormat
* buffer An ArrayBuffer with the contents of the file.
* blob A [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) object with the contents of the file.
* getBlobUrl() 
  A unique [ObjectUrl](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) to the data can be retrieved with this method for easy usage of extracted data in &lt;img&gt; tags etc. 
  
  			document.getElementById("targetImageElement").src = file.getBlobUrl();
* readAsString()
	Parse the file contents as a UTF-8 string.
* readAsJSON()
	Parse the file contents as a JSON object.

If the .tar file was in the ustar format (which most are), the following properties are also defined:

* version
* uname
* gname
* devmajor
* devminor
* namePrefix
