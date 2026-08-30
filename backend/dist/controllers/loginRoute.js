"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = login;
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const finduser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!finduser) {
            return res.status(404).json({ message: "no user exist with this email" });
        }
        if (!finduser.password) {
            return res.status(404).json(null);
        }
        const check_password = await bcrypt_1.default.compare(password, finduser.password);
        if (!check_password) {
            return res.status(400).json({ error: "invalid email or passwsford" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: finduser.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // console.log(check_password, password, finduser.password)
        // console.log(finduser)
        res.status(200).json({ token, finduser });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
}
