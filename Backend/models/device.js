"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Device extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
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
            name: DataTypes.STRING,
            status: DataTypes.BOOLEAN,
        },
        {
            sequelize,
            modelName: "Device",
        }
    );
    return Device;
};
