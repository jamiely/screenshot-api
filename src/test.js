const playwright = require("playwright");
const bluebird = require("bluebird");

const maxWait = 20000;
const delayInterval = 500;

const browserArgs = {
  chromium: {
    // these arguments are required for chromium
    args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"]
    // args: ['--disable-dev-shm-usage', '--disable-setuid-sandbox']
  }
};

const macbookViewport = {
  width: 2880,
  height: 1800
};

const defaultViewport = {
  width: 1280,
  height: 720
};

(async () => {
  for (const browserType of ["firefox", "webkit", "chromium"]) {
    try {
    // for (const browserType of ['webkit']) {
      console.log(`browserType=${browserType}`);
      const args = browserArgs[browserType] || {};
      const browser = await playwright[browserType].launch(args);
      const context = await browser.newContext({
        viewport: defaultViewport
      });
      const page = await context.newPage();
      const url = "https://manager.alertbot.com/reports/nocview.aspx?pvid=36a80082-284f-4f1a-842b-5fd6659fe228";
      await page.goto(url);

      let wait = 0;
      while(wait < maxWait) {
        const content = await page.content();
        if(/Public Site/.test(content)) {
          console.log("Ready.");
          break;
        }
        await bluebird.delay(delayInterval);
        wait += delayInterval;
        console.log("Not ready yet, waiting");
      }
      
      await page.screenshot({ path: `example-${browserType}.png` });
      await browser.close();
    } catch(e) {
      console.error(e);
    }
  }
})();
