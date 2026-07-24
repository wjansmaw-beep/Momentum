import { LinkingOptions } from '@react-navigation/native';
import { readInviteFromCurrentUrl } from '../../sharing/sharedCapsule';
import { RootStackParamList } from './types';

// Deep links (ADR-058): de bestaande uitnodigings-URL (?momentumInvite=…) wordt
// voortaan via de linking-config van de navigator gelezen. Gedrag ongewijzigd:
// - geldige/verlopen uitnodiging → het uitnodigingsscherm is het eerste scherm;
// - ongeldige uitnodiging → het veiligheidsscherm is het eerste scherm;
// - geen uitnodiging → undefined, zodat initialRouteName (Nu / Onboarding)
//   bepaalt waar de app opent — zoals de vroegere conditionele render.
// De URL zelf wordt bewust NIET herschreven bij navigatie (getPathFromState
// geeft de huidige locatie terug), zodat de web-preview er exact hetzelfde
// uitziet als voor deze migratie. Het opschonen van de invite-parameter gebeurt
// — zoals voorheen — pas bij accepteren of afwijzen (clearInviteFromCurrentUrl).
const config = {
  screens: {
    Now: '',
    Today: 'today',
    Guide: 'guide',
    LifeBook: 'lifebook',
    Profile: 'profile',
    Discover: 'discover',
    Onboarding: 'welcome',
    IncomingInvite: 'invite',
    InvalidInvite: 'invite-invalid',
    Prepare: 'prepare',
    Presence: 'presence',
    Remember: 'remember',
  },
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['momentum://'],
  config,
  getStateFromPath: (path) => {
    // Eén bron van waarheid voor de invite-parameter: readInviteFromCurrentUrl
    // dekt de web-locatie; de path-query dekt een eventuele scheme-link.
    const inviteRead = readInviteFromCurrentUrl();
    let state = inviteRead.state;
    if (state === 'none' && path.includes('momentumInvite=')) {
      const query = path.split('?')[1] ?? '';
      const value = new URLSearchParams(query).get('momentumInvite');
      if (value) state = 'valid'; // inhoudelijke validatie blijft bij de store; hier alleen routeren
    }
    if (state === 'valid' || state === 'expired') {
      return { routes: [{ name: 'IncomingInvite' }] };
    }
    if (state === 'invalid') {
      return { routes: [{ name: 'InvalidInvite' }] };
    }
    return undefined;
  },
  getPathFromState: () => {
    // Laat de browser-URL ongemoeid: de web-preview kent geen routes in de
    // adresbalk en dat blijft zo.
    if (typeof window !== 'undefined') return window.location.pathname + window.location.search;
    return '';
  },
};
