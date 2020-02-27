import express, {Request, Response} from "express";
import playwright from "playwright";
import tempy from "tempy";
import bluebird from "bluebird";
import {format as dateFormat} from "date-fns";
import queryString from 'query-string';

const app = express();

app.set("port", process.env.PORT || 3000);

app.use(express.urlencoded());
app.use(express.json());
app.use(express.static('public'));

app.get("/-/health", (req: Request, res: Response) => {
    res.sendStatus(204);
});

app.post("/request", (req: Request, res: Response) => {
    const payload = req.body;
    console.log({
        msg: "payload",
        payload
    });
});

app.get('/screenshotPage', (req: Request, res: Response) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="styles/main.css">
</head>
<body>
<img src="screenshot?${queryString.stringify(req.query)}">
<div id="loadingContainer">
    <div id="loading">Loading</div>
</div>
</body>
</html>
    `)
});

app.get("/screenshot", async (req: Request, res: Response) => {
    try {
        const browserType: string = req.query.browser || "chromium";
        const viewportWidth = parseInt(req.query.viewportWidth) || 1280;
        const viewportHeight = parseInt(req.query.viewportHeight) || 720;
        const viewportScale = parseInt(req.query.viewportScale) || 2;
        const url = req.query.url || "https://example.com";
        let waitForContentRe = null;
        if(req.query.waitForContent) {
            waitForContentRe = new RegExp(req.query.waitForContent);
        }

        const browserArgs: { [key: string]: any } = {
            chromium: {
                // these arguments are required for chromium
                args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"]
                // args: ['--disable-dev-shm-usage', '--disable-setuid-sandbox']
            }
        };

        const defaultViewport = {
            width: 1280,
            height: 720
        };

        const playwrightBrowser = (playwright as { [key: string]: any })[browserType];
        const maxWait = 20000;
        const delayInterval = 500;
        const browser = await playwrightBrowser.launch(browserArgs[browserType] || {});
        const context = await browser.newContext({
        viewport: {
            width: viewportWidth,
            height: viewportHeight,
            deviceScaleFactor: viewportScale
        }
        });
        const page = await context.newPage();
        console.log(`Retrieving url ${url}`);
        await page.goto(url);

        if(waitForContentRe) {
            let wait = 0;
            while(wait < maxWait) {
                const content = await page.content();
                if(waitForContentRe.test(content)) {
                    console.log("Ready.");
                    break;
                }
                await bluebird.delay(delayInterval);
                wait += delayInterval;
                console.log("Not ready yet, waiting");
            }
        }

        const screenshotPath = `${tempy.file()}.png`;
        console.log(`Saving ${url} to ${screenshotPath}`);
        await page.screenshot({ path: screenshotPath });
        await browser.close();
        res.setHeader('ETag', getETag(url));
        // Varnish (and other caches) will respect this max-age
        // setting. It give us some time to catch-up.
        // This could also be done
        // in the nginx proxy (if there is one), but we add this option
        // in case an nginx proxy is not used.
        const maxCacheSeconds = process.env.MAX_CACHE_SECONDS || 5;
        res.setHeader('Cache-Control', `public, max-age=${maxCacheSeconds}`);
        console.log(`Sent ${url} at path ${screenshotPath} with cache seconds=${maxCacheSeconds}`);
        res.sendFile(screenshotPath);
    }
    catch(e) {
        console.error(e);
        res.sendStatus(500);
    }
});

function getETag(url: string) {
    const date = new Date();
    // we bucket time by 5 minutes to enforce an ETAG change
    // every 5 minutes
    const minuteBucket = Math.floor(date.getMinutes() / 5);
    const dateComponent = dateFormat(new Date(), 'yyyy-dd-MM HH');
    // we include the date with the minuteBucket to enforce change
    // every day, every hour, every 5 minutes
    const cacheKey = `${url}-${dateComponent} hourPart=${minuteBucket}`;
    return Buffer.from(cacheKey).toString('base64');
}

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    console.log(
        "  App is running at http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );
    console.log("  Press CTRL-C to stop\n");
});
