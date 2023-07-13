<template>
<div>
<!-- List UIs -->
<div class="d-flex flex-column">
  <div class="d-flex flex-row">
  <div v-if="is_edit_mode" class="d-flex flex-row">
    <input type="checkbox" v-model="all_check"/>
  </div>

  <div class="input-group">
    <div class="input-group-prepend" v-if="is_edit_mode">
      <button class="btn btn-danger material-icons ml-2" @click="deleteSong">delete</button>
    </div>
    <input class="form-control font-weight-bold text-center" type="text" v-model="get_currentAlbum().album"
    :readonly="!is_edit_mode">
    <div class="input-group-append">
      <button class="btn btn-success material-icons" data-toggle="button" aria-pressed="false"
        autocomplete="off" @click="edit_list">edit</button>
    </div>
  </div>
  <button class="btn btn-success material-icons" @click="dlList">list_alt</button>
  <button class="btn btn-success material-icons" @click="dupAddList">content_copy</button>
  </div>
  <div>
    <button class="btn btn-danger mt-2" @click="deleteList" v-if="is_edit_mode">
      <span>Delete List</span>
      <i class="material-icons">delete_forever</i>
    </button>
  </div>

  <ModalDupAdd :playList=playList :currentPlayList=currentPlayList ref="modal"/>
</div>

<ul class="list-group pt-4">
  <!-- 喜歡的歌曲 -->
  <template v-if="currentPlayList && currentPlayList.length>0">
    <div v-if="dl_list_mode">

      <a class="btn btn-success material-icons" :href="dl_list_href" :download="dl_list_name">save_alt</a>
      <textarea :value="dl_list_csv" style="width: 100%; height:50vh;"></textarea>
    </div>
    <div v-for="(item,index) in currentPlayList" :key="`${index}-${item.song}`" class="d-flex justify-content-start" v-else>
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

const empty_album = {album: "-", type: "preset"};

export default {
  name: "PlayList",
  props: ["playList", "playlist_datas", "player", "name", "p2a", "init"],
  data() {
    return {
      currentPopoverIndex: -1,
      all_check: false,
      dl_list_mode: false,
      dl_list_csv: "",
      dl_list_href: "",
      dl_list_name: "リストのダウンロード",
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
      const data = this.playlist_datas[this.name];
      const songs = this.playList?.[data["musicType"]]?.[data["albumIndex"]]?.songs

      return songs || [];
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
    },
    ytify() {
      return this.$root.$children[0].$children[0];
    },
  },
  methods: {
    async checkConsist() {
      let album = this.get_currentAlbum();
      // empty or search_result
      if (Object.keys(album).length == 0 || album?.type == "search_result") return true;

      const wrongs = await this.checkVersion(this, this.axios, this.ytify.$data.user_id, [album]);
      if (wrongs.length > 0) {
        alert("DBとプレイリストバージョンが整合しません");
        return false;
      }
      return true;
    },
    async dupAddList() {
      if (!await this.checkConsist()) return;


      this.$refs.modal.title = "";
      this.$vfm.show('dupAddModal');

      // TODO
      // empty?
      // system?
      // index calc
      // mark as edited
      // 失敗時にJSONで表示
    },
    async deleteList() {
      const confirmed = confirm("リストを削除しますか?");
      if (!confirmed) return;

      const playlist_data = this.targetPlayListData(this.name);
      const musicType = playlist_data["musicType"], albumIndex = playlist_data["albumIndex"];
      if (musicType != "user") return;

      let album = this.playList[musicType][albumIndex];
      console.log("DELETE LIST", album.album, album.id)

      // delete from DB
      const user_id = this.ytify.$data.user_id;
      const list_ids = [album.id];
      const del_query = { user_id, list_ids };
      const response = await this.axios.post('./api/delete_lists', del_query);
      console.log("delete list res", response.data);

      // delete from UI
      this.player.stopUpdateDuration();
      this.player.pausePlay();
      this.player.currentTime = 0;

      this.playList?.[musicType]?.splice(albumIndex, 1);
    },
    async deleteSong() {
      if (!await this.checkConsist()) return;

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

      // check currentIndex will affected?
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

      // delete
      let album = this.get_currentAlbum();
      if (Object.keys(album).length !== 0) { // not empty

        // FIXME: if big album is needed
        //        should be replaced by enhanced album system
        const del_idx = album.songs.filter(item => item.checked).map(item => item.index);

        let res_data = undefined;
        if (this.get_currentAlbum()?.type != "search_result") { // delete from DB
          // send e.g. {:user_id=>, :list_id=>, :indices=>[1, 3]}
          const del_query = {user_id: this.ytify.$data.user_id, list_id: album.id, indices: del_idx}
          console.log("send", del_query);
          const response = await this.axios.post('./api/delete_items', del_query);
          console.log("receive", response.data);

          if (response.data.status !== "ok") {
            alert(`アイテム削除でエラー\n${response.data}`); return;
          }

          res_data = response.data;
          album.version = new Date(res_data.return.version);
          // {:from=>[3], :to=>[2]}
          //idx_changes = response.data.return;
        }

        this.$set(album, "songs", album.songs.filter(item => !item.checked));

        if (res_data.status == "ok") { // DB change and index calc
          let idx_changes = res_data.return;
          let from = idx_changes.from, to = idx_changes.to;
          const min_del_idx = del_idx.sort((a,b)=>a-b)[0];

          console.log("from", from);
          album.songs.sort((a,b) =>a-b).forEach((item, idx) =>{
            if (item.index < min_del_idx) return; // continue

            if (from.length > 0) {
              if (item.index == from[0]) {
                item.index = to[0];
                from.splice(0, 1);
                to.splice(0, 1);
              }
            } else {
              item.index = item.index - del_idx.length;
            }
          });
        }
      }

      console.log({nextIndex});
      this.$set(this.targetPlayListData(this.name), "currentIndex", nextIndex);
    },
    dlList() {
      this.dl_list_mode = !this.dl_list_mode;

      const escape = text => `"${text.replace(/\"/g, '\"\"')}"`;

      const csvMain = this.currentPlayList.map(item => {
        return [escape(item.song), escape(item.videoId), item.start, item.end].join(",");
      }).join("\n");
      this.dl_list_csv = csvMain;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += '\uFEFF';
      csvContent += csvMain;

      let encodedUri = encodeURI(csvContent);
      this.dl_list_href = encodedUri;
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
      const album = this.playList?.[data["musicType"]]?.[data["albumIndex"]];

      return album || empty_album;
    },
    targetPlayListData(name) {
      return this.playlist_datas[name];
    },
  }
};
</script>
