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
            "devices",
            [
                {
                    name: "Lampu 1",
                    status: false,
                },
                {
                    name: "Lampu 2",
                    status: false,
                },
                {
                    name: "Lampu 3",
                    status: true,
                },
                {
                    name: "Lampu 4",
                    status: false,
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
        return queryInterface.bulkDelete("devices", null, {});
    },
};
