export type ValueMap =
	string |
	ObjectMapping |
	ArrayMapping |
	ObjectInContextMapping |
	ConditionalMapping |
	ConcatMapping |
	PropertiesMap;

export type PropertiesMap = {
	[fieldName: string]: ValueMap
} | Array<ValueMap>;

export type ObjectMapping = {
	map: PropertiesMap
}

export type ArrayMapping = {
	forEach: string,
	map: PropertiesMap
}

export type ObjectInContextMapping = {
	from: string,
	map: PropertiesMap
}

export type ConditionalMapping = {
	when: string,
	then: ValueMap,
	else?: ValueMap
}

export type ConcatMapping = {
	concat: Array<ValueMap>
}

export type RootMapping =
	ObjectMapping |
	ArrayMapping |
	ObjectInContextMapping |
	ConditionalMapping |
	ConcatMapping |
	PropertiesMap;
