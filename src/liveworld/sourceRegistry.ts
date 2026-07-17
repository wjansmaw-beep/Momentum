export type LivingWorldSourceContract = {
  id: string;
  label: string;
  role: 'conditions' | 'observation' | 'place-lead' | 'place-knowledge' | 'future';
  coverage: 'global' | 'regional' | 'configured';
  status: 'active' | 'optional' | 'planned';
  maySelectDestination: boolean;
  mayProveCurrentAccess: boolean;
  attributionRequired: boolean;
};

export const livingWorldSourceRegistry: LivingWorldSourceContract[] = [
  { id: 'open-meteo', label: 'Open-Meteo weer, licht en zicht', role: 'conditions', coverage: 'global', status: 'active', maySelectDestination: false, mayProveCurrentAccess: false, attributionRequired: true },
  { id: 'open-meteo-air', label: 'Open-Meteo luchtkwaliteit', role: 'conditions', coverage: 'regional', status: 'active', maySelectDestination: false, mayProveCurrentAccess: false, attributionRequired: true },
  { id: 'open-meteo-marine', label: 'Open-Meteo marien model', role: 'conditions', coverage: 'regional', status: 'active', maySelectDestination: false, mayProveCurrentAccess: false, attributionRequired: true },
  { id: 'ebird', label: 'eBird recente openbare waarnemingen', role: 'observation', coverage: 'configured', status: 'optional', maySelectDestination: true, mayProveCurrentAccess: false, attributionRequired: true },
  { id: 'openstreetmap-places', label: 'OpenStreetMap openbare plaatsleads', role: 'place-lead', coverage: 'global', status: 'active', maySelectDestination: true, mayProveCurrentAccess: false, attributionRequired: true },
  { id: 'wikipedia-place', label: 'Wikipedia plaatskennis', role: 'place-knowledge', coverage: 'global', status: 'active', maySelectDestination: false, mayProveCurrentAccess: false, attributionRequired: true },
];

