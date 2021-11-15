const express = require("express");
const cors = require('cors');
const puppeteer = require("puppeteer");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
  });

app.get("/puppeteer", (req, res) => {
    (async () => {
        page = await (await browserP).newPage();
        await page.setContent(`<p>web running at ${Date()}</p>`);
        res.send(await page.content());
      })()
        .catch(err => res.sendStatus(500))
        .finally(async () => await page.close())
      ;
    });

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });