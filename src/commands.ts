import { createTask, createList, getTasks, createSubtask } from "./clickupClient";
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

  // === BULK CREATE TASKS ===
  // Supports commands like:
  // "create tasks" or "create task list" followed by newline-separated task names (bulleted or plain)
  if (message.toLowerCase().startsWith("create tasks") || message.toLowerCase().startsWith("create task list")) {
    try {
      // Target list for bulk tasks
      const targetListId = "901705691847";

      // Extract the portion after the command phrase
      const linesBlock = message
        .replace(/^create tasks/i, "")
        .replace(/^create task list/i, "")
        .trim();

      if (!linesBlock) {
        return { error: "No tasks provided. Provide newline-separated task names after 'create tasks'." };
      }

      const rawLines = linesBlock.split(/\r?\n/);

      // Normalize lines: remove bullets, numbers, emojis, and trim
      const taskNames = rawLines
        .map((line) =>
          line
            .replace(/^[-*•\u2022\u25CF\u25CB\u25A0\u25AA\u25AB\s]+/, "") // bullets
            .replace(/^\d+\.|^\d+\)|^\(\d+\)\s*/, "") // numeric lists
            .replace(/^👉\s*|^➡️\s*|^✅\s*|^✔️\s*|^–\s*/, "") // common emojis/dashes
            .trim()
        )
        .filter((t) => t.length > 0);

      if (taskNames.length === 0) {
        return { error: "No valid task names found after parsing input lines." };
      }

      const created: any[] = [];
      for (const taskName of taskNames) {
        const payload = { name: taskName };
        const task = await createTask(targetListId, payload);
        created.push({ id: task.id, name: task.name, url: task.url });
      }

      return {
        success: true,
        createdCount: created.length,
        tasks: created,
        link: `https://app.clickup.com/${teamId}/v/l/${targetListId}`,
      };
    } catch (error: any) {
      console.error("Error bulk creating tasks:", error);
      return { error: error.message };
    }
  }

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

      // Create a new list in the Proposals folder
      const folderId = "90172820776"; // Proposals folder
      const newList = await createList(folderId, { name: prd.projectName });
      const createdTasks: any[] = [];

      for (const task of prd.tasks) {
        // Use hardcoded assignee ID for now to avoid user resolution issues
        const assigneeIds = ["63075093"]; // Farid Kheloco as default

        // Calculate due date
        let dueDate = null;
        if (task.dueDate) {
          dueDate = new Date(task.dueDate).getTime();
        }

        // Calculate start date
        let startDate = null;
        if (task.startDate) {
          startDate = new Date(task.startDate).getTime();
        }

        const payload = {
          name: task.name || "Untitled Task",
          description: task.description || "",
          assignees: assigneeIds,
          due_date: dueDate,
          start_date: startDate,
          tags: task.tags || [],
          priority: mapPriority(task.priority || "normal"),
          time_estimate: task.timeEstimate ? parseInt(task.timeEstimate) * 3600000 : null, // Convert hours to milliseconds
          custom_fields: task.customFields || [],
        };

        const createdTask = await createTask(newList.id, payload);
        createdTasks.push(createdTask);

        // Create subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
          for (const subtask of task.subtasks) {
            const subtaskAssigneeIds: string[] = [];
            for (const assignee of subtask.assignees || []) {
              const user = await resolveUserIdByName(teamId, assignee);
              if (user) subtaskAssigneeIds.push(user.id);
            }
            
            if (subtaskAssigneeIds.length === 0) {
              subtaskAssigneeIds.push("63075093");
            }

            const subtaskPayload = {
              name: subtask.name || "Untitled Subtask",
              description: subtask.description || "",
              assignees: subtaskAssigneeIds,
              due_date: subtask.dueDate ? new Date(subtask.dueDate).getTime() : null,
              start_date: subtask.startDate ? new Date(subtask.startDate).getTime() : null,
              tags: subtask.tags || [],
              priority: mapPriority(subtask.priority || "normal"),
              time_estimate: subtask.timeEstimate ? parseInt(subtask.timeEstimate) * 3600000 : null,
            };

            try {
              const createdSubtask = await createSubtask(createdTask.id, subtaskPayload);
              console.log(`Created subtask: ${subtask.name}`);
            } catch (subtaskError) {
              console.error(`Error creating subtask ${subtask.name}:`, subtaskError);
            }
          }
        }
      }

      return {
        success: true,
        projectName: prd.projectName,
        list: newList,
        createdCount: createdTasks.length,
        tasks: createdTasks,
        link: `https://app.clickup.com/${teamId}/v/l/${newList.id}`,
      };
    } catch (error: any) {
      console.error("Error creating PRD:", error);
      return { error: error.message };
    }
  }

  // === CREATE DETAILED PROJECT ===
  if (message.toLowerCase().startsWith("create detailed project")) {
    try {
      const projectData = JSON.parse(message.replace("create detailed project", "").trim());

      // Create list in the Proposals folder
      const folderId = "90172820776"; // Proposals folder
      const newList = await createList(folderId, { name: projectData.projectName });
      const createdTasks: any[] = [];

      for (const task of projectData.tasks) {
        // Use hardcoded assignee ID for now to avoid user resolution issues
        const assigneeIds = ["63075093"]; // Farid Kheloco as default

        // Calculate due date
        let dueDate = null;
        if (task.dueDate) {
          dueDate = new Date(task.dueDate).getTime();
        }

        // Calculate start date
        let startDate = null;
        if (task.startDate) {
          startDate = new Date(task.startDate).getTime();
        }

        const payload = {
          name: task.name || "Untitled Task",
          description: task.description || "",
          assignees: assigneeIds,
          due_date: dueDate,
          start_date: startDate,
          tags: task.tags || [],
          priority: mapPriority(task.priority || "normal"),
          time_estimate: task.timeEstimate ? parseInt(task.timeEstimate) * 3600000 : null, // Convert hours to milliseconds
          custom_fields: task.customFields || [],
        };

        const createdTask = await createTask(newList.id, payload);
        createdTasks.push(createdTask);

        // Create subtasks if they exist
        if (task.subtasks && task.subtasks.length > 0) {
          for (const subtask of task.subtasks) {
            const subtaskAssigneeIds: string[] = [];
            for (const assignee of subtask.assignees || []) {
              const user = await resolveUserIdByName(teamId, assignee);
              if (user) subtaskAssigneeIds.push(user.id);
            }
            
            if (subtaskAssigneeIds.length === 0) {
              subtaskAssigneeIds.push("63075093");
            }

            const subtaskPayload = {
              name: subtask.name || "Untitled Subtask",
              description: subtask.description || "",
              assignees: subtaskAssigneeIds,
              due_date: subtask.dueDate ? new Date(subtask.dueDate).getTime() : null,
              start_date: subtask.startDate ? new Date(subtask.startDate).getTime() : null,
              tags: subtask.tags || [],
              priority: mapPriority(subtask.priority || "normal"),
              time_estimate: subtask.timeEstimate ? parseInt(subtask.timeEstimate) * 3600000 : null,
            };

            try {
              const createdSubtask = await createSubtask(createdTask.id, subtaskPayload);
              console.log(`Created subtask: ${subtask.name}`);
            } catch (subtaskError) {
              console.error(`Error creating subtask ${subtask.name}:`, subtaskError);
            }
          }
        }
      }

      return {
        success: true,
        projectName: projectData.projectName,
        list: newList,
        createdCount: createdTasks.length,
        tasks: createdTasks,
        link: `https://app.clickup.com/${teamId}/v/l/${newList.id}`,
      };
    } catch (error: any) {
      console.error("Error creating detailed project:", error);
      return { error: error.message };
    }
  }

  // === CREATE LIST WITH TASKS ===
  if (message.toLowerCase().startsWith("create list")) {
    try {
      const listName = message.replace("create list", "").trim();
      console.log("Creating list:", listName);
      
      // Create list in the Proposals folder
      const folderId = "90172820776"; // Proposals folder
      const newList = await createList(folderId, { name: listName });
      
      return {
        success: true,
        list: newList,
        link: `https://app.clickup.com/${teamId}/v/l/${newList.id}`,
      };
    } catch (error: any) {
      console.error("Error creating list:", error);
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


