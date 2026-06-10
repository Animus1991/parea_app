import type { Event } from '../types';
import { downloadICS } from './eventCalendarExport';

/** @deprecated Prefer `downloadICS` from `eventCalendarExport`. */
export function downloadEventIcs(event: Event): void {
  downloadICS(event);
}
