const { Device } = require("../models");

const getAllDevices = async (req, res) => {
    try {
        const userId = req.user.id;
        const devices = await Device.findAll({ where: { user_id: userId } });
        res.json({ data: devices });
    } catch (error) {
        console.error("Get all devices error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const getDeviceById = async (req, res) => {
    try {
        const userId = req.user.id;
        const device = await Device.findOne({
            where: { id: req.params.id, user_id: userId },
        });

        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }

        res.json({ data: device });
    } catch (error) {
        console.error("Get device error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const createDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, slot, status } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Device name is required." });
        }

        if (slot === undefined || slot === null) {
            return res.status(400).json({ message: "Slot number is required." });
        }

        // Cek apakah slot sudah dipakai oleh user ini
        const existingSlot = await Device.findOne({
            where: { user_id: userId, slot },
        });

        if (existingSlot) {
            return res.status(409).json({ message: `Slot ${slot} is already in use by device "${existingSlot.name}".` });
        }

        const device = await Device.create({
            user_id: userId,
            name,
            slot,
            status: status !== undefined ? status : false,
        });

        res.status(201).json({ message: "Device created successfully.", data: device });
    } catch (error) {
        console.error("Create device error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const updateDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const device = await Device.findOne({
            where: { id: req.params.id, user_id: userId },
        });

        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }

        const { name, slot, status } = req.body;

        // Cek apakah slot baru sudah dipakai oleh device lain
        if (slot !== undefined && slot !== device.slot) {
            const existingSlot = await Device.findOne({
                where: { user_id: userId, slot },
            });
            if (existingSlot) {
                return res.status(409).json({ message: `Slot ${slot} is already in use by device "${existingSlot.name}".` });
            }
        }

        await device.update({
            name: name !== undefined ? name : device.name,
            slot: slot !== undefined ? slot : device.slot,
            status: status !== undefined ? status : device.status,
        });

        res.json({ message: "Device updated successfully.", data: device });
    } catch (error) {
        console.error("Update device error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const deleteDevice = async (req, res) => {
    try {
        const userId = req.user.id;
        const device = await Device.findOne({
            where: { id: req.params.id, user_id: userId },
        });

        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }

        await device.destroy();

        res.json({ message: "Device deleted successfully.", data: device });
    } catch (error) {
        console.error("Delete device error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

const updateDeviceStatus = async (req, res, broadcastStatus) => {
    try {
        const userId = req.user.id;
        const { deviceId, status } = req.body;

        if (deviceId === undefined || status === undefined) {
            return res.status(400).json({ message: "deviceId and status are required." });
        }

        const device = await Device.findOne({
            where: { id: deviceId, user_id: userId },
        });

        if (!device) {
            return res.status(404).json({ message: "Device not found." });
        }

        const time = new Date().toTimeString().split(" ")[0];
        await device.update({ status });
        broadcastStatus(userId, device.id, device.name, device.slot, status, time);

        res.json({ message: "Device state updated successfully.", data: device });
    } catch (error) {
        console.error("Update device status error:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
};

module.exports = {
    getAllDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    updateDeviceStatus,
};
