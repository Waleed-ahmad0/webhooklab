"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWorkspaceOwnership = checkWorkspaceOwnership;
exports.checkEndpointOwnership = checkEndpointOwnership;
exports.usercheck = usercheck;
const prisma_1 = require("./prisma");
async function checkWorkspaceOwnership(workspaceId, userId) {
    const workspace = await prisma_1.prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace)
        return { error: "Workspace not found", status: 404 };
    if (workspace.ownerId !== userId)
        return { error: "unauthorized", status: 401 };
    return { workspace };
}
async function checkEndpointOwnership(endpointId, userId) {
    const endpoint = await prisma_1.prisma.endpoint.findUnique({ where: { id: endpointId } });
    if (!endpoint)
        return { error: "Endpoint not found", status: 404 };
    const workspaceCheck = await checkWorkspaceOwnership(endpoint.workspaceId, userId);
    if ("error" in workspaceCheck)
        return workspaceCheck;
    return { endpoint };
}
async function usercheck(user) {
    const user_check = await prisma_1.prisma.user.findUnique({ where: { id: user } });
    return user_check;
}
