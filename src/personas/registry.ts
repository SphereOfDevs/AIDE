export type PersonaKey =
  | 'programmer'
  | 'pm'
  | 'po'
  | 'designer'
  | 'qa'
  | 'business-analyst'
  | 'marketing-specialist';

export const TASK_TEMPLATE_FILE = 'task-template.md';
export const PLANNING_PERSONAS: PersonaKey[] = ['pm', 'po'];

export interface PersonaExtraSurveyFile {
  fileName: string;
  templateName: string;
  title: string;
}

export interface PersonaDefinition {
  key: PersonaKey;
  label: string;
  description: string;
  requiredSurveyFiles: string[];
  extraSurveyFile?: PersonaExtraSurveyFile;
  cursorTools?: string[];
  claudeTools?: string[];
  promptTemplate: string;
  agentFileName: string;
}

export const PERSONAS: PersonaDefinition[] = [
  {
    key: 'programmer',
    label: 'Programmer',
    description: 'Implements features, writes tests, follows coding standards and architecture.',
    requiredSurveyFiles: ['coding-standards.md'],
    promptTemplate: 'programmer.md',
    agentFileName: 'programmer.md',
  },
  {
    key: 'pm',
    label: 'Product Manager',
    description: 'Plans roadmap, prioritizes scope, keeps product docs aligned with the vision.',
    requiredSurveyFiles: ['project.md'],
    extraSurveyFile: { fileName: 'roadmap.md', templateName: 'roadmap.md', title: 'Roadmap' },
    cursorTools: ['Read', 'Grep', 'Glob', 'Edit'],
    claudeTools: ['Read', 'Grep', 'Glob', 'Edit'],
    promptTemplate: 'pm.md',
    agentFileName: 'pm.md',
  },
  {
    key: 'po',
    label: 'Product Owner',
    description: 'Owns the backlog, writes acceptance criteria, sequences work for delivery.',
    requiredSurveyFiles: ['project.md'],
    extraSurveyFile: { fileName: 'backlog.md', templateName: 'backlog.md', title: 'Backlog' },
    cursorTools: ['Read', 'Grep', 'Glob', 'Edit'],
    claudeTools: ['Read', 'Grep', 'Glob', 'Edit'],
    promptTemplate: 'po.md',
    agentFileName: 'po.md',
  },
  {
    key: 'designer',
    label: 'Designer',
    description: 'Defines UX/UI direction, design system, and interaction patterns.',
    requiredSurveyFiles: ['project.md'],
    extraSurveyFile: { fileName: 'design.md', templateName: 'design.md', title: 'Design' },
    cursorTools: ['Read', 'Grep', 'Glob', 'Edit'],
    claudeTools: ['Read', 'Grep', 'Glob', 'Edit'],
    promptTemplate: 'designer.md',
    agentFileName: 'designer.md',
  },
  {
    key: 'qa',
    label: 'QA',
    description: 'Validates acceptance criteria, designs test plans, runs regression checks.',
    requiredSurveyFiles: ['coding-standards.md'],
    extraSurveyFile: { fileName: 'qa-strategy.md', templateName: 'qa-strategy.md', title: 'QA Strategy' },
    cursorTools: ['Read', 'Grep', 'Glob', 'Bash'],
    claudeTools: ['Read', 'Grep', 'Glob', 'Bash'],
    promptTemplate: 'qa.md',
    agentFileName: 'qa.md',
  },
  {
    key: 'business-analyst',
    label: 'Business Analyst',
    description: 'Analyzes business requirements, models, KPIs, and stakeholder needs.',
    requiredSurveyFiles: ['business.md'],
    extraSurveyFile: {
      fileName: 'business-analysis.md',
      templateName: 'business-analysis.md',
      title: 'Business Analysis',
    },
    cursorTools: ['Read', 'Grep', 'Glob', 'Edit'],
    claudeTools: ['Read', 'Grep', 'Glob', 'Edit'],
    promptTemplate: 'business-analyst.md',
    agentFileName: 'business-analyst.md',
  },
  {
    key: 'marketing-specialist',
    label: 'Marketing Specialist',
    description: 'Shapes positioning, messaging, channels, and go-to-market strategy.',
    requiredSurveyFiles: ['business.md'],
    extraSurveyFile: {
      fileName: 'marketing.md',
      templateName: 'marketing.md',
      title: 'Marketing',
    },
    cursorTools: ['Read', 'Grep', 'Glob', 'Edit'],
    claudeTools: ['Read', 'Grep', 'Glob', 'Edit'],
    promptTemplate: 'marketing-specialist.md',
    agentFileName: 'marketing-specialist.md',
  },
];

export function getPersona(key: PersonaKey): PersonaDefinition {
  const persona = PERSONAS.find((item) => item.key === key);
  if (!persona) {
    throw new Error(`Unknown persona "${key}".`);
  }
  return persona;
}

export function isPersonaKey(value: string): value is PersonaKey {
  return PERSONAS.some((persona) => persona.key === value);
}

export function getPersonaChoices(exclude: PersonaKey[] = []): { name: string; value: PersonaKey }[] {
  return PERSONAS.filter((persona) => !exclude.includes(persona.key)).map((persona) => ({
    name: `${persona.label} — ${persona.description}`,
    value: persona.key,
  }));
}
