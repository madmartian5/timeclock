<script setup lang="ts">

import { computed, reactive, onMounted } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import { TimeEntry, Employee, BreakTaken } from '../types/employee.model';
import breakSchedule from '../lib/breakSchedule';
import { globalProperties } from '../lib/globals';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Use plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set default timezone if needed
dayjs.tz.setDefault("Pacific/Auckland");

const employeeStore = useEmployeeStore();
const currentEmployeeKey = reactive({ value: '' });
const currentEmployee = computed(() => employeeStore.employees.find(employee => employee.key === currentEmployeeKey.value));

interface ModalData {
  id: number;
  employeeName: string;
}

const modals = reactive<ModalData[]>([]);

const calculateTimeDifference = (startTime: string, endTime: string): { hours: number, minutes: number } => {
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  const totalMinutes = end.diff(start, 'minute');
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
};

const getTotalHoursForToday = (employee: Employee) => {
  const today = dayjs().format('YYYY-MM-DD'); // Get today's date in 'YYYY-MM-DD' format
  const todaysEntries = employee.timeEntries.filter(entry => entry.date === today);

  let totalHours = 0;
  let totalMinutes = 0;

  for (const entry of todaysEntries) {
    let endTime: dayjs.Dayjs;
    if (entry.endTime) {
      endTime = dayjs(entry.endTime);
    } else if (employee.clockedIn) {
      endTime = dayjs(); // Use current time if employee is still clocked in
    } else {
      continue; // Skip this entry if no endTime and not currently clocked in
    }

    const { hours, minutes } = calculateTimeDifference(entry.startTime, endTime.toISOString());
    totalHours += hours;
    totalMinutes += minutes;
  }

  // Convert any sets of 60 minutes into hours
  totalHours += Math.floor(totalMinutes / 60);
  totalMinutes %= 60;

  return totalHours + (totalMinutes / 60); // Return total hours as a decimal
};



const getEntitledBreaks = (hoursWorked: number) => {
  for (const schedule of breakSchedule) {
    if (hoursWorked >= schedule.minHours && hoursWorked <= schedule.maxHours) {
      return schedule.breaks;
    }
  }
  return [];
};

const getAvailableBreaks = (employee: Employee) => {
  const hoursWorked = getTotalHoursForToday(employee);
  const entitledBreaks = getEntitledBreaks(hoursWorked);
  const takenBreakIds = employee.breaksTaken?.map(b => b.breakId) || [];
  return entitledBreaks.filter(breakItem => !takenBreakIds.includes(breakItem.id));
};

const takeBreak = (breakId: number) => {
  if (!currentEmployee.value) return;

  const newBreak: BreakTaken = {
    breakId,
    startTime: dayjs().toISOString()
  };

  if (!currentEmployee.value.breaksTaken) {
    currentEmployee.value.breaksTaken = [];
  }

  currentEmployee.value.breaksTaken.push(newBreak);
  currentEmployee.value.currentBreak = newBreak;
  employeeStore.saveEmployees();

  // Find the break duration
  const breakDuration = breakSchedule.flatMap(schedule => schedule.breaks).find(b => b.id === breakId)?.duration;

  if (breakDuration) {
    // Use an IIFE to capture the current value of employeeName
    (function(employeeName) {
      // Set a timer to play the sound 1 minute before the break ends
      setTimeout(() => {
        playSoundForEmployee(employeeName);
      }, (breakDuration - 1) * 60 * 1000);  // Convert minutes to milliseconds
    })(currentEmployee.value.name);
  }
};



const closeModal = (modalId: number) => {
  const index = modals.findIndex(m => m.id === modalId);
  if (index !== -1) {
    modals.splice(index, 1);
  }
};

const endBreak = () => {
  // Check if currentEmployee or currentBreak is undefined
  if (!currentEmployee.value || !currentEmployee.value.currentBreak) return;

  const endTime = new Date().toISOString();

  // Ensure breaksTaken is defined and find the current break
  const currentBreakTaken = currentEmployee.value.breaksTaken?.find(
    (b) => b.breakId === currentEmployee.value?.currentBreak?.breakId && !b.endTime
  );

  // Check if currentBreakTaken is defined before assigning endTime
  if (currentBreakTaken) {
    currentBreakTaken.endTime = endTime;
  }

  // Reset the currentBreak
  currentEmployee.value.currentBreak = undefined;
  employeeStore.saveEmployees();
};


const currentBreakDetails = computed(() => {
  if (currentEmployee.value?.currentBreak) {
    const breakId = currentEmployee.value.currentBreak.breakId;
    for (const schedule of breakSchedule) {
      const foundBreak = schedule.breaks.find(breakItem => breakItem.id === breakId);
      if (foundBreak) {
        return foundBreak;
      }
    }
  }
  return null;
});

const clockIn = () => {
  if (!currentEmployee.value) return;
  currentEmployee.value.clockedIn = true;
  
  // Use Day.js to handle date and time in NZ timezone
  const nzDate = dayjs().tz("Pacific/Auckland");
  const currentDate = nzDate.format('YYYY-MM-DD'); // Gets the date part in 'YYYY-MM-DD' format
  const startTime = nzDate.toISOString(); // Gets the full date-time string in ISO format
  
  const newEntry: TimeEntry = {
    date: currentDate,
    startTime: startTime
  };
  currentEmployee.value.timeEntries.push(newEntry);
  employeeStore.saveEmployees();
};


