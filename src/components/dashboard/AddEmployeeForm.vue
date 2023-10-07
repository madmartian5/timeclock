<template>
    <h2 class="text-xl mb-4">Add New Employee</h2>
    <div>
        <input 
            type="text" 
            id="employeeName" 
            v-model="newEmployeeName" 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter Employee Name"
        />
    </div>
    <button @click="addEmployee" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Add Employee
    </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEmployeeStore } from '../../stores/employeeStore';
import { Employee } from '../../types/employee.model';

const employeeStore = useEmployeeStore();
const newEmployeeName = ref('');

/**
 * Adds a new employee to the employee store
 */
const addEmployee = () => {
    if (newEmployeeName.value.trim() !== '') {
        const newId = employeeStore.employees.length + 1;
        const newKey = (newId + 100).toString().slice(-3);

        const newEmployee: Employee = {
            id: newId,
            key: newKey,
            name: newEmployeeName.value,
            clockedIn: false,
            timeEntries: []
        };

        employeeStore.addEmployee(newEmployee);
        newEmployeeName.value = '';
    }
};
</script>