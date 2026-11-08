import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { referenceExperiences } from '../src/product/referenceExperiences.ts';

test('every reference chapter has a matching transcript and nonempty PCM WAV', () => {
  const directory = new URL('../assets/audio/', import.meta.url);
  const tracks = JSON.parse(fs.readFileSync(new URL('transcripts.json', directory), 'utf8'));
  for (const experience of referenceExperiences) for (const step of experience.steps) {
    const id = `${experience.id}-${step.editorial.id}`;
    const track = tracks.find(t => t.id === id);
    assert.equal(track?.text, `${step.insight.title}. ${step.insight.body}`);
    const bytes = fs.readFileSync(new URL(`${id}.wav`, directory));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
    let pcm;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = bytes.readUInt32LE(offset + 4);
      if (bytes.toString('ascii', offset, offset + 4) === 'data') pcm = bytes.subarray(offset + 8, offset + 8 + size);
      offset += 8 + size + size % 2;
    }
    assert.ok(pcm && pcm.length > 10000, `${id}: missing audio`);
    assert.ok(pcm.some(byte => byte !== 0), `${id}: silent audio`);
  }
});
