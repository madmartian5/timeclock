<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useEmployeeStore } from '../stores/employeeStore';
import { Employee, TimeEntry } from '../types/employee.model';
import breakSchedule from '../lib/breakSchedule';
import { calculateTimeDifference, calculateEmployeeClockedInTime } from '../lib/utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Use plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// components
import EmployeeTable from '../components/dashboard/EmployeeTable.vue';
import AddEmployeeForm from '../components/dashboard/AddEmployeeForm.vue';
import ExportTimesheets from '../components/dashboard/ExportTimesheets.vue';

const employeeStore = useEmployeeStore();
const selectedEmployeeId = ref<number | null>(null);

const selectedEmployee = computed(() => {
  return selectedEmployeeId.value;
});

const updateSelectedEmployee = (newId: number) => {
    // Update the selectedEmployeeId when the event is emitted from the child component
    selectedEmployeeId.value = selectedEmployeeId.value === newId ? null : newId;
};

const selectedEmployeeName = computed(() => {
  const selectedEmployee = employeeStore.employees.find(emp => emp.id === selectedEmployeeId.value);
  return selectedEmployee ? selectedEmployee.name : '';
});

const selectedEmployeeTimeEntries = computed(() => {
  if (selectedEmployee.value !== null) {
    return groupedTimeEntries.value[selectedEmployee.value];
  }
  return null;
});

const groupedTimeEntries = computed(() => {
  const grouped: { [id: number]: { [date: string]: TimeEntry[] } } = {};

  employeeStore.employees.forEach(employee => {
    grouped[employee.id] = {};
    employee.timeEntries.forEach(entry => {
      let endTime: dayjs.Dayjs;
      if (entry.endTime) {
        endTime = dayjs(entry.endTime).tz("Pacific/Auckland");
      } else if (employee.clockedIn) {
        endTime = dayjs().tz("Pacific/Auckland");
      } else {
        return; // Skip this entry if no endTime and not currently clocked in
      }

      const { hours, minutes } = calculateTimeDifference(entry.startTime, endTime.toISOString());
      entry.duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const date = dayjs(entry.startTime).tz("Pacific/Auckland").format('YYYY-MM-DD');
      if (!grouped[employee.id][date]) {
        grouped[employee.id][date] = [];
      }
      grouped[employee.id][date].push(entry);
    });
  });

  return grouped;
});

const selectedEmployeeBreaks = computed(() => {
  if (selectedEmployee.value !== null) {
    const employee = employeeStore.employees.find(emp => emp.id === selectedEmployee.value);
    return employee?.breaksTaken || [];
  }
  return [];
});


const resetEmployees = () => {
    employeeStore.reset();
};

onMounted(() => {
    window.addEventListener('storage', handleStorageChange);
    employeeStore.loadEmployees();
});

onUnmounted(() => {
    window.removeEventListener('storage', handleStorageChange);
});

const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'employees') {
        employeeStore.refreshEmployees(); // Assuming you have a method to refresh the employees' data
    }
};

const entitledBreaks = computed(() => {
    if (!selectedEmployee.value) return [];

    const workedHours = parseFloat(calculateEmployeeClockedInTime(
        employeeStore.employees.find(emp => emp.id === selectedEmployee.value) as Employee
    ).replace(':', '.')); // Assuming format hh:mm

    const schedule = breakSchedule.find(s => workedHours >= s.minHours && workedHours <= s.maxHours);
    return schedule ? schedule.breaks : [];
});

const getBreakTakenTime = (breakId: number, type: 'start' | 'end' | 'duration') => {
  const breakTaken = selectedEmployeeBreaks.value.find(b => b.breakId === breakId);
  if (!breakTaken) return 'N/A';

  if (type === 'start') {
    return dayjs(breakTaken.startTime).tz("Pacific/Auckland").format('HH:mm:ss');
  } else if (type === 'end') {
    return breakTaken.endTime ? dayjs(breakTaken.endTime).tz("Pacific/Auckland").format('HH:mm:ss') : 'Still on break';
  } else if (type === 'duration') {
    const { hours, minutes } = calculateTimeDifference(breakTaken.startTime, breakTaken.endTime || dayjs().tz("Pacific/Auckland").toISOString());
    return `${hours}h ${minutes}m`;
  }
  return 'N/A';
};

const isBreakTaken = (breakId: number) => {
    return !!selectedEmployeeBreaks.value.find(b => b.breakId === breakId);
};


//editing break times
const editingBreakId = ref<number | null>(null);
const editingType = ref<'start' | 'end' | null>(null);
const editingValue = ref<string>('');

/**
 * Sets up the inline editing for a break time.
 * @param breakId - The ID of the break being edited.
 * @param type - The type of time being edited ('start' or 'end').
 * @param currentValue - The current value of the time being edited.
 */
 const editBreakTime = (breakId: number, type: 'start' | 'end', currentValue: string) => {
    editingBreakId.value = breakId;
    editingType.value = type;
    editingValue.value = currentValue; // Convert to appropriate format if needed
};

