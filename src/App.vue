<template>
  <div id="app">
    <PlayList></PlayList>
  </div>
</template>
<script>
import PlayList from "@/components/PlayList/PlayList";
export default {
  name: "app",
  data() {
    return {
      modalShow: true
    };
  },
  methods: {
    closeModal(e) {
      let modal = this.$refs.modal;
      if (e.target === modal) {
        this.modalShow = false;
      }
    }
  },
  components: {
    PlayList
  }
};
</script>
<style lang="scss">
@import url("https://use.fontawesome.com/releases/v5.6.3/css/all.css");
@import "assets/style";
</style>
