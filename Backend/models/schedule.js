"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Schedule extends Model {
        static associate(models) {
            Schedule.belongsTo(models.Device, {
                foreignKey: "device_id",
                as: "device",
            });
            Schedule.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "user",
            });
        }
    }
    Schedule.init(
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
            device_id: DataTypes.INTEGER,
            hour: DataTypes.INTEGER,
            minute: DataTypes.INTEGER,
            second: DataTypes.INTEGER,
            status: DataTypes.BOOLEAN,
        },
        {
            sequelize,
            modelName: "Schedule",
        }
    );
    return Schedule;
};
