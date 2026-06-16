"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add user_id to Devices table
        await queryInterface.addColumn("Devices", "user_id", {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });

        // Add user_id to Schedules table
        await queryInterface.addColumn("Schedules", "user_id", {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });

        // Add foreign key for device_id in Schedules (if not already there)
        await queryInterface.changeColumn("Schedules", "device_id", {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "Devices",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Devices", "user_id");
        await queryInterface.removeColumn("Schedules", "user_id");
    },
};
