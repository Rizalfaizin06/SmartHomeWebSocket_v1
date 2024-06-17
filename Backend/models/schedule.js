"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Schedule extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Schedule.belongsTo(models.Device, {
                foreignKey: "device_id",
                as: "device",
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
