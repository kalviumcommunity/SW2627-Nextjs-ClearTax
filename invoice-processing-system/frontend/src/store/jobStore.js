import { create } from 'zustand';

export const useJobStore = create((set) => ({
  jobs: [],
  currentJob: null,
  isLoading: false,
  
  setJobs: (jobs) => set({ jobs }),
  setCurrentJob: (job) => set({ currentJob: job }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (id, job) => set((state) => ({
    jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...job } : j)),
  })),
  removeJob: (id) => set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) })),
}));

export default useJobStore;
