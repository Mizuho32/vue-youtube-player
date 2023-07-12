export default {
	computed:{
	},
	methods: {
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
        vm.$set(vm.playList, k, v);
        for (let album of v) {
          const ver = album.version;
          vm.$set(album, "version", ver ? new Date(ver) : undefined);
        }
      }
    },
	}
}
