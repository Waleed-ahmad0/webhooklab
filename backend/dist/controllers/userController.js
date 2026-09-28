"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getuserdata = getuserdata;
exports.deleteuser = deleteuser;
const prisma_1 = require("../lib/prisma");
async function getuserdata(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const getdata = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        res.status(200).json(getdata);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error' });
    }
}
async function deleteuser(req, res) {
    try {
        const userId = req.userId;
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "email not found" });
        }
        if (!userId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const finduser = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!finduser) {
            return res.status(404).json({ error: 'user not found' });
        }
        if (email !== finduser?.email) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        await prisma_1.prisma.user.delete({ where: { id: finduser?.id } });
        return res.status(200).json({ message: 'user delted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'internal server error' });
    }
}
