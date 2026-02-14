export type ContextRecord = {
  id: string;
  name: string;
  type: "system" | "agents" | "runtime";
  source: "repo" | "openclaw";
  content: string;
  updated_at: string | null;
};

export type ContextBundle = {
  system: ContextRecord[];
  agents: ContextRecord[];
  runtime: ContextRecord[];
};
