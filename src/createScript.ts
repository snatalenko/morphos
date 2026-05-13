import type {
	PropertiesMap,
	RootMapping,
	ArrayMapping,
	ObjectInContextMapping,
	ObjectMapping,
	ValueMap,
	ConditionalMapping,
	ConcatMapping
} from './mappingTypes.ts';

function isConditionalMapping(mapping: RootMapping): mapping is ConditionalMapping {
	const keys = Object.keys(mapping);
	return keys.includes('when')
		&& keys.every(k => k === 'when' || k === 'then' || k === 'else');
}

function isArrayMapping(mapping: RootMapping): mapping is ArrayMapping {
	const keys = Object.keys(mapping);
	return keys.length === 2 && keys.includes('forEach') && keys.includes('map');
}

function isConcatMapping(mapping: RootMapping): mapping is ConcatMapping {
	const keys = Object.keys(mapping);
	return keys.length === 1 && keys.includes('concat');
}

function isObjectInContextMapping(mapping: RootMapping): mapping is ObjectInContextMapping {
	const keys = Object.keys(mapping);
	return keys.length === 2 && keys.includes('from') && keys.includes('map');
}

function isObjectMapping(mapping: RootMapping): mapping is ObjectMapping {
	const keys = Object.keys(mapping);
	return keys.length === 1 && keys.includes('map');
}

function isRootElementMapping(mapping: RootMapping): mapping is { '*': ValueMap } {
	const keys = Object.keys(mapping);
	return keys.length === 1 && keys[0] === '*';
}

function isTupleArrayMapping(mapping: RootMapping) {
	const keys = Object.keys(mapping);
	return keys.length && keys.every(k => k && !isNaN(Number(k)));
}

function* returnValueMapToJs(mappingInstruction: ValueMap, level: number): IterableIterator<string> {
	const prefix = '  '.repeat(level);
	if (typeof mappingInstruction === 'string') {
		yield `${prefix}return ${mappingInstruction || 'null'};`;
	}
	else {
		yield `${prefix}return (`;
		// eslint-disable-next-line no-use-before-define
		yield* mappingToJs(mappingInstruction, level);
		yield `${prefix});`;
	}
}

function* propertiesMapToJs(map: PropertiesMap, level: number): IterableIterator<string> {

	const prefix = '  '.repeat(level);
	if (isRootElementMapping(map)) {
		yield* returnValueMapToJs(map['*'], level);
		return;
	}

	const isTupleArray = isTupleArrayMapping(map);
	yield `${prefix}var $output = ${isTupleArray ? '[]' : '{}'};`;
	yield `${prefix}var $value;`;

	for (const [fieldName, mappingInstruction] of Object.entries(map)) {
		const quotedFieldName = fieldName.replace(/`/g, '\\`');

		yield `${prefix}$value =`;
		if (typeof mappingInstruction === 'string') {
			yield `${prefix}  ${mappingInstruction || 'null'};`;
		}
		else {
			// eslint-disable-next-line no-use-before-define
			yield* mappingToJs(mappingInstruction, level);
			yield `${prefix};`;
		}

		yield `${prefix}if ($value !== $omit)`;
		yield `${prefix}  $output[\`${quotedFieldName}\`] = $value;`;
	}

	yield `${prefix}return $output;`;
}

function* mappingToJs(mapping: RootMapping, level: number) {

	const prefix = '  '.repeat(level);

	if (isConditionalMapping(mapping)) {
		const { when, then: thenMapping, else: elseMapping } = mapping;

		if (!when)
			throw new TypeError(`Property "when" is empty in mapping "${JSON.stringify(mapping)}"`);
		if (thenMapping === undefined)
			throw new TypeError(`Property "then" is missing in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  (() => {`;
		yield `${prefix}    if (${when}) {`;
		yield* returnValueMapToJs(thenMapping, level + 3);
		yield `${prefix}    }`;
		if (elseMapping === undefined)
			yield `${prefix}    return $omit;`;
		else
			yield* returnValueMapToJs(elseMapping, level + 2);
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
				yield* mappingToJs(mappingInstruction, level + 2);
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
		yield* propertiesMapToJs(map, level + 3);
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
		yield* propertiesMapToJs(map, level + 3);
		yield `${prefix}    }`;
		yield `${prefix}  })()`;
	}
	else if (isObjectMapping(mapping)) {
		const { map } = mapping;
		if (!map)
			throw new TypeError(`Property "map" is empty in mapping "${JSON.stringify(mapping)}"`);

		yield `${prefix}  (() => {`;
		yield* propertiesMapToJs(map, level + 2);
		yield `${prefix}  })()`;
	}
	else {
		yield `${prefix}  (() => {`;
		yield* propertiesMapToJs(mapping, level + 2);
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
var $omit = Symbol('declarative-mapper.omit');
with ($createGlobalContext($input)) {
  $result =
${Array.from(mappingToJs(map, 1)).join('\n')}
}
if ($result === $omit)
  $result = undefined;`;
}
