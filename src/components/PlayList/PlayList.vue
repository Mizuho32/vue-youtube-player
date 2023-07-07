<template>
<ul class="list-group pt-4">
  <!-- 喜歡的歌曲 -->
  <template v-if="currentPlayList && currentPlayList.length>0">
    <PlayListItem v-for="(item,index) in currentPlayList" :key="`${index}-${item.song}`" :item="item" :index="index"
      :isBuffering="isBuffering" :currentIndex="currentIndex" @selectSong="selectSong" @showPopovers="showPopovers" v-if="item.song">
      <a class="position-absolute pop text-white" :href="'https://www.youtube.com/watch?v='+item.videoId" target="_blank"
        style="top: 24px;left: -40px;" v-show="currentPopoverIndex === index">Youtube
      </a>
    </PlayListItem>
  </template>
  <div v-else>沒有相關歌曲。</div>

</ul>
</template>

<script>
import PlayListItem from "./PlayListItem";

export default {
  name: "PlayList",
  props: ["playList", "playlist_datas", "player", "name", "p2a", "init"],
  data() {
    return {
      currentPopoverIndex: -1,
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
  },
  created: function () {
  },
  mounted: function () {
    //console.log('mounted');
    //console.log(this.player);
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
    }
  },
  methods: {
    showPopovers(index) {
      this.currentPopoverIndex = index;
      setTimeout(() => {
        this.currentPopoverIndex = -1;
      }, 4000);
    },
    selectSong({ item, index }) {
      console.log(`selectSong ${index} ${this.name} ${this.p2a}`);
      if (! this.player ) return;

      this.player.stopUpdateDuration();
      this.player.pausePlay();
      this.player.currentTime = 0;

      if (this.name == this.p2a) {
        this.player.changeIndexAndVideo(index);
      } else {
        this.$emit("update_p2a", this.name);
        this.init({playlist_name: this.name, currentIndex: index});
      }

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
