"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Devices", "slot", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: "Slot number on ESP32 (e.g. relay pin index)",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Devices", "slot");
    },
};
