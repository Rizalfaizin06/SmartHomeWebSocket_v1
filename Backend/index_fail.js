const express = require("express");
const schedule = require("node-schedule");
const { Sequelize, DataTypes } = require("sequelize");
const { Job } = require("./models"); // Import the Job model

const app = express();
const port = 3000;
let jobIdCounter = 1;
// Objek untuk menyimpan jadwal dengan ID
const scheduledJobs = {};

app.use(express.json());

// Fungsi broadcastStatus
function broadcastStatus(lamp, status, time) {
    console.log(`Broadcast: Lamp ${lamp} is ${status} at ${time}`);
}

app.post("/schedule/:lamp/:status/:second", async (req, res) => {
    const second = parseInt(req.params.second);
    const lamp = req.params.lamp;
    const status = req.params.status;

    if (isNaN(second) || second < 0 || second > 59) {
        return res
            .status(400)
            .send("Invalid second parameter. It must be between 0 and 59.");
    }

    const rule = new schedule.RecurrenceRule();
    rule.second = second;

    const job = schedule.scheduleJob(rule, async () => {
        const now = new Date();
        const time = now.toTimeString().split(" ")[0];
        broadcastStatus(lamp, status, time);
        await Job.update({ nextRun: now }, { where: { id: jobId } });
    });

    const newJob = await Job.create({
        lamp,
        status,
        second,
        nextRun: job.nextInvocation().toDate(),
    });

    res.json({ jobId: newJob.id, lamp, status, second });
});

app.get("/schedules", async (req, res) => {
    const jobs = await Job.findAll();

    const allSchedules = jobs.map((job) => {
        const safeJob = {
            jobId: job.id,
            lamp: job.lamp,
            status: job.status,
            nextRun: job.nextRun.toTimeString().split(" ")[0],
            second: job.second,
        };

        return safeJob;
    });

    res.json(allSchedules);
});

app.delete("/schedule/:jobId", async (req, res) => {
    const jobId = req.params.jobId;
    const job = await Job.findByPk(jobId);

    if (!job) {
        return res.status(404).send("Job not found");
    }

    job.job.cancel();
    await Job.destroy({ where: { id: jobId } });

    res.send("Job deleted");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
