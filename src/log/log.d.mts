type RGB = [b: number, g: number, r: number];
declare const gradients: {
    purple: [[number, number, number], [number, number, number]];
    sunset: [[number, number, number], [number, number, number]];
    gray: [[number, number, number], [number, number, number]];
    orange: [[number, number, number], [number, number, number]];
    lime: [[number, number, number], [number, number, number]];
    blue: [[number, number, number], [number, number, number]];
    red: [[number, number, number], [number, number, number]];
    orangeRed: [[number, number, number], [number, number, number]];
};

declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4,
    FATAL = 5,
    PRODUCTION = 6
}
type Writer = (msg: unknown[], level: LogLevel, timestamp: boolean, name?: string) => void;
type LogConfig = {
    level: number;
    timestamp?: boolean;
    color?: [RGB, RGB];
    name: string;
};
declare const isColorSupported: boolean;
declare const colorfulWriter: (name: string, color: [RGB, RGB]) => Writer;
declare const simpleWriter: (name: string) => Writer;
declare function createLogger(config: LogConfig): {
    (...msg: unknown[]): void;
    debug(...msg: unknown[]): void;
    info(...msg: unknown[]): void;
    success(...msg: unknown[]): void;
    fail(...msg: unknown[]): void;
    warn(...msg: unknown[]): void;
    error(...msg: unknown[]): void;
    critical(...msg: unknown[]): void;
    fatal(...msg: unknown[]): void;
    whisper(...msg: unknown[]): void;
    say(...msg: unknown[]): void;
    shout(...msg: unknown[]): void;
};

export { type LogConfig, LogLevel, type RGB, type Writer, colorfulWriter, createLogger, gradients, isColorSupported, simpleWriter };
