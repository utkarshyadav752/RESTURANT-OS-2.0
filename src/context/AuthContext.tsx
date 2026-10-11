import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Organization, Restaurant, Branch, RoleType, PermissionKey } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  restaurant: Restaurant | null;
  branches: Branch[];
  currentBranch: Branch | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  twoFactorPending: {
    userId: string;
    email: string;
    mobile: string;
  } | null;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ requires2FA?: boolean }>;
  verify2FA: (code: string) => Promise<void>;
  loginWithOTP: (phone: string, otp: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchBranch: (branchId: string) => void;
  hasPermission: (permission: PermissionKey) => boolean;
  canAccessBranch: (branchId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('restaurantos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [twoFactorPending, setTwoFactorPending] = useState<{ userId: string; email: string; mobile: string } | null>(null);

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const storedToken = localStorage.getItem('restaurantos_token');
        if (storedToken) {
          const res = await api.get('/auth/me');
          setUser(res.user);
          setOrganization(res.organization);
          setRestaurant(res.restaurant);
          setBranches(res.branches || []);
          
          const savedBranchId = localStorage.getItem('restaurantos_active_branch');
          const matchedBranch = res.branches?.find((b: Branch) => b.id === savedBranchId) || res.branches?.[0] || null;
          setCurrentBranch(matchedBranch);
        }
      } catch (err) {
        console.warn('Session init failed:', err);
        localStorage.removeItem('restaurantos_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (identifier: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, password, rememberMe });
      if (res.requires_2fa) {
        setTwoFactorPending({
          userId: res.user_id,
          email: res.email,
          mobile: res.mobile,
        });
        return { requires2FA: true };
      }

      setToken(res.token);
      localStorage.setItem('restaurantos_token', res.token);
      setUser(res.user);
      setOrganization(res.organization);
      setRestaurant(res.restaurant);
      setBranches(res.branches || []);
      const defaultBranch = res.branches?.[0] || null;
      setCurrentBranch(defaultBranch);
      if (defaultBranch) {
        localStorage.setItem('restaurantos_active_branch', defaultBranch.id);
      }
      setTwoFactorPending(null);
      return { requires2FA: false };
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (code: string) => {
    if (!twoFactorPending) throw new Error('No pending 2FA challenge');
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-2fa', {
        userId: twoFactorPending.userId,
        code,
      });
      setToken(res.token);
      localStorage.setItem('restaurantos_token', res.token);
      setUser(res.user);
      setOrganization(res.organization);
      setRestaurant(res.restaurant);
      setBranches(res.branches || []);
      const defaultBranch = res.branches?.[0] || null;
      setCurrentBranch(defaultBranch);
      if (defaultBranch) {
        localStorage.setItem('restaurantos_active_branch', defaultBranch.id);
      }
      setTwoFactorPending(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOTP = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp });
      setToken(res.token);
      localStorage.setItem('restaurantos_token', res.token);
      setUser(res.user);
      setOrganization(res.organization);
      setRestaurant(res.restaurant);
      setBranches(res.branches || []);
      const defaultBranch = res.branches?.[0] || null;
      setCurrentBranch(defaultBranch);
      if (defaultBranch) {
        localStorage.setItem('restaurantos_active_branch', defaultBranch.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      setToken(res.token);
      localStorage.setItem('restaurantos_token', res.token);
      setUser(res.user);
      setOrganization(res.organization);
      setRestaurant(res.restaurant);
      setBranches(res.branches || []);
      const defaultBranch = res.branches?.[0] || null;
      setCurrentBranch(defaultBranch);
      if (defaultBranch) {
        localStorage.setItem('restaurantos_active_branch', defaultBranch.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('restaurantos_token');
    localStorage.removeItem('restaurantos_active_branch');
    setToken(null);
    setUser(null);
    setOrganization(null);
    setRestaurant(null);
    setBranches([]);
    setCurrentBranch(null);
    setTwoFactorPending(null);
  };

  const switchBranch = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch && canAccessBranch(branchId)) {
      setCurrentBranch(branch);
      localStorage.setItem('restaurantos_active_branch', branch.id);
    }
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(permission);
  };

  const canAccessBranch = (branchId: string): boolean => {
    if (!user) return false;
    if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN') return true;
    if (user.assigned_branch_ids.includes('all')) return true;
    return user.assigned_branch_ids.includes(branchId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        restaurant,
        branches,
        currentBranch,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        twoFactorPending,
        login,
        verify2FA,
        loginWithOTP,
        register,
        logout,
        switchBranch,
        hasPermission,
        canAccessBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
