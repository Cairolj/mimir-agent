import { describe, it, expect } from 'vitest';
import { ExecutorHandler } from '../../../src/agents/handlers/executor';

describe('ExecutorHandler', () => {
  const executor = new ExecutorHandler();

  it('should execute echo command successfully', async () => {
    const step = { id: 's1', agentType: 'executor' as const, command: 'echo hello world', description: '', dependsOn: [] };
    const result = await executor.execute(step);
    expect(result.status).toBe('success');
    expect(result.output).toContain('hello world');
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should fail on nonexistent command', async () => {
    const step = { id: 's2', agentType: 'executor' as const, command: 'thiscommanddoesnotexist', description: '', dependsOn: [] };
    const result = await executor.execute(step);
    expect(result.status).toBe('failure');
    expect(result.error).toBeTruthy();
  });

  it('should capture stderr on failure', async () => {
    const step = { id: 's3', agentType: 'executor' as const, command: 'node -e "process.stderr.write(\'err\'); process.exit(1)"', description: '', dependsOn: [] };
    const result = await executor.execute(step);
    expect(result.status).toBe('failure');
    expect(result.output).toBe('err');
  });

  it('should timeout long commands', async () => {
    const executorWithTimeout = new ExecutorHandler(500);
    const step = { id: 's4', agentType: 'executor' as const, command: 'node -e "setTimeout(()=>{},10000)"', description: '', dependsOn: [] };
    const result = await executorWithTimeout.execute(step);
    expect(result.status).toBe('failure');
    expect(result.error).toContain('timeout');
  });
});
