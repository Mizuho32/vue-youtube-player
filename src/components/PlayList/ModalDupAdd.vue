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
            {{songs2add.length}}件の追加先を選択、あるいは新規作成して下さい。
          </h3>
          <p class="text-secondary">
            同時に複数のリストに追加、新規作成できます。
          </p>
          <ul class="list-group pt-4">
            <div v-for="(item,index) in albums" :key="`${index}-type`" class="d-flex justify-content-start">
              <li>
                <div v-if="item.id"><label>{{item.name}}</label><input type="checkbox" v-model="item.checked"></div>
                <div v-else class="input-group mb-3 mt-3">
                  <input class="form-control" type="text" v-model="item.name" placeholder="New..."/>
                  <button class="btn btn-danger"  @click="del_album(index)" v-if="!item.not_added">-</button>
                  <button class="btn btn-success" @click="add_album(item)"  v-if="item.not_added">+</button>
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

const item_tmpl = {name: "", id:"", checked: true, not_added: true};

export default {
  name: 'ModalDupAdd',
  props: ["currentPlayList", "playList"],
  data() {
    return {
      showModal: false,
      title: "追加、または新規作成",
      created_albums: [{...item_tmpl}],
    }
  },
  created() {
    //console.log(Object.keys(this.playList));
    console.log(this.ytify);
  },
  computed: {
    user_albums(){
      return this.playList.user.map( (al)=>{return {name: al.album, id: al.id, checked: false};} );
    },
    albums() {
      return this.created_albums.concat(this.user_albums);
    },
    ytify() {
      return this.$root.$children[0].$children[0];
    },
    songs2add() {
      return this.currentPlayList.filter(item => !this.$parent.is_edit_mode || item.checked);
    },
  },
  methods: {
    new_album(name, uuid, songs) {
      // FIXME: imgs
      return {"album":name,"id":uuid,"singer":"Rin","type":"user","img":"/jpg/Rin/playlist_icon.jpg","backgroundImg":"/jpg/Rin/header.jpg","songs": songs};
    },

    async make_albums() {

      // calc user_id, list_ids, names, songs to add
      const user_id = this.ytify.$data.user_id;
      console.log("user_id", user_id);

      const id2name = Object.fromEntries(
        this.albums
          .filter(item => item.name && item.checked)
          .map(item => [item.id || crypto.randomUUID(), item.name]));
      // edit_mode => checked
      const data = {
        user_id: user_id, list_ids: Object.keys(id2name), names: Object.values(id2name),
        videos: this.songs2add
          .map(item=>({"video_id": item.videoId, "video_start": item.start, "video_end": item.end}))
      };

      //{:user_id=>"test",
      //     :list_ids=>["uuid1"],
      //     :names=>["name1"],
      //     :videos=>[{:video_id=>"v1", :video_start=>46, :video_end=>536}]}
      console.log("send", data);
      //return;

      const response = await this.axios.post('./api/create_lists', data)

      //{"status"=>"ok", "return"=>{"uuid1"=>{"next_index"=>0, "fails"=>[]}}}
      console.log('receive', response.data);


      if (response.data.status !== "ok") {
        alert(`DBへの追加でエラー\n${response.data}`);
        return;
      }

      ///// Index calculation ////
      // FIXME: should be replaced by enhanced album system
      const songs_added_uuids = response.data.return;
      // for existing user playlists
      const uuid2idx = Object.fromEntries(this.user_albums.map((album, idx) => [album.id, idx]));

      Object.keys(songs_added_uuids).forEach(uuid => {
        const obj = songs_added_uuids[uuid]
        let next_index = obj.next_index;
        const fails = obj.fails;

        const album_index = uuid2idx[uuid];
        let album2add = undefined;

        if (album_index >= 0) {
          album2add = this.playList.user[album_index];
        } else {
          album2add = this.new_album(id2name[uuid], uuid, []);
          this.playList.user.push(album2add);
        }

        this.songs2add.forEach( (song2add, idx) => {
          let copied = { ...song2add }; //FIXME: checked is also copied

          if (fails[0] != idx) {
            copied.index = next_index++;
            console.log(copied.index, copied);
            album2add.songs.push(copied);
          } else {
            fails.splice(0, 1); // remove first
          }
        });

      });

      this.created_albums = [{...item_tmpl}];
    },
    add_album(item) {
      //console.log(this.created_albums);
      if (item.name) {
        delete item.not_added
        this.created_albums.splice(0, 0, {...item_tmpl});
      }
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
