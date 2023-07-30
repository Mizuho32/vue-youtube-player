<template>
  <div>
    <div class="input-group mb-3 mt-3">
      <div class="input-group-prepend">
        <button type="button" class="btn btn-outline-secondary dropdown-toggle" @click="change_type">{{type_text}}</button>
        <!--<div class="dropdown-menu">
          <a class="dropdown-item" href="#">name</a>
          <a class="dropdown-item" href="#">artist</a>
        </div>-->
      </div>
      <input class="form-control font-weight-bold text-center" type="text" v-model="album.searchQuery" placeholder="検索キーワード">
      <div class="input-group-append">
        <button class="btn btn-outline-secondary" @click="search">
          <i class="material-icons">search</i>
        </button>
      </div>
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
      search_song: true,
    };
  },
  created(){
    this.album = this.playList.search_result[0];
  },
  components: {
    PlayList,
  },
  watch: {
  },
  computed: {
    type_text(){
      return this.search_song ? "song" : "artist";
    },
  },
  methods: {
    emitHandler2(ev) {
      this.$emit("update_p2a", ev);
    },
    async search() {
      let response = await this.axios.post("./api/search", {query: this.album.searchQuery, song: this.search_song});
      console.log("search", response.data);
      for (let [k,v] of Object.entries(response.data["search_result"][0])) {
        this.$set(this.album, k, v);
      }
      this.album.set_currentSongInfo();
    },
    change_type() {
      this.search_song = !this.search_song;
    },
  }
};
</script>

<style lang="scss"></style>
