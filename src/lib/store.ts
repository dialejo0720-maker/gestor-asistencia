import { create } from 'zustand';
import { Employee, Timesheet } from './types';

interface AppState {
  currentEmployee: Employee | null;
  todayTimesheet: Timesheet | null;
  setCurrentEmployee: (emp: Employee | null) => void;
  setTodayTimesheet: (ts: Timesheet | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentEmployee: null,
  todayTimesheet: null,
  setCurrentEmployee: (emp) => set({ currentEmployee: emp }),
  setTodayTimesheet: (ts) => set({ todayTimesheet: ts }),
}));
