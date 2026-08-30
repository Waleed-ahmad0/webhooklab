"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const createUser = async (req, res) => {
    try {
        const body = req.body;
        console.log(body);
        const { email, firstName, password, lastName } = req.body;
        const existuser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existuser) {
            return res.status(400).json({ message: "user with this email already exist" });
        }
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: { email, firstName, lastName, password: hashed },
        });
        res.status(201).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
};
exports.createUser = createUser;
