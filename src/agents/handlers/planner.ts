import type { TaskStep } from '../types';
import { nanoid } from 'nanoid';

export class PlannerHandler {
  decompose(description: string): TaskStep[] {
    if (!description.trim()) return [];

    const lower = description.toLowerCase();

    type Template = { match: RegExp; steps: (m: RegExpExecArray) => Array<{ agentType: 'executor'; command: string; description: string }> };
    const templates: Template[] = [
      {
        match: /install\s+(\S+)/,
        steps: (m) => [
          { agentType: 'executor' as const, command: 'node --version', description: 'Check Node.js version' },
          { agentType: 'executor' as const, command: 'npm init -y', description: 'Initialize package.json' },
          { agentType: 'executor' as const, command: `npm install ${m[1]}`, description: `Install ${m[1]}` },
        ],
      },
      {
        match: /git clone\s+(\S+)/,
        steps: (m) => [
          { agentType: 'executor' as const, command: `git clone ${m[1]}`, description: `Clone repository ${m[1]}` },
        ],
      },
      {
        match: /npm (init|install|run|test|build)\b(.+)?/,
        steps: (m) => [
          { agentType: 'executor' as const, command: `npm ${m[1]}${m[2] || ''}`, description: `Run npm ${m[1]}` },
        ],
      },
      {
        match: /node\s+(.+)/,
        steps: (m) => [
          { agentType: 'executor' as const, command: `node ${m[1]}`, description: `Run node ${m[1]}` },
        ],
      },
      {
        match: /echo\s+(.+)/,
        steps: (m) => [
          { agentType: 'executor' as const, command: `echo ${m[1]}`, description: `Echo ${m[1]}` },
        ],
      },
    ];

    for (const t of templates) {
      const match = t.match.exec(lower);
      if (match) {
        const steps: TaskStep[] = [];
        const rawSteps = t.steps(match);
        for (let i = 0; i < rawSteps.length; i++) {
          const s = rawSteps[i];
          steps.push({
            id: nanoid(8),
            agentType: s.agentType,
            command: s.command,
            description: s.description,
            dependsOn: i > 0 ? [steps[i - 1].id] : [],
          });
        }
        return steps;
      }
    }

    const id = nanoid(8);
    return [{
      id,
      agentType: 'executor',
      command: description,
      description: `Execute: ${description}`,
      dependsOn: [],
    }];
  }
}
