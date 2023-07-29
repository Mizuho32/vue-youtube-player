import axios from "axios";

export default class BigAlbum {
  #load_songs;

  constructor({name, id, singer, type, img, backgroundImg, version, size, load_size, show_size, increment_size}) {
    this.name          = name;
    this.id            = id;
    this.singer        = singer;
    this.type          = type;
    this.img           = img;
    this.backgroundImg = backgroundImg;
    this.version       = version;
    this.album_size    = size;
    this.load_size     = load_size;
    this.show_size     = show_size;
    this.increment_size= increment_size;

    this.load_range  = [0, load_size];
    this.songs_range = [0, show_size];
    this.#load_songs = []
    this.songs = [];
  }

  async init_songs() {
    if (!this.#load_songs.length) {
      this.#load_songs = await this.range_get(this.load_range);
      this.songs = this.slice_songs();
    }
  }

  async incremental_load(append = true) {
    let delta = this.increment_size * Math.pow(-1, Number(!append));
    let [start, end] = this.songs_range;

    if ( (end < this.album_size && delta > 0) || (start > 0 && delta < 0) ) {
      let new_song_range = [start + delta, end + delta];

      await this.incremental_get(new_song_range);
      this.songs_range = new_song_range;
      this.songs = this.slice_songs();

      //console.log("lr", this.load_range, this.load_range[1]-this.load_range[0], this.#load_songs.length);
      //console.log("this.songs", this.songs, this.songs.length);
    }
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
        this.#load_songs.splice(0,inc_gotten.length);
        this.load_range = this.load_range.map(elm=>elm + inc_gotten.length);
      } else {
        this.#load_songs.splice(0, 0, ...inc_gotten);
        this.#load_songs.splice(-inc_gotten.length, inc_gotten.length);
        this.load_range = this.load_range.map(elm=>elm - inc_gotten.length);
      }
    }
  }

  // [start, end]
  async range_get(range) {
      // {list_id: {indices:[], ranges:[[start,end],..]}}
      let query = {};
      query[this.id] = {ranges:[ [range[0], range[1]-1] ]};

      const res = await axios.post("./api/songs", {query: query});
      const data = res.data;
      console.log("songs", data);

      if (data.status == "fail") return [];
      return data.return[this.id];
  }

  /*get songs() {
    return this.#load_songs;
  }*/
}
