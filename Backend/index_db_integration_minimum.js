const express = require("express");
const schedule = require("node-schedule");
const app = express();
const { Device, Schedule } = require("./models");

const port = 3000;
let jobIdCounter = 1;
// Objek untuk menyimpan jadwal dengan ID
const scheduledJobs = {};

app.use(express.json()); // Untuk memproses JSON dalam request

// Fungsi broadcastStatus
function broadcastStatus(lamp, status, time) {
    console.log(`Broadcast: Lamp ${lamp} is ${status} at ${time}`);
}

// Endpoint untuk membuat jadwal baru
app.post("/refresh/", async (req, res) => {
    const schedules = await Schedule.findAll({
        include: {
            model: Device,
            as: "device",
        },
    });

    const allSchedules = schedules.map((schedule) => ({
        scheduleId: schedule.id,
        deviceName: schedule.device.name,
        hour: schedule.hour,
        minute: schedule.minute,
        second: schedule.second,
        status: schedule.status,
    }));

    allSchedules.forEach((data) => {
        const rule = new schedule.RecurrenceRule();
        // rule.hour = data.hour;
        // rule.minute = data.minute;
        rule.second = data.second;

        const job = schedule.scheduleJob(rule, () => {
            const now = new Date();
            const time = now.toTimeString().split(" ")[0];
            broadcastStatus(data.deviceName, data.status, time);
        });

        const jobId = data.scheduleId; // Generate unique ID
        scheduledJobs[jobId] = {
            job,
            device: data.deviceName,
            status: data.status,
            second: data.second,
        };
    });
    // res.json();
    if (Object.keys(scheduledJobs).length === 0) {
        return res.json([]); // Handle empty scheduledJobs (e.g., send an empty response)
    }

    // Process scheduled jobs
    const finalSchedule = Object.keys(scheduledJobs).map((jobId) => {
        const job = scheduledJobs[jobId];

        // Check if the job is defined and valid
        if (job) {
            // Extract relevant job information
            const time = new Date(job.job.nextInvocation().toISOString());
            const safeJob = {
                jobId,
                lamp: job.lamp,
                status: job.status,
                nextRun: time.toISOString().slice(2, 19).replace("T", " "), // Convert to HH:MM:SS format
                second: job.second,
            };

            return safeJob;
        } else {
            // If the job object is invalid or undefined, skip it
            console.error(`Job with ID '${jobId}' is undefined or invalid.`);
            return null; // Return null to filter out this invalid job
        }
    });

    // Filter out skipped jobs (null values)
    const filteredSchedules = finalSchedule.filter(
        (schedule) => schedule !== null
    );

    // Send JSON response with all schedules
    res.json(filteredSchedules);
});

// Endpoint untuk membuat jadwal baru
app.post("/schedule/:lamp/:status/:second", async (req, res) => {
    const hour = 0;
    const minute = 0;
    const second = parseInt(req.params.second);
    const device = req.params.lamp;
    const device_id = 1;
    const status = req.params.status;

    // Validasi input
    if (isNaN(second) || second < 0 || second > 59) {
        return res
            .status(400)
            .send("Invalid second parameter. It must be between 0 and 59.");
    }

    const newSchedule = await Schedule.create({
        device_id,
        hour,
        minute,
        second,
        status,
    });
    console.log(newSchedule);

    const rule = new schedule.RecurrenceRule();
    rule.second = second;

    const job = schedule.scheduleJob(rule, () => {
        const now = new Date();
        const time = now.toTimeString().split(" ")[0];
        broadcastStatus(device, status, time);
    });

    const jobId = jobIdCounter++; // Generate ID unik
    scheduledJobs[jobId] = { job, device, status, second };

    res.json({ jobId, device, status, second });
});

app.get("/schedules", async (req, res) => {
    // const schedules = await Schedule.findAll({
    //     include: {
    //         model: Device,
    //         as: "device",
    //     },
    // });

    // const allSchedules = schedules.map((schedule) => ({
    //     scheduleId: schedule.id,
    //     deviceName: schedule.device.name,
    //     hour: schedule.hour,
    //     minute: schedule.minute,
    //     second: schedule.second,
    //     status: schedule.status,
    // }));

    // res.json(allSchedules);
    console.log(scheduledJobs);
    // console.log(scheduledJobs[1].job.nextInvocation().toISOString());

    // console.log(convertToUTCTime(10, 0, 0));
    // Check if there are any scheduled jobs
    if (Object.keys(scheduledJobs).length === 0) {
        return res.json([]); // Handle empty scheduledJobs (e.g., send an empty response)
    }

    // Process scheduled jobs
    const allSchedules = Object.keys(scheduledJobs).map((jobId) => {
        const job = scheduledJobs[jobId];

        // Check if the job is defined and valid
        if (job) {
            // Extract relevant job information
            const time = new Date(job.job.nextInvocation().toISOString());
            const safeJob = {
                jobId,
                lamp: job.lamp,
                status: job.status,
                nextRun: time.toISOString().slice(2, 19).replace("T", " "), // Convert to HH:MM:SS format
                second: job.second,
            };

            return safeJob;
        } else {
            // If the job object is invalid or undefined, skip it
            console.error(`Job with ID '${jobId}' is undefined or invalid.`);
            return null; // Return null to filter out this invalid job
        }
    });

    // Filter out skipped jobs (null values)
    const filteredSchedules = allSchedules.filter(
        (schedule) => schedule !== null
    );

    // Send JSON response with all schedules
    res.json(filteredSchedules);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
