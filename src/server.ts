import express, {Request, Response} from "express";
import playwright from "playwright";
import tempy from "tempy";
import bluebird from "bluebird";

const app = express();

app.set("port", process.env.PORT || 3000);

app.use(express.urlencoded());
app.use(express.json());

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

app.get("/screenshot", async (req: Request, res: Response) => {
    try {
        const browserType: string = req.query.browser || "chromium";
        const viewportWidth = req.query.viewportWidth || 1280;
        const viewportHeight = req.query.viewportHeight || 720;
        const viewportScale = req.query.viewportScale || 2;
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
        console.log(`Saving to ${screenshotPath}`);
        await page.screenshot({ path: screenshotPath });
        await browser.close();
        res.sendFile(screenshotPath);
    }
    catch(e) {
        console.error(e);
        res.sendStatus(500);
    }
});

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
