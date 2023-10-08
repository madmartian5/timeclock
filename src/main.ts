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
    // Register the service worker
    /*
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
    */
  } catch (error) {
    console.error("Error during app setup:", error);
  }
}

setupApp().then(() => {
  app.use(router);
  app.mount('#app');
});
