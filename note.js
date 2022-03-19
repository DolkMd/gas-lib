/**
 * @typedef {object} Article
 * @property {string} title
 * @property {string} link
 */

/**
 * @param  {string} url
 * @return {NoteDatasource}
 */
 function newNote(url) {
    return new NoteDatasource(url)
  }
  
  /**
   * @constructor
   * @classdesc Note RSS class
   * @param{string} url
   */
  class NoteDatasource {
    constructor(url) {
      /** @type {string} */
      this.myNoteRssUrl = url;
  
      /** @type {string} */
      this.baseUrl = "https://note.com/api/v1";
  
    }
  
    /**
     * @param  {string} tag
     * @return {Array<Article>}
     */
    searchTag(tag, count) {
      const response = Http.get(`https://note.com/api/v1/hashtag/${tag}`);
      const resJson = Http.toJson(response);
      const convert = (note) => ({ title : note.name, link : note.note_url });
      if (!resJson || !resJson.data || !resJson.data.notes) return undefined;
      return resJson.data.notes.map(convert).slice(0, count || resJson.data.notes.length);
    }
  
    /**
     * @return {Array<Article>}
     */
    getArticles() {
      const xml = Http.getXml(this.myNoteRssUrl);
      const entries = xml.getRootElement().getChildren('channel')[0].getChildren('item');
      return entries.map(entry => ({
        title : entry.getChildText("title"),
        link  : entry.getChildText("link"),
      }));
    }
  }
  
