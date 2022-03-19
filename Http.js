/**
 * @typedef  {object} HttpResponse
 * @property {() => string}                 toString
 * @property {() => Uint8Array}             getContent
 * @property {() => number}                 getResponseCode
 * @property {() => string}                 getContentText
 * @property {() => Blob}                   getBlob
 * @property {() => Object<string, string>} getAllHeaders
 * @property {() => Object<string, string>} getHeaders
 */

let debug = false;
function setHttpDebug(flag) {
    debug = flag;
}

class Http {
	static _fetch(url, options) {
    try {
			const method = (options ? options.method : undefined) || 'get';
			const payload = options ? (options.body || options.payload) : undefined;
			if(debug) Logger.log(`Request -> Path: ${url}\nMethod: ${method}\nPayload: ${JSON.stringify(payload)}`);

			const response = UrlFetchApp.fetch(url, { ...options, method, payload });
			const headers  = JSON.stringify(response.getHeaders());
			const code     = response.getResponseCode();
			if(debug) Logger.log(`Response -> Path: ${url}\nMethod: ${method}\nCode: ${code}\nHeader: ${headers}`);
			
			return response;
    } catch(e) {
			Logger.log(e);
    throw e;
    }
	}
	/**
	* @param  {string} url
	* @param  {object} options
	* @return {HttpResponse}
	*/
	static get (url, options) {
		const reOptions = {
			...options,
			method             : "get",
			muteHttpExceptions : true,
		};
		return Http._fetch(url, reOptions);
	}

	/**
	* @param  {string} url
	* @param  {object} options
	* @return {HttpResponse}
	*/
	static post(url, options) {
			const reOptions = {
				...options,
				method             : "post",
				payload            : options ? (options.body || options.payload) : undefined,
				muteHttpExceptions : true,
			};
			return Http._fetch(url, reOptions);
	}

	/**
	* @param  {HttpResponse} response
	* @return {any}
	*/
	static toJson(response, defaultValue) {
		try {
			return JSON.parse(response.getContentText());
		}catch (e) {
			return defaultValue;
		}
	}

	/**
	* @param {string} url
	*/
	static getXml(url) {
		const data = Http.get(url);
		return XmlService.parse(data.getContentText());
	}
}
