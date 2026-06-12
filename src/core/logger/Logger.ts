export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogContext = Record<string, unknown>;

export type Logger = {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  /** Pass an Error for automatic serialization, or a plain object for extra context. */
  error(message: string, err?: Error | LogContext): void;
};

type SerializedError = {
  name: string;
  message: string;
  code?: unknown;
  stack: string;
  traceback: string[];
};

function serializeError(err: Error): SerializedError {
  const lines = err.stack?.split('\n') ?? [];
  return {
    name: err.name,
    message: err.message,
    code: (err as NodeJS.ErrnoException).code,
    stack: lines[0] ?? '',
    traceback: lines.slice(1, 6).map(s => s.trim()),
  };
}

function write(level: LogLevel, message: string, context: LogContext): void {
  const entry = JSON.stringify({ level, message, ...context });
  if (level === 'ERROR') console.error(entry);
  else if (level === 'WARN') console.warn(entry);
  else console.log(entry);
}

export function createLogger(context: LogContext = {}): Logger {
  return {
    debug: (message, ctx) => write('DEBUG', message, { ...context, ...ctx }),
    info:  (message, ctx) => write('INFO',  message, { ...context, ...ctx }),
    warn:  (message, ctx) => write('WARN',  message, { ...context, ...ctx }),
    error: (message, err) => {
      const errorData = err instanceof Error ? serializeError(err) : err;
      write('ERROR', message, { ...context, error: errorData });
    },
  };
}

/** Minimal Lambda context fields needed for logging. */
export type LambdaLogContext = {
  awsRequestId?: string;
  functionName?: string;
};

/**
 * Create a logger pre-bound with standard Lambda context fields.
 * Pass the Lambda `context` object directly — requestId, functionName,
 * and the X-Ray trace ID are extracted automatically.
 */
export function createLambdaLogger(
  lambdaContext: LambdaLogContext = {},
  extraContext: LogContext = {},
): Logger {
  return createLogger({
    requestId:    lambdaContext.awsRequestId  ?? 'unknown',
    functionName: lambdaContext.functionName  ?? 'unknown',
    traceId:      process.env['_X_AMZN_TRACE_ID'] ?? 'unknown',
    ...extraContext,
  });
}
