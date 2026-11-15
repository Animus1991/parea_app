import { describe, expect, it } from 'vitest';
import { buildCalendarIcs } from './calendarIcs';

describe('buildCalendarIcs', () => {
  it('emits escaped multi-event ICS with shared calendar headers', () => {
    const ics = buildCalendarIcs([
      { title: 'Hike, Athens', date: '2026-11-20', time: '09:00', locationArea: 'Filopappou' },
      { title: 'Cinema', date: '2026-11-21', time: '21:00' },
    ]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('PRODID:-//Nakamas//Calendar//EN');
    expect(ics).toContain('SUMMARY:Hike\\, Athens');
    expect(ics).toContain('LOCATION:Filopappou');
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2);
  });
});
