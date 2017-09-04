const fs = require('fs');
const { Curl } = require('node-libcurl');
const { DefaultHandler, Parser } = require("htmlparser");
const { Stew } = require("stew-select");
const stew = new Stew();

class Crawler {
    constructor({ savePath, baseURL, search, maxRecursiveDepth }) {
        this.savePath = savePath;
        this.baseURL = baseURL;
        this.search = search;
        this.maxRecursiveDepth = maxRecursiveDepth;
        this.maxSimultaneousDownloads = maxSimultaneousDownloads;
        this.visited = {};
        this.downloaded = {};
        this.downloading = {};

        this.curl = new Curl();
        this.handler = new DefaultHandler(() => {});
        this.parser = new Parser(this.handler);
        this.curl.setOpt('URL', this.baseURL);
        this.curl.setOpt('FOLLOWLOCATION', true);
        this.curl.on('data', this.onData.bind(this));
        this.curl.on('error', this.onError.bind(this));
        this.curl.on('end', this.onEnd.bind(this));
    }

    onData(chunk) { this.parser.parseChunk(chunk); }
    onError(e) { throw e; }
    onEnd(statusCode, body, headers) {
        this.find = stew
            .select
            .bind(stew.select, this.handler.dom);
    }

    parseHTML(str) {
        this.parser.parseComplete(str);
        return this.handler.dom;
    }

    getDomQueryObject(dom) {
        return stew.select.bind(stew, dom);
    }

    search() {
        const { downloads, links } = this.search;
    }

    visit(path) {
        if (!this.visited[path]) {
            this.visited[path] = true;

            return new Promise((resolve, reject) => {
                this.curl.on('end', (statusCode, body, headers) => {
                    resolve(this.parseHTML(body));
                });

                this.curl.on('error', (e) => {
                    reject(e);
                });

                this.curl.setOpt('URL', `${this.baseURL}${path}`);
                this.curl.perform();
            });
        }
        return Promise.resolved(null);
    }

    download(path) {
        if (!this.downloaded[path] && !this.downloading[path]) {
            this.downloading[path] = true;

            const writeble = fs
            .createWriteStream(`${this.savePath}${path.substr(path.lastIndexOf('/'))}`);
           
            this.curl.on('end', (statusCode, body, headers) => {
                writeble.end();
                this.downloading[path] = false;
                this.downloaded[path] = true;
            });

            this.curl.on('data', (chunk) => {
                writeble.write(chunk);
            });

            this.curl.on('error', (e) => {
                throw e;
            });

            this.curl.setOpt('URL', `${this.baseURL}${path}`);
            this.curl.perform();
        }
    }
}

module.exports = Crawler;