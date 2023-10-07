<template>
    <table id="employees" class="min-w-full bg-white mb-8">
      <thead>
          <tr>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Key</th>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Name</th>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Status</th>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-sm uppercase font-bold">Clocked In Hours</th>
          </tr>
      </thead>
      <tbody>
          <tr v-for="employee in employeesWithClockedInTime" :key="employee.id" @click="toggleSelectedEmployee(employee.id)">
              <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ employee.key }}</td>
              <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ employee.name }}</td>
              <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ employee.clockedIn ? 'Clocked In' : 'Clocked Out' }}</td>
              <td class="py-2 px-4 border-b border-gray-200 text-sm">{{ employee.clockedInTime }}</td>
          </tr>
      </tbody>
    </table>
</template>

<script setup lang="ts">
  import { computed, defineEmits } from 'vue';
  import { useEmployeeStore } from '../../stores/employeeStore';
  import { Employee } from '../../types/employee.model';
  import { calculateTimeDifference } from '../../lib/utils';

  const emit = defineEmits();
  const employeeStore = useEmployeeStore();

  /**
   * Sets the selected employee, so that the dashboard can display the employee's time and break entries
   * @param employeeId 
   */
  const toggleSelectedEmployee = (employeeId: number) => {
    emit('update:selectedEmployeeId', employeeId);
  };

  /**
   * Computes a new array of employee objects, each enriched with an additional property: clockedInTime.
   * clockedInTime represents the total hours worked by an employee, calculated using calculateEmployeeClockedInTime function.
   */
  const employeesWithClockedInTime = computed(() => {
    return employeeStore.employees.map(employee => ({
      ...employee,
      clockedInTime: calculateEmployeeClockedInTime(employee)
    }));
  });


  /**
   * Calculates the total clocked-in time for a given employee.
   * Iterates through all time entries of the employee, calculates the time difference for each entry,
   * and accumulates the total hours and minutes. Converts sets of 60 minutes into hours.
   * 
   * @param employee - The employee object for whom the total clocked-in time is to be calculated
   * @returns A string representing the total clocked-in time in the format HH:mm
   */
  const calculateEmployeeClockedInTime = (employee: Employee) => {
    let totalHours = 0;
    let totalMinutes = 0;

    for (const entry of employee.timeEntries) {
      let endTime: Date;
      if (entry.endTime) {
        endTime = new Date(entry.endTime);
      } else if (employee.clockedIn) {
        endTime = new Date(); // Use current time if employee is still clocked in
      } else {
        continue; // Skip this entry if no endTime and not currently clocked in
      }

      const { hours, minutes } = calculateTimeDifference(entry.startTime, endTime);
      totalHours += hours;
      totalMinutes += minutes;
    }

    // Convert any sets of 60 minutes into hours
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes %= 60;

    return `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;
};

</script>

<style scoped>
    table#employees tr:hover {
        background-color: #f5f5f5;
        cursor: pointer;
        }
</style>