import { create } from 'zustand';
import { UserCredits } from '@/types/credit';

type CreditsStore = {
  credits: UserCredits | null;
  setCredits: (credits: UserCredits) => void;
  decrementCredit: () => void;
};

export const useCreditsStore = create<CreditsStore>()((set, get) => ({
  credits: null,
  setCredits: (credits) => set({ credits }),
  decrementCredit: () => {
    const current = get().credits;
    if (current && current.remaining > 0) {
      set({ credits: { ...current, remaining: current.remaining - 1 } });
    }
  },
}));
