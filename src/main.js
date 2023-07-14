import Vue from "vue";
import App from "./App.vue";
import VueYoutube from 'vue-youtube'
import { vfmPlugin } from 'vue-final-modal'



Vue.use(VueYoutube);
Vue.use(vfmPlugin)

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
  mounted() {
    document.title = 'YTify';
  },
}).$mount("#app");
