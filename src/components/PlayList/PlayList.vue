<script>
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import AlbumList from "./AlbumList";
import Player from "./Player";
import PlayListFollowerBtn from "./PlayListFollowerBtn";
import PlayListItem from "./PlayListItem";
import RelatedItem from "./RelatedItem";

Vue.use(VueAxios, axios);
export default {
  name: "PlayList",
  data() {
    return {
      albumIndex: 0,
      currentAlbumImg: "",
      currentBackGround: "",
      currentPopoverIndex: -1,
      currentPlayList: [],
      currentSinger: undefined,
      copyright: "",

      musicType: undefined,
      navbar: "Playlist",
      playList: [],
      playListStatus: "OVERVIEW",
      publicPath: "./",
    };
  },
  components: {
    PlayListFollowerBtn,
    AlbumList,
    Player,
    PlayListItem,
    RelatedItem
  },
  created() {
    let vm = this;
    this.axios.get("./api/preset").then(response => {
      vm.playList = response.data;
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
    isBuffering() {
      return this.player.isBuffering;
    },
    currentIndex() {
      return this.player.currentIndex;
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
    showPopovers(index) {
      this.currentPopoverIndex = index;
      setTimeout(() => {
        this.currentPopoverIndex = -1;
      }, 4000);
    },
    init(musicType = undefined) {
      console.log(`init to ${musicType}`);
      this.player.stopUpdateDuration();
      this.player.pausePlay();

      let pl = this.playList;
      this.musicType = musicType || this.musicType || Object.keys(pl)[0];
      let item = this.playList[this.musicType][this.albumIndex];

      this.reset(item);
      console.log(`reset to ${this.currentSong} ${this.videoId}`);
    },
    reset(item) { // do reset and change video
      this.currentAlbumImg = item.img;
      this.currentBackGround = this.publicPath + item.backgroundImg;

      this.currentSinger = item.singer;
      this.currentPlayList = item.songs || [];
      this.musicType = item.type;
      this.copyright = item.copyright;

      this.player.reset(item);
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
      if (
        item.id === this.playList[this.musicType][this.albumIndex].id &&
        this.isPlay
      )
        return;
      this.player.currentIndex = 0;
      this.albumIndex = index;
      this.init();

      if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }

      this.$nextTick(function() {
        this.player.autoPlay();
      });
    },
    selectSong({ item, index }) {
      this.player.stopUpdateDuration();
      this.player.pausePlay();

      // 點選歌曲
      this.player.currentIndex = index;
      this.player.changeVideo(item.videoId);
      this.player.currentSong = item.song;
      this.player.currentSongInfo = item;

      if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }
      this.$nextTick(function() {
        this.player.autoPlay();
      });
    }
  }
};
</script>
<template src="./template.html"></template>
<style lang="scss"></style>
