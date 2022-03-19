/**
 * @typedef  {object} Route
 * @property {string|undefined}            path
 * @property {(ctx: Context) => void} fn
 * 
 * @typedef  {object} Body
 * @property {object} contents
 * @property {string} type
 * 
 * @typedef  {object} Event
 * @property {number}                    contentLength
 * @property {string}                    contextPath
 * @property {string}                    queryString
 * @property {Object.<string, string>}   parameter
 * @property {Object.<string, string[]>} parameters
 * @property {string|undefined}          pathInfo
 * @property {Body|undefined}            postData
 */

function newServer() {
  return new Server();
}

const logTable = {
  NAME     : "LOG_TABLE",
  cols     : ["date", "type", "text"], 
  toRecord : (date, type, text) => ({ date, type, text }),
};

class Context {
  constructor(event) {
    this._types = {
      json : "json",
      text : "text",
      html : "html",
    }
    this.response = null;
    this.anymap = {};
    this.event = event;
    this._type = this._types.text;
    this.err = null;
    this.nextFn = null;
    this.doneNextFn = false;
  }
  setValue(key, value) {
    this.anymap[key] = value;
  }
  getValue(key) {
    return this.getValue(key);
  }

  /**
   * @return {Event}
   */
  req () {
    return this.event;
  }

  /**
   * @param {any} value;
   */
  res(value) {
    this.response = value;
  }

  /**
   * @param {object} value;
   */
  json(value) {
    this._type = this._types.json;
    this.response = value;
  }

  /**
   * @param {any} value;
   */
  text(value) {
    this._type = this._types.text;
    this.response = value;
  }

  /**
   * @return {string}
   */
  getType() {
    return this._type;
  } 

  next() {
    this.doneNextFn = true;
    this.nextFn();
  }
}
class Server {
  constructor() {
    /** @type  Array<Route>*/
    this.routers = [];
    /** @type  Array<(Context) => void>*/
    this.middlewares = [];
  }
  /**
   * @param  {(Context) => void} middleware
   * @return {Server}
   */
  use(...middleware) {
    this.middlewares.push(...middleware);
    return this;
  }


  /**
   * @param  {Route[]} routes
   * @return {Server}
   */
  handleGet(...routes) {
    routes.forEach(route => this.routers.push({ path : route.path, fn : route.fn }));
    return this;
  }

  /**
   * @param  {(Context) => void} handler
   * @return {Server}
   */
  handlePost(handler) {
    this.routers.push({ fn : handler, path: "" })
    return this;
  }

  /**
   * @param {Event} event
   * @param {Context} ctx
   */
  exec(event, ctx) {
    ctx = ctx || new Context(event);
    const resJson = (json) => ContentService.createTextOutput()
          .setMimeType(ContentService.MimeType.JSON)
          .setContent(JSON.stringify(json));
    const resText = (text) => ContentService.createTextOutput()
          .setContent(text);
    const isRouter = (router) => router && router.fn && router.path !== undefined && router.path !== null;
    const isSamePath = (router, pathInfo) => {
      return (router.path || '/') === `/${pathInfo || ''}`
    };
    const tasks = [];
    tasks.push(...this.middlewares);
    tasks.push(...this.routers);
    
    const doTask = (i) => {
      const task = tasks[i];
      const next = () => doTask(i+1);
      
      if (isRouter(task)) {
        ctx.nextFn = null;
        if (isSamePath(task, event.pathInfo)) {
          task.fn(ctx);
        }
        next();
      } else if(task) {
        ctx.nextFn = () => next();

        task(ctx);

        if (!ctx.doneNextFn) next();
        else ctx.doneNextFn = false;
      }
    }

    doTask(0);

    if (!ctx.response) return resText("404 not found");

    switch (ctx.getType()) {
      case "json":
        return resJson(ctx.response); 
      case "text":
        return resText(JSON.stringify(ctx.response))
      default:
        return resText("OK");
    }
  }
}
