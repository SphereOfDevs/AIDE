import path from 'path';
import checkbox from '@inquirer/checkbox';
import confirm from '@inquirer/confirm';
import { readPackageName } from './fs';
import type { Provider } from './manifest';
import { getPersonaChoices, isPersonaKey, type PersonaKey } from '../personas/registry';
import { getStackChoices, isStackKey, type StackKey } from '../stacks/registry';

export function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(name.trim());
}

export function getProjectNameValidationMessage(): string {
  return 'Project name must start with a letter and contain only letters, numbers, dots, hyphens, or underscores.';
}

export async function resolveProjectName(
  targetDir: string,
  override?: string
): Promise<string> {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) {
    if (!isValidProjectName(trimmedOverride)) {
      throw new Error(getProjectNameValidationMessage());
    }
    return trimmedOverride;
  }

  const packageName = await readPackageName(targetDir);
  if (packageName) {
    return packageName;
  }

  return path.basename(targetDir);
}

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function splitList(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .split(/[,+\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseProviders(value: string): Provider[] {
  const normalized = value.trim().toLowerCase();

  if (normalized === 'both' || normalized === 'all') {
    return ['cursor', 'claude'];
  }

  const providers = new Set<Provider>();

  for (const part of splitList(value)) {
    if (part === 'both' || part === 'all') {
      providers.add('cursor');
      providers.add('claude');
      continue;
    }

    if (part === 'cursor' || part === 'claude') {
      providers.add(part);
      continue;
    }

    throw new Error(`Unknown provider "${part}". Use cursor, claude, or both.`);
  }

  return [...providers];
}

export async function promptForProviders(): Promise<Provider[]> {
  return checkbox<Provider>({
    message: 'Select AI provider template(s)',
    instructions: 'Space to toggle · Enter to confirm',
    loop: false,
    required: true,
    choices: [
      {
        name: 'Cursor IDE — rules, skills, agents, AGENTS.md, MCP',
        value: 'cursor',
        checked: true,
      },
      {
        name: 'Claude Code — CLAUDE.md, commands, agents, workflows',
        value: 'claude',
        checked: false,
      },
    ],
  });
}

export async function resolveProviders(cliValue?: string): Promise<Provider[]> {
  if (cliValue?.trim()) {
    const providers = parseProviders(cliValue);
    if (providers.length === 0) {
      throw new Error('Select at least one provider: cursor, claude, or both.');
    }
    return providers;
  }

  if (isInteractive()) {
    return promptForProviders();
  }

  throw new Error(
    'Provider required in non-interactive mode. Use --providers cursor, --providers claude, or --providers both.'
  );
}

export function parsePersonas(value: string): PersonaKey[] {
  const personas = new Set<PersonaKey>();

  for (const part of splitList(value)) {
    if (!isPersonaKey(part)) {
      throw new Error(
        `Unknown persona "${part}". Use one of: programmer, pm, po, designer, qa, business-analyst.`
      );
    }
    personas.add(part);
  }

  return [...personas];
}

export async function promptForPersonas(exclude: PersonaKey[] = []): Promise<PersonaKey[]> {
  const choices = getPersonaChoices(exclude);

  if (choices.length === 0) {
    return [];
  }

  return checkbox<PersonaKey>({
    message: 'Select AI personalities to configure',
    instructions: 'Space to toggle · Enter to confirm',
    loop: false,
    required: true,
    choices,
  });
}

export async function resolvePersonas(
  cliValue?: string,
  exclude: PersonaKey[] = []
): Promise<PersonaKey[]> {
  if (cliValue?.trim()) {
    return parsePersonas(cliValue).filter((persona) => !exclude.includes(persona));
  }

  if (isInteractive()) {
    return promptForPersonas(exclude);
  }

  throw new Error(
    'Personas required in non-interactive mode. Use --personas programmer,pm,po,designer,qa,business-analyst.'
  );
}

export function parseStacks(value: string): StackKey[] {
  const stacks = new Set<StackKey>();

  for (const part of splitList(value)) {
    if (!isStackKey(part)) {
      throw new Error(`Unknown stack "${part}". Use one of: angular, react, node-js, node-ts, tailwind.`);
    }
    stacks.add(part);
  }

  return [...stacks];
}

export async function promptForStacks(): Promise<StackKey[]> {
  return checkbox<StackKey>({
    message: 'Select stack template(s) for the Programmer persona (optional)',
    instructions: 'Space to toggle · Enter to confirm · Enter with none selected to skip',
    loop: false,
    required: false,
    choices: getStackChoices(),
  });
}

export async function resolveStacks(cliValue?: string): Promise<StackKey[]> {
  if (cliValue?.trim()) {
    return parseStacks(cliValue);
  }

  if (isInteractive()) {
    return promptForStacks();
  }

  return [];
}

export async function resolveConfirmation(
  message: string,
  options: { autoConfirm?: boolean; default?: boolean } = {}
): Promise<boolean> {
  if (options.autoConfirm) {
    return true;
  }

  if (!isInteractive()) {
    return options.default ?? false;
  }

  return confirm({ message, default: options.default ?? true });
}
