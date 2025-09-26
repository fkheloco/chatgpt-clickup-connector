# Custom GPT Action Configuration

## Action Details

**Action Name:** `ClickUp Project Manager`

**Description:** `Connect to ClickUp API to manage tasks, create PRDs, and handle project management operations directly in your ClickUp workspace.`

## Authentication
- **Type:** None (public endpoint)

## API Configuration

### Base URL
```
https://chatgpt-clickup-connector-production.up.railway.app
```

### Endpoints

#### 1. Process ClickUp Commands
- **Method:** `POST`
- **URL:** `/chat`
- **Headers:**
  - `Content-Type: application/json`

**Request Body Schema:**
```json
{
  "message": "string"
}
```

**Supported Commands:**
1. **Create Task:** `"create task [task name]"`
   - Example: `"create task Update website copy"`

2. **Export PRD:** `"export prd [JSON]"`
   - Example: `"export prd {\"projectName\":\"New Feature\",\"tasks\":[{\"name\":\"Design UI\",\"description\":\"Create mockups\",\"assignees\":[\"Sarah\"],\"dueDate\":\"2024-12-31\",\"tags\":[\"design\"],\"priority\":\"high\"}]}"`

3. **Update Project:** `"update project [project name]"`
   - Example: `"update project Q4 Marketing Campaign"`

**Response Examples:**

**Task Creation Success:**
```json
{
  "success": true,
  "task": {
    "id": "86dxvpgtn",
    "name": "Test Railway Deployment",
    "url": "https://app.clickup.com/t/86dxvpgtn",
    "status": {
      "status": "open"
    },
    "assignees": [
      {
        "username": "Farid Kheloco"
      }
    ]
  }
}
```

**PRD Export Success:**
```json
{
  "success": true,
  "list": {
    "id": "901704202752",
    "name": "New Feature"
  },
  "tasks": 3,
  "link": "https://app.clickup.com/9017044797/v/l/901704202752"
}
```

**Project Update Success:**
```json
{
  "project": "Q4 Marketing Campaign",
  "summary": {
    "open": 5,
    "in progress": 3,
    "completed": 2
  },
  "link": "https://app.clickup.com/9017044797/v/l/901704202752"
}
```

#### 2. Webhook Handler
- **Method:** `POST`
- **URL:** `/webhook`
- **Headers:**
  - `Content-Type: application/json`

## Usage Instructions for Custom GPT

1. **Task Creation:**
   - User says: "Create a task to update the website"
   - GPT calls action with: `{"message": "create task Update the website"}`

2. **PRD Export:**
   - User provides project details
   - GPT formats as JSON and calls action with: `{"message": "export prd {\"projectName\":\"...\",\"tasks\":[...]}"}`

3. **Project Status:**
   - User asks: "What's the status of the Q4 campaign?"
   - GPT calls action with: `{"message": "update project Q4 campaign"}`

## Error Handling

- **400 Bad Request:** Missing or invalid message
- **500 Internal Server Error:** Server-side issues
- **Success responses:** Always include relevant ClickUp links for easy access

## Features

✅ **Task Management:** Create tasks with automatic assignment  
✅ **PRD Export:** Generate project lists with multiple tasks  
✅ **Project Status:** Get real-time project summaries  
✅ **Direct Links:** All responses include ClickUp URLs  
✅ **Fuzzy Matching:** Smart name resolution for spaces, folders, and users  
