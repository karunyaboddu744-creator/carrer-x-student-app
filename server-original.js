const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "carrer_x_super_secret_key_2026";

const DB_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DB_DIR, "db.json");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [], assessments: [], projects: [], challenges: [], progress: [], activity: []
  }, null, 2));
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function calculateReadiness(user, db) {
  const profileScore = user.profile?.completed ? 20 : 10;
  const skills = user.skills || [];
  const skillScore = skills.length
    ? Math.min(30, skills.reduce((sum, s) => sum + Number(s.score || 0), 0) / skills.length * 0.3)
    : 0;

  const assessments = db.assessments.filter(a => a.userId === user.id);
  const assessmentScore = assessments.length
    ? Math.min(30, assessments.reduce((sum, a) => sum + Number(a.score || 0), 0) / assessments.length * 0.3)
    : 0;

  const projects = db.projects.filter(p => p.userId === user.id);
  const projectScore = Math.min(20, projects.length * 5);

  return Math.round(Math.min(100, profileScore + skillScore + assessmentScore + projectScore));
}

app.get("/", (req, res) => res.json({
  success: true, application: "CARRER-X Student Backend", status: "running", version: "1.0.0"
}));

app.get("/api/health", (req, res) => res.json({
  success: true, message: "CARRER-X backend is healthy", timestamp: new Date().toISOString()
}));

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      fullName, email, password, college, institution, degree, program,
      graduationYear, primaryCareerInterest, interests
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email and password are required" });
    }

    const db = readDB();
    const normalizedEmail = String(email).toLowerCase().trim();

    if (db.users.find(u => u.email === normalizedEmail)) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: uuid(),
      fullName,
      email: normalizedEmail,
      passwordHash,
      college: college || institution || "",
      degree: degree || program || "",
      graduationYear: graduationYear || "",
      primaryCareerInterest: primaryCareerInterest || "",
      interests: interests || [],
      profile: {
        completed: false, bio: "", location: "", phone: "",
        github: "", linkedin: "", portfolio: ""
      },
      skills: [],
      readiness: { score: 0, level: "Foundation" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDB(db);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: createToken(user),
      user: {
        id: user.id, fullName: user.fullName, email: user.email,
        college: user.college, degree: user.degree,
        graduationYear: user.graduationYear,
        primaryCareerInterest: user.primaryCareerInterest
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === String(email).toLowerCase().trim());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: createToken(user),
      user: {
        id: user.id, fullName: user.fullName, email: user.email,
        college: user.college, degree: user.degree,
        graduationYear: user.graduationYear,
        primaryCareerInterest: user.primaryCareerInterest
      }
    });
  } catch {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

app.get("/api/auth/me", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  res.json({
    success: true,
    user: {
      id: user.id, fullName: user.fullName, email: user.email,
      college: user.college, degree: user.degree,
      graduationYear: user.graduationYear,
      primaryCareerInterest: user.primaryCareerInterest,
      interests: user.interests, profile: user.profile, skills: user.skills
    }
  });
});

app.get("/api/dashboard", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const readiness = calculateReadiness(user, db);
  user.readiness.score = readiness;
  user.readiness.level =
    readiness < 40 ? "Foundation" :
    readiness < 65 ? "Proficient" :
    readiness < 85 ? "Advanced" : "Master";

  writeDB(db);

  const assessments = db.assessments.filter(a => a.userId === user.id);
  const projects = db.projects.filter(p => p.userId === user.id);
  const activities = db.activity.filter(a => a.userId === user.id).slice(-10).reverse();

  res.json({
    success: true,
    student: {
      id: user.id, name: user.fullName, email: user.email,
      college: user.college, degree: user.degree,
      graduationYear: user.graduationYear,
      careerInterest: user.primaryCareerInterest
    },
    readiness: { score: readiness, level: user.readiness.level },
    skills: user.skills || [],
    statistics: {
      assessmentsCompleted: assessments.length,
      projectsCompleted: projects.filter(p => p.status === "completed").length,
      totalProjects: projects.length,
      skillsTracked: user.skills?.length || 0
    },
    recentActivity: activities
  });
});

app.put("/api/profile", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  ["fullName", "college", "degree", "graduationYear", "primaryCareerInterest", "interests"]
    .forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

  if (req.body.profile) user.profile = { ...user.profile, ...req.body.profile };
  user.profile.completed = true;
  user.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json({ success: true, message: "Profile updated", user });
});

app.get("/api/skills", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  res.json({ success: true, skills: user?.skills || [] });
});

app.post("/api/skills", auth, (req, res) => {
  const { name, category, score, level } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Skill name is required" });

  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const existing = user.skills.find(s => s.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.score = Number(score ?? existing.score);
    existing.level = level || existing.level;
    existing.updatedAt = new Date().toISOString();
  } else {
    user.skills.push({
      id: uuid(), name, category: category || "Core CS",
      score: Number(score || 0), level: level || "Foundation",
      verification: "UNVERIFIED", growthDelta: 0,
      createdAt: new Date().toISOString()
    });
  }

  writeDB(db);
  res.status(201).json({ success: true, skills: user.skills });
});

