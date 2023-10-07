export interface TimeEntry {
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime?: string;
  duration?: string;
  adjustedHours?: number;
}

export interface CurrentBreak {
  breakId: number;
  startTime: string;
}

export interface BreakTaken {
  breakId: number;
  startTime: string;
  endTime?: string;
}

export interface Employee {
  id: number;
  name: string;
  key: string;
  clockedIn: boolean;
  timeEntries: TimeEntry[];
  breaksTaken?: BreakTaken[];
  currentBreak?: CurrentBreak;
  
}
