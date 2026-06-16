const express = require("express");
const router = express.Router();
const {
    createSchedule,
    deleteSchedule,
    getAllSchedules,
} = require("../controllers/scheduleController");
const { authenticate } = require("../middlewares/auth");

// All schedule routes require authentication
router.use(authenticate);

module.exports = (broadcastStatus) => {
    router.post("/", (req, res) => createSchedule(req, res, broadcastStatus));
    router.delete("/:id", deleteSchedule);
    router.get("/", getAllSchedules);
    return router;
};
