import axios from "axios";
import utils from "./utils.js";

export default class BigAlbum {
  #load_songs;

  constructor({name, id, singer, type, img, backgroundImg, version, size, load_size, show_size, increment_size, vm,
    songs = [], searchQuery = ""}) {
    this.name          = name;
    this.id            = id;
    this.singer        = singer;
    this.type          = type;
    this.img           = img;
    this.backgroundImg = backgroundImg;
    this.version       = version ? new Date(version) : undefined;
    this.album_size    = size;
    this.load_size     = load_size;
    this.show_size     = show_size;
    this.increment_size= increment_size;

    this.load_size   = load_size;
    this.songs_size  = show_size;
    this.load_range  = [0, load_size];
    this.songs_range = [0, show_size];
    this.#load_songs = []
    this.songs = songs;

    this.index = 0;
    this.currentSongInfo = undefined;

    this.vm = vm;
    this.searchQuery = searchQuery;
  }

  async init_songs() {
    if (this.id) {
      const user_id = this.ytify().$data.user_id;
      let updated = false;

      if (user_id) { // when no user
        const chk = await utils.methods.checkVersion(axios, user_id, [this]);
         updated = chk.length;
      }

      if (!this.#load_songs.length || updated) {
        this.ytify().$data.listloading = true;

        if (updated)  {
          // Get new size
          await this.update();

          // start idx of load s.t. end is in [0, album_size]
          let start = Math.min(this.index, this.album_size-this.load_size);
          start = Math.max(0, start);
          this.load_range = [start, start+this.load_size];
        }

        this.#load_songs = await this.range_get(this.load_range);
        this.songs = this.slice_songs();
        console.log("init album", this.load_range, this.songs_range);
        this.set_currentSongInfo();

        // false after 2sec
        utils.methods.waitUntil(()=>{
          this.ytify().$data.listloading = false;
          return true;
        }, 2, 2000);
      }

    }
  }

  async update() {
    // {user_id: "", list_ids:[""]}
    const query = {user_id: this.ytify().$data.user_id, list_ids:[this.id]};
    const ret = await axios.post("./api/albums", query);
    const album = ret.data.return[this.id];
    console.log("update", album);

    this.name = album.name
    this.version = new Date(album.version);
    this.album_size = album.size;
  }

  async incremental_load(append = true) {
    if (!this.lock) this.lock = true;
    else return;

    let delta = this.increment_size * Math.pow(-1, Number(!append));
    let [start, end] = this.songs_range;

    if ( (end < this.album_size && delta > 0) || (start > 0 && delta < 0) ) {
      let new_song_range = [start + delta, end + delta];

      await this.incremental_get(new_song_range);

      this.songs_range = new_song_range;
      this.songs = this.slice_songs();

      this.ytify().playlist.scrollNItems(delta);

      //console.log("lr", this.load_range, this.load_range[1]-this.load_range[0], this.#load_songs.length);
      //console.log("this.songs", this.songs, this.songs.length);
    }

    await utils.methods.waitUntil( ()=>true, 0.5, 500);
    this.lock = false;
  }

  ytify() {
    return this.vm.$root.$children[0].$children[0];
  }

  slice_songs() {
    let start = this.load_range[0];
    let range = this.songs_range.map(elm => elm-start);
    //console.log("slice　range", range);
    return this.#load_songs.slice(...range)
  }

  async incremental_get(new_song_range) {
    let [start, end] = new_song_range;
    let [lstart, lend] = this.load_range;
    let inc_range = undefined;
    let append = true;

    if (end > lend) {
      inc_range = [lend, end];
    } else if (start < lstart) {
      inc_range = [start, lstart]
      append = false;
    }

    if (inc_range) {
      let inc_gotten = await this.range_get(inc_range);
      if (append) {
        this.#load_songs.push(...inc_gotten);
        this.#load_songs.splice(0, inc_gotten.length);
        this.load_range = this.load_range.map(elm=>elm + inc_gotten.length);
      } else {
        this.#load_songs.splice(0, 0, ...inc_gotten);
        this.#load_songs.splice(-inc_gotten.length, inc_gotten.length);
        this.load_range = this.load_range.map(elm=>elm - inc_gotten.length);
      }
    }
  }

  // [start, end)
  async range_get(range) {
    if (!this.id) return;

      // {list_id: {indices:[], ranges:[[start,end],..]}}
      let query = {};
      query[this.id] = {ranges:[ [range[0], range[1]-1] ]};

      const res = await axios.post("./api/songs", {query: query});
      const data = res.data;
      console.log("songs", data);

      if (data.status == "fail") return [];
      return data.return[this.id];
  }

  async setIndex(index) {
    index = Math.min(this.album_size-1, Math.max(0, index)); // 0 <= index < size

    let [min, max] = this.songs_range;
    if (this.id && !(min <= index && index < max)) {
      if (index == this.index + 1 && index >= max) {
        await this.incremental_load(); // append
      } else if (index == this.index - 1 && index < min) { // index < min
        await this.incremental_load(false); // prepend
      } else {
        let next = await this.range_get([index, index+1]);
        this.vm.$set(this, "currentSongInfo", next[0]);
      }
    }

    this.vm.$set(this, "index", index);
    this.set_currentSongInfo();
  }

  set_currentSongInfo() {
    if (!this.id) {
      this.vm.$set(this, "currentSongInfo", this.songs[this.index]);
      return;
    }

    let [min, max] = this.load_range;
    if (min <= this.index && this.index < max) {
      this.vm.$set(this, "currentSongInfo", this.#load_songs[this.index - min]);
    }
  }

  set size(size) {
    this.album_size = size;
  }
}
