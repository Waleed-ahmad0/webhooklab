"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceFunc = workspaceFunc;
exports.getworkspace = getworkspace;
const prisma_1 = require("../lib/prisma");
async function workspaceFunc(req, res) {
    try {
        const { name, ownerId } = await req.body;
        const createworkspace = await prisma_1.prisma.workspace.create({
            data: {
                name, ownerId
            }
        });
        res.status(201).json(createworkspace);
    }
    catch (error) {
        console.error(error);
        res.json(500).json({ error: 'internal server error status 500' });
    }
}
async function getworkspace(req, res) {
    try {
        const { userId } = req.params;
        console.log(userId);
        const getworkspaces = await prisma_1.prisma.workspace.findMany({ where: { ownerId: userId } });
        res.status(200).json(getworkspaces);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "internal server error" });
    }
}
