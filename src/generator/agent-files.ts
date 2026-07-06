import path from 'path';
import fs from 'fs-extra';
import { getTemplatesRoot, renderPlaceholders, type PlaceholderValues } from '../utils/fs';
import { getPersona, type PersonaKey } from '../personas/registry';
import { getStack, type StackKey } from '../stacks/registry';
import { readStackFragment } from './survey-files';
import type { Provider } from '../utils/manifest';

async function readPersonaPromptBody(promptTemplate: string): Promise<string> {
  const templatePath = path.join(getTemplatesRoot(), 'personas', promptTemplate);
  return fs.readFile(templatePath, 'utf8');
}

export async function buildAgentFileContent(
  personaKey: PersonaKey,
  provider: Provider,
  placeholders: PlaceholderValues,
  extraBodySections: string[] = []
): Promise<string> {
  const persona = getPersona(personaKey);
  const rawBody = await readPersonaPromptBody(persona.promptTemplate);
  const renderedBody = renderPlaceholders(rawBody, placeholders);
  const body =
    extraBodySections.length > 0 ? `${renderedBody}\n\n${extraBodySections.join('\n\n')}` : renderedBody;

  const tools = provider === 'cursor' ? persona.cursorTools : persona.claudeTools;

  const frontmatterLines = ['---', `name: ${persona.key}`, `description: ${persona.description}`];

  if (tools && tools.length > 0) {
    frontmatterLines.push(`tools: ${tools.join(', ')}`);
  }

  if (provider === 'claude') {
    frontmatterLines.push('model: inherit');
  }

  frontmatterLines.push('managedBy: aide', '---');

  return `${frontmatterLines.join('\n')}\n\n${body}\n`;
}

export function getAgentRelativePath(provider: Provider, personaKey: PersonaKey): string {
  const persona = getPersona(personaKey);
  const dir = provider === 'cursor' ? '.cursor/agents' : '.claude/agents';
  return path.posix.join(dir, persona.agentFileName);
}

export async function buildStackRuleContent(
  key: StackKey,
  placeholders: PlaceholderValues
): Promise<string> {
  const stack = getStack(key);
  const fragment = await readStackFragment(key);

  const frontmatterLines = [
    '---',
    `description: ${stack.label} best practices for the Programmer persona`,
    `globs: ${stack.cursorGlobs}`,
    'alwaysApply: false',
    'managedBy: aide',
    '---',
  ];

  return `${frontmatterLines.join('\n')}\n\n${renderPlaceholders(fragment, placeholders)}\n`;
}

export function getStackRuleRelativePath(key: StackKey): string {
  const stack = getStack(key);
  const ruleFileName = stack.fragmentFile.replace(/\.md$/, '.mdc');
  return path.posix.join('.cursor', 'rules', 'stacks', ruleFileName);
}
