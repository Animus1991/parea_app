/**
 * Copilot orchestrator (Φ23): engine routing → planning → execution with
 * human-in-the-loop confirmation, undo and graceful degradation.
 */
import { useStore } from '../store';
import { useCopilotStore, type CopilotEngine } from '../store/copilotStore';
import { useLanguageStore } from '../store/languageStore';
import { availableActions, getAction, toFunctionDeclarations } from './actions';
import { buildContextSnapshot, buildSystemInstruction } from './context';
import { callCopilotModel, getEngineStatus, markEngineUnavailable, type GeminiContent, type GeminiPart } from './geminiClient';
import { invalidateAfterAction } from './invalidation';
import { planLocal, UNDO_CALL } from './localEngine';
import { detectLanguage } from './text';
import type { ActionArgs, ActionResult, ActionRuntime, AiLang, PlannedCall } from './types';
import { isPlatformAdmin } from '../lib/roles';
import { useAiAuditStore, type AiAuditStatus } from '../store/aiAuditStore';

/* ───────────── navigation bridge (set by <CopilotBridge/> inside the router) ───────────── */

let navigateImpl: (path: string) => void = (path) => {
  if (typeof window !== 'undefined') window.location.assign(path);
};
let currentPath = '/';

export function bindCopilotNavigation(navigate: (path: string) => void, pathname: string): void {
  navigateImpl = navigate;
  currentPath = pathname;
}

/* ───────────── undo registry (in-memory; closures are not persisted) ───────────── */

const undoFns = new Map<string, () => void>();
const undoStack: string[] = [];

export function canUndo(messageId: string): boolean {
  return undoFns.has(messageId);
}

function registerUndo(messageId: string, fn: () => void) {
  undoFns.set(messageId, fn);
  undoStack.push(messageId);
  if (undoStack.length > 20) {
    const old = undoStack.shift();
    if (old) undoFns.delete(old);
  }
}

/* ───────────── helpers ───────────── */

function store() {
  return useCopilotStore.getState();
}

function runtime(lang: AiLang): ActionRuntime {
  return {
    navigate: (p) => navigateImpl(p),
    pathname: currentPath,
    lang,
    lastEventIds: store().lastEventIds,
    currentEventId: currentPath.match(/^\/events\/([^/]+)/)?.[1],
  };
}

function isAdmin(): boolean {
  return isPlatformAdmin(useStore.getState().currentUser);
}

function sayBoth(el: string, en: string, lang: AiLang, engine: CopilotEngine, extra: Partial<Parameters<ReturnType<typeof store>['append']>[0]> = {}) {
  return store().append({ role: 'assistant', el, en, lang, engine, ...extra });
}

function audit(action: string, risk: AiAuditEntryRisk, status: AiAuditStatus, engine: CopilotEngine, args: ActionArgs | undefined, messageId?: string) {
  useAiAuditStore.getState().record({
    userId: useStore.getState().currentUser?.id ?? null,
    action,
    risk,
    status,
    engine,
    argKeys: Object.keys(args ?? {}).slice(0, 12),
    messageId,
  });
}
type AiAuditEntryRisk = 'safe' | 'confirm' | 'destructive' | 'unknown';

function applyResult(messageId: string, result: ActionResult) {
  if (result.eventIds && result.eventIds.length > 0) store().setLastEventIds(result.eventIds);
  if (result.undo) registerUndo(messageId, result.undo);
}

function argsSummary(result: ActionResult): Record<string, unknown> {
  return { ok: result.ok, message: result.en, ...(result.data ?? {}) };
}

/**
 * Executes (or queues for confirmation) one planned call and records it in the
 * conversation. Returns a structured payload suitable for a model functionResponse.
 */
