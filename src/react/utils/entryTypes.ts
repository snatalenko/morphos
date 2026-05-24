export type ExprEntryValue = { kind: 'expr'; expr: string };
export type ArrayEntryValue = { kind: 'array'; forEach: string; entries: Entry[] };
export type ObjectEntryValue = { kind: 'object'; from: string; entries: Entry[] };
export type ConditionalEntryValue = {
	kind: 'conditional';
	when: string;
	then: EntryValue;
	else?: EntryValue;
};
export type ConcatEntryValue = { kind: 'concat'; items: EntryValue[] };
export type TupleEntryValue = { kind: 'tuple'; items: EntryValue[] };
export type EntryValue =
	ExprEntryValue |
	ArrayEntryValue |
	ObjectEntryValue |
	ConditionalEntryValue |
	ConcatEntryValue |
	TupleEntryValue;

export type Entry = {
	id: string;
	key: string;
	value: EntryValue;
	keyAdvanced?: boolean;
	template?: boolean;
	rootValue?: boolean;
};
