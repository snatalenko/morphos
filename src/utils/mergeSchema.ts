import type { JSONSchema4 } from 'json-schema';

const isObject = v => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

function getUniqueValues<TElement>(arr: TElement[]): TElement[] {
	const kvPairs: [string, TElement][] = arr.map(el => [
		JSON.stringify(el),
		el
	]);
	return Array.from(new Map(kvPairs).values());
}

export default function mergeSchema(dest: JSONSchema4, src: JSONSchema4): JSONSchema4 {
	const result = Object.assign({}, dest);
	for (const key of Object.keys(src)) {
		if (isObject(src[key]) && isObject(dest[key]))
			result[key] = mergeSchema(dest[key], src[key]);
		else if (Array.isArray(src[key]) && Array.isArray(dest[key]))
			result[key] = getUniqueValues(dest[key].concat(src[key]));
		else
			result[key] = src[key];
	}
	return result;
}
