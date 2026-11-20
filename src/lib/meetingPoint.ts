/** One meeting-point readout: the specific spot when it differs from the venue, else the venue. */
export function meetingPointLabel(venue?: string, meetingPoint?: string): string | undefined {
  if (meetingPoint && meetingPoint !== venue) return meetingPoint;
  return venue || meetingPoint;
}
