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
    /*
    const web3Store = useWeb3Store();
    web3Store.checkZilPayIsInstalled();

    await CarbMigrationAPI.fetchAndSetDataFromSmartContract();

    if (typeof window.zilPay !== 'undefined' && window.zilPay.wallet.isConnect) {
      web3Store.handleAccountChange();
      web3Store.handleNetworkChange();
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
