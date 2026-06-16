"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Device extends Model {
        static associate(models) {
            Device.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            });
            Device.hasMany(models.Schedule, {
                foreignKey: "device_id",
                as: "schedules",
            });
        }
    }
    Device.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            name: DataTypes.STRING,
            slot: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: "Slot number on ESP32 (e.g. relay pin index)",
            },
            status: DataTypes.BOOLEAN,
        },
        {
            sequelize,
            modelName: "Device",
        }
    );
    return Device;
};
