# Live Source Contract

Status: Directional, approved for first implementation  
Version: 1.0

## Normalized signal

Every live signal records:

- source identifier and display name;
- source URL and attribution;
- observation time and retrieval time;
- expiry and freshness state;
- geographic precision and sensitivity;
- validation status and uncertainty;
- license or usage note where required;
- raw-to-normalized transformation version.

## Initial adapters

### Weather and light

The first adapter requests temperature, wind, visibility, weather code, sunrise, and sunset for the selected prototype region. Forecast data is described as forecast or modeled conditions, not direct measurement at the user's exact position.

### Bird observations

The eBird adapter is optional and requires a configured token. It requests recent nearby public observations. A record can influence Wonder but produces a route destination only when it has a public, non-private location and passes the Nature Guard.

## Source states

`live`, `stale`, `unavailable`, `not configured`, and `error` are distinct. The interface exposes them plainly. A missing source never silently becomes scenario data.

At presentation time, every claim is checked against its recorded expiry. Expired evidence may remain visible only as clearly historical provenance in a deeper view; it is excluded from current promises and preparation. If no current source remains, Momentum falls back to a named editorial or global evergreen basis rather than implying equal live coverage everywhere.

## Expansion registry

Tides, seasonal nature, events, markets, cultural programs, opening hours, crowds, and closures are registered as future adapters with owner, geographic scope, freshness need, license, and failure behavior before implementation.
