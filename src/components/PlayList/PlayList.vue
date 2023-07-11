<template>
<div>
<!-- List UIs -->
<div class="d-flex">
  <div v-if="is_edit_mode">
    <input type="checkbox" v-model="all_check"/>
    <button class="btn btn-danger" @click="deleteSong">削除</button>
  </div>
  <button class="btn btn-success" data-toggle="button" aria-pressed="false" autocomplete="off" @click="edit_list">編集</button>

  <ModalDupAdd :playList=playList :currentPlayList=currentPlayList ref="modal"/>
  <button class="btn btn-success" @click="dupAddList">追加</button>
</div>

<ul class="list-group pt-4">
  <!-- 喜歡的歌曲 -->
  <template v-if="currentPlayList && currentPlayList.length>0">
    <div v-for="(item,index) in currentPlayList" :key="`${index}-${item.song}`" class="d-flex justify-content-start">
    <input type="checkbox" v-if="is_edit_mode" v-model="item.checked"/>
    <PlayListItem :item="item" :index="item.index || index"
      :isBuffering="isBuffering" :currentIndex="currentIndex" @selectSong="selectSong" @showPopovers="showPopovers" v-if="item.song" class="flex-fill">
    <a class="position-absolute pop text-white" :href="`https://www.youtube.com/watch?v=${item.videoId}&t=${item.start}`" target="_blank"
        style="top: 24px;left: -40px;" v-show="currentPopoverIndex === index">Youtube
      </a>
    </PlayListItem>
    </div>
  </template>
  <div v-else>沒有相關歌曲。</div>
</ul>

</div>
</template>

<script>

import PlayListItem from "./PlayListItem";
import ModalDupAdd from "./ModalDupAdd";


export default {
  name: "PlayList",
  props: ["playList", "playlist_datas", "player", "name", "p2a", "init"],
  data() {
    return {
      currentPopoverIndex: -1,
      all_check: false,
      /*
      Album: undefined,
      AlbumImg: "",
      Index: 0,
      Song: undefined,
      SongInfo: undefined,
      Singer: undefined,*/
    };
  },
  components: {
    PlayListItem,
    ModalDupAdd,
  },
  created: function () {
    this.playListData = this.playlist_datas[this.name];
  },
  mounted: function () {
  },
  watch: {
    all_check() {
      for (let item of this.currentPlayList) {
        this.$set(item, "checked", this.all_check);
      }
    },
  },
  computed: {
    currentPlayList() {
      let data = this.playlist_datas[this.name];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]].songs;
      return [];
    },
    isBuffering() {
      if (this.player) return this.player.isBuffering || !this.player.isLoaded;
      return false;
    },
    currentIndex() {
      let data = this.playlist_datas[this.name];
      return data.currentIndex;
    },
    is_edit_mode() {
      return this.playlist_datas[this.name].edit_mode;
    }
  },
  methods: {
    dupAddList() {
      this.$refs.modal.title = "";
      this.$vfm.show('dupAddModal');

      // empty?
      // system?
      // index calc
      // mark as edited
      //失敗時にJSONで表示
    },
    deleteSong() {
      // compare
      let new_idx = 0, new_indices = Array(this.currentPlayList.length);
      this.currentPlayList.forEach((item, idx)=>{
        if (!item.checked) {
          new_indices[idx] = new_idx;
          new_idx++;
        }
      });
      let num2del = new_indices.length - new_idx;
      if (num2del === 0) return;

      // currentIndex will affected
      let cur_del_confirmed = false;
      let nextIndex = this.currentIndex;

      if (this.name == this.p2a) { // playing
        if (new_indices[this.currentIndex] === undefined) { // currentIndex will deleted
          cur_del_confirmed = confirm(`現在の再生を停止して${num2del}件を削除します。`);
          if (!cur_del_confirmed) return;
          nextIndex = 0;
        } else if (new_indices[this.currentIndex] !== this.currentIndex) { // will change
          nextIndex = new_indices[this.currentIndex];
        }
      }

      //confirm
      if (!cur_del_confirmed) {
        if (!confirm(`${num2del}件を削除します。`)) return;
      } else {
        console.log("stopDUr, pause, curT = 0");
        this.player.stopUpdateDuration();
        this.player.pausePlay();
        this.player.currentTime = 0;
      }

      console.log({nextIndex});
      this.$set(this.targetPlayListData(this.name), "currentIndex", nextIndex);


      // delete
      //console.log("Delete");
      let album = this.get_currentAlbum();
      if (Object.keys(album).length !== 0) {
        this.$set(album, "songs", album.songs.filter(item => !item.checked));
      }
    },
    edit_list() {
      let pl_type = this.get_currentAlbum()?.type;
      if (pl_type == "preset") {
        alert("presetは編集できません");
        return;
      }

      if (!this.is_edit_mode) {
        for (let item of this.currentPlayList){
          this.$set(item, "checked", false);
        }
      }
      this.$set(this.playListData, "edit_mode", !this.is_edit_mode);
    },
    showPopovers(index) {
      this.currentPopoverIndex = index;
      setTimeout(() => {
        this.currentPopoverIndex = -1;
      }, 4000);
    },
    selectSong({ item, index }) {
      console.log(`selectSong ${index} in ${this.name} p2a is ${this.p2a}`);
      if (! this.player ) return;

      this.player.stopUpdateDuration();
      this.player.pausePlay();
      this.player.currentTime = 0;

      if (this.name == this.p2a) {
        this.player.changeIndexAndVideo(index);
      } else {
        this.$emit("update_p2a", this.name);
        this.init({playlist_name: this.name, currentIndex: index, albumIndex: this.targetPlayListData(this.name).albumIndex});
      }

      if (this.musicType === "Daily Mix") {
        this.currentSinger = this.currentPlayList[this.currentIndex].singer;
      }

      this.$nextTick(function() {
        this.player.autoPlay();
      });
    },
    get_currentAlbum(name = this.name) {
      let data = this.playlist_datas[name];

      if (this.playList[data["musicType"]])
        return this.playList[data["musicType"]][data["albumIndex"]];
      return {};
    },
    targetPlayListData(name) {
      return this.playlist_datas[name];
    },
  }
};
</script>
