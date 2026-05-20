import type { RootMapping } from './mappingTypes.ts';
import * as vm from 'vm';
import createScript from './createScript.ts';
import { createGlobalContext } from './runtime/index.ts';

interface ILogger {
	trace(message: string, ...args: any[]): void;
}

type TMappingScriptEnvironment<TSource, TResult> = {

	/** Main input source */
	$input?: TSource;

	/** Placeholder for mapping output */
	$result?: TResult;

	/**
	 * Method for top level context creation.
	 * Resulting object catches all variable requests
	 * and returns `undefined` instead of ReferenceError
	 */
	$createGlobalContext(input: object): any;
}

/**
 * Create map function for given instructions
 *
 * @param map Instructions for object mapping
 * @param options
 * @param options.extensions
 *  Extensions to pass to mapping environment.
 *  The object can contain additional functions, dictionaries, etc.
 * @param options.logger
 *  Logger instance for trace output
 */
export default function createMapper<TSource extends object, TResult>(map: RootMapping, options?: {
	extensions?: object,
	logger?: ILogger
}) {
	const scriptBody = createScript(map);
	options?.logger?.trace(scriptBody);

	const script = new vm.Script(scriptBody);

	const extensionNames = options && options.extensions ? Object.keys(options.extensions) : undefined;

	const sandbox: TMappingScriptEnvironment<TSource, TResult> = Object.assign({
		$input: undefined,
		$result: undefined,
		$createGlobalContext: (input: object) => createGlobalContext(input, extensionNames)
	}, options?.extensions);

	const ctx = vm.createContext(sandbox);

	return (document: TSource): TResult | undefined => {

		ctx.$input = document;
		ctx.$result = undefined;

		if (extensionNames) {
			const conflictingKey = Object.keys(document).find(inputKey => extensionNames.includes(inputKey));
			if (conflictingKey)
				throw new TypeError(`Extension "${conflictingKey}" conflicts with a field name passed in input`);
		}

		script.runInContext(ctx);

		return ctx.$result;
	};
}
