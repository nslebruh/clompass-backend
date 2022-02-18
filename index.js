const express = require("express");
const cors = require('cors');
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const atob = require("atob");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



const getStudentInfoData = async (browser) => {
  let page = await browser.newPage();
  let done = false;
  let data = [];
  await page.setRequestInterception(true);
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on("request", async (request) => await request.continue());
  page.on("requestfinished", async (request) => {
      if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/User.svc/GetUserDetailsBlobByUserId")) {
          inforesponse = await request.response().json()
          let responsebody = inforesponse.d;
          let prefered_name = responsebody.userPreferredName;
          let photo_url = "https://lilydaleheights-vic.compass.education/" + responsebody.userSquarePhotoPath;
          let user_id = responsebody.userDisplayCode;
          let age = responsebody.userDetails;
          let form_group = responsebody.userFormGroup;
          let full_name = responsebody.userFullName;
          let email = responsebody.userEmail;
          let house = responsebody.userHouse;
          let id = responsebody.userId;
          let year_level = responsebody.userYearLevelId;
          data.push({prefered_name: prefered_name, photo_url: photo_url, user_id: user_id, age: age, form_group: form_group, full_name: full_name, email: email, house: house, id: id, year_level: year_level})
          done = true;
      }
  })
  await page.goto("https://lilydaleheights-vic.compass.education/Records/User.aspx#dsh", {waitUntil: "load", timeout: 0})
  while (!done) {
      console.log("info collection not done")
      await sleep(1000)
  }
  return data;
}
app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
  });

app.get("/puppeteer", async (req, res) => {
  if (!req.query.username || !req.query.password ) {
    res.status(400).send("nah chief this ain't it")
    return
  }
  const response = {};
  const username = req.query.username;
  const password = req.query.password;

  const browser = await puppeteer.launch({headless: true, "args" : ["--no-sandbox", "--disable-setuid-sandbox"]})
  let page = await browser.newPage(); 
  await page.goto('https://lilydaleheights-vic.compass.education/', {waitUntil: "load", timeout: 0});
  await page.waitForSelector("#username", timeout=2000);
  console.log("page loaded")
  await page.$$eval("#username", (el, username) => {
      el[0].value = username;
    }, username);
  console.log("username filled")

  await page.$$eval("#password", (el, password) => {
      el[0].value = password;
  }, password);
  console.log("password filled")

  console.log("clicking login button");
  await page.$eval("#button1", el => {
    el.disabled = false;
    el.click();
  });
  try {
    await page.waitForSelector("#c_bar")
    console.log("page loaded")
  } catch (error) {
    console.error(error);
    await browser.close();
    res.status(500).send("could not navigate to https://lilydaleheights-vic.compass.education/");
    return
    
  }
  

  if (req.query.learning_tasks === "true") {
    response.learning_tasks = []
    if (req.query.year !== null || undefined) {
      const year = req.query.year;
      console.log(year)
      const data = {};
      let total_requests = 0;
      let id = 0;
      let total_tasks_requests = 0;
      let page = await browser.newPage();

      await page.setRequestInterception(true);
      page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
      page.on("request", async (request) => {
        await request.continue();
      });

      page.on("requestfinished", async (request) => {
          if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/LearningTasks.svc/GetAllLearningTasksByUserId")) {
            console.log("request finished")
            console.log(total_requests)
            console.log("what is happening?")
            total_requests++;
              if (total_requests > 2) {
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
                              attachments.push({attachment_name: task.attachments[j].name, attachment_link: "https://lilydaleheights-vic.compass.education/Services/FileAssets.svc/DownloadFile?id=" + task.attachments[j].id + "&originalFileName=" + task.attachments[j].fileName.replace(/ /g, "%20"),});
                          }
                        } else {
                          attachments = "None";
                        }
                      
                      if (task.students[0].submissions != null) {
                        for (let j = 0; j < task.students[0].submissions.length; j++) {
                              submissions.push({submission_name: task.students[0].submissions[j].fileName, submission_link: "https://lilydaleheights-vic.compass.education/Services/FileDownload/FileRequestHandler?FileDownloadType=2&taskId=" + task.students[0].taskId + "&submissionId=" + task.students[0].submissions[j].id});
                        }
                      }
                      data[year].push({name: name, subject_name: subject_name, subject_code: subject_code, attachments: attachments, description: description, official_due_date: official_due_date, individual_due_date: individual_due_date, submission_status: submission_status, submissions: submissions, submission_svg_link: submission_svg_link, id: id});
                      id++; 
                  }
                  console.log("response awaited")
                  total_tasks_requests++
              }
          }
      })
      await page.goto("https://lilydaleheights-vic.compass.education/Records/User.aspx#learningTasks");
      while (total_requests !== 1) {
        await sleep(250)
        console.log("waiting for first request")
      };
      console.log("page loaded")
      console.log("collecting learning tasks information");
      await page.$$eval(".x-trigger-index-0.x-form-trigger.x-form-arrow-trigger.x-form-trigger-first", el => el[1].click())
      await page.waitForSelector(".x-boundlist-item");
      await page.evaluate(() => {
          list = document.querySelectorAll(".x-boundlist-item");
          for (i = 0; i < list.length; i++) {
              if (list[i].innerText == "500") {
                  list[i].unselectable = false; 
                  list[i].click();
                  console.log("clicked 500 button")
              }
          }
      })
      console.log("clicking 500 button")
      while (total_requests !== 2) {
        await sleep(250);
        console.log("waiting for second request")
      }
      await page.$$eval(".x-trigger-index-0.x-form-trigger.x-form-arrow-trigger.x-form-trigger-first", el => el[0].click())
      console.log("clicking year button")
      data[year] = [];
      await page.evaluate(year => {
        console.log("evaluating page")
          list = document.querySelectorAll(".x-boundlist-item");
          console.log("selected element")
          for (i = 0; i < list.length; i++) {
              if (list[i].innerText == `${year} Academic`) {
                  console.log(`found item - ${year} Academic`);
                  list[i].unselectable = false; 
                  list[i].click();
                  console.log(`clicked item - ${year} Academic`)
              }   
          }
      }, year)
      while (total_tasks_requests !== 1) {
          console.log("waiting for third request")
          await sleep(1000);
      }
      response.learning_tasks = data;
    }
  } else {
    response.learning_tasks = []
  }
  res.json(response)
  await browser.close();
  console.log("browser has been closed");
})

  app.get('*', (req, res) => {
    res.status(400).send("nah chief this ain't it")
  });
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });