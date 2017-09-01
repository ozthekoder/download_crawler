const { Curl } = require('node-libcurl');
const htmlparser = require("htmlparser");
const { Stew } = require("stew-select");
const stew = new Stew();

class Crawler {
    constructor({ savePath, baseURL, crawlPath }) {
        this.savePath = savePath; 
        this.baseURL = baseURL;
        this.crawlPath = crawlPath;
        this.curl = new Curl();
        this.currentBuffer = '';
        this.lastBuffer = '';
        this.handler = new htmlparser.DefaultHandler(() => {});
        this.parser = new htmlparser.Parser(this.handler);
        
        this.curl.setOpt( 'URL', this.baseURL );
        this.curl.setOpt( 'FOLLOWLOCATION', true );
        this.curl.on('data', this.onData.bind(this));
        this.curl.on('error', this.onError.bind(this));
        this.curl.on('end', this.onEnd.bind(this));
    }

    onData(chunk) { this.parser.parseChunk(chunk); }
    onError(e) { throw e; }
    onEnd(statusCode, body, headers) {
       this.find = stew.select.bind(stew.select, this.handler.dom);
    }

    parseHTML(str) {
        this.parser.parseComplete(str);
        return this.handler.dom;
    }

    getDomQueryObject(dom) {
        return stew.select.bind(stew, dom);
    }

    requestPage(path) {
        return new Promise((resolve, reject) => {
            this.curl.on('end', (statusCode, body, headers) => {
                resolve(this.parseHTML(body));
            });

            this.curl.on('error', (e) => {
                reject(e);
            })
            this.curl.setOpt( 'URL', path );
            this.curl.perform();
        });
    }
}

module.exports = Crawler;