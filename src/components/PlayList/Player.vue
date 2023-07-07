<script>
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import PlayListItem from "./PlayListItem";

import utils from './utils' 

Vue.mixin(utils)   
Vue.use(VueAxios, axios);

export default {
  name: "Player",
  props: ["playList", "playlist_datas", "playlist2attach"],
  data() {
    return {
      //currentAlbum: undefined,
      //currentAlbumImg: "",
      //currentIndex: 0,
      //currentSong: undefined,
      //currentSongInfo: undefined,
      //currentSinger: undefined,
      //musicType: undefined,
      //playList: {},

      currentTime: 0,
      duration: 0,
      isPlay: false,
      isDrag: false,
      isGrab: false,
      isAutoPlay: false,
      isLoop: false,
      isShuffle: false,
      isBuffering: false,
      isLoaded: false,
      isUnMute: false,
      newTime: 0,
      playerState: -1,
      playlist: undefined,
      progress: 0,
      processInterval: null,
      publicPath: "./",
      timeLine: 0,
      volume: 30,
      videoId: undefined
    };
  },
  components: {
    PlayListItem,
  },
  created() {
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
      if (this.playerState == 1)
        this.isPlay = true;
      if (this.playerState == 2)
        this.isPlay = false;
    }
  },
  computed: {
    currentPlayListData() {
      return this.playlist_datas[this.playlist2attach];
    },
    currentAlbum() {
      let data = this.playlist_datas[this.playlist2attach];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]];
      return {};
    },
    currentAlbumImg() {
      let data = this.playlist_datas[this.playlist2attach];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].img;
      return "";
    },
    currentIndex() {
      let data = this.playlist_datas[this.playlist2attach];
      return data["currentIndex"];
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
    currentSinger() {
      let data = this.playlist_datas[this.playlist2attach];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].singer;
      return "";
    },
    musicType() {
      let data = this.playlist_datas[this.playlist2attach];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].type;
      return "";
    },
    ytplayer() {
      return this.$refs.youtube.player;
    },
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
    init(playList) {
      //this.playList = playList;
      console.log(`player init to ${this.playlist2attach} ${this.currentSongInfo.videoId}`);
      this.changeVideo(this.currentSongInfo.videoId);

      //this.currentAlbum = item;
      //this.currentSong = item.songs[this.currentIndex].song;
      //this.currentSongInfo = item.songs[this.currentIndex];
      //this.currentPlayList = item.songs || [];
      //this.currentAlbumImg = item.img;
      //this.currentSinger = item.singer;
      //this.musicType = item.type;
    },
    ready() {
      // seek to the time (autoPlay) after video load finished
      let vm = this;
      let itv_id = setInterval(()=>{
        vm.ytplayer.getVideoUrl().then(p=>{
          if (p !== undefined && p.includes(vm.videoId)) {
            console.log(`loaded video ${vm.currentSong} (${p})`, vm.ytplayer);
            clearInterval(itv_id);

            let seekOnly = true
            // A => B <=> !A or B
            vm.autoPlay(!this.isAutoPlay || !seekOnly); // AutoPlay => not seek only
          }

          //console.log(vm.ytplayer);
          vm.ytplayer.addEventListener('onStateChange', this.onPlayerStateChange);
        });
      }, 100);
    },
    onPlayerStateChange(event) {
      //console.log(`state change ${event.data}, loaded ${this.isLoaded}`);
      if (!this.isLoaded) {
        if (event.data == 1 || event.data == 3 || event.data == 5) { // video cued
          this.isLoaded = true;
        }
      }
    },
    changeIndexAndVideo(index) {
      this.currentPlayListData.currentIndex = index;
      this.changeVideo(this.currentSongInfo.videoId);
    },
    changeVideo(id) {
      this.videoId = id;
      this.isLoaded = false;
    },
    changeSong(click) {
      let album = this.currentAlbum;

      // 上一首或下一首
      let total = album.songs.length;
      if (total <= 1) return;

      let cindex = this.currentPlayListData.currentIndex
      //this.currentPlayListData.currentIndex = (cindex + click + total) % total;
      this.changeIndexAndVideo((cindex + click + total) % total);

      let vm = this;
      this.$nextTick(function() {
        vm.autoPlay();
      });
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
      this.duration = this.currentSongInfo.end ? this.currentSongInfo.end - this.currentSongInfo.start : await this.ytplayer.getDuration();
      this.processInterval = setInterval(() => {

        this.ytplayer.getCurrentTime().then(currentTime => {
          if (this.currentSongInfo.end && this.currentSongInfo.end < currentTime) { // song ended
            if (this.processInterval !== null) // currentTime > end but changed by changeSong() => this.processInterval is null
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
      this.playerState = await this.ytplayer.getPlayerState();
    },
    loopCurrentSong() {
      let zero = this.currentSongInfo.start || 0;
      this.ytplayer.seekTo(zero);
    },
    loopSong() {
      if (this.isLoop) {
        this.loopCurrentSong();
      } else { // called when playing ended
        console.log(`loopSong ${this.currentIndex}`);

        if (this.currentSongInfo.end)
            this.ytplayer.pauseVideo();

        let album = this.currentAlbum;
        let total = album.songs.length;

        // 隨機撥放
        let suffleIndex = Math.floor(Math.random() * total);
        let nextIndex = this.currentIndex;
        if (this.isShuffle && this.currentIndex !== suffleIndex) {
          nextIndex = suffleIndex;
        } else {
          nextIndex++;
        }
        if (nextIndex === total) nextIndex = 0;
        console.log(`loopSong, nextidx ${nextIndex}`);

        //this.reset(this.currentAlbum);
        this.changeIndexAndVideo(nextIndex);
        this.$nextTick(function() {
          this.autoPlay();
        });
        // this.stopUpdateDuration(); // called in init()
      }
    },
    async autoPlay(seekOnly = false) {
      let start = this.currentSongInfo.start
      let vm = this;

      if (!start) return;

      // Wait load
      // await new Promise(resolve => setTimeout(resolve, 5000));
      let wait_loaded = await this.waitUntil(()=>this.isLoaded, 10);
      if (!wait_loaded) {
        alert("failed to load video");
        return
      }

      // Seek
      let check_seek = async ()=>{
        await vm.ytplayer.seekTo(start); // return player
        let current_time = await vm.ytplayer.getCurrentTime();

        let msg = `seek to ${this.videoId} ${start} (player.getCurTime: ${current_time}, this.curTime: ${vm.currentTime})`;
        console.log(msg);

        if (Math.abs(current_time - start) <= 1.0) return true;
        return false;
      };
      let sought = await this.waitUntil(check_seek, 5, 500);

      if (!sought) {
        alert("failed to seek video");
        return
      }

      // handle autoplay case
      // actually is playing while !isAutoPlay, set isPlay = true
      let playerState = await this.ytplayer.getPlayerState();
      //console.log(`actually is playing ${playerState}`);
      if (playerState == 1 || playerState == 3 || playerState == 5) this.isPlay = true;


      if (seekOnly) return;

      vm.startPlay();
    },

    async startPlay() {
      this.ytplayer.playVideo();
      await new Promise(resolve => setTimeout(resolve, 100));

      this.isPlay = true;
      this.updateDuration();
    },
    pausePlay() {
      this.isPlay = false;
      this.ytplayer.pauseVideo();
      this.paused();
    },
    async togglePlay() {
      let current_time = await this.ytplayer.getCurrentTime();
      console.log(`toggle, ${this.currentSong}, ${current_time}`);

      if (this.isPlay) {
        this.pausePlay();
      } else {
        this.startPlay();
      }
    },
    changeVolume() {
      // 改變聲音&聲音 Input 顏色
      let volume = parseInt(this.$refs.volume.value);
      if (this.isUnMute && this.volume > 0) {
        this.isUnMute = false;
        this.ytplayer.unMute();
      }
      this.ytplayer.setVolume(volume);
      this.volume = volume;
    },
    changeUnMute() {
      // 靜音&取消靜音
      this.isUnMute = !this.isUnMute;
      if (this.isUnMute) {
        this.volume = 0;
        this.ytplayer.mute();
      } else if (!this.isUnMute) {
        this.volume = 30;
        this.ytplayer.unMute();
      }
    },
    processBarTime(e) {
      // 調整進度條
      let progressWidth = this.$refs.progressBar.offsetWidth;
      let x = e.offsetX;
      this.newTime = Math.floor((x / progressWidth) * this.duration);
      let offset = this.currentSongInfo.start || 0;
      this.ytplayer.seekTo(offset + this.newTime);
    },

  }
};
</script>
<template>
<footer class="fixed-bottom">
  <div class="h-0">
    <youtube :video-id="videoId" loop="isLoop" autoplay="isAutoPlay" ref="youtube" class="youtube" @ended="loopSong"
      @playing="updateDuration" @paused="paused"  @ready="ready" />
  </div>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12 bg-dark py-3 border-top border-dark">
        <div class="row">
          <div class="col-md-10">
            <div class="row">
              <div class="col-md-4 d-flex align-items-center justify-content-left">
                <div class="img-thumb img-cover mr-2" :style="`background-image: url(${publicPath}${currentAlbumImg})`"></div>
                <div class="d-flex flex-column text-left">
                  <div class="text-white d-flex align-items-center mb-1">
                    <h5 class="h5 mb-0">{{currentSong}}</h5>
                  </div>
                  <small class="text-secondary" v-if="musicType!=='Daily Mix'">{{currentSinger}}</small>
                  <small class="text-secondary"
                    v-if="musicType==='Daily Mix'">{{currentPlayList[currentIndex].singer}}</small>
                </div>
              </div>
              <!-- PlayListController -->
              <div class="col-md-8 my-auto">
                <div class="d-flex align-items-center justify-content-center">
                  <!-- 隨機撥放 -->
                  <i class="material-icons mx-md-4 text-secondary" @click="isShuffle = !isShuffle"
                    :class="{'text-success':isShuffle}">shuffle</i>
                  <!-- 上一首 -->
                  <i class="material-icons mx-md-4 text-secondary icon-font-large"
                    @click="changeSong(-1)">keyboard_arrow_left</i>
                  <!-- 撥放||暫停 -->
                  <div class="mx-md-4 text-secondary" @click="togglePlay">
                    <i class="material-icons" style="transform: translateY(4px);font-size:2rem"
                      v-if="!isPlay">play_arrow</i>
                    <i class="material-icons" style="transform: translateY(4px);font-size:2rem" v-else>pause</i>
                  </div>
                  <!-- 下一首 -->
                  <i class="material-icons mx-md-4 text-secondary icon-font-large"
                    @click="changeSong(1)">keyboard_arrow_right</i>
                  <!-- 重複撥放 -->
                  <div class="mx-md-4 text-secondary" @click="isLoop=!isLoop">
                    <i class="material-icons text-secondary" style="transform: translateY(4px)"
                      v-if="!isLoop">repeat</i>
                    <i class="material-icons text-secondary" style="transform: translateY(4px)"
                      :class="{'text-success':isLoop}" v-else>repeat_one</i>
                  </div>
                  <!-- <i class="material-icons mx-md-4 text-secondary">repeat</i> -->
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-secondary mr-2">{{currentTime===undefined ? 0 : currentTime|formatTime}}</small>
                  <div class="progress">
                    <div class="progress__bar" ref="progressBar" @click="processBarTime">
                      <div class="progress__bar__pointer" :style="{'left':timeLine - 1 +'%'}"></div>
                      <div class="progress__bar--fill" :style="{'width':timeLine+'%'}"></div>
                    </div>
                  </div>
                  <small class="text-secondary ml-2">{{duration | formatTime}}</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-2 my-auto">
            <div class="d-flex justify-content-end align-items-center">
              <div @click="changeUnMute">
                <i class="material-icons text-secondary icon-font-large mr-2 pb-2"
                  v-if="!isUnMute&&volume!==0">volume_down</i>
                <i class="material-icons text-secondary icon-font-large mr-2 pb-2"
                  v-else="isUnMute&&volume==0">volume_off</i>
              </div>
              <!-- 調整音量 -->
              <div class="volume w-50">
                <input class="input my-auto" type="range" name="volume" min="0" max="100" :value="volume"
                  @change="changeVolume" @mousemove="changeVolume" @click="changeVolume" ref="volume"
                  :style="{'background':`linear-gradient(90deg, #26de85 ${volume}%, #6c757d ${volume}%`}" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>
</template>


<style lang="scss"></style>
