import { byId, experiences } from '../src/product/experienceModel';
import { defaultPrototypeContext, rankForMoment } from '../src/product/localIntelligence';
import { applyReflection, defaultPersonalProfile, directionTerms, forgetReflection, hydratePersonalProfile } from '../src/profile/personalModel';

const expect = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

export function runPersonalMemoryScenarioChecks() {
  const migrated = hydratePersonalProfile({ version: 1, aspiration: 'Meer koken met aandacht', preferredKinds: [], equipment: {}, kindAffinity: {} });
  expect(migrated.version === 2, 'A legacy profile should migrate to version 2.');
  expect(migrated.directions.near.includes('Meer koken met aandacht'), 'A legacy aspiration should remain visible as a near direction.');

  const experience = byId('pantry-dinner');
  const learned = applyReflection(defaultPersonalProfile(), experience, {
    outcome: 'neutral', aspects: ['less-guidance', 'too-long', 'content-not-useful'], note: 'De kookuitleg mocht korter.',
  });
  expect(learned.guidanceBalance < 0, 'Less guidance should change the guidance preference.');
  expect(learned.durationBiasMinutes < 0, 'Too long should favor shorter future experiences.');
  expect(learned.mutedInsightTopics.includes('food'), 'A rejected food insight should mute that insight topic.');
  expect(learned.reflectionMemories.length === 1, 'The explicit correction should remain visible in reflection memory.');
  const forgotten = forgetReflection(learned, learned.reflectionMemories[0].id);
  expect(forgotten.reflectionMemories.length === 0, 'A reflection should be individually forgettable.');
  expect(forgotten.guidanceBalance === 0 && forgotten.durationBiasMinutes === 0, 'Forgetting should recalculate learned preferences.');
  expect(!forgotten.mutedInsightTopics.includes('food'), 'Forgetting the only topic correction should restore that topic.');

  const directed = { ...defaultPersonalProfile(), directions: { near: ['vaker koken'], growth: [], meaning: [] } };
  const decision = rankForMoment(
    { ...defaultPrototypeContext(), dayPart: 'evening', availableMinutes: 45 }, '', [], experiences,
    { kindAffinity: directed.kindAffinity, blockedExperienceIds: [], favoriteExperienceIds: [], recentExperienceIds: [], directionTerms: directionTerms(directed), durationBiasMinutes: 0, intensityBalance: 0, maxTravelMinutes: 20, travelBiasMinutes: 0 },
  );
  expect(Boolean(decision.selected), 'Direction-aware ranking should still produce an experience.');
  expect(decision.selected?.reasons.some((reason) => reason.text.includes('richting')) ?? false, 'A matching self-chosen direction should be explained.');

  return { migratedVersion: migrated.version, learnedSignals: learned.reflectionMemories.length, selected: decision.selected?.experience.id };
}
