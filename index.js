const Crawler = require('./crawler.js');

const crawler = new Crawler({
    baseURL: 'http://www.makehumancommunity.org/clothes.html',
    savePath: '',
    crawlPath: []
});

crawler
.requestPage(crawler.baseURL)
.then(crawler.getDomQueryObject)
.then((query) => {
    const anchors = query('td > a')
    .map(({ attribs }) => attribs.href);

    console.log(anchors);
    console.log(anchors.length);
});