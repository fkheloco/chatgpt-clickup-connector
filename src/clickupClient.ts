import axios from "axios";

const BASE_URL = "https://api.clickup.com/api/v2";

async function request(method: string, url: string, data?: any) {
  const headers = {
    Authorization: process.env.CLICKUP_API_KEY || "",
    "Content-Type": "application/json",
  };
  
  const response = await axios({
    method,
    url: `${BASE_URL}${url}`,
    headers,
    data,
  });
  return response.data;
}

// Spaces / Folders / Lists
export async function getSpaces(teamId: string) {
  return request("GET", `/team/${teamId}/space`);
}

export async function getFolders(spaceId: string) {
  return request("GET", `/space/${spaceId}/folder`);
}

export async function getLists(folderId: string) {
  return request("GET", `/folder/${folderId}/list`);
}

export async function createList(folderId: string, payload: any) {
  return request("POST", `/folder/${folderId}/list`, payload);
}

// Tasks
export async function getTasks(listId: string) {
  return request("GET", `/list/${listId}/task`);
}

export async function createTask(listId: string, payload: any) {
  return request("POST", `/list/${listId}/task`, payload);
}

export async function updateTask(taskId: string, payload: any) {
  return request("PUT", `/task/${taskId}`, payload);
}

// Users
export async function getUsers(teamId: string) {
  return request("GET", `/team/${teamId}/user`);
}