async function executeCall(callIn: PlannedCall, lang: AiLang, engine: CopilotEngine): Promise<Record<string, unknown>> {
  if (callIn.name === UNDO_CALL) {
    const done = undoLast(lang, engine);
    return { ok: done };
  }
  const action = getAction(callIn.name);
  if (!action || (action.adminOnly && !isAdmin())) {
    audit(callIn.name.slice(0, 64), action?.risk ?? 'unknown', 'denied', engine, callIn.args);
    sayBoth('Δεν μπορώ να κάνω αυτή την ενέργεια.', "I can't perform that action.", lang, engine, { error: true });
    return { ok: false, error: 'unknown_or_forbidden_action' };
  }
  const rt = runtime(lang);
  if (action.risk !== 'safe') {
    const preview = action.preview?.(callIn.args, rt) ?? { el: action.name, en: action.name };
    sayBoth(
      'Χρειάζομαι την επιβεβαίωσή σου:',
      'I need your confirmation:',
      lang,
      engine,
      { confirm: true, action: { name: action.name, args: callIn.args, risk: action.risk, status: 'pending', previewEl: preview.el, previewEn: preview.en } },
    );
    return { ok: true, status: 'awaiting_user_confirmation', preview: preview.en };
  }
  let result: ActionResult;
  try {
    result = await action.run(callIn.args, rt);
  } catch {
    result = { ok: false, el: 'Κάτι πήγε στραβά σε αυτή την ενέργεια.', en: 'Something went wrong with that action.' };
  }
  const id = sayBoth(result.el, result.en, lang, engine, {
    eventIds: result.eventIds,
    link: result.link,
    error: !result.ok,
    compact: engine === 'gemini' && !result.eventIds?.length && !result.el.includes('\n'),
    action: { name: action.name, args: callIn.args, risk: action.risk, status: result.ok ? 'done' : 'failed' },
  });
  applyResult(id, result);
  if (result.ok) invalidateAfterAction(action.name);
  audit(action.name, action.risk, result.ok ? 'done' : 'failed', engine, callIn.args, id);
  return argsSummary(result);
}

/* ───────────── public API used by the UI ───────────── */

export async function confirmAction(messageId: string): Promise<void> {
  const msg = store().messages.find((m) => m.id === messageId);
  if (!msg?.action || msg.action.status !== 'pending') return;
  const action = getAction(msg.action.name);
  const lang = msg.lang ?? useLanguageStore.getState().language;
  if (!action) return;
  store().updateAction(messageId, { status: 'done' });
  let result: ActionResult;
  try {
    result = await action.run(msg.action.args, runtime(lang));
  } catch {
    result = { ok: false, el: 'Κάτι πήγε στραβά.', en: 'Something went wrong.' };
  }
  if (!result.ok) store().updateAction(messageId, { status: 'failed' });
  const id = sayBoth(result.el, result.en, lang, msg.engine ?? 'local', { eventIds: result.eventIds, link: result.link, error: !result.ok });
  applyResult(id, result);
  if (result.ok) invalidateAfterAction(action.name);
  audit(action.name, action.risk, result.ok ? 'done' : 'failed', msg.engine ?? 'local', msg.action.args, id);
}

export function cancelAction(messageId: string): void {
  const msg = store().messages.find((m) => m.id === messageId);
  if (!msg?.action || msg.action.status !== 'pending') return;
  store().updateAction(messageId, { status: 'cancelled' });
  audit(msg.action.name, msg.action.risk ?? 'unknown', 'cancelled', msg.engine ?? 'local', msg.action.args);
  const lang = msg.lang ?? useLanguageStore.getState().language;
  sayBoth('Εντάξει, ακύρωσα — δεν έγινε καμία αλλαγή.', "Okay, cancelled — nothing was changed.", lang, msg.engine ?? 'local', { compact: true });
}

export function undoAction(messageId: string): boolean {
  const fn = undoFns.get(messageId);
  if (!fn) return false;
  fn();
  undoFns.delete(messageId);
  const idx = undoStack.indexOf(messageId);
  if (idx >= 0) undoStack.splice(idx, 1);
  store().update(messageId, { undone: true });
  store().updateAction(messageId, { status: 'undone' });
  useAiAuditStore.getState().markUndone(messageId);
  return true;
}

