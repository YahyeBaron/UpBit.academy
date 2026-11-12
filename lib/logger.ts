export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  context?: Record<string, any>;
  error?: any;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'cvv',
  'accountnumber',
  'account_number',
  'payeraccount',
  'payer_account',
  'phone',
  'phonenumber',
  'phone_number',
  'mobilenumber',
  'clerksecretkey',
  'sifalopayapikey',
  'webhooksecret',
]);

function redactSensitiveData(obj: any, depth = 0): any {
  if (depth > 5 || !obj) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSensitiveData(item, depth + 1));

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase().replace(/[_-]/g, ''))) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = redactSensitiveData(val, depth + 1);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

class Logger {
  private formatLog(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';

    const formatted = {
      timestamp,
      level: level.toUpperCase(),
      environment,
      message: payload.message,
      ...(payload.context ? { context: redactSensitiveData(payload.context) } : {}),
      ...(payload.error
        ? {
            error: {
              name: payload.error?.name,
              message: payload.error?.message,
              stack: process.env.NODE_ENV === 'development' ? payload.error?.stack : undefined,
            },
          }
        : {}),
    };

    return JSON.stringify(formatted);
  }

  info(message: string, context?: Record<string, any>) {
    console.log(this.formatLog('info', { message, context }));
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(this.formatLog('warn', { message, context }));
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    console.error(this.formatLog('error', { message, error, context }));
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', { message, context }));
    }
  }
}

export const logger = new Logger();
