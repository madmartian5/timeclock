import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { Employee } from '../types/employee.model';

// Use the plugins
dayjs.extend(utc);
dayjs.extend(timezone);


export function calculateTimeDifference(startTime: string, endTime: string | Date) {
  // Convert start time to NZ timezone
  const nzStartTime = dayjs(startTime).tz("Pacific/Auckland");

  // Convert end time to NZ timezone
  const nzEndTime = dayjs(endTime).tz("Pacific/Auckland");

  // Calculate the difference in minutes
  const totalMinutes = nzEndTime.diff(nzStartTime, 'minute');
  console.log(totalMinutes);

  // Return the difference in hours and minutes
  return { hours: Math.floor(totalMinutes / 60), minutes: Math.round(totalMinutes % 60) };
};

/**
   * Calculates the total clocked-in time for a given employee.
   * Iterates through all time entries of the employee, calculates the time difference for each entry,
   * and accumulates the total hours and minutes. Converts sets of 60 minutes into hours.
   * 
   * @param employee - The employee object for whom the total clocked-in time is to be calculated
   * @returns A string representing the total clocked-in time in the format HH:mm
   */
export function calculateEmployeeClockedInTime(employee: Employee) {
  let totalHours = 0;
let totalMinutes = 0;

for (const entry of employee.timeEntries) {
  let endTime: dayjs.Dayjs;
  if (entry.endTime) {
    endTime = dayjs(entry.endTime).tz("Pacific/Auckland");
  } else if (employee.clockedIn) {
    endTime = dayjs().tz("Pacific/Auckland");
  } else {
    continue;
  }

  const { hours, minutes } = calculateTimeDifference(entry.startTime, endTime.toISOString());
  totalHours += hours;
  totalMinutes += minutes;
}

// Convert any sets of 60 minutes into hours
totalHours += Math.floor(totalMinutes / 60);
totalMinutes %= 60;

return `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;
};
