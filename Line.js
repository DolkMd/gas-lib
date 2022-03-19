const APIEndpointBase        = "https://api.line.me",
      APIEndpointPushMessage = "/v2/bot/message/push";


/**
 * @param  {string} token
 * @param  {string} targetGroupId
 * @return {LineStreamer}
 */
 function newLine(token, targetGroupId) {
    return new LineStreamer(token, targetGroupId);
  }
  
 
class LineStreamer {
    constructor(token, targetGroupId) {
        /** @type {string} */
        this.token = token;

        /** @type {string} */
        this.groupId = targetGroupId;
    }

    /**
     * @param {string} text
     * @param {string} to
     */
    publishTextMessage(text, to) {
        const headers = {
            Authorization  : `Bearer ${this.token}`,
            "Content-Type" : "application/json; charset=UTF-8",
        };
        const body = JSON.stringify({
            to       : to || this.groupId,
            messages : [{ type : 'text', text }],
        });
        return Http.post(`${APIEndpointBase}${APIEndpointPushMessage}`, { body, headers });
    }
}
