"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Schedules", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            device_id: {
                type: Sequelize.INTEGER,
            },
            hour: {
                type: Sequelize.INTEGER,
            },
            minute: {
                type: Sequelize.INTEGER,
            },
            second: {
                type: Sequelize.INTEGER,
            },
            status: {
                type: Sequelize.BOOLEAN,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Schedules");
    },
};
