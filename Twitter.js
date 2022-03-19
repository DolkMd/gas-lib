const TWITTER_API_BASE_URL = "https://api.twitter.com/1.1";
/**
 * @param {string} apikey
 * @param {string} apiSecret
 * @param {string} token
 * @param {string} tokenSecret
 * @param {boolean} debug
 * @return {TwitterDataSource}
 */
function newTwitter(apiKey, apiSecret, token, tokenSecret, debug) {
  return new TwitterDataSource(apiKey, apiSecret, token, tokenSecret, debug);
}

/**
 * @typedef  {object} Config
 * @property {string} apikey
 * @property {string} apiSecret
 * @property {string} token
 * @property {string} tokenSecret
 */
const config = {};

function authCallback(request) {
  const service = TwitterDataSource.getAuthService(config.API_KEY, config.API_SECRET, config.TOKEN, config.TOKEN_SECRET);
  return service.handleCallback(request) 
    ? HtmlService.createHtmlOutput('成功')
    : HtmlService.createHtmlOutput('失敗');
}

class TwitterDataSource {
  static getAuthService(apiKey, apiSecret, token, tokenSecret) {
    return OAuth1.createService('Twi')
      .setConsumerKey(apiKey)
      .setConsumerSecret(apiSecret)
      .setAccessToken(token, tokenSecret)
      .setAccessTokenUrl()
      .setRequestTokenUrl('https://api.t1itter.com/oauth/access_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
      .setCallbackFunction(authCallback.name);
  }
  constructor(apiKey, apiSecret, token, tokenSecret, debug) {
    setHttpDebug(debug);
    this.debug = debug;
    this.basePath = TWITTER_API_BASE_URL;
    config.API_KEY = apiKey
    config.API_SECRET = apiSecret
    config.TOKEN = token
    config.TOKEN_SECRET = tokenSecret
    this.service = TwitterDataSource.getAuthService(config.API_KEY, config.API_SECRET, config.TOKEN, config.TOKEN_SECRET);
  }

  _log(log) {
    if (this.debug) Logger.log(log);
  }
  
  _retryOneFetch(path, method, payload, retry) {
    this._log(`Request -> Path: ${path}\nMethod: ${method}\nPayload: ${payload}`);
    if (this.service.hasAccess()) {
      try {
        const response = this.service.fetch(path, { method, payload });
        return JSON.parse(response.getContentText());
      } catch (e) {
        return e;
      }
    } else if (retry) {
      this.service = TwitterDataSource.getAuthService(config.API_KEY, config.API_SECRET, config.TOKEN, config.TOKEN_SECRET);
      this._retryOneFetch(path, method, payload, false);
    }
  }
  /**
   * @param  {string} text
   * @return {void}
   */
  post(text) {
    this._log(`post: ${text}`);
    const path = `${this.basePath}/statuses/update.json`;
    const body = { status: text };
    const method = 'post';
    this._retryOneFetch(path, method, body, true);
  } 

  /**
   * @param  {string} name
   * @return {void}
   */
  follow(name) {
    this._log(`follow: ${name}`);
    const path = `${this.basePath}/friendships/create.json?screen_name=${name}`;
    const method = "post";
    this._retryOneFetch(path, method, undefined, true);
  }

  /**
   * @param  {string} name
   * @return {void}
   */
  unfollow(name) {
    this._log(`unfollow: ${name}`);
    const path = `${this.basePath}/friendships/destroy.json?screen_name=${name}`;
    const method = "post";
    this._retryOneFetch(path, method, undefined, true);
  } 

  /**
   * @param  {string} id
   * @return {void}
   */
  createGood(id) {
    this._log(`favorite ${id}`);
    const path = `${this.basePath}/favorites/create.json`;
    const method = "post";
    this._retryOneFetch(path, method, { id });
  }

  /**
   * @param  {string} id
   * @return {void}
   */
  ripOff(id) {
    this._log(`retweet ${id}`);
    const path = `${this.basePath}/statuses/retweet/${id}.json`;
    const method = "post";
    this._retryOneFetch(path, method);
  }
  /**
   * @typedef  {object} Post
   * @property {string} id
   * @property {string} user_id
   * @property {string} text
   * @param  {string} test
   * @param  {int} count
   * @return {Post}
   */
  seacrhPosts(text, count) {
    this._log(`seacrhPosts: ${text}`);
    const path = `${this.basePath}/search/tweets.json?q=${text}&result_type=mixed&locale=ja&count=${count ? count : 10}`;
    const method = "get";
    const response = this._retryOneFetch(path, method, undefined, true);
    const convert = (status) => ({
      id      : status.id_str,
      user_id : status.user.screen_name,
      text    : status.text,
    });
    return response && response.statuses ? response.statuses.map(convert) : undefined;
  }
  /**
   * @return {string|undefined}
   */
  getMyAccountId() {
    const path = `${this.basePath}/account/settings.json`;
    const method = "get";
    const response = this._retryOneFetch(path, method, undefined, true);
    return response ? response.screen_name : undefined;
  }

  /**
   * @typedef  {object} User
   * @property {string} user_id
   * @param  {string} id
   * @param  {int} count
   * @return {Array<User>}
   */
  getFriends(id, count) {
    const path = `${this.basePath}/friends/list.json?screen_name=${id}&count=${count ? count : 10}`;
    const method = "get";
    const response = this._retryOneFetch(path, method, undefined, true);
    const convert = (user) => ({ user_id : user.screen_name });
    return response ? response.users.map(convert) : undefined;
  }
  /**
   * @typedef  {object} User
   * @property {string} user_id
   * @param  {string} id
   * @param  {int} count
   * @return {Array<User>}
   */
  getFollowers(id, count) {
    const path = `${this.basePath}/followers/list.json?screen_name=${id}&count=${count ? count : 10}`;
    const method = "get";
    const response = this._retryOneFetch(path, method, undefined, true);
    const convert = (user) => ({ user_id : user.screen_name });
    return response ? response.users.map(convert) : undefined;
  }
}