app.get("/api/assessments", auth, (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    assessments: db.assessments.filter(a => a.userId === req.user.id)
  });
});

app.post("/api/assessments/submit", auth, (req, res) => {
  const {
    title, category, company, totalQuestions,
    correctAnswers, answers, duration
  } = req.body;

  const total = Number(totalQuestions || 0);
  const correct = Number(correctAnswers || 0);
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const db = readDB();

  const assessment = {
    id: uuid(), userId: req.user.id,
    title: title || "Assessment",
    category: category || "General",
    company: company || null,
    totalQuestions: total, correctAnswers: correct, score,
    answers: answers || [], duration: duration || 0,
    completedAt: new Date().toISOString()
  };

  db.assessments.push(assessment);
  db.activity.push({
    id: uuid(), userId: req.user.id, type: "assessment",
    title: `Completed ${assessment.title}`, score,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json({ success: true, message: "Assessment submitted", result: assessment });
});

app.get("/api/projects", auth, (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    projects: db.projects.filter(p => p.userId === req.user.id)
  });
});

app.post("/api/projects", auth, (req, res) => {
  const { title, description, technologies, difficulty, status } = req.body;

  if (!title) return res.status(400).json({ success: false, message: "Project title is required" });

  const db = readDB();
  const project = {
    id: uuid(), userId: req.user.id, title,
    description: description || "",
    technologies: technologies || [],
    difficulty: difficulty || "Beginner",
    status: status || "in-progress",
    proofHash: uuid(), verification: "UNVERIFIED",
    createdAt: new Date().toISOString()
  };

  db.projects.push(project);
  db.activity.push({
    id: uuid(), userId: req.user.id, type: "project",
    title: `Started ${title}`, createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json({ success: true, project });
});

app.get("/api/challenges", auth, (req, res) => {
  const db = readDB();

  if (!db.challenges.length) {
    db.challenges = [
      {
        id: uuid(), title: "Build a REST API",
        category: "Backend Systems", difficulty: "Intermediate",
        skills: ["Node.js", "Express", "REST API"], points: 100
      },
      {
        id: uuid(), title: "DSA Problem Solver",
        category: "Core CS", difficulty: "Intermediate",
        skills: ["Data Structures", "Algorithms"], points: 100
      },
      {
        id: uuid(), title: "AI Data Analysis",
        category: "Data & AI", difficulty: "Advanced",
        skills: ["Python", "Pandas", "Machine Learning"], points: 150
      },
      {
        id: uuid(), title: "System Design Challenge",
        category: "Architecture", difficulty: "Advanced",
        skills: ["System Design", "Architecture"], points: 200
      }
    ];
    writeDB(db);
  }

  res.json({ success: true, challenges: db.challenges });
});

app.get("/api/recommendations", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  const skills = user?.skills || [];
  const recommendations = [];
  const names = skills.map(s => s.name.toLowerCase());

  if (!names.includes("data structures")) {
    recommendations.push({
      id: uuid(), title: "Master Data Structures & Algorithms",
      category: "Core CS", reason: "Important for technical assessments", priority: "HIGH"
    });
  }

  if (!names.includes("system design")) {
    recommendations.push({
      id: uuid(), title: "Learn System Design Fundamentals",
      category: "Architecture", reason: "Build scalable-system thinking", priority: "MEDIUM"
    });
  }

  if (!names.includes("communication")) {
    recommendations.push({
      id: uuid(), title: "Improve Technical Communication",
      category: "Soft Skills", reason: "Useful for interviews and teamwork", priority: "MEDIUM"
    });
  }

  recommendations.push({
    id: uuid(), title: "Build a Real-World Project",
    category: "Practical Experience",
    reason: "Create verifiable career evidence", priority: "HIGH"
  });

  res.json({ success: true, recommendations });
});

app.get("/api/analytics", auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  const assessments = db.assessments.filter(a => a.userId === req.user.id);
  const projects = db.projects.filter(p => p.userId === req.user.id);

  res.json({
    success: true,
    readiness: calculateReadiness(user, db),
    skillAnalytics: user?.skills || [],
    assessmentAnalytics: assessments.map(a => ({
      title: a.title, category: a.category, score: a.score, date: a.completedAt
    })),
    projectAnalytics: {
      total: projects.length,
      completed: projects.filter(p => p.status === "completed").length,
      verified: projects.filter(p => p.verification === "VERIFIED").length
    }
  });
});

app.get("/api/activity", auth, (req, res) => {
  const db = readDB();
  const activity = db.activity
    .filter(a => a.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, activity });
});

app.post("/api/auth/logout", auth, (req, res) => {
  res.json({
    success: true,
    message: "Logout successful. Remove the token from the client."
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("       CARRER-X STUDENT BACKEND");
  console.log("======================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log("======================================");
  console.log("");
});
