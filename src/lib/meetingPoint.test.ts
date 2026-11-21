import { describe, expect, it } from 'vitest';
import {
  conversationShowsEventVenue,
  meetingPointLabel,
  meetingPointMapQuery,
  meetingPointMeetAt,
} from './meetingPoint';

describe('meetingPoint helpers', () => {
  it('prefers the specific meeting point over the venue', () => {
    expect(meetingPointLabel('Cine Thisio', 'κύρια είσοδος')).toBe('κύρια είσοδος');
    expect(meetingPointMapQuery('Cine Thisio', 'κύρια είσοδος')).toBe('κύρια είσοδος');
  });

  it('falls back to the venue when there is no distinct meeting point', () => {
    expect(meetingPointLabel('Cine Thisio, Apostolou Pavlou 7')).toBe(
      'Cine Thisio, Apostolou Pavlou 7',
    );
    expect(meetingPointMapQuery('Cine Thisio, Apostolou Pavlou 7')).toBe(
      'Cine Thisio, Apostolou Pavlou 7',
    );
  });

  it('reads the announced meetup time from the system body', () => {
    expect(meetingPointMeetAt('Meeting point: Cine Thisio, Apostolou Pavlou 7 · 20:30')).toBe(
      '20:30',
    );
    expect(meetingPointMeetAt('No time here')).toBeUndefined();
  });

  it('does not treat a DM as an event meeting-point surface', () => {
    expect(conversationShowsEventVenue('event_group')).toBe(true);
    expect(conversationShowsEventVenue('group_to_group')).toBe(true);
    expect(conversationShowsEventVenue('direct')).toBe(false);
    expect(conversationShowsEventVenue('person_to_group')).toBe(false);
  });
});
