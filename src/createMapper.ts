import type { RootMapping } from './mappingTypes.ts';
import type { ILogger } from './ILogger.ts';
import * as vm from 'vm';
import createScript from './createScript.ts';
import { createGlobalContext } from './runtime/index.ts';
import RuntimeValueWrapper from './runtime/RuntimeValueWrapper.ts';

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
	$createGlobalContext?: (input: object) => object;

	/** Global context used to resolve top level source properties */
	$globalContext?: object;

	[extensionName: string]: unknown
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
 * @param options.timeout
 *  Maximum script execution time per document, in milliseconds.
 */
export default function createMapper<TSource extends object, TResult>(map: RootMapping, options?: {
	extensions?: Record<string, unknown>,
	logger?: ILogger,
	timeout?: number
}) {
	const scriptBody = createScript(map);
	options?.logger?.trace(scriptBody);

	const script = new vm.Script(scriptBody);
	const extensionNames = options?.extensions ? new Set(Object.keys(options.extensions)) : undefined;
	const valueWrapper = new RuntimeValueWrapper(options?.logger);
	const $createGlobalContext = (input: object) => createGlobalContext(input, extensionNames, {
		logger: options?.logger,
		valueWrapper
	});
	const sandbox: TMappingScriptEnvironment<TSource, TResult> = {};

	for (const extensionName of extensionNames ?? [])
		sandbox[extensionName] = valueWrapper.wrap(options?.extensions?.[extensionName]);

	const ctx = vm.createContext(sandbox) as TMappingScriptEnvironment<TSource, TResult>;

	return (document: TSource): TResult | undefined => {

		ctx.$createGlobalContext = $createGlobalContext;
		ctx.$input = document;
		ctx.$result = undefined;

		try {
			script.runInContext(ctx, {
				timeout: options?.timeout
			});

			return ctx.$result;
		}
		catch (error: unknown) {
			throw valueWrapper.unwrap(error);
		}
		finally {
			ctx.$input = undefined;
			ctx.$result = undefined;
			ctx.$createGlobalContext = undefined;
			ctx.$globalContext = undefined;
		}
	};
}
