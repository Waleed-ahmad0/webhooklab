"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const prisma_1 = require("../lib/prisma");
const createUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body);
        const { email, firstName, lastName } = req.body;
        const user = await prisma_1.prisma.user.create({
            data: { email, firstName, lastName },
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
};
exports.createUser = createUser;
