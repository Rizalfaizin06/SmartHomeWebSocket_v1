const express = require("express");
const schedule = require("node-schedule");
const app = express();

const port = 3000;

// Fungsi broadcastStatus
function broadcastStatus(lamp, status, time) {
    console.log(`Broadcast: Lamp ${lamp} is ${status} at ${time}`);
}

// Objek untuk menyimpan job penjadwalan
const scheduledJobs = {};

// Endpoint untuk melihat semua jadwal
app.get("/schedules", (req, res) => {
    const allSchedules = Object.keys(scheduledJobs).map((lamp) => ({
        lamp,
        schedules: scheduledJobs[lamp].map((jobObj) => ({
            status: jobObj.status,
            second: jobObj.second,
        })),
    }));
    console.log("Current Schedules:", JSON.stringify(allSchedules, null, 2));
    res.json(allSchedules);
});

app.get("/schedule/:lamp/:status/:second", (req, res) => {
    const second = parseInt(req.params.second); // Dapatkan detik dari parameter
    const lamp = req.params.lamp;
    const status = req.params.status;

    // Validasi input
    if (isNaN(second) || second < 0 || second > 59) {
        return res
            .status(400)
            .send("Invalid second parameter. It must be between 0 and 59.");
    }

    // Membuat array untuk setiap lamp jika belum ada
    if (!scheduledJobs[lamp]) {
        scheduledJobs[lamp] = [];
    }

    // Membatalkan jadwal yang sudah ada untuk lampu dan status yang sama
    // jika lampu sama dan status sama, maka batalkan pekerjaan, jadi bisa menyalakan lampu satu kali saja di dalam loop waktu
    scheduledJobs[lamp] = scheduledJobs[lamp].filter((jobObj) => {
        if (jobObj.status === status) {
            jobObj.job.cancel();
            return false;
        }
        return true;
    });

    // Membuat aturan penjadwalan
    const rule = new schedule.RecurrenceRule();
    rule.second = second; // Atur aturan untuk dijalankan pada detik tertentu setiap menit

    // Menjadwalkan pekerjaan baru
    const job = schedule.scheduleJob(rule, () => {
        const now = new Date();
        const time = now.toTimeString().split(" ")[0]; // Mendapatkan waktu dalam format HH:MM:SS
        broadcastStatus(lamp, status, time);
    });

    // Menyimpan pekerjaan dalam array
    scheduledJobs[lamp].push({ job, second, status });

    res.send(
        `Scheduled ${lamp} to turn ${status} at every second ${second} of each minute.`
    );
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
