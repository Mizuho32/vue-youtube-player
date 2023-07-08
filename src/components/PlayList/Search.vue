<template>
  <div>
    <div>
      <input class="font-weight-bold text-center mt-3 mb-3" type="text" v-model="searchQuery" placeholder="検索キーワード">
      <button @click="search">検索</button>
    </div>
    <PlayList :playList="playList" :playlist_datas="playlist_datas" :player="player" :name="'search'" :p2a="p2a" @update_p2a="emitHandler2($event)" :init="init"></PlayList>
  </div>
</template>

<script>
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";

import PlayList from "./PlayList";

Vue.use(VueAxios, axios);

export default {
  name: "Search",
  props: ["playList", "playlist_datas", "player", "p2a", "init"],
  data() {
    return {
      searchQuery: '明日',
    };
  },
  components: {
    PlayList,
  },
  watch: {
  },
  computed: {
  },
  methods: {
    emitHandler2(ev) {
      this.$emit("update_p2a", ev);
    },
    async search() {
      let response = await this.axios.get("./api/search", {params: {query: this.searchQuery}});
      this.$set(this.playList, "search_result", response.data["search_result"]);
    }
  }
};
</script>

<style lang="scss"></style>
