const Crawler = require('./crawler.js');

const crawler = new Crawler({
    baseURL: 'http://www.makehumancommunity.org/',
    savePath: './downloads/',
    search: {
        downloads: [
            {
                pattern: [],
                fileExtensions: ['mhclo', 'obj', 'mhmat', 'thumb']
            },
            {
                pattern: [/diffuse/g],
                fileExtensions: ['png', 'jpeg', 'bmp', 'svg']
            }
        ],
        links: [
            {
                pattern: [],
                dom: [
                    'td > a',
                    'section a'
                ]
            }
        ]
    },
    maxRecursiveDepth: 4,
    maxSimultaneousDownloads: 5
});

crawler
    .visit('clothes.html')
    .then(crawler.getDomQueryObject)
    .then((query) => {
        const anchors = query('td > a')
            .map(({ attribs }) => attribs.href);

        console.log(anchors);
        console.log(anchors.length);
});;