function undoLast(lang: AiLang, engine: CopilotEngine): boolean {
  const last = undoStack[undoStack.length - 1];
  if (!last || !undoAction(last)) {
    sayBoth('Δεν υπάρχει κάτι να αναιρέσω.', 'There is nothing to undo.', lang, engine, { compact: true });
    return false;
  }
  sayBoth('Έγινε αναίρεση της τελευταίας ενέργειας.', 'Undid the last action.', lang, engine, { compact: true });
  return true;
}

/* ───────────── engines ───────────── */

async function runLocal(text: string, lang: AiLang): Promise<void> {
  const s = useStore.getState();
  const plan = planLocal(text, {
    lang,
    isAdmin: isAdmin(),
    areas: [...new Set(s.events.map((e) => e.locationArea))],
    userNames: s.users.map((u) => u.name),
    lastEventIds: store().lastEventIds,
  });
  if (plan.reply) sayBoth(plan.reply.el, plan.reply.en, lang, 'local');
  for (const c of plan.calls) {
    if (c.name !== UNDO_CALL && !availableActions().some((a) => a.name === c.name)) continue;
    await executeCall(c, lang, 'local');
  }
}

function historyContents(lang: AiLang): GeminiContent[] {
  const msgs = store().messages.slice(-14, -1); // exclude the just-appended user message
  const out: GeminiContent[] = [];
  for (const m of msgs) {
    const text = m.role === 'user' ? m.text : m.text ?? (m.lang === 'en' || lang === 'en' ? m.en : m.el);
    if (!text) continue;
    const role = m.role === 'user' ? 'user' : 'model';
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts.push({ text });
    else out.push({ role, parts: [{ text }] });
  }
  // Gemini requires the conversation to start with a user turn.
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

async function runGemini(text: string, lang: AiLang): Promise<void> {
  const system = buildSystemInstruction(buildContextSnapshot({ pathname: currentPath, lastEventIds: store().lastEventIds }));
  const tools = toFunctionDeclarations();
  const contents: GeminiContent[] = [...historyContents(lang), { role: 'user', parts: [{ text }] }];
  for (let round = 0; round < 4; round += 1) {
    const res = await callCopilotModel({ system, contents, tools });
    if (res.functionCalls.length === 0) {
      if (res.text) store().append({ role: 'assistant', text: res.text, lang, engine: 'gemini' });
      return;
    }
    const responses: GeminiPart[] = [];
    for (const fc of res.functionCalls) {
      const payload = await executeCall({ name: fc.name, args: (fc.args ?? {}) as ActionArgs }, lang, 'gemini');
      responses.push({ functionResponse: { ...(fc.id ? { id: fc.id } : {}), name: fc.name, response: payload } });
    }
    contents.push(res.content ?? { role: 'model', parts: res.functionCalls.map((fc) => ({ functionCall: fc })) });
    contents.push({ role: 'user', parts: responses });
  }
}

/** Main entry: user sends a message to the copilot. */
export async function sendToCopilot(rawText: string): Promise<void> {
  const text = rawText.trim();
  if (!text || store().busy) return;
  const uiLang = useLanguageStore.getState().language;
  const lang = detectLanguage(text, uiLang);
  store().append({ role: 'user', text, lang });
  store().setBusy(true);
  try {
    const status = await getEngineStatus();
    store().setEngine(status.available ? 'gemini' : 'local', status.model);
    if (status.available) {
      try {
        await runGemini(text, lang);
        return;
      } catch {
        markEngineUnavailable();
        store().setEngine('local', null);
        sayBoth(
          'Η σύνδεση με το cloud AI δεν είναι διαθέσιμη — συνεχίζω με τον τοπικό βοηθό.',
          'The cloud AI is unavailable — continuing with the on-device assistant.',
          lang,
          'local',
          { compact: true },
        );
      }
    }
    await runLocal(text, lang);
  } finally {
    store().setBusy(false);
  }
}

/** Opens the copilot panel, optionally sending a prompt right away. */
export function openCopilot(prompt?: string): void {
  store().setOpen(true);
  if (prompt) void sendToCopilot(prompt);
}
