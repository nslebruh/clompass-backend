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
    let browser = await puppeteer.launch({args: ["--no-sandbox", "--disable-setuid-sandbox"]})
    let page = await browser.newPage();
    let example = await page.goto("https://example.com");
    res.send(await example.content);
})

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });