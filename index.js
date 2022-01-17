const express = require("express");
const cors = require('cors');
const puppeteer = require("puppeteer");
const dates = require("./dates.json");
const week_a = require("./response week a.json");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getStudentLearningTasks(student, browser) {

}
async function getStudentInfo(student, browser) {

}
async function updateStudentSchedule(student, browser) {

}
app.get("/api", (req, res) => {
    res.json({ message: "Hello from server!" });
  });

  app.get("/puppeteer", async (req, res) => {
    //if (!req.query.username || !req.query.password) {res.send(400, "nah chief this ain't it")};
    //const browser = await puppeteer.launch({headless: false, "args" : ["--no-sandbox", "--disable-setuid-sandbox"]});
    //const response = {};
    //try {
    //  const page = await browser.newPage();
    //} catch (error) {
    //  console.log(error)
    //}
    //if (!response.query.LearningTasks && !response.query.StudentInfo && !UpdateSchedule) {
    //  res.send(400, "nah chief this ain't it");
    //}
    //if (response.query.LearningTasks === true) {
    //  response.LearningTasks = await getStudentLearningTasks(browser);
    //}
    //if (response.query.StudentInfo === true) {
    //  response.StudentInfo = await getStudentInfo(browser);
    //}
    //if (response.query.UpdateSchedule === true) {
    //  response.UpdateSchedule = await updateStudentSchedule(browser);
    //}
    let id = 0;
    let x = 0;
    let y = false;
    let z = false;
    let a = false;
    const response = {profile: {}, learning_tasks: []}
    const username = req.query.username;
    const password = req.query.password;
    const browser = await puppeteer.launch({headless: false, "args" : ["--no-sandbox", "--disable-setuid-sandbox"]});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
  
    page.on("request", async (request) => {
      await request.continue();
    });
  
    page.on("requestfinished", async (request) => {
        if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/LearningTasks.svc/GetAllLearningTasksByUserId")) {
            x += 1;
            if (x === 3) {
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
    await page.$$eval(".x-trigger-index-0.x-form-trigger.x-form-arrow-trigger.x-form-trigger-first", el => el[1].click())
    await page.waitForSelector(".x-boundlist-item");
    await page.$$eval(".x-boundlist-item", el => el[6].click())
    await page.$$eval(".x-trigger-index-0.x-form-trigger.x-form-arrow-trigger.x-form-trigger-first", el => el[0].click())
    await page.$$eval(".x-boundlist-item", el => {
      el.forEach(ele => {
        if (ele.textContent === "2021 Academic") {
          ele.click();
        } 
      });
    })

    while (!y) {
      await sleep(250)
      console.log("waiting for learning tasks to load");
    }
    
    const page2 = await browser.newPage();
    await page2.setRequestInterception(true);
    page2.on("request", async (request) => {
      await request.continue();
    });
    page2.on("requestfinished", async (request) => {
      if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/User.svc/GetUserDetailsBlobByUserId")) {
        let responsebody = await request.response().json();
        responsebody = responsebody.d;
        response.profile.square_img_link = "https://lilydaleheights-vic.compass.education/" + responsebody.userSquarePhotoPath;
        response.profile.img_link = "https://lilydaleheights-vic.compass.education/" + responsebody.userPhotoPath;
        response.profile.display_code = responsebody.userDisplayCode;
        response.profile.email = responsebody.userEmail;
        response.profile.form_group = responsebody.userFormGroup;
        response.profile.full_name = responsebody.userFullName;
        response.profile.house = responsebody.userHouse;
        response.profile.prefered_name = responsebody.userPreferredName;
        response.profile.year_level = responsebody.userYearLevel;
        response.profile.user_id = responsebody.userId;
        response.profile.year_level_num = responsebody.userYearLevelId
        console.log("done user details");
        z = true;
      }
    })
    await page2.goto("https://lilydaleheights-vic.compass.education/Records/User.aspx#dsh");
    while (!z) {
      await sleep(250)
      console.log("waiting for user details to load");
    }
    console.log("bruh")
    let responsebody = week_a.d;
    let codes = [];
    let updates = {};
    let ids = [0, 35371, 34934, 35496];
    for (i = 0; i < responsebody.length; i++) {
      let code = responsebody[i].title;
      let room = responsebody[i].longTitleWithoutTime.split(" - ")[2]
      let period = responsebody[i].longTitleWithoutTime[0];
      let date = new Date(responsebody[i].start).toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" })
      let week;
      let day;
      let activity_code = responsebody[i].activityId;
      if (codes.includes(code) === false) {
        if (ids.includes(activity_code) === false) {
          if (updates[code] === undefined) {
            updates[code] = [];
          }
        }
      }
      console.log(updates);

      //for (i = 0; i < dates.length; i++) {
      //  console.log(i)
      //  for (let j = 0; j < dates[i].length; j++) {
      //    if (dates[i][j].includes(date)) {
      //      week = Object.keys(dates[i])
      //      day = Object.keys(dates[i][j])
      //    }
      //  }
      //}
      //updates[code].push({week: week, day: day, period: period, room: room})
    }
    //const page3 = await browser.newPage();
    //await page3.setRequestInterception(true);
    //page3.on("request", async (request) => {
    //  await request.continue();
    //});
    //page3.on("requestfinished", async (request) => {
    //  if (request.url().includes("https://lilydaleheights-vic.compass.education/Services/Calendar.svc/GetCalendarEventsByUser")) {
    //      let responsebody = await request.response().json();
    //      let codes = [];
    //      let ids = [0, 35371, 34934, 35496];
    //      responsebody = responsebody.d;
    //      for (let i = 0; i < responsebody.length; i++) {
    //        let code = responsebody[i].title;
    //        let activity_code = responsebody[i].activityId;
    //        if (codes.includes(code) === false) {
    //          if (ids.includes(activity_code) === false) {
    //            codes.push(code)
    //          }
    //        }
    //      }
    //        console.log(codes)
    //        for (i = 0; i < codes.length; i++) {
    //          let result = await subjects.find({code: codes[i]}).toArray();
    //          console.log(result)
    //          if (result === []) {
    //            let updates = [];
    //            for (i = 0; i < responsebody.length; i++) {
    //              if (responsebody[i].title === codes[i]) {
    //                let period = responsebody[i].title[0];
    //                let date = new Date(responsebody[i].start).toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" })
    //                let room = responsebody[i].longTitleWithoutTime.split(" ");
    //                console.log(room)
    //              }
    //            }
    //          }
    //        }
    //    console.log("Schedule done")
    //    a = true;
    //  }
    //})
    //await page3.goto("https://lilydaleheights-vic.compass.education/Organise/Calendar/")
    ////page3.evaluate(async () => {
    ////  await document.querySelector("#calendar-manager-tb-prev").click();
    ////})
    //while (!a) {
    //  await sleep(250);
    //  console.log("Waiting for schedule to load")
    //}

    res.json(response);
    await browser.close();
  });
  app.get('*', (req, res) => {
    res.status(400).send("nah")
  });
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });