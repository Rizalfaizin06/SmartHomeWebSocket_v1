"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Add seed commands here.
         *
         * Example:
         * await queryInterface.bulkInsert('People', [{
         *   name: 'John Doe',
         *   isBetaMember: false
         * }], {});
         */
        return queryInterface.bulkInsert(
            "schedules",
            [
                {
                    device_id: 1,
                    hour: 0,
                    minute: 0,
                    second: 0,
                    status: true,
                },
                {
                    device_id: 1,
                    hour: 0,
                    minute: 0,
                    second: 10,
                    status: true,
                },
                {
                    device_id: 1,
                    hour: 0,
                    minute: 0,
                    second: 20,
                    status: true,
                },
                {
                    device_id: 1,
                    hour: 0,
                    minute: 0,
                    second: 30,
                    status: true,
                },
                {
                    device_id: 1,
                    hour: 0,
                    minute: 0,
                    second: 40,
                    status: true,
                },
                {
                    device_id: 1,
                    hour: 0,
                    minute: 0,
                    second: 50,
                    status: true,
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
        return queryInterface.bulkDelete("schedules", null, {});
    },
};
