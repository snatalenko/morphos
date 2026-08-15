const hasExplicitPath = process.argv.length > 2 &&
	process.argv.slice(2).some(arg => !arg.startsWith('-') && arg.includes('/'));

export default {
	testEnvironment: 'node',
	roots: hasExplicitPath
		? ['<rootDir>/tests']
		: ['<rootDir>/tests/unit'],
	testMatch: [
		'**/*.test.ts'
	],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/react/utils/entries.ts',
		'!/src/**/*.d.ts'
	],
	coverageReporters: ['lcov', 'text-summary'],
	coveragePathIgnorePatterns: [
		'/dist/',
		'/node_modules/',
		'/tests/'
	],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { tsconfig: './tests/tsconfig.json' }]
	}
};
