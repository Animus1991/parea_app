import { describe, expect, it } from 'vitest';
import type { Event } from '../types';
import {
  matchesCategoryFilter,
  matchesDateFilter,
  matchesEventQuery,
  sortEventsByDistance,
} from './categoryFilters';

function event(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event',
    title: 'A social gathering',
    category: 'Social',
    description: 'An evening together',
    date: '2024-04-13',
    time: '18:00',
    duration: '2h',
    locationArea: 'Athens',
    isPaid: false,
    price: 0,
    organizerId: 'host',
    safetyLevel: 'low',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 10,
    ...overrides,
  };
}

function date(year: number, month: number, day: number, hour = 12, minute = 0): Date {
  return new Date(year, month, day, hour, minute);
}

describe('matchesDateFilter', () => {
  it('uses Monday as the start of the week', () => {
    const monday = date(2024, 5, 10);
    expect(matchesDateFilter(date(2024, 5, 16, 23), 'This Week', monday)).toBe(true);
    expect(matchesDateFilter(date(2024, 5, 9, 23), 'This Week', monday)).toBe(false);
  });

  it('matches today and the current month', () => {
    const now = date(2024, 5, 10, 9);
    expect(matchesDateFilter(date(2024, 5, 10, 23), 'Today', now)).toBe(true);
    expect(matchesDateFilter(date(2024, 5, 11), 'Today', now)).toBe(false);
    expect(matchesDateFilter(date(2024, 5, 30), 'This Month', now)).toBe(true);
    expect(matchesDateFilter(date(2024, 6, 1), 'This Month', now)).toBe(false);
  });

  it('matches only the upcoming weekend from Wednesday', () => {
    const wednesday = date(2024, 3, 10);
    expect(matchesDateFilter(date(2024, 3, 13), 'Weekend', wednesday)).toBe(true);
    expect(matchesDateFilter(date(2024, 3, 14, 23, 59), 'Weekend', wednesday)).toBe(true);
    expect(matchesDateFilter(date(2024, 3, 7), 'Weekend', wednesday)).toBe(false);
    expect(matchesDateFilter(date(2024, 3, 20), 'Weekend', wednesday)).toBe(false);
  });

  it('starts the weekend window at now on Saturday and Sunday', () => {
    const saturday = date(2024, 3, 13, 12);
    expect(matchesDateFilter(date(2024, 3, 13, 11), 'Weekend', saturday)).toBe(false);
    expect(matchesDateFilter(date(2024, 3, 13, 12), 'Weekend', saturday)).toBe(true);
    expect(matchesDateFilter(date(2024, 3, 14, 23, 59), 'Weekend', saturday)).toBe(true);

    const sunday = date(2024, 3, 14, 18);
    expect(matchesDateFilter(date(2024, 3, 14, 23), 'Weekend', sunday)).toBe(true);
    expect(matchesDateFilter(date(2024, 3, 15), 'Weekend', sunday)).toBe(false);
  });

  it('accepts the unrestricted filter', () => {
    expect(matchesDateFilter(new Date(Number.NaN), 'Any', new Date())).toBe(true);
  });
});

describe('category event filters', () => {
  it('matches Greek accents-insensitively in catalog labels and tags', () => {
    expect(matchesEventQuery(event(), 'κοινωνικα')).toBe(true);
    expect(matchesEventQuery(event({ tags: ['Κοινωνικά'] }), 'κοινωνικα')).toBe(true);
  });

  it('matches a query without broad substring category matches', () => {
    expect(matchesCategoryFilter(event(), 'Social')).toBe(true);
    expect(matchesCategoryFilter(event({ category: 'Social Club' }), 'Social')).toBe(false);
    expect(matchesCategoryFilter(event(), null)).toBe(true);
  });
});

describe('sortEventsByDistance', () => {
  it('orders by distance and puts events without both coordinates last', () => {
    const origin = { lat: 37.9838, lng: 23.7275 };
    const events = [
      { id: 'far', lat: 40.6401, lng: 22.9444 },
      { id: 'missing-lat', lng: origin.lng },
      { id: 'near', lat: 37.984, lng: 23.728 },
      { id: 'missing', lat: undefined, lng: undefined },
      { id: 'origin', ...origin },
    ];

    expect(sortEventsByDistance(events, origin).map((item) => item.id)).toEqual([
      'origin',
      'near',
      'far',
      'missing-lat',
      'missing',
    ]);
  });
});
