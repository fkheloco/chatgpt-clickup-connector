import Fuse from "fuse.js";
import { getSpaces, getFolders, getLists, getUsers } from "./clickupClient";

function fuzzyMatch(target: string, items: { id: string; name: string }[]) {
  const fuse = new Fuse(items, { keys: ["name"], threshold: 0.3 });
  return fuse.search(target)[0]?.item;
}

export async function resolveSpaceIdByName(teamId: string, name: string) {
  const spaces = await getSpaces(teamId);
  return fuzzyMatch(name, spaces.spaces);
}

export async function resolveFolderIdByName(spaceId: string, name: string) {
  const folders = await getFolders(spaceId);
  return fuzzyMatch(name, folders.folders);
}

export async function resolveListIdByName(spaceId: string, name: string) {
  // Get lists directly from space
  const response = await fetch(`https://api.clickup.com/api/v2/space/${spaceId}/list`, {
    headers: {
      'Authorization': process.env.CLICKUP_API_KEY || '',
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  if (data.lists) {
    return fuzzyMatch(name, data.lists);
  }
  return null;
}

export async function resolveUserIdByName(teamId: string, name: string) {
  try {
    const users = await getUsers(teamId);
    const members = users.members.map((m: any) => ({
      id: m.user.id,
      name: m.user.username,
      email: m.user.email,
    }));
    
    // Try exact email match first
    const emailMatch = members.find((m: any) => m.email === name);
    if (emailMatch) return emailMatch;
    
    // Try fuzzy match on username
    return fuzzyMatch(name, members);
  } catch (error) {
    console.error("Error resolving user:", error);
    // Return a default user if resolution fails
    return { id: "63075093", name: "Farid Kheloco" };
  }
}


