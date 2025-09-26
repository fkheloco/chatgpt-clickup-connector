import { createTask, createList, getTasks } from "./clickupClient";
import { resolveSpaceIdByName, resolveFolderIdByName, resolveListIdByName, resolveUserIdByName } from "./resolver";

// Map text priority → ClickUp numeric priority
function mapPriority(priority: string): number {
  switch (priority.toLowerCase()) {
    case "urgent": return 1;
    case "high": return 2;
    case "normal": return 3;
    case "low": return 4;
    default: return 3;
  }
}

export async function processCommand(message: string) {
  const teamId = process.env.CLICKUP_TEAM_ID as string;

  // === CREATE TASK ===
  if (message.toLowerCase().startsWith("create task")) {
    try {
      const taskName = message.replace("create task", "").trim();
      console.log("Creating task:", taskName);
      
      // Hardcode the values for now
      const listId = "901704202752"; // Development General Tasks
      const assigneeId = "63075093"; // Farid Kheloco

      const payload = {
        name: taskName,
        assignees: [assigneeId],
      };

      console.log("Creating task with payload:", payload);
      const task = await createTask(listId, payload);
      return { success: true, task };
    } catch (error: any) {
      console.error("Error creating task:", error);
      return { error: error.message };
    }
  }

  // === EXPORT PRD ===
  if (message.toLowerCase().startsWith("export prd")) {
    try {
      const prd = JSON.parse(message.replace("export prd", "").trim());

      // Use the specific folder ID from the URL you provided
      const folderId = "90172820776"; // Proposals folder
      
      const newList = await createList(folderId, { name: prd.projectName });
      const createdTasks: any[] = [];

      for (const task of prd.tasks) {
        const assigneeIds: string[] = [];
        for (const assigneeName of task.assignees) {
          const user = await resolveUserIdByName(teamId, assigneeName);
          if (user) assigneeIds.push(user.id);
        }

        const payload = {
          name: task.name,
          description: task.description,
          assignees: assigneeIds,
          due_date: new Date(task.dueDate).getTime(),
          tags: task.tags,
          priority: mapPriority(task.priority),
        };

        const createdTask = await createTask(newList.id, payload);
        createdTasks.push(createdTask);
      }

      return {
        success: true,
        list: newList,
        tasks: createdTasks.length,
        link: `https://app.clickup.com/${teamId}/v/l/${newList.id}`,
      };
    } catch (error: any) {
      console.error("Error creating PRD:", error);
      return { error: error.message };
    }
  }

  // === PROJECT UPDATE ===
  if (message.toLowerCase().startsWith("update project")) {
    const projectName = message.replace("update project", "").trim();
    const space = await resolveSpaceIdByName(teamId, "Development");
    const folder = await resolveFolderIdByName(space!.id, "Q4 Projects");
    const list = await resolveListIdByName(folder!.id, projectName);

    const tasks = await getTasks(list!.id);
    const summary = tasks.tasks.reduce((acc: any, t: any) => {
      const status = t.status.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      project: projectName,
      summary,
      link: `https://app.clickup.com/${teamId}/v/l/${list!.id}`,
    };
  }

  return { error: "Unknown command" };
}


