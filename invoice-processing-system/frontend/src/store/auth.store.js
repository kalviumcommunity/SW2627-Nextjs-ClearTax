import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  login: (email) => {
    const name = email.split('@')[0];
    const user = { email, name };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  signup: (email, name) => {
    const user = { email, name };
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
  initialize: () => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          set({ user: JSON.parse(savedUser) });
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
    }
  }
}));

