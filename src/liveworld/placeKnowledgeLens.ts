import { Experience } from '../product/experienceModel';
import { LiveWorldSnapshot, PlaceKnowledge } from './liveWorld';

const eligibleKinds: Experience['kind'][] = ['outside', 'culture', 'learn'];
const maxLocalDistanceMeters = 4000;

const compactSummary = (value: string, maxLength = 520) => {
  if (value.length <= maxLength) return value;
  const slice = value.slice(0, maxLength);
  const sentenceEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '));
  return `${slice.slice(0, sentenceEnd > 240 ? sentenceEnd + 1 : maxLength).trim()}…`;
};

const attachKnowledge = (experience: Experience, knowledge: PlaceKnowledge): Experience => {
  if (experience.placeKnowledge || experience.routePlan || !eligibleKinds.includes(experience.kind)) return experience;
  const sourceLabel = `${knowledge.language === 'nl' ? 'Nederlandstalige' : 'Engelstalige'} Wikipedia`;
  return {
    ...experience,
    why: [...experience.why, `Een bronverhaal binnen ${knowledge.distanceMeters < 1000 ? `${knowledge.distanceMeters} meter` : `${(knowledge.distanceMeters / 1000).toFixed(1)} kilometer`} van je omgeving`].slice(0, 4),
    placeKnowledge: {
      title: knowledge.title,
      summary: compactSummary(knowledge.extract),
      sourceLabel,
      sourceUrl: knowledge.pageUrl,
      distanceMeters: knowledge.distanceMeters,
    },
    guideOrigin: { mode: 'composed', label: 'Lokale kennislens · ervaring en bronverhaal blijven gescheiden' },
  };
};

export function applyPlaceKnowledgeLens(experiences: Experience[], snapshot?: LiveWorldSnapshot): Experience[] {
  if (!snapshot) return experiences;
  const available = (snapshot.placeKnowledge ?? []).filter((item) => item.distanceMeters <= maxLocalDistanceMeters);
  if (!available.length) return experiences;
  let cursor = 0;
  return experiences.map((experience) => {
    if (experience.placeKnowledge || experience.routePlan || !eligibleKinds.includes(experience.kind)) return experience;
    const knowledge = available[cursor % available.length];
    cursor += 1;
    return attachKnowledge(experience, knowledge);
  });
}

export function attachNearestPlaceKnowledge(experience: Experience, snapshot?: LiveWorldSnapshot): Experience {
  const knowledge = snapshot?.placeKnowledge?.find((item) => item.distanceMeters <= maxLocalDistanceMeters);
  return knowledge ? attachKnowledge(experience, knowledge) : experience;
}

