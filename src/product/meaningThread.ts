import { Experience } from './experienceModel';
import { PersonalProfile } from '../profile/personalModel';

const conceptTerms: Array<{ pattern: RegExp; experienceTerms: string[] }> = [
  { pattern: /gezin|kind|familie|samen|partner|vriend/i, experienceTerms: ['gezin', 'kind', 'familie', 'samen', 'verbinding', 'connect'] },
  { pattern: /natuur|buiten|vogel|zee|bos|wereld|ontdek|reis/i, experienceTerms: ['natuur', 'buiten', 'vogels', 'zee', 'bos', 'ontdekken', 'route', 'outside'] },
  { pattern: /sterk|fit|kracht|beweeg|sport|gezond/i, experienceTerms: ['sterk', 'kracht', 'bewegen', 'sport', 'workout', 'movement'] },
  { pattern: /rust|herstel|aandacht|balans|ruimte/i, experienceTerms: ['rust', 'herstel', 'ademen', 'pauze', 'stilte', 'restore'] },
  { pattern: /leer|groei|nieuwsgierig|kennis|begrijp/i, experienceTerms: ['leren', 'groei', 'nieuwsgierigheid', 'kennis', 'culture', 'learn'] },
  { pattern: /kook|eten|voeding|maaltijd/i, experienceTerms: ['koken', 'eten', 'voeding', 'maaltijd', 'food'] },
];

const tokens = (value: string) => value.toLocaleLowerCase('nl-NL').split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 4);
const horizonOrder = { near: 0, growth: 1, meaning: 2 } as const;

export function attachMeaningThread(experience: Experience, profile: PersonalProfile): Experience {
  const searchable = `${experience.kind} ${experience.title} ${experience.promise} ${experience.wonder} ${experience.keywords.join(' ')}`.toLocaleLowerCase('nl-NL');
  const directions = (['near', 'growth', 'meaning'] as const).flatMap((horizon) => profile.directions[horizon]
    .filter((label) => !profile.pausedDirections.includes(label))
    .map((label) => ({ horizon, label })));

  const ranked = directions.map((direction) => {
    const direct = tokens(direction.label).reduce((score, token) => score + (searchable.includes(token) ? 3 : 0), 0);
    const conceptual = conceptTerms.reduce((score, concept) => concept.pattern.test(direction.label) && concept.experienceTerms.some((term) => searchable.includes(term)) ? score + 2 : score, 0);
    return { ...direction, score: direct + conceptual };
  }).filter((direction) => direction.score > 0).sort((a, b) => b.score - a.score || horizonOrder[a.horizon] - horizonOrder[b.horizon]);

  const selected = ranked[0];
  if (!selected) return { ...experience, meaningThread: undefined };
  return {
    ...experience,
    meaningThread: {
      horizon: selected.horizon,
      label: selected.label,
      source: 'user-confirmed',
      reason: selected.horizon === 'near' ? 'raakt aan iets waar jij de komende tijd ruimte voor wilt maken' : selected.horizon === 'growth' ? 'sluit zacht aan bij een richting waarin jij wilt groeien' : 'kan betekenis krijgen binnen iets dat jij belangrijk noemt',
    },
  };
}
