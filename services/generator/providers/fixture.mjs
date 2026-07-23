// Fixture provider (ADR-056): promotes the existing local fixture to a full
// provider behind the shared interface. Behavior is identical to Generator
// Service v1 (ADR-037); the content library itself stays in ../fixture.mjs.
// This provider needs no API key and remains the default development path.

import { createFixtureDrafts } from '../fixture.mjs';

export function createFixtureProvider() {
  return {
    name: 'momentum-fixture',
    kind: 'fixture',
    isConfigured: () => true,
    async generate(request) {
      // ADR-059: serve the requested candidate set (default stays one draft,
      // identical to Generator Service v1 behavior).
      return { drafts: createFixtureDrafts(request) };
    },
    modelName: () => undefined,
    healthLabel: () => 'local fixture provider (no external model)',
  };
}