/**
 * Checks if a particular break time is currently being edited.
 * @param breakId - The ID of the break.
 * @param type - The type of time ('start' or 'end').
 * @returns Boolean indicating whether the break time is being edited.
 */
 const isEditing = (breakId: number, type: 'start' | 'end') => {
    return editingBreakId.value === breakId && editingType.value === type;
};

/**
 * Saves the edited break time and exits the editing mode.
 * @param breakId - The ID of the break being edited.
 * @param type - The type of time being edited ('start' or 'end').
 */
 const saveBreakTime = (breakId: number, type: 'start' | 'end') => {
    console.log(editingValue.value);

    // Find the selected employee
    const selectedEmployee = employeeStore.employees.find(emp => emp.id === selectedEmployeeId.value);

    if (!selectedEmployee || !selectedEmployee.breaksTaken) {
        console.error('Selected employee or breaksTaken is not defined');
        return;
    }

    // Find the break
    const breakTaken = selectedEmployee.breaksTaken.find(b => b.breakId === breakId);

    if(!breakTaken) {
        console.error('Break is not defined');
        return;
    }

    // Assuming the date part should be the same and only time part is changing
    // Extract the date part from the existing startTime or endTime
    //const existingDate = type === 'start' ? new Date(breakTaken.startTime) : new Date(breakTaken.endTime);

    let existingDate: Date;
    if (type === 'start') {
        existingDate = new Date(breakTaken.startTime);
    } else {
        if (breakTaken.endTime) {
            existingDate = new Date(breakTaken.endTime);
        } else {
            console.error('End time is not defined');
            return;
        }
    }


    
    // Extract the hour, minute, and second from the editingValue
    // Assuming editingValue is in the format HH:mm:ss
    const [hour, minute, second] = editingValue.value.split(':').map(Number);

    // Set the hour, minute, and second to the existing date object
    existingDate.setHours(hour, minute, second);

    // Update the break time
    if (type === 'start') {
        breakTaken.startTime = existingDate.toISOString();
    } else {
        breakTaken.endTime = existingDate.toISOString();
    }

    // Save the employees
    employeeStore.saveEmployees();

    // Exit editing mode
    console.log('Saving break time', breakId, type, editingValue.value);
    editingBreakId.value = null;
    editingType.value = null;
};



</script>

<template>
    <div class="mt-8 w-full flex">
        <div class="w-1/3 p-4 border-r">
            <button @click="resetEmployees" class="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Reset Employees
            </button>
            <ExportTimesheets />
            <AddEmployeeForm />
        </div>

        <div class="w-2/3 p-4">
            <!-- Main Employee Table -->
            <EmployeeTable @update:selectedEmployeeId="updateSelectedEmployee" />

            <!-- Time Entries Table -->
            <div v-if="selectedEmployee">
                <h2 class="text-xl mb-4">Time Entries for {{ selectedEmployeeName }}</h2>
                <table v-if="selectedEmployeeTimeEntries" class="min-w-full bg-white mt-4">
                    <thead>
                        <tr>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Date</th>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Start Time</th>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">End Time</th>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(entries, date) in selectedEmployeeTimeEntries" :key="date">
                        <tr v-for="entry in entries" :key="entry.startTime">
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ date }}</td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ new Date(entry.startTime).toLocaleTimeString() }}</td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : 'Still clocked in' }}</td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ entry.duration }}</td>
                        </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Breaks Table -->
            <div v-if="selectedEmployee">
                <h2 class="text-xl mt-8 mb-4">Breaks for {{ selectedEmployeeName }}</h2>
                <table v-if="entitledBreaks.length > 0" class="min-w-full bg-white mt-4">
                    <thead>
                        <tr>
                            <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Break Description</th>
                            <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Start Time</th>
                            <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">End Time</th>
                            <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Duration</th>
                            <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Taken</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="breakDefinition in entitledBreaks" :key="breakDefinition.id">
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ breakDefinition.duration }}min {{ breakDefinition.type }} break</td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">
                                <template v-if="isEditing(breakDefinition.id, 'start')">
                                    <input type="time" v-model="editingValue" @blur="saveBreakTime(breakDefinition.id, 'start')" @keyup.enter="saveBreakTime(breakDefinition.id, 'start')">
                                </template>
                                <template v-else>
                                    <span @click="editBreakTime(breakDefinition.id, 'start', getBreakTakenTime(breakDefinition.id, 'start'))">{{ getBreakTakenTime(breakDefinition.id, 'start') }}</span>
                                </template>
                            </td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ getBreakTakenTime(breakDefinition.id, 'end') }}</td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ getBreakTakenTime(breakDefinition.id, 'duration') }}</td>
                            <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ isBreakTaken(breakDefinition.id) ? 'Yes' : 'No' }}</td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="mt-4 text-gray-600">No breaks data available.</p>
            </div>
        </div>
    </div>
</template>