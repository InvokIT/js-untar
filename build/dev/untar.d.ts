export interface ProgressivePromise<T, P> extends Promise<T> {
	progress (cb: (arg: P) => void): this
}

export interface TarFile {
	name: string
	mode: string
	uid: number
	gid: number
	size: number
	mtime: number
	checksum: number
	type: string
	linkname: string
	ustarFormat: string
	version?: string
	uname?: string
	gname?: string
	devmajor?: number
	devminor?: number
	namePrefix?: string
	buffer: ArrayBuffer
	blob (): Blob
	getBlobUrl (): URL
	readAsString (): string
	readAsJSON (): any
}

export default function untar(arrayBuffer: ArrayBuffer): ProgressivePromise<TarFile[], TarFile>
