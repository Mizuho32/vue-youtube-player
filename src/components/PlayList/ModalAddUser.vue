<template>
<vue-final-modal v-model="showModal" name="addUserModal">
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
          <h3 class="h3 text-white font-weight-bold ml-4 mt-4">{{title}}</h3>
        </div>
        <div
          class="modal-body text-left text-white p-5 d-flex align-items-left flex-column justify-content-center">
          <h3 class="h3 font-weight-bold mb-4">
            URLを貼り付け
          </h3>
          <input class="form-control" v-model="ytify.$data.user_id" />
          <button class="btn btn-success my-3 font-weight-bold" @click="check">
            作成
          </button>
        </div>
      </div>
    </div>
  </div>
</vue-final-modal>
</template>
<script>

//const item_tmpl = {name: "", id:"", checked: true, not_added: true};

export default {
  name: 'ModalAddUser',
  props: [],
  data() {
    return {
      showModal: false,
      title: "アカウント",
      authed: false,
    }
  },
  created() {
    //console.log(Object.keys(this.playList));
    console.log(this.ytify);
  },
  computed: {
    ytify() {
      return this.$root.$children[0].$children[0];
    },
    user_id() {
      return this.ytify.$data.user_id;
    }
  },
  methods: {
    async check() {
      const response = await this.axios('/api/valid_folder_id', 
        { params: {id: encodeURIComponent(this.user_id)}});

      console.log(response.data);

      if (response.data.status == "ok") {
        this.authed = true;
        this.ytify.$data.user_id = response.data.return;

        // change url
        const url = new URL(location.href);
        url.searchParams.set('uid', this.user_id);
        history.pushState({}, '', url);

        //bookmark促す
        alert("作成完了。この画面でブックマークして下さい");

        // cookie
        document.cookie = `user_id=${encodeURIComponent(this.user_id)}`;

        // url param delete
        url.searchParams.delete('uid');
        history.pushState({}, '', url);

        this.closeModal();
      } else {
        alert("フォルダの確認失敗。権限を見直して下さい");
      }
    },
    closeModal(e) {
      this.showModal = false;

      if (!this.authed) {
        this.ytify.$data.user_id = "";
        this.ytify.$data.icon = "lock";
      } else {
        this.ytify.$data.icon = "headset";
      }
    } //close
  }
}
</script>
<style lang="scss" scoped>
</style>
