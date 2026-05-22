export interface ILogger {
	trace(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
}
