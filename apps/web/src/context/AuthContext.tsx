'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  role: 'STUDENT' | 'COMPANY' | 'ADMIN';
  personalEmail: string;
  displayEmail: string;
  createdAt: string;
  studentProfile?: any;
  companyProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('internme_token');
    if (storedToken) {
      setToken(storedToken);
      api.get<User>('/api/auth/me')
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('internme_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  async function login(personalEmail: string, password: string) {
    const data = await api.post<{ token: string; user: User }>('/api/auth/login', {
      personalEmail,
      password,
    });
    localStorage.setItem('internme_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload: any) {
    const data = await api.post<{ token: string; user: User }>('/api/auth/register', payload);
    localStorage.setItem('internme_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('internme_token');
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    const updated = await api.get<User>('/api/auth/me');
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
