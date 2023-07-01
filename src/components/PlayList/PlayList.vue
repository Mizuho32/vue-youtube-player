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
      albumIndex: 0,
      isPlay: false,
      timeLine: 0,
      duration: 0,
      currentTime: 0,
      isDrag: false,
      isGrab: false,
      isAutoPlay: true,
      isLoop: false,
      isShuffle: false,
      isBuffering: false,
      isLoaded: false,
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

            let seekOnly = true
            // A => B <=> !A or B
            vm.autoPlay(!this.isAutoPlay || !seekOnly); // AutoPlay => not seek only
          }

          console.log(vm.player);
          vm.player.addEventListener('onStateChange', this.onPlayerStateChange);
        });
      }, 100);
    },
    onPlayerStateChange(event) {
      //console.log(`state change ${event.data}, loaded ${this.isLoaded}`);
      if (!this.isLoaded) {
        if (event.data == 5) { // video cued
          this.isLoaded = true;
        }
      }
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
      this.stopPlay();

      let pl = this.playList;
      this.musicType = this.musicType || Object.keys(pl)[0];
      let item = this.playList[this.musicType][this.albumIndex];

      this.reset(item);
      this.isLoaded = false;
      console.log(`reset to ${this.currentSong} ${this.videoId}`);
    },
    reset(item) { // do reset and change video
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
    waitUntil(cond, timeout = 10, delta = 100) { // sec, millisec
      let tsum = 0;
      return new Promise(resolve => {
        const interval = setInterval(() => {
          tsum += delta;

          if (cond()) { // OK
            clearInterval(interval);
            resolve(true); // return
          } else if ( tsum > timeout*1000 ) { // timeout
            resolve(false);
          }
        }, delta);
      });
    },
    async autoPlay(seekOnly = false) {
      let start = this.currentSongInfo.start
      let vm = this;

      if (!start) return;

      // Wait load
      // await new Promise(resolve => setTimeout(resolve, 5000));
      // let wait_loaded = await this.waitUntil(()=>this.isLoaded, 5);
      // if (!wait_loaded) {
      //   alert("failed to load video");
      //   return
      // }

      // Seek
      let check_seek = async ()=>{
        await vm.player.seekTo(start); // return player
        let current_time = await vm.player.getCurrentTime();

        let msg = `seek to ${start} (player.getCurTime: ${current_time}, this.curTime: ${vm.currentTime})`;
        console.log(msg);

        if (current_time == start) return true;
        return false;
      };
      let sought = await this.waitUntil(check_seek, 5, 500);

      if (!sought) {
        alert("failed to seek video");
        return
      }
      console.log(`After seek ${sought}`);

      // handle autoplay case
      // actually is playing while !isAutoPlay, set isPlay = true
      let playerState = await this.player.getPlayerState();
      //console.log(`actually is playing ${playerState}`);
      if (playerState == 1 || playerState == 3 || playerState == 5) this.isPlay = true;


      if (seekOnly) return;

      vm.startPlay();
    },
    async startPlay() {
      this.player.playVideo();
      await new Promise(resolve => setTimeout(resolve, 100));

      let playerState = await this.player.getPlayerState();
      //console.log(`set isPlay when ${playerState}`);
      if (playerState == 1 || playerState == 3 || playerState == 5) { // playing or buffering or cued
        this.isPlay = true;
        this.updateDuration();
      }
    },
    stopPlay() {
      this.isPlay = false;
      this.player.pauseVideo();
      this.paused();
    },
    async togglePlay() {
      let current_time = await this.player.getCurrentTime();
      console.log(`toggle, ${this.currentSong}, ${current_time}`);

      if (this.isPlay) {
        this.stopPlay();
      } else {
        this.startPlay();
      }
    },
    changeSong(click) {
      // 上一首或下一首
      let total = this.currentPlayList.length;
      if (total <= 1) return;
      this.currentIndex = (this.currentIndex + click + total) % total;

      this.init();

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
      if (this.processInterval !== null) return;

      // 計算歌曲總時間
      this.duration = this.currentSongInfo.end ? this.currentSongInfo.end - this.currentSongInfo.start : await this.player.getDuration();
      this.processInterval = setInterval(() => {

        this.player.getCurrentTime().then(currentTime => {
          if (this.currentSongInfo.end && this.currentSongInfo.end < currentTime) { // song ended
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
      this.init();
      //this.reset(item);
      if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }
      this.$nextTick(function() {
        this.autoPlay();
      });
    },
    selectSong({ item, index }) {
      // 點選歌曲
      this.currentSong = item.song;
      this.videoId = item.videoId;
      this.currentIndex = index;
      this.currentSongInfo = item;

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
