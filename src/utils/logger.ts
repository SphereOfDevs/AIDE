import chalk from 'chalk';

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'step';

const prefix: Record<LogLevel, string> = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✖'),
  step: chalk.cyan('→'),
};

function write(level: LogLevel, message: string): void {
  console.log(`${prefix[level]} ${message}`);
}

export const logger = {
  info(message: string): void {
    write('info', message);
  },
  success(message: string): void {
    write('success', message);
  },
  warn(message: string): void {
    write('warn', message);
  },
  error(message: string): void {
    write('error', message);
  },
  step(message: string): void {
    write('step', message);
  },
  title(message: string): void {
    console.log(chalk.bold.cyan(`\n${message}\n`));
  },
  dim(message: string): void {
    console.log(chalk.gray(message));
  },
  highlight(text: string): string {
    return chalk.cyan(text);
  },
};
