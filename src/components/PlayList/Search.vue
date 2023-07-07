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
      publicPath: "./",
      currentIndex: null,
      currentItem: {},
      searchQuery: '明日',

      isBuffering: false,
      currentIndex: 0,
      currentPopoverIndex: 0,
      currentPlayList: []
    };
  },
  components: {
    PlayList,
  },
  watch: {
    currentItem(newValue, oldValue) {
      if (oldValue.id !== newValue.id) {
        this.emitHandler(newValue, this.currentIndex);
      }
    }
  },
  computed: {
  },
  methods: {
    dummy(){
    },
    selectHandler(item, index) {
      this.currentIndex = index;
      this.currentItem = item;
    },
    emitHandler(item, index) {
      this.$emit("selectSinger", { item, index });
    },
    emitHandler2(ev) {
      this.$emit("update_p2a", ev);
    },
    async search() {
      let response = await this.axios.get("./api/search", {params: {query: this.searchQuery}});
      //console.log(response.data);
      //this.playList["search_result"] = response.data["search_result"];
      this.$set(this.playList, "search_result", response.data["search_result"]);
      //console.log(this.playList);
      // this.$emit("init", "search_result", "search");
      //this.player.setVolume(100);
      //console.log(this.currentPlayList,this.playList["search_result"][0].songs);
      //this.currentPlayList = this.playList["search_result"][0].songs;
    }
  }
};
</script>

<style lang="scss"></style>
