import type { CapsuleStep } from '../product/experienceModel';

// A finite data contract, never executable model-authored UI. Legacy steps
// use exactly the same renderer; editorial metadata is optional.
export type ExperienceBlock =
  | { kind: 'story'; title: string; text: string }
  | { kind: 'observation'; text: string }
  | { kind: 'depth'; text: string }
  | { kind: 'evidence'; label: string; url?: string; provenance: string; reviewedAt?: string };

export function renderableBlocks(step: CapsuleStep, showInsight: boolean): ExperienceBlock[] {
  // Editorial stories are the core content, not an optional contextual insight.
  const insight = showInsight || step.editorial?.composition === 'editorial-place' ? step.insight : undefined;
  const blocks: ExperienceBlock[] = [];
  if (insight) blocks.push({ kind: 'story', title: insight.title, text: insight.body });
  if (showInsight && step.editorial?.depth) blocks.push({ kind: 'depth', text: step.editorial.depth });
  if (insight) blocks.push({ kind: 'evidence', label: insight.sourceLabel,
    url: insight.sourceUrl && /^https:\/\//i.test(insight.sourceUrl) ? insight.sourceUrl : undefined,
    provenance: insight.sourceKind === 'live' ? 'Actuele bron' : insight.sourceKind === 'generated' ? 'Samengestelde uitleg' : 'Redactionele context',
    reviewedAt: step.editorial?.reviewedAt });
  blocks.push({ kind: 'observation', text: step.editorial?.observation || step.instruction });
  return blocks;
}
