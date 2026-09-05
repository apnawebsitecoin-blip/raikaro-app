import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  walletBalance: number;
  refreshBalance: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  walletBalance: 0,
  refreshBalance: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);

  const refreshBalance = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', session.user.id)
      .single();
    if (data) setWalletBalance(data.wallet_balance ?? 0);
  }, [session?.user.id]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <ProfileContext.Provider value={{ walletBalance, refreshBalance }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
