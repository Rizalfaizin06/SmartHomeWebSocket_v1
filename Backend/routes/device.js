const express = require("express");
const router = express.Router();
const {
    getAllDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    updateDeviceStatus,
} = require("../controllers/deviceController");
const { authenticate } = require("../middlewares/auth");

// All device routes require authentication
router.use(authenticate);

module.exports = (broadcastStatus) => {
    // Status update route (must be before /:id to avoid conflict)
    router.post("/status", (req, res) => updateDeviceStatus(req, res, broadcastStatus));

    router.get("/", getAllDevices);
    router.get("/:id", getDeviceById);
    router.post("/", createDevice);
    router.put("/:id", updateDevice);
    router.delete("/:id", deleteDevice);

    return router;
};
