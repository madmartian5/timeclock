<script setup lang="ts">
  import Logo from './Logo.vue';
  import { ref, computed } from 'vue';
  import dayjs from 'dayjs';
  import localizedFormat from 'dayjs/plugin/localizedFormat';

  // Use the localizedFormat plugin
  dayjs.extend(localizedFormat);

  const currentDate = ref(dayjs());

  const formattedCurrentDate = computed(() => {
    return currentDate.value.format('dddd D MMMM YYYY');
  });
</script>

<template>
  <div class="navbar bg-base-300">
    <div class="navbar-start">
      <Logo /> 
    </div>
    <div class="navbar-center">
    </div>
    <div class="navbar-end">
      <div class="text-sm text-gray-500">{{ formattedCurrentDate }}</div>
    </div>
  </div>
</template>
