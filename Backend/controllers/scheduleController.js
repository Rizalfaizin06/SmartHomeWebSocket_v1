const nodeSchedule = require("node-schedule");
const { Schedule, Device } = require("../models");

// In-memory store for scheduled jobs
let scheduledJobs = {};

const createSchedule = async (req, res, broadcastStatus) => {
    try {
        const userId = req.user.id;
        const { hour, minute, second, device_id, status } = req.body;

        if (isNaN(second) || second < 0 || second > 59) {
            return res.status(400).json({ message: "Invalid second parameter. It must be between 0 and 59." });
        }

        if (isNaN(minute) || minute < 0 || minute > 59) {
            return res.status(400).json({ message: "Invalid minute parameter. It must be between 0 and 59." });
        }

        if (isNaN(hour) || hour < 0 || hour > 23) {
            return res.status(400).json({ message: "Invalid hour parameter. It must be between 0 and 23." });
        }

        // Verify the device belongs to this user
        const device = await Device.findOne({
            where: { id: device_id, user_id: userId },
        });

        if (!device) {
            return res.status(404).json({ message: "Device not found or does not belong to you." });
        }

        const newSchedule = await Schedule.create({
            user_id: userId,
            device_id,
            hour,
            minute,
            second,
            status,
        });

        const rule = new nodeSchedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        rule.second = second;

        const job = nodeSchedule.scheduleJob(rule, () => {
            const now = new Date();
            const time = now.toTimeString().split(" ")[0];
            broadcastStatus(userId, device.id, device.name, device.slot, status, time);
        });

        const jobId = newSchedule.id;
        scheduledJobs[jobId] = {
            job,
            device: device.name,
            deviceId: device.id,
            slot: device.slot,
            status,
            hour,
            minute,
            second,
            user_id: userId,
        };

        res.status(201).json({
            message: "Schedule created successfully.",
            data: { id: newSchedule.id, deviceName: device.name, slot: device.slot, status, hour, minute, second },
        });
    } catch (error) {
        console.error("Create schedule error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const scheduleId = req.params.id;

        const schedule = await Schedule.findOne({
            where: { id: scheduleId, user_id: userId },
            include: { model: Device, as: "device" },
        });

        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found." });
        }

        if (scheduledJobs[scheduleId]) {
            scheduledJobs[scheduleId].job.cancel();
            delete scheduledJobs[scheduleId];
        }

        await schedule.destroy();

        res.json({ message: "Schedule deleted successfully.", data: schedule });
    } catch (error) {
        console.error("Delete schedule error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const getAllSchedules = async (req, res) => {
    try {
        const userId = req.user.id;
        const filteredSchedules = getActiveSchedulesByUser(userId);
        res.json({ data: filteredSchedules });
    } catch (error) {
        console.error("Get schedules error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

function getActiveSchedulesByUser(userId) {
    if (Object.keys(scheduledJobs).length === 0) {
        return [];
    }

    const finalSchedule = Object.keys(scheduledJobs)
        .filter((jobId) => scheduledJobs[jobId].user_id === userId)
        .map((jobId) => {
            const job = scheduledJobs[jobId];
            if (job && job.job.nextInvocation()) {
                const time = new Date(job.job.nextInvocation().toISOString());
                time.setUTCHours(time.getUTCHours() + 7);
                return {
                    jobId,
                    device: job.device,
                    slot: job.slot,
                    status: job.status,
                    second: job.second,
                    minute: job.minute,
                    hour: job.hour,
                    nextRun: time.toISOString().slice(2, 19).replace("T", " "),
                };
            }
            return null;
        });

    return finalSchedule.filter((s) => s !== null);
}

async function refreshSchedules(broadcastStatus) {
    await cancelAllJobs();

    const schedules = await Schedule.findAll({
        include: { model: Device, as: "device" },
    });

    const allSchedules = schedules.map((s) => ({
        scheduleId: s.id,
        userId: s.user_id,
        deviceName: s.device.name,
        deviceId: s.device.id,
        slot: s.device.slot,
        hour: s.hour,
        minute: s.minute,
        second: s.second,
        status: s.status,
    }));

    allSchedules.forEach((data) => {
        const rule = new nodeSchedule.RecurrenceRule();
        rule.hour = data.hour;
        rule.minute = data.minute;
        rule.second = data.second;

        const job = nodeSchedule.scheduleJob(rule, () => {
            const now = new Date();
            const time = now.toTimeString().split(" ")[0];
            broadcastStatus(data.userId, data.deviceId, data.deviceName, data.slot, data.status, time);
        });

        scheduledJobs[data.scheduleId] = {
            job,
            device: data.deviceName,
            deviceId: data.deviceId,
            slot: data.slot,
            status: data.status,
            hour: data.hour,
            minute: data.minute,
            second: data.second,
            user_id: data.userId,
        };
    });

    const activeCount = Object.keys(scheduledJobs).length;
    console.log(`Loaded ${activeCount} scheduled jobs.`);
}

async function cancelAllJobs() {
    for (const jobId in scheduledJobs) {
        if (scheduledJobs.hasOwnProperty(jobId)) {
            scheduledJobs[jobId].job.cancel();
        }
    }
    scheduledJobs = {};
}

module.exports = {
    createSchedule,
    deleteSchedule,
    getAllSchedules,
    refreshSchedules,
};
