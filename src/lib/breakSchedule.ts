type BreakType = 'paid' | 'unpaid';

export interface ScheduleBreak {
  id: number;
  duration: number;
  type: BreakType;
}

interface Schedule {
  minHours: number;
  maxHours: number;
  breaks: ScheduleBreak[];
}

const breakSchedule: Schedule[] = [
  {
    minHours: 2,
    maxHours: 4,
    breaks: [
      { id: 1, duration: 10, type: 'paid' }
    ]
  },
  {
    minHours: 4,
    maxHours: 6,
    breaks: [
      { id: 1, duration: 10, type: 'paid' },
      { id: 2, duration: 30, type: 'unpaid' }
    ]
  },
  {
    minHours: 6,
    maxHours: 10,
    breaks: [
      { id: 1, duration: 10, type: 'paid' },
      { id: 2, duration: 30, type: 'unpaid' },
      { id: 3, duration: 10, type: 'paid' }
    ]
  },
  {
    minHours: 10,
    maxHours: 12,
    breaks: [
      { id: 1, duration: 10, type: 'paid' },
      { id: 2, duration: 30, type: 'unpaid' },
      { id: 3, duration: 10, type: 'paid' },
      { id: 4, duration: 10, type: 'paid' }
    ]
  },
  {
    minHours: 12,
    maxHours: 14,
    breaks: [
      { id: 1, duration: 10, type: 'paid' },
      { id: 2, duration: 30, type: 'unpaid' },
      { id: 3, duration: 10, type: 'paid' },
      { id: 4, duration: 10, type: 'paid' },
      { id: 5, duration: 30, type: 'unpaid' }
    ]
  },
  {
    minHours: 14,
    maxHours: 24,
    breaks: [
      { id: 1, duration: 10, type: 'paid' },
      { id: 2, duration: 30, type: 'unpaid' },
      { id: 3, duration: 10, type: 'paid' },
      { id: 4, duration: 10, type: 'paid' },
      { id: 5, duration: 30, type: 'unpaid' },
      { id: 6, duration: 10, type: 'paid' }
    ]
  }
];

export default breakSchedule;