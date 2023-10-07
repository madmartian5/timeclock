import { defineStore } from 'pinia';
import employeesData from '../data/employees.json';
import { Employee } from '../types/employee.model';

export const useEmployeeStore = defineStore({
  id: 'employee',
  state: () => ({
    employees: employeesData as Employee[],
  }),
  actions: {
    loadEmployees() {
      const storedEmployees = localStorage.getItem('employees');
      if (storedEmployees) {
        this.employees = JSON.parse(storedEmployees);
      } else {
        this.employees = employeesData as Employee[];
      }
    },
    saveEmployees() {
      try {
        localStorage.setItem('employees', JSON.stringify(this.employees));
        this.refreshEmployees();
      } catch (error) {
        console.error("Error saving employees:", error);
      }
    },
    addEmployee(employee: Employee) {
      this.employees.push(employee);
      this.saveEmployees();
    },
    updateEmployee(updatedEmployee: Employee) {
      const index = this.employees.findIndex(e => e.id === updatedEmployee.id);
      if (index !== -1) {
        this.employees.splice(index, 1, updatedEmployee);
        this.saveEmployees();
      }
    },
    refreshEmployees() {
      const storedEmployees = localStorage.getItem('employees');
      if (storedEmployees) {
        this.employees = JSON.parse(storedEmployees);
      }
    },
    reset() {
      this.employees = [];
      localStorage.removeItem('employees');
      this.loadEmployees();
    },
  }
});
