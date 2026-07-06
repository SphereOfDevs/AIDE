import readline from 'readline';
import chalk from 'chalk';

export const CONTINUE_VALUE = '__aide_continue__';

export interface ToggleChoice<T> {
  name: string;
  value: T;
}

export interface ToggleSelectOptions<T> {
  message: string;
  choices: ToggleChoice<T>[];
  initiallySelected?: T[];
  required?: boolean;
}

function isContinueChoice<T>(value: T): boolean {
  return value === (CONTINUE_VALUE as unknown as T);
}

function valuesEqual<T>(a: T, b: T): boolean {
  return a === b;
}

function isSelected<T>(selected: T[], value: T): boolean {
  return selected.some((item) => valuesEqual(item, value));
}

function toggleSelected<T>(selected: T[], value: T): T[] {
  if (isSelected(selected, value)) {
    return selected.filter((item) => !valuesEqual(item, value));
  }
  return [...selected, value];
}

function clearLines(count: number): void {
  for (let i = 0; i < count; i++) {
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);
  }
  readline.cursorTo(process.stdout, 0);
}

function renderPrompt<T>(
  message: string,
  choices: ToggleChoice<T>[],
  selected: T[],
  cursor: number
): string[] {
  const lines: string[] = [];
  lines.push(chalk.cyan('?') + ' ' + chalk.bold(message));
  lines.push(chalk.dim('Enter to toggle · Select Continue to proceed'));
  lines.push('');

  for (let index = 0; index < choices.length; index++) {
    const choice = choices[index];
    const active = index === cursor;
    const prefix = active ? chalk.cyan('❯') : ' ';
    const marker = isContinueChoice(choice.value)
      ? ' '
      : isSelected(selected, choice.value)
        ? chalk.green('◉')
        : chalk.dim('○');
    const label = active ? chalk.cyan(choice.name) : choice.name;
    lines.push(`${prefix} ${marker} ${label}`);
  }

  return lines;
}

export async function promptToggleSelect<T>(options: ToggleSelectOptions<T>): Promise<T[]> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive terminal required for toggle selection.');
  }

  const selectableChoices = options.choices.filter((choice) => !isContinueChoice(choice.value));
  const choices: ToggleChoice<T>[] = [
    ...selectableChoices,
    { name: 'Continue', value: CONTINUE_VALUE as unknown as T },
  ];

  let selected = [...(options.initiallySelected ?? [])];
  let cursor = 0;
  let renderedLineCount = 0;

  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.resume();

  const redraw = (): void => {
    if (renderedLineCount > 0) {
      clearLines(renderedLineCount);
    }

    const lines = renderPrompt(options.message, choices, selected, cursor);
    renderedLineCount = lines.length;
    process.stdout.write(lines.join('\n') + '\n');
  };

  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
    };

    const finish = (values: T[]): void => {
      cleanup();
      if (renderedLineCount > 0) {
        clearLines(renderedLineCount);
      }
      process.stdout.write(
        chalk.cyan('?') +
          ' ' +
          chalk.bold(options.message) +
          ' ' +
          chalk.dim(values.length > 0 ? values.join(', ') : '(none)') +
          '\n'
      );
      resolve(values);
    };

    const onKeypress = (_str: string, key: readline.Key): void => {
      if (!key) {
        return;
      }

      if (key.name === 'up' || key.name === 'k') {
        cursor = cursor === 0 ? choices.length - 1 : cursor - 1;
        redraw();
        return;
      }

      if (key.name === 'down' || key.name === 'j') {
        cursor = cursor === choices.length - 1 ? 0 : cursor + 1;
        redraw();
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        const current = choices[cursor];

        if (isContinueChoice(current.value)) {
          if (options.required && selected.length === 0) {
            redraw();
            process.stdout.write('\n' + chalk.yellow('Select at least one option before continuing.\n'));
            renderedLineCount += 2;
            return;
          }
          finish(selected);
          return;
        }

        selected = toggleSelected(selected, current.value);
        redraw();
        return;
      }

      if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        cleanup();
        if (renderedLineCount > 0) {
          clearLines(renderedLineCount);
        }
        reject(new Error('Selection cancelled.'));
      }
    };

    process.stdin.on('keypress', onKeypress);
    redraw();
  });
}
