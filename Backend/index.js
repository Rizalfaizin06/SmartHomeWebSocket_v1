const express = require("express");
const schedule = require("node-schedule");
const app = express();

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
app.post("/schedule/:lamp/:status/:second", (req, res) => {
    const second = parseInt(req.params.second);
    const lamp = req.params.lamp;
    const status = req.params.status;

    // Validasi input
    if (isNaN(second) || second < 0 || second > 59) {
        return res
            .status(400)
            .send("Invalid second parameter. It must be between 0 and 59.");
    }

    const rule = new schedule.RecurrenceRule();
    rule.second = second;

    const job = schedule.scheduleJob(rule, () => {
        const now = new Date();
        const time = now.toTimeString().split(" ")[0];
        broadcastStatus(lamp, status, time);
    });

    const jobId = jobIdCounter++; // Generate ID unik
    scheduledJobs[jobId] = { job, lamp, status, second };

    res.json({ jobId, lamp, status, second });
});

app.get("/schedules", (req, res) => {
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
                nextRun: time.toTimeString().split(" ")[0], // Convert to HH:MM:SS format
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

app.get("/schedule/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const job = scheduledJobs[jobId];

    // Check if job exists
    if (!job) {
        return res.status(404).send("Job not found");
    }

    // Extract relevant details, sanitizing JSON response to avoid circular structure issues
    const jobDetails = {
        jobId,
        lamp: job.lamp,
        status: job.status,
        second: job.second,
    };

    // Respond with job details in JSON format
    res.json(jobDetails);
});

// Endpoint untuk menghapus jadwal berdasarkan ID
app.delete("/schedule/:jobId", (req, res) => {
    const jobId = req.params.jobId;
    const job = scheduledJobs[jobId];
    if (!job) {
        return res.status(404).send("Job not found");
    }
    job.job.cancel(); // Membatalkan pekerjaan di jadwal
    delete scheduledJobs[jobId];
    res.send("Job deleted");
});

// Endpoint untuk memperbarui jadwal berdasarkan ID
app.put("/schedule/:jobId/:lamp/:status/:second", (req, res) => {
    const jobId = req.params.jobId;
    const second = parseInt(req.params.second);
    const lamp = req.params.lamp;
    const status = req.params.status;

    // Validasi input
    if (isNaN(second) || second < 0 || second > 59) {
        return res
            .status(400)
            .send("Invalid second parameter. It must be between 0 and 59.");
    }

    const existingJob = scheduledJobs[jobId];
    if (!existingJob) {
        return res.status(404).send("Job not found");
    }

    // Batalkan jadwal yang sudah ada
    existingJob.job.cancel();

    // Jadwalkan pekerjaan baru
    const rule = new schedule.RecurrenceRule();
    rule.second = second;

    const job = schedule.scheduleJob(rule, () => {
        const now = new Date();
        const time = now.toTimeString().split(" ")[0];
        broadcastStatus(lamp, status, time);
    });

    // Update jadwal dengan ID baru
    scheduledJobs[jobId] = { job, lamp, status, second };

    res.json({ jobId, lamp, status, second });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
