<script>
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import AlbumList from "./AlbumList";
import PlayListFollowerBtn from "./PlayListFollowerBtn";
import PlayListItem from "./PlayListItem";
import RelatedItem from "./RelatedItem";
Vue.use(VueAxios, axios);
export default {
  name: "PlayList",
  data() {
    return {
      currentPopoverIndex: -1,
      currentIndex: 0,
      /* FIXME, server side process ? */
      /*musicType: "preset",
      currentSong: {
        song: "水色の雨",
        videoId: "zGsc-9kDgYk",
        duration: "00:00"
      },
      currentSinger: "Rin",
      videoId: "zGsc-9kDgYk",*/
      albumIndex: 0,
      isPlay: false,
      timeLine: 0,
      duration: 0,
      currentTime: 0,
      isDrag: false,
      isGrab: false,
      isAutoPlay: false,
      isLoop: false,
      isShuffle: false,
      isBuffering: false,
      progress: 0,
      newTime: 0,
      processInterval: null,
      playerState: -1,
      volume: 30,
      isUnMute: false,
      playList: [],
      currentPlayList: [],
      currentAlbumImg: "",
      currentBackGround: "",
      playListStatus: "OVERVIEW",
      navbar: "Playlist",
      copyright: "",
      publicPath: "./"
    };
  },
  components: {
    PlayListFollowerBtn,
    AlbumList,
    PlayListItem,
    RelatedItem
  },
  created() {
    let vm = this;
    this.axios.get("./api/preset").then(response => {
      vm.playList = response.data;
      vm.init();
      vm.player.setVolume(100);
    });
  },
  mounted() {
    let progressBar = this.$refs.progressBar;
    progressBar.addEventListener("mouseover", () => {
      this.isDrag = true;
    });
    progressBar.addEventListener("mouseout", () => {
      this.isDrag = false;
      this.isGrab = false;
    });
    progressBar.addEventListener("mousedown", () => {
      this.isGrab = true;
      this.isDrag = true;
    });
    progressBar.addEventListener("mouseup", () => {
      this.isGrab = false;
    });
    progressBar.addEventListener("mousemove", e => {
      if (this.isDrag && this.isGrab) this.processBarTime(e);
    });
  },

  watch: {
    playerState() {
      if (this.playerState !== 3) {
        setTimeout(() => {
          this.isBuffering = false;
        }, 500);
      } else {
        this.isBuffering = true;
      }
    },
    navbar() {
      if (this.navbar === "Daily Mix") {
        this.currentBackGround =
          this.publicPath + this.playList["Daily Mix"][0].backgroundImg;
        this.currentPlayList = this.playList["Daily Mix"][0].songs;
      }
    }
  },
  computed: {
    audio() {
      return this.$refs.audio;
    },
    player() {
      return this.$refs.youtube.player;
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
    formatTime(time) {
      // 調整時間 & 歌曲總長度
      let mins = Math.floor(time / 60);
      let secs = Math.floor(time % 60);
      time = `${mins < 10 ? 0 : ""}${mins}:${secs < 10 ? 0 : ""}${secs}`;
      return time;
    }
  },

  methods: {
    ready() {
      // seek to the time (autoPlay) after video load finished
      let vm = this;
      let itv_id = setInterval(()=>{
        vm.player.getVideoUrl().then(p=>{
          if (p !== undefined && p.includes(vm.videoId)) {
            console.log(`loaded video ${vm.currentSong} (${p})`, vm.player);
            clearInterval(itv_id);
            vm.autoPlay();
          }
        });
      }, 100);
    },
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
    init() {
      this.stopUpdateDuration();

      let pl = this.playList;
      this.musicType = this.musicType || Object.keys(pl)[0];
      let item = this.playList[this.musicType][this.albumIndex];

      this.reset(item);
      console.log(`reset to ${this.currentSong} ${this.videoId}`);
    },
    reset(item) {
      this.currentSong = item.songs[this.currentIndex].song;
      this.currentSongInfo = item.songs[this.currentIndex];
      this.videoId = item.songs[this.currentIndex].videoId;
      this.currentPlayList = item.songs || [];
      this.currentAlbumImg = item.img;
      this.currentBackGround = this.publicPath + item.backgroundImg;
      this.currentSinger = item.singer;
      this.musicType = item.type;
      this.copyright = item.copyright;
    },
    autoPlay() {
      let start = this.currentSongInfo.start
      let vm = this;
      if (start) {
        setTimeout(()=> {
          vm.player.seekTo(start).then(v=>{
            vm.player
              .getCurrentTime()
              .then(p => console.log(`change complete seek to ${start} (actual ${p})`));
          });
        }, 200)
      }

      // 自動撥放
      if (!this.isPlay) {
        this.player.playVideo();
      } else {
        this.player.pauseVideo();
        setTimeout(() => {
          this.isPlay = true;
          this.player.playVideo();
        }, 1000);
      }
    },
    togglePlay() {
      // 切換撥放或停止
      this.isPlay = !this.isPlay;

      console.log(`toggle, ${this.currentSong}`);

      this.player.playVideo();
      if (!this.isPlay) {
        this.player.pauseVideo();
        this.isPlay = false;
      }
    },
    changeSong(click) {
      // 上一首或下一首
      let total = this.currentPlayList.length;
      if (total <= 1) return;
      this.currentIndex = (this.currentIndex + click + total) % total;

      this.init();

      // Old video load code
      //this.player.nextVideo();
      //setTimeout(()=>this.player.seekTo(this.currentSongStart), 200)
      /*this.player.loadVideoById(new String(this.videoId)).then(()=>{
        let start = this.currentSongInfo.start
        if (start) {
          console.log(`change complete seek to ${start}`);
          setTimeout(()=>this.player.seekTo(start), 200)
        }
      });*/

      let vm = this;
      this.$nextTick(function() {
        vm.autoPlay();
      });
    },
    changeVolume() {
      // 改變聲音&聲音 Input 顏色
      let volume = parseInt(this.$refs.volume.value);
      if (this.isUnMute && this.volume > 0) {
        this.isUnMute = false;
        this.player.unMute();
      }
      this.player.setVolume(volume);
      this.volume = volume;
    },
    changeUnMute() {
      // 靜音&取消靜音
      this.isUnMute = !this.isUnMute;
      if (this.isUnMute) {
        this.volume = 0;
        this.player.mute();
      } else if (!this.isUnMute) {
        this.volume = 30;
        this.player.unMute();
      }
    },
    processBarTime(e) {
      // 調整進度條
      let progressWidth = this.$refs.progressBar.offsetWidth;
      let x = e.offsetX;
      this.newTime = Math.floor((x / progressWidth) * this.duration);
      let offset = this.currentSongInfo.start || 0;
      this.player.seekTo(offset + this.newTime);
    },
    stopUpdateDuration() {
      let vm = this;
      //this.$once("hook:beforeDestroy", () => {
        if (vm.processInterval !== null) {
          clearInterval(vm.processInterval);
          vm.processInterval = null;
        }
      //});
    },
    async updateDuration() {
      // 計算歌曲總時間
      this.duration = this.currentSongInfo.end ? this.currentSongInfo.end - this.currentSongInfo.start : await this.player.getDuration();
      this.processInterval = setInterval(() => {
        this.player.getCurrentTime().then(currentTime => {
          if (this.currentSongInfo.end && this.currentSongInfo.end < currentTime) {
            if (this.processInterval !== null) // currentTime > end but changed by changeSong() , this.processInterval is null
              this.loopSong();
          } else {
            if (this.currentSongInfo.start)
              currentTime -= this.currentSongInfo.start;

            // 調整進度軸長度 time:currentTime/totaltime:duration
            this.timeLine = (currentTime / this.duration) * 100;
            this.currentTime = currentTime;
            this.getPlayerState();
          }
        });
      }, 1000);
    },
    paused() {
      this.stopUpdateDuration();
    },
    async getPlayerState() {
      // 監控影片狀態=>增加 loading icon
      // getPlayerState():Number
      // -1 – unstarted、0 – ended、1 – playing、2 – paused、3 – buffering、5 – video cued
      this.playerState = await this.player.getPlayerState();
    },
    loopCurrentSong() {
      let zero = this.currentSongInfo.start || 0;
      this.player.seekTo(zero);
    },
    loopSong() {
      if (this.isLoop) {
        this.loopCurrentSong();
      } else { // called when playing ended
        if (this.currentSongInfo.end)
            this.player.pauseVideo();

        let total = this.currentPlayList.length;
        // 隨機撥放
        let suffleIndex = Math.floor(Math.random() * total);
        if (this.isShuffle && this.currentIndex !== suffleIndex) {
          this.currentIndex = suffleIndex;
        } else {
          this.currentIndex++;
        }
        if (this.currentIndex === total) this.currentIndex = 0;

        this.init();
        this.$nextTick(function() {
          this.autoPlay();
        });
        // this.stopUpdateDuration(); // called in init()
      }
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
      this.currentIndex = 0;
      this.albumIndex = index;
      this.reset(item);
      if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }
      this.$nextTick(function() {
        this.player.pauseVideo();
        setTimeout(() => {
          this.isPlay = true;
          this.player.playVideo();
        }, 1000);
      });
    },
    selectSong({ item, index }) {
      // 點選歌曲
      this.currentSong = item.song;
      this.videoId = item.videoId;
      this.currentIndex = index;
      if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }
      this.$nextTick(function() {
        this.autoPlay();
      });
    }
  }
};
</script>
<template src="./template.html"></template>
<style lang="scss"></style>
