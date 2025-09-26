# ChatGPT ↔ ClickUp Connector

A powerful integration that allows ChatGPT to create tasks, export PRDs, and manage projects directly in ClickUp.

## Features

- ✅ **Create Tasks**: Generate tasks in ClickUp with natural language
- ✅ **Export PRDs**: Create project lists with multiple tasks from JSON
- ✅ **Project Management**: Get project status and summaries
- ✅ **Fuzzy Matching**: Smart name resolution for spaces, folders, and users

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Run: `npm run dev`

## Environment Variables

```
CLICKUP_API_KEY=your_clickup_token
CLICKUP_TEAM_ID=your_clickup_team_id
PORT=3000
```

## API Endpoints

- `POST /chat` - Process ClickUp commands
- `POST /webhook` - ClickUp webhook handler (placeholder)

## Commands

- `create task [name]` - Create a new task
- `export prd [JSON]` - Export PRD with tasks
- `update project [name]` - Get project status
