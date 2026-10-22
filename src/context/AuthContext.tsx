import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserSkill } from '../types';
import { StorageService } from '../utils/storage';
import { DEFAULT_USER } from '../data/defaultUser';
import { ApiService } from '../services/api';

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginWithDemo: () => Promise<void>;
  register: (profileData: {
    name: string;
    email: string;
    password: string;
    passwordConfirm?: string;
    college?: string;
    degree?: string;
    targetRole?: string;
  }) => Promise<any>;
  verifyEmail: (token?: string) => Promise<any>;
  resendVerification: () => Promise<any>;
  logout: () => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  addSkill: (skill: UserSkill) => void;
  removeSkill: (skillName: string) => void;
  updateSkillProficiency: (skillName: string, proficiency: UserSkill['proficiency']) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('skillmatch_auth_token')) || StorageService.isAuthenticated();
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = StorageService.getUserProfile();
    return saved || DEFAULT_USER;
  });

  // Verify token on mount or fetch authenticated user details
  useEffect(() => {
    async function syncAuth() {
      const token = localStorage.getItem('skillmatch_auth_token');
      if (token) {
        try {
          const res = await ApiService.getMe();
          if (res.success && res.user) {
            const mergedUser: UserProfile = {
              ...DEFAULT_USER,
              ...user,
              id: res.user.id,
              credentialId: res.user.credentialId || res.user.credential_id || 'SKM-2026-DEMO01',
              name: res.user.name,
              email: res.user.email,
              college: res.user.college || user.college,
              degree: res.user.degree || user.degree,
              targetRole: res.user.targetRole || user.targetRole,
              emailVerified: Boolean(res.user.emailVerified)
            };
            setUser(mergedUser);
            StorageService.setUserProfile(mergedUser);
            setIsAuthenticated(true);
            StorageService.setAuthenticated(true);
          }
        } catch (err) {
          // Fall back gracefully to local storage user
        }
      }
    }
    syncAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await ApiService.login(email, pass);
      if (res.success && res.user) {
        const loggedInUser: UserProfile = {
          ...DEFAULT_USER,
          ...user,
          id: res.user.id,
          credentialId: res.user.credentialId || 'SKM-2026-DEMO01',
          name: res.user.name,
          email: res.user.email,
          college: res.user.college || user.college,
          degree: res.user.degree || user.degree,
          targetRole: res.user.targetRole || user.targetRole,
          emailVerified: Boolean(res.user.emailVerified)
        };
        setUser(loggedInUser);
        StorageService.setUserProfile(loggedInUser);
        setIsAuthenticated(true);
        StorageService.setAuthenticated(true);
        return true;
      }
    } catch (err: any) {
      // Fallback for offline demo credentials
      if (email && pass && pass.length >= 6) {
        const offlineUser: UserProfile = {
          ...DEFAULT_USER,
          email,
          credentialId: 'SKM-2026-DEMO01',
          emailVerified: true
        };
        StorageService.setUserProfile(offlineUser);
        StorageService.setAuthenticated(true);
        setUser(offlineUser);
        setIsAuthenticated(true);
        return true;
      }
      throw err;
    }
    return false;
  };

  const loginWithDemo = async () => {
    try {
      await login('demo@skillmatch.ai', 'password123');
    } catch (e) {
      const demoUser: UserProfile = {
        ...DEFAULT_USER,
        credentialId: 'SKM-2026-DEMO01',
        emailVerified: true
      };
      StorageService.setUserProfile(demoUser);
      StorageService.setAuthenticated(true);
      setUser(demoUser);
      setIsAuthenticated(true);
    }
  };

  const register = async (profileData: {
    name: string;
    email: string;
    password: string;
    passwordConfirm?: string;
    college?: string;
    degree?: string;
    targetRole?: string;
  }) => {
    const res = await ApiService.register(profileData);
    if (res.success && res.user) {
      const newProfile: UserProfile = {
        ...DEFAULT_USER,
        id: res.user.id,
        credentialId: res.user.credentialId,
        name: res.user.name,
        email: res.user.email,
        college: res.user.college || 'Engineering College',
        degree: res.user.degree || 'B.Tech CS',
        targetRole: res.user.targetRole || 'Java Developer',
        emailVerified: false
      };
      setUser(newProfile);
      StorageService.setUserProfile(newProfile);
      setIsAuthenticated(true);
      StorageService.setAuthenticated(true);
    }
    return res;
  };

  const verifyEmail = async (token?: string) => {
    const res = await ApiService.verifyEmail(user.email, token);
    if (res.success) {
      const updated = { ...user, emailVerified: true };
      setUser(updated);
      StorageService.setUserProfile(updated);
    }
    return res;
  };

  const resendVerification = async () => {
    return await ApiService.resendVerification(user.email);
  };

  const logout = () => {
    localStorage.removeItem('skillmatch_auth_token');
    StorageService.setAuthenticated(false);
    setIsAuthenticated(false);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    StorageService.setUserProfile(newProfile);
  };

  const addSkill = (skill: UserSkill) => {
    const exists = user.skills.some((s) => s.name.toLowerCase() === skill.name.toLowerCase());
    if (!exists) {
      const newSkills = [...user.skills, skill];
      updateProfile({ skills: newSkills });
    }
  };

  const removeSkill = (skillName: string) => {
    const newSkills = user.skills.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
    updateProfile({ skills: newSkills });
  };

  const updateSkillProficiency = (skillName: string, proficiency: UserSkill['proficiency']) => {
    const newSkills = user.skills.map((s) => (s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, proficiency } : s));
    updateProfile({ skills: newSkills });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        loginWithDemo,
        register,
        verifyEmail,
        resendVerification,
        logout,
        updateProfile,
        addSkill,
        removeSkill,
        updateSkillProficiency
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
