import './index.css'
import App from './App.vue'
import router from './router';
import { createPinia } from 'pinia'
import { createApp } from 'vue'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)

async function setupApp() {
  try {

  } catch (error) {
    console.error("Error during app setup:", error);
  }
}


setupApp().then(() => {
  app.use(router);
  app.mount('#app');
});