const clockOut = () => {
  const currentEmployeeValue = currentEmployee.value;
  if (!currentEmployeeValue) return;

  const userConfirmed = window.confirm('Are you sure you want to clock out?');
  if (!userConfirmed) return;

  currentEmployeeValue.clockedIn = false;
  const latestEntry = currentEmployeeValue.timeEntries.find(entry => !entry.endTime);
  if (latestEntry) {
    latestEntry.endTime = dayjs().toISOString();
  }

  // We need to end any breaks that are currently in progress
  if (currentEmployeeValue.currentBreak) {
    endBreak();
  }

  // We need to calculate the total hours worked today and adjust for any breaks taken or entitled breaks not taken
  
  // Calculate total hours worked
  const totalHoursWorked = getTotalHoursForToday(currentEmployeeValue);

  // Determine entitled breaks
  const entitledBreaks = getEntitledBreaks(totalHoursWorked);

  // Check for missing breaks
  entitledBreaks.forEach((entitledBreak) => {
    const breakTaken = currentEmployeeValue.breaksTaken?.find(b => b.breakId === entitledBreak.id);
    if (!breakTaken) {
      // Add a zero-minute break
      const zeroMinuteBreak: BreakTaken = {
        breakId: entitledBreak.id,
        startTime: dayjs().toISOString(),
        endTime: dayjs().toISOString(),
      };
      if (!currentEmployeeValue.breaksTaken) {
        currentEmployeeValue.breaksTaken = [];
      }
      currentEmployeeValue.breaksTaken.push(zeroMinuteBreak);
    }
  });

  employeeStore.saveEmployees();
};



const addHour = () => {
  if (!currentEmployee.value) return;
  const latestEntry = currentEmployee.value.timeEntries.find(entry => !entry.endTime);
  if (latestEntry) {
    // Use Day.js to subtract 1 hour from the start time
    const adjustedStartTime = dayjs(latestEntry.startTime).subtract(1, 'hour').toISOString();
    latestEntry.startTime = adjustedStartTime;
    employeeStore.saveEmployees();
  }
};


const playSoundForEmployee = (employeeName: string) => {
  const audio = new Audio('/notification.mp3');
  audio.play();

  modals.push({
    id: Date.now(), // Using timestamp as a unique identifier
    employeeName: employeeName
  });
};

onMounted(() => {
  employeeStore.loadEmployees();
});

</script>

<template>
<div class="flex flex-col items-center w-full justify-center px-1 mt-4">
    <div class="mb-4">
        <input 
            type="text" 
            id="employeeKey" 
            v-model="currentEmployeeKey.value" 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter Employee Key"
        />
    </div>

    

    <div v-if="currentEmployee" :class="`m-2 p-4 border rounded-lg w-64 ${currentEmployee.clockedIn ? 'bg-green-200 border-green-600 shadow-lg' : 'bg-white'}`">
        
      <!-- Testing Feature -->
      <template v-if="currentEmployee.clockedIn && globalProperties.testmode">
        <button @click="addHour" class="btn bg-purple-200 hover:bg-purple-300 font-bold py-2 px-4 rounded w-full mb-2">Add 1 Hour</button>
      </template>

      
      <h2 class="text-xl text-center font-bold mb-2">{{ currentEmployee.name }}</h2>
        <template v-if="!currentEmployee.clockedIn">
            <button @click="clockIn" class="btn bg-green-200 border-green-600 hover:bg-green-300 hover:border-green-600 font-bold py-2 px-4 rounded w-full">Clock In</button>
        </template>
        <template v-else>
          <template v-if="!currentBreakDetails">
            <button @click="clockOut" class="btn bg-red-400 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full mb-2">Clock Out</button>
          </template>

          <div class="mt-2">
            <h3 class="text-md text-center font-bold mb-2">Breaks</h3>
            <template v-if="currentBreakDetails">
              <button @click="endBreak" class="btn bg-yellow-200 hover:bg-yellow-300 font-bold py-1 px-2 rounded w-full mb-1">
                End {{ currentBreakDetails.duration }} min {{ currentBreakDetails.type === 'paid' ? 'Paid' : 'Unpaid' }} Break
              </button>
            </template>

            <template v-else>
              <div v-for="breakItem in getAvailableBreaks(currentEmployee)" :key="breakItem.id">
                <button @click="takeBreak(breakItem.id)" class="btn bg-blue-200 hover:bg-blue-300 font-bold py-1 px-2 rounded w-full mb-1">
                    {{ breakItem.duration }} min {{ breakItem.type }} break
                </button>
              </div>
            </template>
          </div>
        </template>
    </div>
</div>



  <!-- Modals -->
<div v-for="(modal, index) in modals" :key="modal.id" class="fixed z-10 inset-0 overflow-y-auto flex items-center justify-center" :style="{ zIndex: 10 + index, marginTop: index * 20 + 'px', marginBottom: index * 20 + 'px' }">
    <div class="bg-white p-4 rounded shadow-lg w-1/2">
        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
                Break Ending Soon
            </h3>
            <div class="mt-2">
                {{ modal.employeeName }}'s break is about to end.
            </div>
        </div>

        <div class="mt-5 sm:mt-6">
            <button @click="closeModal(modal.id)" class="btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Acknowledge
            </button>
        </div>
    </div>
</div>

</template>
