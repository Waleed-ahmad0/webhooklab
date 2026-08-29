import { prisma } from "./prisma";

export async function checkWorkspaceOwnership(workspaceId: string, userId?: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return { error: "Workspace not found", status: 404 };
  if (workspace.ownerId !== userId) return { error: "unauthorized", status: 401 };
  return { workspace };
}

export async function checkEndpointOwnership(endpointId: string, userId?: string) {
  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } });
  if (!endpoint) return { error: "Endpoint not found", status: 404 };

  const workspaceCheck = await checkWorkspaceOwnership(endpoint.workspaceId, userId);
  if ("error" in workspaceCheck) return workspaceCheck;

  return { endpoint };
}
export async function usercheck(user: string) {
    const user_check = await prisma.user.findUnique({ where: { id: user } })
    return user_check
}