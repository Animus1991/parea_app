/** Core contracts for the Nakamas AI copilot (Φ23). */

export type AiLang = 'el' | 'en';

/**
 * Risk tiers drive human-in-the-loop behaviour:
 * - `safe`: executes immediately (reversible, private to the user).
 * - `confirm`: shows a preview card; runs only after the user confirms
 *   (anything published to others, sent, or privacy-relevant).
 * - `destructive`: like `confirm`, styled as a danger action.
 */
export type RiskTier = 'safe' | 'confirm' | 'destructive';

/** OpenAPI-subset schema accepted by Gemini `functionDeclarations`. */
export interface ParamSchema {
  type: 'OBJECT' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY';
  description?: string;
  enum?: string[];
  properties?: Record<string, ParamSchema>;
  required?: string[];
  items?: ParamSchema;
}

export type ActionArgs = Record<string, unknown>;

export interface ActionRuntime {
  navigate: (path: string) => void;
  pathname: string;
  lang: AiLang;
  /** Ids of the events shown in the most recent result list (for «the second one»). */
  lastEventIds: string[];
  /** Event whose detail page is open, if any («save this event»). */
  currentEventId?: string;
}

export interface ActionPreview {
  el: string;
  en: string;
}

export interface ActionResult {
  ok: boolean;
  el: string;
  en: string;
  /** Events to render as result cards under the message. */
  eventIds?: string[];
  /** Reverts the effect (kept in memory only; not persisted). */
  undo?: () => void;
  /** Compact structured payload returned to the model as functionResponse. */
  data?: Record<string, unknown>;
  /** Optional follow-up link rendered as a button. */
  link?: { path: string; el: string; en: string };
}

export interface CopilotAction {
  name: string;
  description: string;
  parameters: ParamSchema;
  risk: RiskTier;
  adminOnly?: boolean;
  /** Human-readable preview shown on confirmation cards. */
  preview?: (args: ActionArgs, rt: ActionRuntime) => ActionPreview;
  run: (args: ActionArgs, rt: ActionRuntime) => ActionResult | Promise<ActionResult>;
}

export interface PlannedCall {
  name: string;
  args: ActionArgs;
}

/** Output of an engine turn before execution. */
export interface EnginePlan {
  /** Text shown before/without actions (e.g. clarifying question, answer). */
  reply?: { el: string; en: string };
  calls: PlannedCall[];
}
