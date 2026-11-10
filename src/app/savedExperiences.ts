import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import type { Experience } from '../product/experienceModel';
import { parseSaved, savedExperiencesKey, serializeSaved, toggleSaved, type SavedExperience } from '../product/savedExperiences';

// Mounted once by the existing AppProvider; no second app/session store.
export function useSavedExperiences() {
  const [savedExperiences, setItems] = useState<SavedExperience[]>([]);
  const [savedHydrated, setHydrated] = useState(false);
  const [savedError, setError] = useState('');
  const readable = useRef(false);
  const current = useRef<SavedExperience[]>([]);
  const writes = useRef(Promise.resolve());
  const revision = useRef(0);
  useEffect(() => {
    AsyncStorage.getItem(savedExperiencesKey).then(raw => {
      current.current = parseSaved(raw); setItems(current.current); readable.current = true;
    }).catch(() => setError('Je bewaarde ideeën konden niet worden geladen. De opgeslagen gegevens blijven intact. Heropen de app om opnieuw te proberen.'))
      .finally(() => setHydrated(true));
  }, []);
  const persist = (items: SavedExperience[]) => {
    const version = ++revision.current;
    const serialized = serializeSaved(items);
    writes.current = writes.current.then(() => AsyncStorage.setItem(savedExperiencesKey, serialized))
      .then(() => { if (version === revision.current) setError(''); })
      .catch(() => { if (version === revision.current) setError('Deze wijziging is nog niet opgeslagen. Probeer opnieuw voordat je de app sluit.'); });
  };
  return {
    savedExperiences, savedHydrated, savedError,
    canSave: savedHydrated && readable.current,
    toggleSavedExperience: (experience: Experience) => {
      if (!readable.current) return;
      current.current = toggleSaved(current.current, experience);
      setItems(current.current); persist(current.current);
    },
    retrySaved: () => { if (readable.current) persist(current.current); },
  };
}
