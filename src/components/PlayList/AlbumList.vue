<template>
  <div>
    <ul class="d-flex flex-column mt-5">
      <li v-for="(type, index) in typeList" :key="type" class="text-white">
        <h3 class="h3 font-weight-bold text-white text-left mb-3">
          {{ type }}
        </h3>
        <div class="d-flex flex-wrap justify-content-start">
        <div class="album-item mb-0 float-md-left mr-2" v-for="(item, index) in playList[type]"
             :key="item.id">
          <div class="d-flex flex-column justify-content-center align-items-center">
            <div class="img-singer-thumb img-cover"
                 :style="`background-image: url(${publicPath}${item.img})`"
                 @click="selectHandler(item, index)">
            </div>
            <small class="text-singer text-white mt-3 text-center">{{ item.name }}</small>
          </div>
        </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "AlbumList",
  props: ["playList", "typeList"],
  data() {
    return {
      publicPath: "./",
      currentIndex: null,
      currentItem: {}
    };
  },
  watch: {
    currentItem(newValue, oldValue) {
      if (oldValue.id !== newValue.id) {
        this.emitHandler(newValue, this.currentIndex);
      }
    }
  },
  methods: {
    selectHandler(item, index) {
      this.currentIndex = index;
      this.currentItem = item;
    },
    emitHandler(item, index) {
      this.$emit("selectSinger", { item, index });
    }
  }
};
</script>

<style lang="scss"></style>
