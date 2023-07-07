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
  created() {
    let vm = this;
    this.axios.get("./api/preset").then(response => {
      for (let [k,v] of Object.entries(response.data)) {
        vm.$set(this.playList, k, v);
      }
      vm.init();
      vm.player.ytplayer.setVolume(100);
    });
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
    init(playlist_name = "main", musicType = undefined, albumIndex = 0) {
      console.log(`init ${playlist_name} to ${musicType}, ${albumIndex}`);
      this.player.stopUpdateDuration();
      this.player.pausePlay();

      let pl = this.playList;
      let set_musicType = musicType || this.musicType || Object.keys(pl)[0];

      this.$set(this.playlist_datas[playlist_name], "musicType"   , set_musicType);
      this.$set(this.playlist_datas[playlist_name], "albumIndex"  , albumIndex);
      this.$set(this.playlist_datas[playlist_name], "currentIndex", 0);


      let item = this.playList[this.musicType][this.albumIndex];
      this.currentBackGround = this.publicPath + item.backgroundImg;
      //console.log(`YT ${item}`);
      //this.reset(item);
      this.player.init(this.videoId);
    },
    /*reset(item) { // do reset and change video
      //this.currentAlbumImg = item.img;

      //this.currentSinger = item.singer;
      //this.currentPlayList = item.songs || [];
      //this.copyright = item.copyright;

      //this.playlist.reset(item, this.player);
    },*/
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

      console.log("selectSinger");
      //this.albumIndex = index;
      this.init(this.playlist2attach, undefined, index);

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
