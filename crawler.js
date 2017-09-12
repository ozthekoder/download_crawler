const fs = require('fs');
const { Curl } = require('node-libcurl');
const ProgressBar = require('progress');
const { DefaultHandler, Parser } = require("htmlparser");
const { Stew } = require("stew-select");
const stew = new Stew();

class Crawler {
    constructor({ savePath, baseURL, search, maxRecursiveDepth, maxSimultaneousDownloads }) {
        this.savePath = savePath;
        this.baseURL = baseURL;
        this.search = search;
        this.maxRecursiveDepth = maxRecursiveDepth;
        this.maxSimultaneousDownloads = maxSimultaneousDownloads;
        this.foundLinks = [baseURL];
        this.foundDownloads = [];
        this.visited = {};
        this.downloaded = {};
        this.downloading = {};

        this.handler = new DefaultHandler(() => { });
        this.parser = new Parser(this.handler);

        this.downloader = new Curl();
        this.downloader.setOpt('FOLLOWLOCATION', true);
        this.downloader.setOpt( Curl.option.NOPROGRESS, false );
        this.downloader.enable( Curl.feature.NO_STORAGE );

        this.visitor = new Curl();
        this.visitor.setOpt('URL', this.baseURL);
        this.visitor.setOpt('FOLLOWLOCATION', true);
        this.visitor.setOpt( Curl.option.NOPROGRESS, false );
        this.visitor.on('data', this.onPageData.bind(this));
        this.visitor.on('error', this.onPageError.bind(this));
        this.visitor.on('end', this.onPageEnd.bind(this));
        this.visitor.setOpt( Curl.option.HEADERFUNCTION, () => {
        });
        this.visitor.on('header', () => {
            console.log('ARGUMENTS', arguments);
        });

    }

    onPageData(chunk) { this.parser.parseChunk(chunk); }
    onPageError(e) { throw e; }
    onPageEnd(statusCode, body, headers) {
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
                this.visitor.on('end', (statusCode, body, headers) => {
                    resolve(this.parseHTML(body));
                });

                this.visitor.on('error', (e) => {
                    reject(e);
                });

                this.visitor.setOpt('URL', `${this.baseURL}${path}`);
                this.visitor.perform();
            });
        }
        return Promise.resolved(null);
    }

    download(path) {
        if (!this.downloaded[path] && !this.downloading[path]) {
            this.downloading[path] = true;

            const writeble = fs
                .createWriteStream(`${this.savePath}${path.substr(path.lastIndexOf('/'))}`);

            this.downloader.on('end', (statusCode, body, headers) => {
                writeble.end();
                this.downloading[path] = false;
                this.downloaded[path] = true;
            });

            this.downloader.on('data', (chunk) => {
                writeble.write(chunk);
            });

            this.downloader.on('error', (e) => {
                throw e;
            });

            this.downloader.setOpt('URL', `${this.baseURL}${path}`);
            this.downloader.perform();
        }
    }

    run() {

    }
}

module.exports = Crawler;