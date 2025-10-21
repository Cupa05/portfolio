export type TriggerType = 'webhook' | 'cron';
export type NodeType = 'httpRequest' | 'function' | 'set' | 'if';

export interface Trigger {
  id: string;
  type: TriggerType;
  // webhook
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  // cron
  cron?: string; // cron expression
}

export interface NodeDef {
  id: string;
  type: NodeType;
  name?: string;
  config?: Record<string, any>;
}

export interface Connection {
  from: { id: string; port: string };
  to: { id: string; port: string };
}

export interface RetryPolicy {
  maxAttempts?: number;
  backoffMs?: number;
}

export interface WorkflowSettings {
  onError?: 'stop' | 'continue';
  retry?: RetryPolicy;
}

export interface Workflow {
  name: string;
  triggers: Trigger[];
  nodes: NodeDef[];
  connections: Connection[];
  settings?: WorkflowSettings;
}

export interface RunContext {
  runId: string;
  triggerId: string;
  now: string;
  headers?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  result?: any;
  [key: string]: any;
}

export interface NodeResult {
  output: any;
  nextPort?: string; // 'main' by default or alternate for conditionals
}

export type NodeExecutor = (node: NodeDef, context: RunContext) => Promise<NodeResult>;
