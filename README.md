# js-untar
Library for extracting tar files in the browser.

## Documentation
Load the module with RequireJS or similar. Module is a function that returns a modified Promise with a progress callback. 
This callback is executed every time a file is extracted. 
The standard Promise.then method is also called when extraction is done, with all extracted files as argument.

### Example:

	define(["untar"], function(untar) {
		// Load the source ArrayBuffer from a XMLHttpRequest or any other way.
		var sourceBuffer = ...;
		
		untar(sourceBuffer)
			.progress(function(extractedFile) {
				...
			})
			.then(function(extractedFiles) {
				...
			});
	});

### File object
The returned file object has the following properties. Most of these are explained in the [Tar wikipedia entry](https://en.wikipedia.org/wiki/Tar_(computing)#File_format).

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
