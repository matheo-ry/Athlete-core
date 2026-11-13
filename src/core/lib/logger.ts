// Único punto de salida de los registros de la app. El resto del código no usa
// `console` (lo prohíbe ESLint): así, cuando exista un servicio de avisos de
// errores (DECISIONES P-10), solo habrá que conectarlo aquí.
//
// IMPORTANTE: en los registros no se escriben datos personales (emails, nombres,
// medidas). En `context` solo van identificadores y datos técnicos.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

// `debug` e `info` solo sirven mientras se desarrolla: en producción serían ruido.
const DEV_ONLY_LEVELS: ReadonlySet<LogLevel> = new Set<LogLevel>(['debug', 'info']);

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (DEV_ONLY_LEVELS.has(level) && !import.meta.env.DEV) {
    return;
  }
  if (context === undefined) {
    console[level](message);
    return;
  }
  console[level](message, context);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
