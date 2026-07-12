# Local Decision Prototype

Status: Directional, approved for prototype  
Version: 1.0

## Purpose

The local engine makes the Understanding model visible before real platform integrations exist. It is a testable approximation, not a claim that Momentum already understands a person's life.

## Inputs

- chosen prototype day part;
- available minutes including return buffer;
- chosen company;
- editable profile orientation;
- explicitly available equipment;
- optional present-tense words from Discover.

All inputs are local, visible, and correctable.

## Pipeline

> Context -> hard feasibility -> intent match -> time fit -> company fit -> profile affinity -> friction -> ranking -> one proposal or abstention

Hard filters remove experiences that exceed the available window, require unavailable equipment, or conflict with known company needs. Scoring never restores a filtered candidate.

## Shared surfaces

- **Now** ranks for one selected Human Moment.
- **Today** ranks independently for meaningful day windows, then prevents repetitive forms.
- **Discover** adds explicit words and time to the same candidate process.

## Explanation receipt

Each result returns a small set of reasons classified as:

- **Chosen:** explicitly set by the person in the prototype;
- **Calculated:** derived from duration, preparation, or comparative fit;
- **Unknown:** unavailable live context that the engine did not use.

## Abstention

If nothing meets hard feasibility, the engine returns no proposal. The interface may ask one useful question, offer a bounded low-context fallback, or remain quiet. It may not relax safety or fabricate availability merely to fill the surface.

## Future replacement

Real calendar, location, weather, health, and Living World signals can later enter the same typed contract with source, freshness, sensitivity, and permission metadata. They do not change the authority order: explicit present intent remains primary.

