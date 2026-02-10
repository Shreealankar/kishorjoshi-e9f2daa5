import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

interface AuthContextType {
  user: AuthUser | null;
  login: (name: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('family_app_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('family_app_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.rpc('verify_member_login', {
        _name: name,
        _password: password,
      });

      if (error || !data || data.length === 0) return false;

      const member = data[0];
      const authUser: AuthUser = {
        id: member.member_id,
        name: member.member_name,
        role: member.member_role as 'admin' | 'member',
      };
      setUser(authUser);
      localStorage.setItem('family_app_user', JSON.stringify(authUser));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('family_app_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin', loading }}>
      {children}
    </AuthContext.Provider>
  );
};
