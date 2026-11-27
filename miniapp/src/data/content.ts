import contentCsv from './content_library.csv?raw';
import analyticsCsv from './analytics_rules.csv?raw';
import type { BarrierKind, CharacterKind } from '../types';

export interface ContentRecord {
  id: string;
  version: string;
  category: string;
  character: string;
  text: string;
  triggerEvent: string;
  action: string;
  priority: number;
  status: string;
  active: boolean;
  theme: string;
}

export interface AnalyticsRule {
  id: string;
  version: string;
  condition: string;
  text: string;
  action: string;
  kind: string;
  cooldownDays: number;
  status: string;
}

function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

function table<T>(source: string, map: (r: Record<string, string>) => T): T[] {
  const rows = parseCsv(source);
  const head = rows[0] ?? [];
  return rows.slice(1).filter(r => r.some(Boolean)).map(r => map(Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))));
}

export const CONTENT_LIBRARY = table<ContentRecord>(contentCsv, r => ({
  id: r.id,
  version: r.version,
  category: r.category,
  character: r.character,
  text: r.text,
  triggerEvent: r.trigger_event,
  action: r.action,
  priority: Number(r.priority || 0),
  status: r.status,
  active: r.active === 'True',
  theme: r.theme,
}));

export const ANALYTICS_RULES = table<AnalyticsRule>(analyticsCsv, r => ({
  id: r.id,
  version: r.version,
  condition: r.condition,
  text: r.text,
  action: r.action,
  kind: r.kind,
  cooldownDays: Number(r.cooldown_days || 0),
  status: r.status,
}));

function seed(input: string): number {
  let n = 0;
  for (const ch of input) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n;
}

export function pickContent(category: string, trigger: string, key: string, character?: CharacterKind): ContentRecord | undefined {
  const records = CONTENT_LIBRARY.filter(r =>
    r.category === category && r.triggerEvent === trigger && (!character || !r.character || r.character === character)
  ).sort((a, b) => b.priority - a.priority || String(a.id ?? '').localeCompare(String(b.id ?? '')));
  if (!records.length) return undefined;
  return records[seed(`${category}:${trigger}:${key}:${character ?? ''}`) % records.length];
}

export function reflectionQuestions(date: string) {
  return {
    gratitude: pickContent('gratitude', 'daily_reflection_open', `g-${date}`)?.text ?? 'За что хочется поблагодарить себя сегодня?',
    contribution: pickContent('contribution', 'daily_reflection_open', `k-${date}`)?.text ?? 'Что хорошего сегодня удалось сделать для других?',
  };
}

export function contextForBarrier(barrier: BarrierKind): { text: string; action: string } {
  const event = { time: 'A23', forget: 'A24', start: 'A25', conflict: 'A26', energy: 'A30', other: 'barrier' }[barrier];
  const found = pickContent('context', event, `b-${barrier}-${event}`);
  const fallback = {
    time: 'Какое время для действия реально доступно?',
    forget: 'После какого знакомого действия удобно начать?',
    start: 'Какой первый шаг можно сделать проще?',
    conflict: 'Какое обязательство сейчас важнее?',
    energy: 'Подходит ли нынешний объём?',
    other: 'Что можно изменить в плане, чтобы он стал удобнее?',
  }[barrier];
  return { text: found?.text ?? fallback, action: found?.action ?? 'schedule_edit' };
}

export function characterLine(kind: CharacterKind, date: string, event = 'character_opened'): string {
  return pickContent('character', event, `${kind}-${date}`, kind)?.text ?? 'Рядом, когда нужен спокойный следующий шаг.';
}

export function uxText(id: string): string | undefined {
  return CONTENT_LIBRARY.find(r => r.id === id)?.text;
}
