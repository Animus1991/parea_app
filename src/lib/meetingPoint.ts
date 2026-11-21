/** One meeting-point readout: the specific spot when it differs from the venue, else the venue. */
export function meetingPointLabel(venue?: string, meetingPoint?: string): string | undefined {
  if (meetingPoint && meetingPoint !== venue) return meetingPoint;
  return venue || meetingPoint;
}

/** Map search should follow the same label the person sees, not a coarser venue fallback. */
export function meetingPointMapQuery(venue?: string, meetingPoint?: string): string {
  return meetingPointLabel(venue, meetingPoint) ?? venue ?? meetingPoint ?? '';
}

/** Pull a clock time from a meeting-point announcement ("… · 20:30"). */
export function meetingPointMeetAt(body?: string): string | undefined {
  if (!body) return undefined;
  const match = body.match(/(?:·|•)\s*(\d{1,2}:\d{2})\b/) ?? body.match(/\b(\d{1,2}:\d{2})\b/);
  return match?.[1];
}

/** Event venue is a meeting point only in group coordination threads, never in DMs. */
export function conversationShowsEventVenue(type: string): boolean {
  return type === 'event_group' || type === 'group_to_group';
}
