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
  props: ["Album"],
  data() {
    return {
      //Album: undefined, // same as PlayList, songs
      currentPopoverIndex: -1,
      player: undefined,
    };
  },
  components: {
    PlayListItem,
  },
  computed: {
    currentPlayList() {
      if (this.Album) return this.Album;
      return [];
    },
    isBuffering() {
      if (this.player) return this.player.isBuffering;
      return false;
    },
    currentIndex() {
      if (this.player) return this.player.currentIndex;
      return 0;
    }
  },
  methods: {
    reset(album, player) {
      //this.Album = album;
      this.player = player;
    },
    showPopovers(index) {
      this.currentPopoverIndex = index;
      setTimeout(() => {
        this.currentPopoverIndex = -1;
      }, 4000);
    },
    selectSong({ item, index }) {
      if (! this.player ) return;

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
