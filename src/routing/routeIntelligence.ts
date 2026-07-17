import { RoutePlan } from '../product/experienceModel';

declare const process: { env: { EXPO_PUBLIC_MOMENTUM_ROUTING_URL?: string } };

export type RouteCheck = {
  state: 'fallback' | 'verified' | 'over-budget' | 'error';
  providerLabel: string;
  detail: string;
  distanceMeters?: number;
  durationMinutes?: number;
  checkedAt: string;
};

type RouteProviderResponse = {
  provider?: string;
  distanceMeters?: number;
  durationMinutes?: number;
};

const endpoint = () => process.env.EXPO_PUBLIC_MOMENTUM_ROUTING_URL?.trim();

export function routingCapability(): NonNullable<RoutePlan['routeCapability']> {
  return endpoint()
    ? { state: 'configured', providerLabel: 'Momentum Routing Service', detail: 'De route wordt vlak voor vertrek via de ingestelde applicatieservice gecontroleerd.' }
    : { state: 'fallback', providerLabel: 'Apple Maps handoff', detail: 'Momentum bewaakt het tijdsbudget conservatief; Kaarten bepaalt bij vertrek de echte route en reistijd.' };
}

export async function verifyRouteBeforeHandoff(plan: RoutePlan): Promise<RouteCheck> {
  const checkedAt = new Date().toISOString();
  const routingUrl = endpoint();
  if (!routingUrl || !plan.source || !plan.destination) {
    return { state: 'fallback', providerLabel: 'Apple Maps', detail: 'Kaarten bepaalt nu de werkelijke route en reistijd.', checkedAt };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(routingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ source: plan.source, destination: plan.destination, mode: plan.mode }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as RouteProviderResponse;
    if (!Number.isFinite(data.distanceMeters) || !Number.isFinite(data.durationMinutes) || data.distanceMeters! <= 0 || data.durationMinutes! <= 0 || data.durationMinutes! > 24 * 60) throw new Error('Ongeldige routerespons');
    const durationMinutes = Math.ceil(data.durationMinutes!);
    const tolerance = Math.max(5, Math.ceil(plan.outboundMinutes * 0.25));
    if (durationMinutes > plan.outboundMinutes + tolerance) {
      return {
        state: 'over-budget', providerLabel: data.provider?.trim() || 'Momentum Routing Service', distanceMeters: Math.round(data.distanceMeters!), durationMinutes,
        detail: `De actuele heenroute duurt ongeveer ${durationMinutes} minuten en past niet meer betrouwbaar binnen de beschermde tijd.`, checkedAt,
      };
    }
    return {
      state: 'verified', providerLabel: data.provider?.trim() || 'Momentum Routing Service', distanceMeters: Math.round(data.distanceMeters!), durationMinutes,
      detail: `Route gecontroleerd: ongeveer ${durationMinutes} minuten tot het beginpunt.`, checkedAt,
    };
  } catch {
    return { state: 'error', providerLabel: 'Momentum Routing Service', detail: 'De extra routecontrole is niet bereikbaar. Kaarten controleert de route bij het openen.', checkedAt };
  } finally {
    clearTimeout(timeout);
  }
}
