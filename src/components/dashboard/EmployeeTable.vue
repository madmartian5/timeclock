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
  import { computed } from 'vue';
  import { useEmployeeStore } from '../../stores/employeeStore';
  import { calculateEmployeeClockedInTime } from '../../lib/utils';
  import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Use plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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

</script>

<style scoped>
    table#employees tr:hover {
        background-color: #f5f5f5;
        cursor: pointer;
        }
</style>