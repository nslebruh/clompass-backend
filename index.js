const express = require("express");
const cors = require('cors');
const puppeteer = require("puppeteer");
const dates = require("./dates.json");
const subjects = require("./subjects.json");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
  });

  app.get("/puppeteer", async (req, res) => {
    if (!req.query.username && !req.query.password) {res.send(400, "Username and password are required")};
    const response = {learning_tasks: [], profile: {}, schedule: {"a" : {}, "b" : {}}};
    let id = 0;
    let x = 0;
    let y = false;
    let z = false;
    let a = false;
    const username = req.query.username;
    const password = req.query.password;
    const browser = await puppeteer.launch({"args" : ["--no-sandbox", "--disable-setuid-sandbox"]});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
  
    page.on("request", async (request) => {
      await request.continue();
    });
  
    page.on("requestfinished", async (request) => {
        if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/LearningTasks.svc/GetAllLearningTasksByUserId")) {
            x += 1;
            if (x === 2) {
              let responsebody = await request.response().json();
              responsebody = responsebody.d.data;
              for (let i = 0; i < responsebody.length; i++) {
                let task = responsebody[i];
                let name = task.name;
                let subject_name = task.subjectName;
                let subject_code = task.activityName;
                let attachments = [];
                let submissions = [];
                let description = task.description;
                let official_due_date = task.dueDateTimestamp;
                let individual_due_date = task.students[0].dueDateTimestamp;
                individual_due_date ? individual_due_date = individual_due_date : individual_due_date = official_due_date;
                let submission_status;
                let submission_svg_link;
                if (task.students[0].submissionStatus === 1) {
                    submission_status = "Pending";
                    submission_svg_link = "https://cdn.jsdelivr.net/gh/clompass/clompass@main/public/svg/task-status/pending.svg";
                  } else if (task.students[0].submissionStatus === 2) {
                    submission_status = "Overdue";
                    submission_svg_link = "https://cdn.jsdelivr.net/gh/clompass/clompass@main/public/svg/task-status/overdue.svg";
                  } else if (task.students[0].submissionStatus === 3) {
                    submission_status = "On time";
                    submission_svg_link = "https://cdn.jsdelivr.net/gh/clompass/clompass@main/public/svg/task-status/ontime.svg"
                  } else if (task.students[0].submissionStatus === 4) {
                    submission_status = "Recieved late";
                    submission_svg_link = "https://cdn.jsdelivr.net/gh/clompass/clompass@main/public/svg/task-status/receivedlate.svg";
                  } else {
                    submission_status = "Unknown"
                  }
                if (task.attachments != null) {
                    for (let j = 0; j < task.attachments.length; j++) {
                        attachments.push({name: task.attachments[j].name, link: "https://lilydaleheights-vic.compass.education/Services/FileAssets.svc/DownloadFile?id=" + task.attachments[j].id + "&originalFileName=" + task.attachments[j].fileName.replace(/ /g, "%20"),});
                    }
                  } else {
                    attachments = "None";
                  }
                
                if (task.students[0].submissions != null) {
                  for (let j = 0; j < task.students[0].submissions.length; j++) {
                        submissions.push({name: task.students[0].submissions[j].fileName, link: "https://lilydaleheights-vic.compass.education/Services/FileDownload/FileRequestHandler?FileDownloadType=2&taskId=" + task.students[0].taskId + "&submissionId=" + task.students[0].submissions[j].id});
                  }
                } else {
                  submissions = "None"
                }
                response.learning_tasks.push({name: name, subject_name: subject_name, subject_code: subject_code, attachments: attachments, description: description, official_due_date: official_due_date, individual_due_date: individual_due_date, submission_status: submission_status, submissions: submissions, submission_svg_link: submission_svg_link, id: id});
                id ++; 
            }
            console.log("done learning tasks");
            y = true;
            }
        }
        if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/User.svc/GetNamesById?sessionstate=readonly&_dc=1637544149780")) {

        }
        if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/Calendar.svc/GetCalendarEventsByUser?sessionstate=readonly&includeEvents=true&includeAllPd=true&includeExams=true&includeVolunteeringEvent=true&_dc=1637624948674")) {

        }
    });
  
    console.log("navigating to compass login page")
    await page.goto('https://lilydaleheights-vic.compass.education/Records/User.aspx#learningTasks');
    await page.waitForSelector("#username", timeout=1000);
  
    console.log(`Logging in as user: ${username.toUpperCase()}`)
    console.log("filling username");
    await page.$$eval("#username", (el, username) => {
      el[0].value = username;
    }, username);
  
    console.log("filling password");
    await page.$$eval("#password", (el, password) => {
      el[0].value = password;
    }, password);
  
    console.log("clicking login button");
    await page.$eval("#button1", el => {
      el.disabled = false;
      el.click();
    });
  
    console.log("waiting for compass page to load");
    await page.waitForSelector('.x-grid-table');
  
    console.log("collecting learning tasks information");
    await page.evaluate(async () => {
      document.querySelector("#ext-gen1722").click();
      document.querySelector("li.x-boundlist-item:nth-child(7)").click();
    });
    while (true) {
      console.log("still waiting");
      if (y) {
        if (z) {
          if (a) {
            break
          } else {
            await sleep(250)
          }
        } else {
          await sleep(250)
        }
      } else {
        await sleep(250)
      }
      await sleep(250);
    }
    res.json(response);
    await browser.close();
  });
  app.get('*', (req, res) => {
    res.send("nah")
  });
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });