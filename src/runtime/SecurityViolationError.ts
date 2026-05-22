export default class SecurityViolationError extends Error {}

Object.defineProperty(SecurityViolationError.prototype, 'name', {
	value: SecurityViolationError.name,
	writable: true,
	enumerable: false,
	configurable: true
});
