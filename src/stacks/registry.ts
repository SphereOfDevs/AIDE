export type StackKey = 'angular' | 'react' | 'node-js' | 'node-ts' | 'tailwind';

export interface StackDefinition {
  key: StackKey;
  label: string;
  fragmentFile: string;
  cursorGlobs: string;
}

export const STACKS: StackDefinition[] = [
  {
    key: 'angular',
    label: 'Angular',
    fragmentFile: 'angular.md',
    cursorGlobs: '**/*.ts,**/*.html',
  },
  {
    key: 'react',
    label: 'React',
    fragmentFile: 'react.md',
    cursorGlobs: '**/*.tsx,**/*.jsx',
  },
  {
    key: 'node-js',
    label: 'Node.js (JavaScript)',
    fragmentFile: 'node-js.md',
    cursorGlobs: '**/*.js',
  },
  {
    key: 'node-ts',
    label: 'Node.js (TypeScript)',
    fragmentFile: 'node-ts.md',
    cursorGlobs: '**/*.ts',
  },
  {
    key: 'tailwind',
    label: 'Tailwind CSS',
    fragmentFile: 'tailwind.md',
    cursorGlobs: '**/*.html,**/*.tsx,**/*.jsx,**/*.vue',
  },
];

export function getStack(key: StackKey): StackDefinition {
  const stack = STACKS.find((item) => item.key === key);
  if (!stack) {
    throw new Error(`Unknown stack "${key}".`);
  }
  return stack;
}

export function isStackKey(value: string): value is StackKey {
  return STACKS.some((stack) => stack.key === value);
}

export function getStackChoices(): { name: string; value: StackKey }[] {
  return STACKS.map((stack) => ({ name: stack.label, value: stack.key }));
}
