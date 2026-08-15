import type { ILogger } from '../ILogger.ts';
import RuntimeValueWrapper, { isBlockedRuntimeProperty } from './RuntimeValueWrapper.ts';
import SecurityViolationError from './SecurityViolationError.ts';

/**
 * JavaScript's standard, built-in objects
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
 */
const SAFE_GLOBAL_PROPERTY_NAMES = new Set([
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
]);

export default function createGlobalContext(
	context: object,
	extensionNames?: Set<string>,
	options?: {
		logger?: ILogger,
		valueWrapper?: RuntimeValueWrapper
	}
): any {
	return new Proxy(context, {
		/**
		 * Returns `true` if object should be handled by this proxy.
		 */
		has(target: object, key: string | symbol) {
			if (isBlockedRuntimeProperty(key))
				return true;

			if (typeof key !== 'string')
				return false;

			if (SAFE_GLOBAL_PROPERTY_NAMES.has(key))
				return false;

			if (extensionNames?.has(key))
				return false;

			return true;
		},

		/**
		 * Returns property by its name.
		 * Does not throw `ReferenceError` and returns `undefined` when property doesn't exist.
		 */
		get(target: object, key: string) {
			if (isBlockedRuntimeProperty(key)) {
				const message = `Blocked read of "${key}" from the mapping global scope`;
				try {
					options?.logger?.warn(message);
				}
				catch { /* Ignore logger errors */ }

				if (options?.valueWrapper)
					throw options.valueWrapper.wrap(new SecurityViolationError(message));
				else
					return undefined;
			}

			if (key in target)
				return (target as any)[key];

			return undefined;
		}
	});
}
