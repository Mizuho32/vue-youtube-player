<template>
<vue-final-modal v-model="showModal" name="dupAddModal">
  <div
    class="modal bg-dark-50 bd-example-modal-lg d-block"
    id="dupAddModal"
    tabindex="-1"
    role="dialog"
    aria-labelledby="ModalDupAdd"
    aria-hidden="true" @click="closeModal">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document" @click.stop>
      <div class="modal-content d-flex flex-column">
        <div class="d-flex flex-row-reverse justify-content-between" style="height: 2em;">
          <button class="btn btn-danger btn-sm font-weight-bold" aria-label="Close" @click="closeModal">close</button>
          <h3 class="h3 text-white font-weight-bold mb-4">{{title}}</h3>
        </div>
        <div
          class="modal-body text-left text-white p-5 d-flex align-items-left flex-column justify-content-center">
          <!--<h1 class="display-4 font-weight-bold text-success ">
            只要 NT$19.00
          </h1>
          <h1 class="h2 font-weight-bold mb-4">
            即享 3 個月熱門音樂
            </h1>-->
          <h3 class="h3 font-weight-bold mb-4">
            プレイリストの追加先を選択、あるいは新規作成して下さい。
          </h3>
          <p class="text-secondary">
            同時に複数のリストに追加、新規作成できます。
          </p>
          <ul class="list-group pt-4">
            <div v-for="(item,index) in albums" :key="`${index}-type`" class="d-flex justify-content-start">
              <li>
                <div v-if="item.id"><label>{{item.name}}</label><input type="checkbox" v-model="item.checked"></div>
                <div v-else class="input-group mb-3 mt-3">
                  <button class="btn btn-danger" @click="del_album(index)" v-if="item.name && !item.id">-</button>
                  <input class="form-control" type="text" v-model="item.name" placeholder="New..."/>
                  <button class="btn btn-success" @click="add_album(item)">+</button>
                  <input type="checkbox" v-model="item.checked" />
                </div>
              </li>
            </div>
          </ul>
          <button class="btn btn-success my-3 font-weight-bold" @click="make_albums">
            追加と作成
          </button>
        </div>
      </div>
    </div>
  </div>
</vue-final-modal>
</template>
<script>

export default {
  name: 'ModalDupAdd',
  props: ["currentPlayList", "playList"],
  data() {
    return {
      showModal: false,
      title: "追加、または新規作成",
      created_albums: [{name: "", id:"", checked: true}],
      user_albums: [],
    }
  },
  created() {
    //console.log(Object.keys(this.playList));
    this.user_albums = this.playList.user.map( (al)=>{return {name: al.album, id: al.id, checked: false};} );
  },
  computed: {
    albums() {
      return this.created_albums.concat(this.user_albums);
    },
  },
  methods: {
    new_album(name, uuid, songs) {
      // FIXME: imgs
      return {"album":name,"id":uuid,"singer":"Rin","type":"user","img":"/jpg/Rin/playlist_icon.jpg","backgroundImg":"/jpg/Rin/header.jpg","songs": songs};
    },
    make_albums() {
      let uuid2idx = Object.fromEntries(this.user_albums.map((album, idx) => [album.id, idx]));

      this.user_albums.forEach((item, idx) =>{
        if (item.checked) {
          for (let toadd of this.currentPlayList)
            this.playList.user[ uuid2idx[item.id] ].songs.push(toadd); // FIXME: index calc
        }
      });

      this.created_albums.forEach((item, idx)=>{
        if (item.name && item.checked) {
          // FIXME: goodway
          let songs = this.currentPlayList.map((item2,idx2)=>{
            return {"song": item2.song, "videoId": item2.videoId, "duration": item2.duration, "start": item2.start, "end": item2.end, "index": idx2};
          });
          this.playList.user.push(this.new_album(item.name, `uuid ${item.name}`, songs));
        }
      });
      this.created_albums = [{name: "", id:"", checked: true}];
    },
    add_album(item) {
      console.log(this.created_albums);
      if (item.name)
        this.created_albums.splice(0, 0, {name: '', id:'', checked: true});
    },
    del_album(index) {
        this.created_albums.splice(index, 1);
    },

    closeModal(e) {
      this.showModal = false;
    } //close
  }
}
</script>
<style lang="scss" scoped>
</style>
