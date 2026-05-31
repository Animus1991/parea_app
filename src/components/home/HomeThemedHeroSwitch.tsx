import { RefObject, ReactNode } from 'react';
import { useStore } from '../../store';
import { HomeLoggedInHeroContrast } from './HomeLoggedInHeroContrast';
import { HomeSearchDropdown } from './HomeSearchDropdown';

export interface HomeThemedHeroSwitchProps {
  greeting: string;
  motivation: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchRef: RefObject<HTMLDivElement | null>;
  showSearchSuggestions: boolean;
  onSearchFocus: () => void;
  searchSuggestions: string[];
  onPickSuggestion: (value: string) => void;
  richHero: ReactNode;
}

export function HomeThemedHeroSwitch({
  greeting,
  motivation,
  searchQuery,
  onSearchChange,
  searchRef,
  showSearchSuggestions,
  onSearchFocus,
  searchSuggestions,
  onPickSuggestion,
  richHero,
}: HomeThemedHeroSwitchProps) {
  const homeHeroMode = useStore((s) => s.homeHeroMode);

  if (homeHeroMode !== 'rich') {
    return (
      <HomeLoggedInHeroContrast
        greeting={greeting}
        motivation={motivation}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchRef={searchRef}
        showSearchSuggestions={showSearchSuggestions}
        onSearchFocus={onSearchFocus}
        searchDropdown={
          <HomeSearchDropdown
            popularSuggestions={searchSuggestions}
            onPick={onPickSuggestion}
            show={showSearchSuggestions}
            searchQuery={searchQuery}
          />
        }
      />
    );
  }

  return <>{richHero}</>;
}
