<template>
    <button @click="generateCSV" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 ml-2 rounded">
        Export Timesheets
    </button>
</template>

<script setup lang="ts">
import { useEmployeeStore } from '../../stores/employeeStore';
import { WeekHours } from '../../types/weekHours';
import { calculateTimeDifference } from '../../lib/utils';
import breakSchedule from '../../lib/breakSchedule';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Use plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const employeeStore = useEmployeeStore();

const generateCSV = () => {
    const headers = ["ID", "Name", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const rows = [];

    // Add the headers
    rows.push(headers.join(','));

    // Process each employee
    for (const employee of employeeStore.employees) {
        const row = [];
        row.push(employee.id.toString());
        row.push(`"${employee.name}"`); // Quotes are for handling names with commas

        // Initialize a week's worth of hours
        const weekHours: WeekHours = {
            Monday: 0,
            Tuesday: 0,
            Wednesday: 0,
            Thursday: 0,
            Friday: 0,
            Saturday: 0,
            Sunday: 0
        };

        // Calculate worked hours without adjusting for breaks
        for (const entry of employee.timeEntries) {
            const day = dayjs(entry.startTime).tz("Pacific/Auckland").format('dddd');
            let endTime: dayjs.Dayjs;
            if (entry.endTime) {
                endTime = dayjs(entry.endTime).tz("Pacific/Auckland");
            } else if (employee.clockedIn) {
                endTime = dayjs().tz("Pacific/Auckland");
            } else {
                continue;
            }

            const { hours, minutes } = calculateTimeDifference(entry.startTime, endTime.toISOString());
            const dayOfWeek = day as keyof WeekHours;
            weekHours[dayOfWeek] += hours + (minutes / 60);
        }

        // Adjust for breaks taken separately
        const uniqueWorkDays = new Set(employee.timeEntries.map(entry => dayjs(entry.startTime).tz("Pacific/Auckland").format('YYYY-MM-DD')));
        uniqueWorkDays.forEach(entryDate => {
            const day = dayjs(entryDate).tz("Pacific/Auckland").format('dddd');
            const dayOfWeek = day as keyof WeekHours;

            const todaysBreaks = employee.breaksTaken?.filter(breakTaken => dayjs(breakTaken.startTime).tz("Pacific/Auckland").format('YYYY-MM-DD') === entryDate) || [];

            for (const breakTaken of todaysBreaks) {
                const breakDefinition = breakSchedule.flatMap(schedule => schedule.breaks).find(b => b.id === breakTaken.breakId);
                if (!breakDefinition) continue;

                const { hours: breakHours, minutes: breakMinutes } = calculateTimeDifference(breakTaken.startTime, breakTaken.endTime || dayjs().tz("Pacific/Auckland").toISOString());

                if (breakDefinition.type === 'paid') {
                    if (breakHours * 60 + breakMinutes > breakDefinition.duration) {
                        weekHours[dayOfWeek] -= (breakHours * 60 + breakMinutes - breakDefinition.duration) / 60;
                    } else {
                        weekHours[dayOfWeek] += (breakDefinition.duration - (breakHours * 60 + breakMinutes)) / 60;
                    }
                } else {
                    weekHours[dayOfWeek] -= breakHours + breakMinutes / 60;
                }
            }
        });

        // Convert total hours for each day into hh:mm format and add to the row
        for (const day of headers.slice(2)) {
            const dayOfWeek = day as keyof WeekHours;
            const hours = Math.floor(weekHours[dayOfWeek]);
            const minutes = Math.round((weekHours[dayOfWeek] - hours) * 60);
            row.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        }

        rows.push(row.join(','));
    }

    // Convert rows to a single CSV string
    const csvContent = rows.join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'employee_summary.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
</script>
