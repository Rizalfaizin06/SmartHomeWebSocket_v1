const express = require("express");
const schedule = require("node-schedule");
const app = express();
const { Device, Schedule } = require("./models");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;
let scheduledJobs = {};

function broadcastStatus(deviceId, deviceName, status, time) {
    console.log(`Update Status Device ID : ${deviceId} to ${status}`);
    console.log(`Broadcast: Device ${deviceName} is ${status} at ${time}`);
}

// Endpoint untuk membuat jadwal baru
app.post("/schedule", async (req, res) => {
    const hour = req.body.hour;
    const minute = req.body.minute;
    const second = req.body.second;
    const device_id = req.body.device_id;
    const status = req.body.status;

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

    const scheduleWithDevice = await Schedule.findOne({
        where: { id: newSchedule.id },
        include: {
            model: Device,
            as: "device",
        },
    });

    const deviceName = scheduleWithDevice.device.name;
    const deviceId = scheduleWithDevice.device.id;
    const rule = new schedule.RecurrenceRule();
    rule.second = second;

    const job = schedule.scheduleJob(rule, () => {
        const now = new Date();
        const time = now.toTimeString().split(" ");
        broadcastStatus(deviceId, deviceName, status, time);
    });

    const jobId = newSchedule.id;
    scheduledJobs[jobId] = { job, deviceName, status, hour, minute, second };

    res.json({ id: newSchedule.id, deviceName, status, hour, minute, second });
});

// Endpoint untuk menghapus jadwal
app.delete("/schedule/:id", async (req, res) => {
    const scheduleId = req.params.id;

    try {
        // Cari jadwal yang akan dihapus
        const schedule = await Schedule.findByPk(scheduleId, {
            include: {
                model: Device,
                as: "device",
            },
        });

        if (!schedule) {
            return res.status(404).send("Schedule not found.");
        }

        // Hapus pekerjaan yang dijadwalkan jika ada
        if (scheduledJobs[scheduleId]) {
            scheduledJobs[scheduleId].job.cancel();
            delete scheduledJobs[scheduleId];
        } else {
            console.log("Job not found in Local scheduledJobs.");
        }

        // Hapus jadwal dari database
        await schedule.destroy();

        res.json({ message: "Schedule deleted successfully.", data: schedule });
    } catch (error) {
        console.error("Error deleting schedule:", error);
        res.status(500).send("Internal Server Error.");
    }
});

app.get("/schedules", async (req, res) => {
    const filteredSchedules = await findSchedules();

    // Send JSON response with all schedules
    res.json(filteredSchedules);
});

async function refreshSchedule() {
    await cancelAllJobs();
    console.log(scheduledJobs);
    const schedules = await Schedule.findAll({
        include: {
            model: Device,
            as: "device",
        },
    });

    const allSchedules = schedules.map((schedule) => ({
        scheduleId: schedule.id,
        deviceName: schedule.device.name,
        deviceId: schedule.device.id,
        hour: schedule.hour,
        minute: schedule.minute,
        second: schedule.second,
        status: schedule.status,
    }));

    allSchedules.forEach((data) => {
        const rule = new schedule.RecurrenceRule();
        // Set specific time for Mondays, Wednesdays, and Fridays:
        // rule.dayOfWeek = [
        //     new schedule.Range(1, 1), // Monday
        //     new schedule.Range(3, 3), // Wednesday
        //     new schedule.Range(5, 5),
        // ]; // Friday
        // rule.hour = data.hour;
        // rule.minute = data.minute;
        rule.second = data.second;

        const job = schedule.scheduleJob(rule, () => {
            const now = new Date();
            const time = now.toTimeString().split(" ")[0];
            broadcastStatus(data.deviceId, data.deviceName, data.status, time);
        });

        const jobId = data.scheduleId;

        scheduledJobs[jobId] = {
            job,
            device: data.deviceName,
            status: data.status,
            hour: data.hour,
            minute: data.minute,
            second: data.second,
        };
    });
    const filteredSchedules = await findSchedules();

    // const jobIds = Object.keys(scheduledJobs);
    // console.log("Turning on Scheduled jobs: ", jobIds);

    // Send JSON response with all schedules
    // res.json(filteredSchedules);
    console.log("Turning on " + filteredSchedules.length + " Scheduled jobs:");
    console.log(filteredSchedules);
}

async function cancelAllJobs() {
    for (const jobId in scheduledJobs) {
        if (scheduledJobs.hasOwnProperty(jobId)) {
            scheduledJobs[jobId].job.cancel();
            console.log(`Cancelled job with ID: ${jobId}`);
        }
    }
    scheduledJobs = {};
}
async function findSchedules() {
    if (Object.keys(scheduledJobs).length === 0) {
        // return res.json([]); // Handle empty scheduledJobs (e.g., send an empty response)
        console.log("No Schedule Jobs Initialized");
        return;
    }

    // Process scheduled jobs
    const finalSchedule = Object.keys(scheduledJobs).map((jobId) => {
        const job = scheduledJobs[jobId];

        if (job) {
            const time = new Date(job.job.nextInvocation().toISOString());
            time.setUTCHours(time.getUTCHours() + 7);
            const safeJob = {
                jobId,
                device: job.device,
                status: job.status,
                second: job.second,
                nextRun: time.toISOString().slice(2, 19).replace("T", " "),
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

    return filteredSchedules;
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

refreshSchedule();
