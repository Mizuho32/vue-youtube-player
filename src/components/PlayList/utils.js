import BigAlbum from './bigalbum'

export default {
	computed:{
	},
	methods: {
    newAlbum(vm, album) {
      return new BigAlbum({...album, load_size: 30, show_size: 20, increment_size: 10, vm: vm});
    },
		waitUntil(cond, timeout = 10, delta = 100) { // sec, millisec
			let tsum = 0;
			return new Promise(resolve => {
				const interval = setInterval(async () => {
					tsum += delta;

					let condition = await cond();
					if (await cond() || tsum > timeout*1000) { // OK or timeout
						clearInterval(interval);
						resolve(condition); // return
					}
				}, delta);
			});
		}, // waitUntil
    async loadPlaylist(vm, axios, path, params = {}){
      const response = await this.axios.get(path, params);

      for (let [k,v] of Object.entries(response.data)) {

        vm.$set(vm.playList, k,
          v.map(album => this.newAlbum(vm, album)));
          //v.map(album => new BigAlbum({...album, ...{load_size: 100, show_size: 50, increment_size: 20}})));
      }
    }, //
    // album should has id, version
    async checkVersion(axios, user_id, albums) { // albums -> inconsistent albums
        const version_query = {user_id: user_id, list_ids: albums.map(al=>al.id)};
        const response = await axios.post('./api/versions', version_query);
        const db_pl_versions = response.data.return.map(v=>new Date(v)); // versions

        console.log("check vers q, r, cur", version_query, db_pl_versions, albums.map(a=>a.version));

        return albums
          .map((al, idx) => ({al: al, ver: db_pl_versions[idx]}) )
          .filter(({al, ver}) => (ver?.getTime() != al?.version?.getTime()) );

    }, //
	}
}
