import {
	isArrayMapping,
	isConcatMapping,
	isConditionalMapping,
	isObjectInContextMapping,
	isObjectMapping,
	isRootElementMapping,
	isTupleArrayMapping,
	isWildcardSpread,
	type PropertiesMap,
	type RootMapping,
	type ValueMap
} from './mappingTypes.ts';

function copyContextExpression(contextExpr: string, fallback = '{}'): string {
	return `(($source) => Array.isArray($source) ? [...$source] : $source && typeof $source === 'object' ? { ...$source } : ${fallback})(${contextExpr})`;
}

function* returnValueMapToJs(
	mappingInstruction: ValueMap,
	level: number,
	contextExpr: string
): IterableIterator<string> {
	const prefix = '  '.repeat(level);
	if (typeof mappingInstruction === 'string') {
		yield `${prefix}return ${mappingInstruction === '*' ? copyContextExpression(contextExpr) : mappingInstruction || 'null'};`;
	}
	else {
		yield `${prefix}return (`;
		yield* mappingToJs(mappingInstruction, level, contextExpr);
		yield `${prefix});`;
	}
}

function* propertiesMapToJs(
	map: PropertiesMap,
	level: number,
	contextExpr: string
): IterableIterator<string> {

	const prefix = '  '.repeat(level);
	if (isRootElementMapping(map) && !isWildcardSpread(map)) {
		yield* returnValueMapToJs(map['*'], level, contextExpr);
		return;
	}

	const entries = Object.entries(map).filter(([fieldName, mappingInstruction]) =>
		fieldName !== '*' || mappingInstruction !== '*');
	const isTupleArray = isTupleArrayMapping(Object.fromEntries(entries));
	const initialOutput = isTupleArray ? '[]' : '{}';
	if (isWildcardSpread(map))
		yield `${prefix}var $output = ${copyContextExpression(contextExpr, initialOutput)};`;
	else
		yield `${prefix}var $output = ${initialOutput};`;

	yield `${prefix}var $value;`;

	for (const [fieldName, mappingInstruction] of entries) {
		const quotedFieldName = fieldName.replace(/`/g, '\\`');

		yield `${prefix}$value =`;
		if (mappingInstruction === '*') {
			yield `${prefix}  ${copyContextExpression(contextExpr)};`;
		}
		else if (typeof mappingInstruction === 'string') {
			yield `${prefix}  ${mappingInstruction || 'null'};`;
		}
		else {
			yield* mappingToJs(mappingInstruction, level, contextExpr);
			yield `${prefix};`;
		}

		yield `${prefix}if ($value !== $omit)`;
		yield `${prefix}  $output[\`${quotedFieldName}\`] = $value;`;
	}

	yield `${prefix}return $output;`;
}

function* mappingToJs(mapping: RootMapping, level: number, contextExpr: string): IterableIterator<string> {

	const prefix = '  '.repeat(level);

	if (isConditionalMapping(mapping)) {
		const { when, then: thenMapping, else: elseMapping } = mapping;

		if (!when)
			throw new TypeError(`Property "when" is empty in mapping "${JSON.stringify(mapping)}"`);
		if (thenMapping === undefined)
			throw new TypeError(`Property "then" is missing in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  (() => {`;
		yield `${prefix}    if (${when}) {`;
		yield* returnValueMapToJs(thenMapping, level + 3, contextExpr);
		yield `${prefix}    }`;
		if (elseMapping === undefined)
			yield `${prefix}    return $omit;`;
		else
			yield* returnValueMapToJs(elseMapping, level + 2, contextExpr);
		yield `${prefix}  })()`;
	}
	else if (isConcatMapping(mapping)) {
		const { concat } = mapping;
		if (!Array.isArray(concat))
			throw new TypeError(`Property "concat" is not an array in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  (() => {`;
		yield `${prefix}    var $output = [];`;
		yield `${prefix}    var $value;`;
		for (const mappingInstruction of concat) {
			yield `${prefix}    $value =`;
			if (typeof mappingInstruction === 'string') {
				yield `${prefix}      ${mappingInstruction || 'null'};`;
			}
			else {
				yield* mappingToJs(mappingInstruction, level + 2, contextExpr);
				yield `${prefix}    ;`;
			}
			yield `${prefix}    if ($value !== $omit) {`;
			yield `${prefix}      if (Array.isArray($value))`;
			yield `${prefix}        $output.push(...$value);`;
			yield `${prefix}      else`;
			yield `${prefix}        $output.push($value);`;
			yield `${prefix}    }`;
		}
		yield `${prefix}    return $output;`;
		yield `${prefix}  })()`;
	}
	else if (isArrayMapping(mapping)) {
		const { forEach, map } = mapping;
		if (!forEach)
			throw new TypeError(`Property "forEach" is empty in mapping "${JSON.stringify(mapping)}"`);
		if (!map)
			throw new TypeError(`Property "map" is empty in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  ${forEach}?.map(($record, $index, $collection) => {`;
		yield `${prefix}    with ($record) {`;
		yield* propertiesMapToJs(map, level + 3, '$record');
		yield `${prefix}    }`;
		yield `${prefix}  })`;
	}
	else if (isObjectInContextMapping(mapping)) {
		const { from, map } = mapping;
		if (!from)
			throw new TypeError(`Property "from" is empty in mapping "${JSON.stringify(mapping)}"`);
		if (!map)
			throw new TypeError(`Property "map" is empty in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  (() => {`;
		yield `${prefix}    var $context = ${from} ?? {};`;
		yield `${prefix}    with ($context) {`;
		yield* propertiesMapToJs(map, level + 3, '$context');
		yield `${prefix}    }`;
		yield `${prefix}  })()`;
	}
	else if (isObjectMapping(mapping)) {
		const { map } = mapping;
		if (!map)
			throw new TypeError(`Property "map" is empty in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  (() => {`;
		yield* propertiesMapToJs(map, level + 2, contextExpr);
		yield `${prefix}  })()`;
	}
	else {
		yield `${prefix}  (() => {`;
		yield* propertiesMapToJs(mapping, level + 2, contextExpr);
		yield `${prefix}  })()`;
	}
}

/**
 * Transform declarative map to JS code
 *
 * @param map Instructions for object mapping
 */
export default function createScript(map: RootMapping) {
	return `
$input = JSON.parse(JSON.stringify($input));
var $omit = Symbol('morphos.omit');
var $globalContext = $createGlobalContext($input);
$createGlobalContext = undefined;
with ($globalContext) {
  $result =
${Array.from(mappingToJs(map, 1, '$input')).join('\n')}
}
if ($result === $omit)
  $result = undefined;`;
}
