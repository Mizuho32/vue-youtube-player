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
import ModalAddUser from "./ModalAddUser";

import utils from './utils'
import BigAlbum from './bigalbum'

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
      playList: {user: [], preset: [], search_result: [
        new BigAlbum({name: "search", type: "search_result", songs:[], searchQuery: "", vm: this})
      ]},
      playListStatus: "OVERVIEW",
      publicPath: "./",

      playlist_datas: {
        main:   {musicType: "preset",        albumIndex: 0, currentIndex: 0},
        search: {musicType: "search_result", albumIndex: 0, currentIndex: 0},
      },
      playlist2attach: "main",


      //for UI
      backuping: false,
      listloading: true,
      tallmode: window.innerHeight > window.innerWidth,
    };
  },
  components: {
    PlayListFollowerBtn,
    AlbumList,
    Search,
    Player,
    PlayList,
    RelatedItem,
    ModalAddUser,
  },
  async created() {
    const url = new URL(location.href);
    const url_params = url.searchParams;
    this.user_id = url_params.get("uid") || "";

    if (url_params.has("uid")) { // user_id given
      const response = await axios.get("./api/check_user", { params: {user_id: this.user_id} });

      if (response.data.status == "ok") { // exists in DBV
        document.cookie = `user_id=${encodeURIComponent(this.user_id)}`;
        // url param delete
        url.searchParams.delete('uid');
        history.pushState({}, '', url);
      } else { // newly create
        this.$vfm.show('addUserModal');
      }

    } else { //  not given. lookfor cookie
      // from cookie
      for (let kv of document.cookie.split(/;\s+/)) {
        const [k, v] = kv.split("=");
        v = decodeURIComponent(v);
        if (k == "user_id") {
          const response = await axios.get("./api/check_user", { params: {user_id: v} });
          if (response.data.status == "ok") {
            this.user_id = v;
          } else {
            this.user_id = "";
          }
        }
      }
    } // end if
    console.log(`Wellcome '${this.user_id}'`);

    let vm = this;
    await this.loadPlaylist(vm, axios, "./api/preset");

    if (this.user_id) {
      const params = {user_id: this.user_id};
      await this.loadPlaylist(vm, axios, "./api/user", { params });
    }

    //console.log("created", this.currentSongInfo);

    await vm.init({});
    vm.player.ytplayer.setVolume(vm.player.volume);

    document.querySelector("div.playlist").addEventListener('scroll', event => {
      const {scrollHeight, scrollTop, clientHeight} = event.target;

      if (this.navbar == "Playlist" && !this.currentPlayListData.edit_mode) {
        if (Math.abs(scrollHeight - clientHeight - scrollTop) < 1) {
          this.currentAlbum.incremental_load();
        } else if (scrollTop < 1) {
          this.currentAlbum.incremental_load(false);
        }
      }
    });
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
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
    currentAlbum() {
      const data = this.currentPlayListData;
      const album = this.playList?.[data["musicType"]]?.[data["albumIndex"]];

      return album;
    },
    currentIndex() {
      return this.currentAlbum?.index || 0;
    },
    currentSinger() {
      const singer = this.currentAlbum?.singer;

      if (singer)
        return singer;
      return "-";
    },
    currentSong() {
      return this.currentSongInfo?.song || "";
    },
    currentSongInfo() {
      return this.currentAlbum?.currentSongInfo || {};
    },
    videoId() {
      return this.currentSongInfo?.videoId || "";
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
    async backup() { // drive
      let save_name = prompt("名前を入力。空の場合時刻で名前付け");
      if (save_name == null) return;

      this.backuping = true;

      save_name = save_name || (new Date()).toISOString();

      console.log(save_name);
      const response = await this.axios.post('./api/backup', {user_id: this.user_id, save_name: save_name});

      this.backuping = false;
      console.log(response.data);

      if (response.data.status == "ok") {
        alert(`バックアップ完了\n${response.data.msg}`);
      } else {
        alert(`エラー\n${response.data.msg}`);
      }
    },
    checkPopovers($event) {
      if ($event.target.nodeName !== "I") {
        this.currentPopoverIndex = -1;
      }
    },
    async init({playlist_name = "main", musicType = undefined, albumIndex = 0, currentIndex = 0, autoplay = false}) {
      console.log(`init ${playlist_name} to ${musicType}, ${albumIndex}`);
      this.player?.stopUpdateDuration();
      this.player?.pausePlay();

      let pl = this.playList;
      let set_musicType = musicType || this.musicType || Object.keys(pl)[0];

      this.$set(this.playlist_datas[playlist_name], "musicType"   , set_musicType);
      this.$set(this.playlist_datas[playlist_name], "albumIndex"  , albumIndex);
      this.$set(this.playlist_datas[playlist_name], "currentIndex", currentIndex);


      let item = this.playList[this.musicType][this.albumIndex];
      this.currentBackGround = this.publicPath + item.backgroundImg;
      //console.log(`YT init to `, {pld: this.currentPlayListData});

      await this.currentAlbum.init_songs();

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
    onResize() {
      if (window.innerHeight > window.innerWidth) { //tall
        this.tallmode = true;
      } else {
        this.tallmode = false;
      }
    },
    async selectSinger({ item, index }) {
      if ( item.id === this.playList[this.musicType][this.albumIndex].id && this.isPlay ) return;

      //this.albumIndex = index;
      this.playlist2attach = "main";
      await this.init({playlist_name: this.playlist2attach, musicType: item.type, albumIndex: index, autoplay: true});
      console.log("selectSinger, p2a is ", this.playlist2attach);

      /*if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }*/

      this.$nextTick(function() {
        this.player.autoPlay();
        this.navbar = "Playlist";
      });
    },
  }
};
</script>
<template src="./template.html"></template>
<style lang="scss"></style>
