/**
 * JavaScript's standard, built-in objects
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
 */
const STANDARD_OBJECT_NAMES = [
	'Infinity',
	'NaN',
	'isFinite',
	'isNaN',
	'parseFloat',
	'parseInt',
	'decodeURI',
	'decodeURIComponent',
	'encodeURI',
	'encodeURIComponent',
	'Object',
	'Function',
	'Boolean',
	'Symbol',
	'Error',
	'Number',
	'BigInt',
	'Math',
	'Date',
	'String',
	'RegExp',
	'Array',
	'Int8Array',
	'Uint8Array',
	'Uint8ClampedArray',
	'Int16Array',
	'Uint16Array',
	'Int32Array',
	'Uint32Array',
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Map',
	'Set',
	'ArrayBuffer',
	'SharedArrayBuffer',
	'DataView',
	'Atomics',
	'JSON',
	'Intl',
	'$input',
	'$result',
	'$omit'
];

export default function createGlobalContext(context: object, extensionNames?: string[]): any {
	return new Proxy(context, {
		/**
		 * Returns `true` if object should be handled by this proxy.
		 */
		has(target: object, key: string) {
			return !STANDARD_OBJECT_NAMES.includes(key)
				&& !extensionNames?.includes(key);
		},

		/**
		 * Returns property by its name.
		 * Does not throw `ReferenceError` and returns `undefined` when property doesn't exist.
		 */
		get(target: object, key: string) {
			if (key in target)
				return target[key];

			return undefined;
		}
	});
}
