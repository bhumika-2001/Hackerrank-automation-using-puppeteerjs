// node activity_2.js --url="https://www.hackerrank.com" --config=config.json

let minimist = require("minimist");
let puppeteer = require("puppeteer");
let fs = require("fs");


let args = minimist(process.argv);

let configJSON = fs.readFileSync(args.config, "utf-8");
let configJSO = JSON.parse(configJSON);
async function run() {
    let browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized' // you can also use '--start-fullscreen'
        ],
        defaultViewport: null
    });
    let page = await browser.pages();
    let pages = page[0];
    await pages.goto(args.url);

    await pages.waitForSelector("a[data-event-action='Login']");
    await pages.click("a[data-event-action='Login']");



    await pages.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await pages.click("a[href='https://www.hackerrank.com/login']");

    await pages.waitForSelector("input[name = 'username']");
    await pages.type("input[name = 'username']", configJSO.username);

    await pages.waitForSelector("input[name = 'password']");
    await pages.type("input[name = 'password']", configJSO.password);

    await pages.waitForSelector("button[data-analytics='LoginPassword']");
    await pages.click("button[data-analytics='LoginPassword']");

    await pages.waitForSelector("a[data-analytics='NavBarContests']");
    await pages.click("a[data-analytics='NavBarContests']");

    await pages.waitForSelector("a[href='/administration/contests/']");
    await pages.click("a[href='/administration/contests/']");
    await pages.waitForSelector("div.pagination > ul > li > a[data-attr1='Last']");
    let numPages = await pages.$eval("div.pagination > ul > li > a[data-attr1='Last']", function (data) {
        return data.getAttribute("data-page");
    })
    for (let i = 1; i <= numPages; i++) {
        await pages.waitForSelector("a.backbone.block-center");

        let curls = await pages.$$eval("a.backbone.block-center", function (atags) {
            let urls = [];
            for (let i = 0; i < atags.length; i++) {
                let url = atags[i].getAttribute("href");
                urls.push(url);
            }

            return urls;

        });

        for (let i = 0; i < curls.length; i++) {
            let ctab = await browser.newPage();
            await handleContests(ctab, args.url + curls[i], configJSO.moderator, browser);

            await ctab.close();
            await pages.waitFor(1000);
        }
        if(i != numPages)
        {
            await pages.waitForSelector("div.pagination > ul > li > a[data-attr1='Right']");
            await pages.click("div.pagination > ul > li > a[data-attr1='Right']");
            await pages.waitFor(5000);
        }
    }
    browser.close();
}
async function handleContests(ctab, href, moderator, browser) {
    await ctab.bringToFront();
    await ctab.goto(href);
    await ctab.waitFor(3000);
    await ctab.waitForSelector("li[data-tab='moderators']");
    await ctab.click("li[data-tab='moderators']");

    await ctab.waitForSelector("input[id='moderator']");
    await ctab.type("input[id='moderator']", configJSO.moderator, ({ delay: 30 }));

    await ctab.keyboard.press("Enter");
}


run();
