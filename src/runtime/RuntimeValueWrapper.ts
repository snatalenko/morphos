import type { ILogger } from '../ILogger.ts';
import SecurityViolationError from './SecurityViolationError.ts';

const BLOCKED_PROPERTY_NAMES = new Set([
	'constructor',
	'prototype',
	'__proto__',
	'caller',
	'arguments'
]);

export function isBlockedRuntimeProperty(key: string | symbol): key is string {
	return typeof key === 'string' && BLOCKED_PROPERTY_NAMES.has(key);
}

export type RuntimeValueSerializer<T = any> = {
	check: (value: unknown) => value is T,
	serialize: (value: T) => unknown
}

export default class RuntimeValueWrapper {

	#wrappedValues = new WeakMap<object, any>();
	#unwrappedValues = new WeakMap<object, object>();
	#serializers: RuntimeValueSerializer[];
	#logger?: ILogger;

	constructor(logger?: ILogger, serializers: RuntimeValueSerializer[] = []) {
		this.#logger = logger;
		this.#serializers = serializers;
	}

	/**
	 * Get the original host value behind a proxy when calling host APIs
	 */
	unwrap<T>(value: T): T {
		if (value === null || (typeof value !== 'object' && typeof value !== 'function'))
			return value;

		return (this.#unwrappedValues.get(value) ?? value) as T;
	}

	#wrapCallbacks(argumentsList: any[]) {
		return argumentsList.map(argument => {
			if (typeof argument !== 'function' || this.#unwrappedValues.has(argument))
				return argument;

			return this.#wrapCallback(argument);
		});
	}

	/**
	 * Let host extensions call VM callbacks without exposing raw host values.
	 * Host callback arguments are wrapped before entering the VM callback,
	 * and host values returned from the callback stay wrapped for the host extension.
	 */
	#wrapCallback(callback: Function): Function {
		const runtimeValueWrapper = this;

		return function runtimeCallback(this: any, ...args: any[]) {
			const receiver = runtimeValueWrapper.wrap(this, true);
			const wrappedArgs = args.map(arg => runtimeValueWrapper.wrap(arg, true));
			const result = Reflect.apply(callback, receiver, wrappedArgs);

			return result;
		};
	}

	#safeWarn(message: string): void {
		try {
			this.#logger?.warn(message);
		}
		catch { /* Ignore logger errors */ }
	}

	#notifyBlockedRead(key: string, operation: string): void {
		this.#safeWarn(`Blocked ${operation} of "${key}" on a sandboxed value`);
	}

	#raiseBlockedMutation(operation: string, key?: string | symbol): never {
		const target = key === undefined ? 'sandboxed value' : `"${String(key)}" on a sandboxed value`;
		const message = `Blocked ${operation} of ${target}`;
		this.#safeWarn(message);
		throw this.wrap(new SecurityViolationError(message));
	}

	#serializeValue<T>(value: T): T | undefined {
		for (const serializer of this.#serializers) {
			if (serializer.check(value))
				return serializer.serialize(value) as T;
		}

		return undefined;
	}

	/**
	 * Exposes a host value to VM code while blocking constructor-based escapes
	 */
	wrap<T>(value: T, protect = false): T {
		if (value === null || (typeof value !== 'object' && typeof value !== 'function'))
			return value;

		const serialized = this.#serializeValue(value);
		if (serialized !== undefined)
			return serialized;

		if (this.#unwrappedValues.has(value as object))
			return value;

		const cachedProxy = this.#wrappedValues.get(value);
		if (cachedProxy)
			return cachedProxy;

		const proxy = new Proxy(value, {
			apply: (target: Function, thisArg: any, argumentsList: any[]) => {
				const args = this.#wrapCallbacks(argumentsList);
				try {
					const result = Reflect.apply(target, thisArg, args);
					return this.wrap(result);
				}
				catch (error) {
					throw this.wrap(error);
				}
			},

			construct: (target: Function, argumentsList: any[], newTarget: Function) => {
				const args = this.#wrapCallbacks(argumentsList);
				try {
					const instance = Reflect.construct(target, args, newTarget);
					return this.wrap(instance);
				}
				catch (error) {
					throw this.wrap(error);
				}
			},

			defineProperty: (target: object, key: string | symbol, descriptor: PropertyDescriptor) => {
				if (protect)
					this.#raiseBlockedMutation('property definition', key);

				return Reflect.defineProperty(target, key, descriptor);
			},

			deleteProperty: (target: object, key: string | symbol) => {
				if (protect)
					this.#raiseBlockedMutation('property deletion', key);

				return Reflect.deleteProperty(target, key);
			},

			get: (target: object, key: string | symbol, receiver: any) => {
				if (isBlockedRuntimeProperty(key)) {
					this.#notifyBlockedRead(key, 'read');
					return undefined;
				}

				try {
					const propertyValue = Reflect.get(target, key, receiver);
					return this.wrap(propertyValue, protect);
				}
				catch (error) {
					throw this.wrap(error);
				}
			},

			getOwnPropertyDescriptor: (target: object, key: string | symbol) => {
				if (isBlockedRuntimeProperty(key)) {
					this.#notifyBlockedRead(key, 'descriptor read');
					return undefined;
				}

				try {
					const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
					if (!descriptor)
						return descriptor;

					if ('value' in descriptor)
						descriptor.value = this.wrap(descriptor.value, protect);
					if (descriptor.get)
						descriptor.get = this.wrap(descriptor.get, protect);
					if (descriptor.set)
						descriptor.set = this.wrap(descriptor.set, protect);

					return descriptor;
				}
				catch (error) {
					throw this.wrap(error);
				}
			},

			getPrototypeOf() {
				return null;
			},

			has: (target: object, key: string | symbol) => {
				if (isBlockedRuntimeProperty(key))
					return true;

				return Reflect.has(target, key);
			},

			preventExtensions: (target: object) => {
				if (protect)
					return false;

				if (Reflect.isExtensible(target))
					Reflect.setPrototypeOf(target, null);

				return Reflect.preventExtensions(target);
			},

			set: (target: object, key: string | symbol, newValue: any, receiver: any) => {
				if (protect)
					this.#raiseBlockedMutation('property assignment', key);

				return Reflect.set(target, key, newValue, receiver);
			},

			setPrototypeOf: (target: object, prototype: object | null) => {
				if (protect)
					this.#raiseBlockedMutation('prototype assignment');

				return Reflect.setPrototypeOf(target, prototype);
			}
		});

		this.#wrappedValues.set(value, proxy);
		this.#unwrappedValues.set(proxy, value);

		return proxy as T;
	}
}
