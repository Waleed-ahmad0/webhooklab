"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceFunc = workspaceFunc;
exports.getworkspace = getworkspace;
exports.updateWorkspaceFunc = updateWorkspaceFunc;
exports.deleteWorkspaceFunc = deleteWorkspaceFunc;
const prisma_1 = require("../lib/prisma");
async function workspaceFunc(req, res) {
    try {
        const userId = req.userId;
        const { name } = await req.body;
        const createworkspace = await prisma_1.prisma.workspace.create({
            data: {
                name, ownerId: userId
            }
        });
        res.status(201).json(createworkspace);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'internal server error status 500' });
    }
}
async function getworkspace(req, res) {
    try {
        const userId = req.userId;
        const getworkspaces = await prisma_1.prisma.workspace.findMany({ where: { ownerId: userId } });
        res.status(200).json(getworkspaces);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "internal server error" });
    }
}
async function updateWorkspaceFunc(req, res) {
    try {
        const userId = req.userId;
        const workspaceIdParam = req.params.workspaceId;
        const workspaceId = Array.isArray(workspaceIdParam) ? workspaceIdParam[0] : workspaceIdParam;
        const { name } = req.body ?? {};
        if (!workspaceId || typeof name !== "string") {
            return res.status(400).json({ error: "Valid workspace id and name are required" });
        }
        const trimmedName = name.trim();
        if (!trimmedName) {
            return res.status(400).json({ error: "Workspace name cannot be empty" });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                ownerId: userId,
            },
        });
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        const updatedWorkspace = await prisma_1.prisma.workspace.update({
            where: { id: workspaceId },
            data: { name: trimmedName },
        });
        return res.status(200).json(updatedWorkspace);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
}
async function deleteWorkspaceFunc(req, res) {
    try {
        const userId = req.userId;
        const workspaceIdParam = req.params.workspaceId;
        const workspaceId = Array.isArray(workspaceIdParam) ? workspaceIdParam[0] : workspaceIdParam;
        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace id is required" });
        }
        const workspace = await prisma_1.prisma.workspace.findFirst({
            where: {
                id: workspaceId,
                ownerId: userId,
            },
        });
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }
        await prisma_1.prisma.workspace.delete({
            where: { id: workspaceId },
        });
        return res.status(200).json({ success: true, message: "Workspace deleted" });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "internal server error" });
    }
}
