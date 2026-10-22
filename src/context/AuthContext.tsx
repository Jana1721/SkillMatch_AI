import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserSkill } from '../types';
import { StorageService } from '../utils/storage';
import { DEFAULT_USER } from '../data/defaultUser';
import { ApiService } from '../services/api';

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (identifier: string, pass: string) => Promise<any>;
  loginWithDemo: () => Promise<void>;
  loginWithAdmin: () => Promise<void>;
  register: (profileData: {
    name: string;
    email: string;
    rollNumber: string;
    phone?: string;
    department?: string;
    password: string;
    confirmPassword?: string;
    college?: string;
    degree?: string;
    targetRole?: string;
    yearOfStudy?: string;
  }) => Promise<any>;
  verifyEmail: (code: string, identifier?: string) => Promise<any>;
  resendVerification: (identifier?: string) => Promise<any>;
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

  const isAdmin = user?.role === 'admin';

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
              rollNumber: res.user.rollNumber || res.user.roll_number,
              name: res.user.name,
              email: res.user.email,
              phone: res.user.phone || user.phone,
              department: res.user.department || user.department,
              college: res.user.college || user.college,
              degree: res.user.degree || user.degree,
              targetRole: res.user.targetRole || user.targetRole,
              role: res.user.role || 'student',
              emailVerified: Boolean(res.user.emailVerified)
            };
            setUser(mergedUser);
            StorageService.setUserProfile(mergedUser);
            setIsAuthenticated(true);
            StorageService.setAuthenticated(true);
          }
        } catch (err) {
          // Token expired or invalid
        }
      }
    }
    syncAuth();
  }, []);

  const login = async (identifier: string, pass: string): Promise<any> => {
    try {
      const res = await ApiService.login(identifier, pass);
      if (res.success && res.user) {
        const loggedInUser: UserProfile = {
          ...DEFAULT_USER,
          ...user,
          id: res.user.id,
          credentialId: res.user.credentialId || res.user.credential_id || 'SKM-2026-DEMO01',
          rollNumber: res.user.rollNumber || res.user.roll_number,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone || user.phone,
          department: res.user.department || user.department,
          college: res.user.college || user.college,
          degree: res.user.degree || user.degree,
          targetRole: res.user.targetRole || user.targetRole,
          role: res.user.role || 'student',
          emailVerified: Boolean(res.user.emailVerified)
        };
        setUser(loggedInUser);
        StorageService.setUserProfile(loggedInUser);
        setIsAuthenticated(true);
        StorageService.setAuthenticated(true);
        return loggedInUser;
      }
    } catch (err: any) {
      throw err;
    }
    return false;
  };

  const loginWithDemo = async () => {
    await login('demo@skillmatch.ai', 'password123');
  };

  const loginWithAdmin = async () => {
    await login('admin@skillmatch.ai', 'Admin@2026!');
  };

  const register = async (profileData: {
    name: string;
    email: string;
    rollNumber: string;
    phone?: string;
    department?: string;
    password: string;
    confirmPassword?: string;
    college?: string;
    degree?: string;
    targetRole?: string;
    yearOfStudy?: string;
  }) => {
    const res = await ApiService.register(profileData);
    if (res.success && res.user) {
      const newProfile: UserProfile = {
        ...DEFAULT_USER,
        id: res.user.id,
        credentialId: res.user.credentialId || res.loginId,
        rollNumber: res.user.rollNumber,
        name: res.user.name,
        email: res.user.email,
        phone: res.user.phone || '',
        department: res.user.department || 'Computer Science & Engineering',
        college: res.user.college || 'Engineering College',
        degree: res.user.degree || 'B.Tech CS',
        targetRole: res.user.targetRole || 'Software Engineer',
        role: 'student',
        emailVerified: false
      };
      setUser(newProfile);
      StorageService.setUserProfile(newProfile);
      setIsAuthenticated(true);
      StorageService.setAuthenticated(true);
    }
    return res;
  };

  const verifyEmail = async (code: string, identifier?: string) => {
    const target = identifier || user.credentialId || user.email;
    const res = await ApiService.verifyEmail(code, target);
    if (res.success) {
      const updated: UserProfile = { ...user, emailVerified: true };
      setUser(updated);
      StorageService.setUserProfile(updated);
    }
    return res;
  };

  const resendVerification = async (identifier?: string) => {
    const target = identifier || user.credentialId || user.email;
    return await ApiService.resendVerification(target);
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
    const exists = user.skills?.some((s) => s.name.toLowerCase() === skill.name.toLowerCase());
    if (!exists) {
      const newSkills = [...(user.skills || []), skill];
      updateProfile({ skills: newSkills });
    }
  };

  const removeSkill = (skillName: string) => {
    const newSkills = (user.skills || []).filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
    updateProfile({ skills: newSkills });
  };

  const updateSkillProficiency = (skillName: string, proficiency: UserSkill['proficiency']) => {
    const newSkills = (user.skills || []).map((s) => {
      if (s.name.toLowerCase() === skillName.toLowerCase()) {
        return { ...s, proficiency };
      }
      return s;
    });
    updateProfile({ skills: newSkills });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        login,
        loginWithDemo,
        loginWithAdmin,
        register,
        verifyEmail,
        resendVerification,
        logout,
        updateProfile,
        addSkill,
        removeSkill,
        updateSkillProficiency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
