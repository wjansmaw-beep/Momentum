import { catalogValidationRegions, createWorldContext, resolveContentCatalog } from '../src/content/contentCatalog';

const expect = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

export function runContentCatalogScenarioChecks() {
  const date = new Date('2026-07-13T12:00:00Z');
  const unconfirmedDokkum = resolveContentCatalog(createWorldContext(catalogValidationRegions.dokkum, date));
  const dokkum = resolveContentCatalog(createWorldContext(catalogValidationRegions.dokkum, date, 'nl', true));
  const newYork = resolveContentCatalog(createWorldContext(catalogValidationRegions.newYork, date, 'nl', true));
  const tokyo = resolveContentCatalog(createWorldContext(catalogValidationRegions.tokyo, date, 'nl', true));

  expect(unconfirmedDokkum.mostSpecificScope === 'global', 'A validation location must not unlock local content.');
  expect(dokkum.mostSpecificScope === 'local', 'Dokkum should include the local coast pack.');
  expect(dokkum.experiences.some((item) => item.id === 'wadden-light'), 'Dokkum should contain Wadden Light Walk.');
  expect(newYork.mostSpecificScope === 'global', 'New York should safely fall back to global content.');
  expect(tokyo.mostSpecificScope === 'global', 'Tokyo should safely fall back to global content.');
  expect(!newYork.experiences.some((item) => item.id === 'wadden-light'), 'New York must not receive local Wadden content.');
  expect(!tokyo.experiences.some((item) => item.id === 'wadden-light'), 'Tokyo must not receive local Wadden content.');
  expect(newYork.experiences.some((item) => item.id === 'one-song-listening'), 'The global catalog should remain varied.');
  expect(tokyo.experiences.length > 0, 'Unknown regions must never have an empty evergreen catalog.');

  return {
    dokkum: { scope: dokkum.mostSpecificScope, experiences: dokkum.experiences.length },
    newYork: { scope: newYork.mostSpecificScope, experiences: newYork.experiences.length },
    tokyo: { scope: tokyo.mostSpecificScope, experiences: tokyo.experiences.length },
  };
}
