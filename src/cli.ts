import { Command } from 'commander';
import { runInitFlow } from './generator/init-flow';
import { runAudit } from './generator/audit';
import { runPersonaAdd } from './generator/persona-add';
import { buildPlaceholders, resolveInitDirectory } from './utils/fs';
import { logger } from './utils/logger';
import { resolveProjectName } from './utils/prompt';

const VERSION = '2.0.0';

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('aide')
    .description('Bootstrap and maintain a spec-driven AI development team for your project')
    .version(VERSION);

  program
    .command('init')
    .description('Set up AIDE (survey phase) or generate your AI team (generate phase) in the current directory')
    .argument('[project-name]', 'Optional display name override for templates')
    .option('-p, --providers <providers>', 'Provider(s): cursor, claude, both, or cursor,claude')
    .option(
      '-a, --personas <personas>',
      'Persona(s): programmer,pm,po,designer,qa,business-analyst'
    )
    .option('-s, --stacks <stacks>', 'Stack(s) for Programmer: angular,react,node-js,node-ts,tailwind')
    .option('-d, --dir <dir>', 'Directory to initialize (defaults to current working directory)')
    .option('--no-git', 'Skip git repository initialization')
    .option('-y, --yes', 'Auto-confirm all prompts (for CI)')
    .option('-f, --force', 'Overwrite files not managed by AIDE without asking')
    .action(async (projectName: string | undefined, cliOptions: InitCliOptions) => {
      const targetDir = resolveInitDirectory(cliOptions.dir);
      const resolvedProjectName = await resolveProjectName(targetDir, projectName);
      const placeholders = buildPlaceholders(resolvedProjectName);

      await runInitFlow({
        projectName: resolvedProjectName,
        targetDir,
        placeholders,
        providersCli: cliOptions.providers,
        personasCli: cliOptions.personas,
        stacksCli: cliOptions.stacks,
        initGit: cliOptions.git !== false,
        force: cliOptions.force,
        autoConfirm: cliOptions.yes,
      });
    });

  program
    .command('audit')
    .description('Report survey fill status, drift on generated files, and next steps')
    .option('-d, --dir <dir>', 'Directory to audit (defaults to current working directory)')
    .action(async (cliOptions: AuditCliOptions) => {
      const targetDir = resolveInitDirectory(cliOptions.dir);
      await runAudit({ targetDir });
    });

  const personaCommand = program.command('persona').description('Manage AI personas incrementally');

  personaCommand
    .command('add')
    .description('Add new AI personalities and their survey files without touching existing ones')
    .option(
      '-a, --personas <personas>',
      'Persona(s) to add: programmer,pm,po,designer,qa,business-analyst'
    )
    .option('-s, --stacks <stacks>', 'Stack(s) for Programmer: angular,react,node-js,node-ts,tailwind')
    .option('-d, --dir <dir>', 'Directory to update (defaults to current working directory)')
    .option('-y, --yes', 'Auto-confirm all prompts (for CI)')
    .action(async (cliOptions: PersonaAddCliOptions) => {
      const targetDir = resolveInitDirectory(cliOptions.dir);
      const resolvedProjectName = await resolveProjectName(targetDir);
      const placeholders = buildPlaceholders(resolvedProjectName);

      await runPersonaAdd({
        targetDir,
        placeholders,
        personasCli: cliOptions.personas,
        stacksCli: cliOptions.stacks,
        autoConfirm: cliOptions.yes,
      });
    });

  program.hook('postAction', () => {
    logger.dim('');
  });

  await program.parseAsync(argv);
}

interface InitCliOptions {
  providers?: string;
  personas?: string;
  stacks?: string;
  dir?: string;
  git?: boolean;
  yes?: boolean;
  force?: boolean;
}

interface AuditCliOptions {
  dir?: string;
}

interface PersonaAddCliOptions {
  personas?: string;
  stacks?: string;
  dir?: string;
  yes?: boolean;
}
