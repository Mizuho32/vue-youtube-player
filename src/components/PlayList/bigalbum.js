import axios from "axios";

export default class BigAlbum {
  #load_songs;

  constructor({name, id, singer, type, img, backgroundImg, version, album_size, load_size, show_size, increment_size}) {
    this.name          = name;
    this.id            = id;
    this.singer        = singer;
    this.type          = type;
    this.img           = img;
    this.backgroundImg = backgroundImg;
    this.version       = version;
    this.album_size    = album_size;
    this.load_size     = load_size;
    this.show_size     = show_size;
    this.increment_size= increment_size;

    this.#load_songs = []
    this.songs = [];
  }

  async init_songs() {
    if (!this.#load_songs.length) {
      const vm = this;
      // {list_id: {indices:[], ranges:[[start,end],..]}}
      let query = {};
      query[this.id] = {ranges:[[0, this.load_size-1]]};

      const res = await axios.post("./api/songs", {query: query});
      const data = res.data;
      console.log("songs", data);

      if (data.status == "fail") return;

      this.#load_songs = data.return[this.id];
      this.songs = this.#load_songs;
    }
  }

  /*get songs() {
    return this.#load_songs;
  }*/
}
