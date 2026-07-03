import { create } from 'zustand';

export const useUploadStore = create((set) => ({
  uploads: [],
  currentUpload: null,
  isLoading: false,
  
  setUploads: (uploads) => set({ uploads }),
  setCurrentUpload: (upload) => set({ currentUpload: upload }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  addUpload: (upload) => set((state) => ({ uploads: [...state.uploads, upload] })),
  removeUpload: (id) => set((state) => ({ uploads: state.uploads.filter((u) => u.id !== id) })),
}));

export default useUploadStore;
