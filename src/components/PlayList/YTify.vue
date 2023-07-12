<script>
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import AlbumList from "./AlbumList";
import Search from "./Search";
import Player from "./Player";
import PlayListFollowerBtn from "./PlayListFollowerBtn";
import PlayList from "./PlayList";
import RelatedItem from "./RelatedItem";

import utils from './utils'

Vue.mixin(utils)
Vue.use(VueAxios, axios);
export default {
  name: "YTify",
  data() {
    return {
      albumIndex: 0,
      currentAlbumImg: "",
      currentBackGround: "",
      currentPopoverIndex: -1,
      currentPlayList: [],
      //currentSinger: undefined,
      copyright: "",
      user_id: undefined,

      //musicType: undefined,
      navbar: "Playlist",
      playList: {},
      playListStatus: "OVERVIEW",
      publicPath: "./",

      playlist_datas: {
        main:   {musicType: undefined, albumIndex: 0, currentIndex: 0},
        search: {musicType: "search_result", albumIndex: 0, currentIndex: 0}
      },
      playlist2attach: "main",
    };
  },
  components: {
    PlayListFollowerBtn,
    AlbumList,
    Search,
    Player,
    PlayList,
    RelatedItem
  },
  async created() {
    this.user_id = (new URL(location.href)).searchParams.get("uid") || "";

    let vm = this;
    await this.loadPlaylist(vm, axios, "./api/preset");
    const params = {user_id: this.user_id};
    await this.loadPlaylist(vm, axios, "./api/user", { params });

    console.log(this.playList);

    vm.init({});
    vm.player.ytplayer.setVolume(100);
  },
  mounted() {
  },
  watch: {
    navbar() {
      if (this.navbar === "Daily Mix") {
        this.currentBackGround =
          this.publicPath + this.playList["Daily Mix"][0].backgroundImg;
        this.currentPlayList = this.playList["Daily Mix"][0].songs;
      }
    }
  },
  computed: {
    player() {
      return this.$refs.player;
    },
    playlist() {
      return this.$refs.playlist;
    },
    isBuffering() {
      return this.player.isBuffering;
    },
    musicType() {
      return this.playlist_datas[this.playlist2attach].musicType;
    },
    currentPlayListData() {
      return this.playlist_datas[this.playlist2attach];
    },
    currentIndex() {
      let data = this.playlist_datas[this.playlist2attach];
      return data["currentIndex"];
    },
    currentSinger() {
      let data = this.currentPlayListData;

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].singer;
      return "";
    },
    currentSong() {
      let data = this.playlist_datas[this.playlist2attach];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].songs[data["currentIndex"]].song;
      return "";
    },
    currentSongInfo() {
      let data = this.playlist_datas[this.playlist2attach];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].songs[data["currentIndex"]];
      return {};
    },
    videoId() {
      return this.currentSongInfo.videoId;
    },
    sameTypeList() {
      return this.playList[this.musicType];
    },
    typeList() {
      return Object.keys(this.playList);
    },
    favoriteList() {
      return this.playList["Daily Mix"][0].songs || [];
    }
  },
  filters: {
  },

  methods: {
    checkPopovers($event) {
      if ($event.target.nodeName !== "I") {
        this.currentPopoverIndex = -1;
      }
    },
    init({playlist_name = "main", musicType = undefined, albumIndex = 0, currentIndex = 0, autoplay = false}) {
      console.log(`init ${playlist_name} to ${musicType}, ${albumIndex}`);
      this.player.stopUpdateDuration();
      this.player.pausePlay();

      let pl = this.playList;
      let set_musicType = musicType || this.musicType || Object.keys(pl)[0];

      this.$set(this.playlist_datas[playlist_name], "musicType"   , set_musicType);
      this.$set(this.playlist_datas[playlist_name], "albumIndex"  , albumIndex);
      this.$set(this.playlist_datas[playlist_name], "currentIndex", currentIndex);


      let item = this.playList[this.musicType][this.albumIndex];
      this.currentBackGround = this.publicPath + item.backgroundImg;
      //console.log(`YT init to `, {pld: this.currentPlayListData});
      if (autoplay)
        this.player.init(this.videoId);
    },
    followHandler(item) {
      item.isFollow = !item.isFollow;
      let follower = parseInt(item.followers.replace(/,/g, ""));
      if (item.isFollow) {
        item.followers = (follower + 1).toLocaleString("en-us");
      } else if (!item.isFollow) {
        item.followers = (follower - 1).toLocaleString("en-us");
      }
    },
    selectSinger({ item, index }) {
      if ( item.id === this.playList[this.musicType][this.albumIndex].id && this.isPlay ) return;

      //this.albumIndex = index;
      this.playlist2attach = "main";
      this.init({playlist_name: this.playlist2attach, musicType: item.type, albumIndex: index});
      console.log("selectSinger, p2a is ", this.playlist2attach);

      /*if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }*/

      this.$nextTick(function() {
        this.player.autoPlay();
      });
    },
  }
};
</script>
<template src="./template.html"></template>
<style lang="scss"></style>
