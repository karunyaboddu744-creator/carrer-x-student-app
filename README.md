# carrer-x-student-app

CARRER-X Student App — an AI-powered career readiness platform that helps students assess skills, identify skill gaps, complete real-world challenges, track progress, and build verified career evidence for industry readiness.

This package combines the Student frontend and Student backend into one Electron desktop application.

## What is connected
- Local Express backend starts automatically inside the desktop app.
- JWT login/register is connected.
- Dashboard reads live backend data.
- Skills can be added and are persisted.
- AI/Core Skills assessment submits its result to the backend.
- Backend stores user, assessment, project, skill, activity and challenge data in the local app data folder.
- Company, roadmap, notifications and settings screens from the supplied Student frontend are retained.

## Run in VS Code
Requirements: Node.js 20+.

```powershell
npm install
npm run build
npm run desktop
```

## Build a Windows installer / portable executable
On a Windows development machine:

```powershell
npm install
npm run dist
```

The generated Windows files will be placed in `dist/` by electron-builder.

## Browser development
```powershell
npm run dev
```
The development browser uses `http://localhost:5000` as the fallback backend URL. For desktop packaging the Electron process injects a local backend URL automatically.

## Important
The supplied backend was a JSON-file backend, so this desktop version keeps that architecture. It is suitable for a hackathon/demo and local use. For multi-user production hosting, replace the JSON store with a real database and deploy the API separately.
