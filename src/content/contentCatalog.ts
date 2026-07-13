import { Experience, experiences } from '../product/experienceModel';
import type { Coordinates } from '../liveworld/liveWorld';

export type Hemisphere = 'northern' | 'southern';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type ContentScope = 'local' | 'regional' | 'global';

export type WorldContext = {
  coordinates: Coordinates;
  deviceLocale: string;
  contentLanguage: string;
  hemisphere: Hemisphere;
  season: Season;
  localContentAllowed: boolean;
};

type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type ContentPack = {
  id: string;
  title: string;
  scope: ContentScope;
  contentLanguage: string;
  experienceIds: string[];
  coverage?: Bounds;
  seasons?: Season[];
  provenance: 'momentum-editorial' | 'local-curator';
};

export type ResolvedContentCatalog = {
  context: WorldContext;
  experiences: Experience[];
  matchedPacks: ContentPack[];
  mostSpecificScope: ContentScope;
  coverageLabel: string;
};

const globalExperienceIds = experiences
  .filter((experience) => experience.id !== 'wadden-light')
  .map((experience) => experience.id);

export const contentPacks: ContentPack[] = [
  {
    id: 'global-evergreen-nl',
    title: 'Wereldwijde basis',
    scope: 'global',
    contentLanguage: 'nl',
    experienceIds: globalExperienceIds,
    provenance: 'momentum-editorial',
  },
  {
    id: 'northern-netherlands-coast-nl',
    title: 'Noord-Nederlandse kust',
    scope: 'local',
    contentLanguage: 'nl',
    experienceIds: ['wadden-light'],
    coverage: { north: 53.65, south: 52.75, west: 4.65, east: 7.25 },
    provenance: 'momentum-editorial',
  },
];

const withinBounds = (coordinates: Coordinates, bounds?: Bounds) => !bounds || (
  coordinates.latitude <= bounds.north
  && coordinates.latitude >= bounds.south
  && coordinates.longitude <= bounds.east
  && coordinates.longitude >= bounds.west
);

const seasonFor = (date: Date, hemisphere: Hemisphere): Season => {
  const month = date.getMonth() + 1;
  const northern = month >= 3 && month <= 5 ? 'spring'
    : month >= 6 && month <= 8 ? 'summer'
      : month >= 9 && month <= 11 ? 'autumn'
        : 'winter';
  if (hemisphere === 'northern') return northern;
  return northern === 'spring' ? 'autumn'
    : northern === 'summer' ? 'winter'
      : northern === 'autumn' ? 'spring'
        : 'summer';
};

export function createWorldContext(coordinates: Coordinates, date = new Date(), contentLanguage = 'nl', localContentAllowed = false): WorldContext {
  const deviceLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'nl-NL';
  const hemisphere: Hemisphere = coordinates.latitude >= 0 ? 'northern' : 'southern';
  return {
    coordinates,
    deviceLocale,
    contentLanguage,
    hemisphere,
    season: seasonFor(date, hemisphere),
    localContentAllowed,
  };
}

const scopeOrder: Record<ContentScope, number> = { local: 0, regional: 1, global: 2 };

export function resolveContentCatalog(context: WorldContext, packs: ContentPack[] = contentPacks): ResolvedContentCatalog {
  const exactLanguage = packs.filter((pack) => pack.contentLanguage === context.contentLanguage);
  const eligible = exactLanguage
    .filter((pack) => pack.scope === 'global' || context.localContentAllowed)
    .filter((pack) => withinBounds(context.coordinates, pack.coverage))
    .filter((pack) => !pack.seasons || pack.seasons.includes(context.season))
    .sort((a, b) => scopeOrder[a.scope] - scopeOrder[b.scope]);

  const globalFallback = exactLanguage.filter((pack) => pack.scope === 'global');
  const matchedPacks = eligible.length ? eligible : globalFallback;
  const ids = [...new Set(matchedPacks.flatMap((pack) => pack.experienceIds))];
  const resolvedExperiences = ids
    .map((id) => experiences.find((experience) => experience.id === id))
    .filter((experience): experience is Experience => Boolean(experience));
  const mostSpecificScope = matchedPacks[0]?.scope ?? 'global';

  return {
    context,
    experiences: resolvedExperiences.length ? resolvedExperiences : experiences.filter((item) => globalExperienceIds.includes(item.id)),
    matchedPacks,
    mostSpecificScope,
    coverageLabel: mostSpecificScope === 'local'
      ? 'Lokale en wereldwijde ervaringen'
      : mostSpecificScope === 'regional'
        ? 'Regionale en wereldwijde ervaringen'
        : 'Wereldwijde ervaringen',
  };
}

export const catalogValidationRegions = {
  dokkum: { latitude: 53.325, longitude: 5.999 },
  newYork: { latitude: 40.7128, longitude: -74.006 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
} satisfies Record<string, Coordinates>;
