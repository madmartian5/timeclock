import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// Your components
import TimeclockView from '../views/TimeclockView.vue';
import DashboardView from '../views/DashboardView.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', component: TimeclockView },
  { path: '/dashboard', component: DashboardView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
