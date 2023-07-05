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
		},
	}
}
