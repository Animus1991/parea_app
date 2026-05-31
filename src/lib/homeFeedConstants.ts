export const HOME_CATEGORIES = [
  'All',
  'Live Music',
  'Electronic Music',
  'Theater & Dance',
  'Cinema',
  'Stand-up',
  'Food & Drink',
  'Museums',
  'Exhibitions',
  'Workshops',
  'Sports',
  'Social',
  'Networking',
  'Wellness',
  'Board games',
  'Book club',
  'Language exchange',
  'Hiking',
  'Nearby escapes',
  'Walking tours',
  'Community events',
] as const;

export const HOME_POPULAR_TAGS = [
  'All',
  'music',
  'culture',
  'food',
  'outdoor',
  'social',
  'nightlife',
  'sports',
  'workshop',
  'free',
] as const;

export const HOME_MOCK_DISTANCES: Record<string, number> = {
  e1: 1.2, e2: 18.0, e3: 2.8, e4: 3.6, e5: 150.0, e6: 0.5,
  e7: 2.1, e8: 4.5, e9: 1.8, e10: 25.0, e11: 1.5, e12: 5.2,
  e13: 1.0, e14: 0.8, e15: 3.2, e16: 2.5, e17: 3.8, e18: 1.3,
  e19: 12.0, e20: 6.0, e21: 2.0, e22: 0.9, e23: 2.4, e24: 2.6,
  e25: 18.0, e26: 3.5, e27: 2.2, e28: 8.5,
};

export type HomePriceFilter = 'All' | 'Free' | 'Paid' | 'Group Discount';
export type HomeDateFilter = 'Any' | 'Today' | 'This Week' | 'This Month';
export type HomeSafetyFilter = 'All' | 'low' | 'medium' | 'high_trust';
export type HomeRadiusFilter = 'Any' | '5km' | '10km' | '25km';
export type HomeSortParam = 'Relevance' | 'Distance' | 'Group Progress';
