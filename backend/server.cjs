const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const {
  addCredits,
  getCreditSummary,
} = require('./services/credits.cjs');

const COMPANY_CATALOG = [
  {
    name: 'Google',
    role: 'Software Engineer',
    skills: ['DSA', 'JavaScript', 'System Design'],
    logo: 'G',
  },
  {
    name: 'Microsoft',
    role: 'Software Engineer',
    skills: ['DSA', 'React', 'SQL'],
    logo: 'M',
  },
  {
    name: 'Amazon',
    role: 'SDE I',
    skills: ['DSA', 'Cloud', 'System Design'],
    logo: 'A',
  },
  {
    name: 'Deloitte',
    role: 'Technology Analyst',
    skills: ['JavaScript', 'SQL', 'Communication'],
    logo: 'D',
  },
];

const CHALLENGE_CATALOG = [
  {
    id: 'rest-api',
    title: 'Build a REST API',
    category: 'Backend Systems',
    difficulty: 'Intermediate',
    skills: ['Node.js', 'Express', 'REST API'],
    points: 100,
    description:
      'Design and implement a REST API with proper routes, validation and error handling.',
  },
  {
    id: 'dsa-problem-solver',
    title: 'DSA Problem Solver',
    category: 'Core CS',
    difficulty: 'Intermediate',
    skills: ['Data Structures', 'Algorithms'],
    points: 100,
    description:
      'Solve a set of algorithmic problems and demonstrate efficient problem-solving skills.',
  },
  {
    id: 'ai-data-analysis',
    title: 'AI Data Analysis',
    category: 'Data & AI',
    difficulty: 'Advanced',
    skills: ['Python', 'Pandas', 'Machine Learning'],
    points: 150,
    description:
      'Analyze a real-world dataset and generate useful insights using Python and AI techniques.',
  },
  {
    id: 'system-design',
    title: 'System Design Challenge',
    category: 'Architecture',
    difficulty: 'Advanced',
    skills: ['System Design', 'Architecture'],
    points: 200,
    description:
      'Design a scalable system and explain its architecture, APIs, database and scalability decisions.',
  },
];

function createServer(dataDir) {
  const app = express();

  const JWT_SECRET =
    process.env.JWT_SECRET || 'carrer_x_super_secret_key_2026';

  const allowed = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const DB_DIR = dataDir || path.join(__dirname, 'data');
  const DB_FILE = path.join(DB_DIR, 'db.json');

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          users: [],
          assessments: [],
          projects: [],
          challenges: [],
          progress: [],
          activity: [],
        },
        null,
        2
      )
    );
  }

  /*
   * ---------------------------------------------------------
   * DATABASE
   * ---------------------------------------------------------
   */

  const readDB = () => {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

    if (!Array.isArray(db.users)) db.users = [];
    if (!Array.isArray(db.assessments)) db.assessments = [];
    if (!Array.isArray(db.projects)) db.projects = [];
    if (!Array.isArray(db.challenges)) db.challenges = [];
    if (!Array.isArray(db.progress)) db.progress = [];
    if (!Array.isArray(db.activity)) db.activity = [];

    db.users.forEach((u) => {
      if (typeof u.credits !== 'number') {
        u.credits = 0;
      }

      if (!Array.isArray(u.creditHistory)) {
        u.creditHistory = [];
      }

      if (!Array.isArray(u.completedChallenges)) {
        u.completedChallenges = [];
      }

      if (!Array.isArray(u.skills)) {
        u.skills = [];
      }

      if (!u.profile) {
        u.profile = {
          completed: false,
          bio: '',
          location: '',
          phone: '',
          github: '',
          linkedin: '',
          portfolio: '',
        };
      }

      if (!u.readiness) {
        u.readiness = {
          score: 0,
          level: 'Foundation',
        };
      }
    });

    return db;
  };

  const writeDB = (db) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  };

  /*
   * ---------------------------------------------------------
   * AUTH
   * ---------------------------------------------------------
   */

  const createToken = (user) =>
    jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

  const auth = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  };

  /*
   * ---------------------------------------------------------
   * READINESS
   * ---------------------------------------------------------
   */

  const readiness = (user, db) => {
    const profileScore = user.profile?.completed ? 20 : 10;

    const skillScore = user.skills?.length
      ? Math.min(
          30,
          (user.skills.reduce(
            (total, skill) => total + Number(skill.score || 0),
            0
          ) /
            user.skills.length) *
            0.3
        )
      : 0;

    const assessments = db.assessments.filter(
      (item) => item.userId === user.id
    );

    const assessmentScore = assessments.length
      ? Math.min(
          30,
          (assessments.reduce(
            (total, item) => total + Number(item.score || 0),
            0
          ) /
            assessments.length) *
            0.3
        )
      : 0;

    const projects = db.projects.filter(
      (item) => item.userId === user.id
    );

    return Math.round(
      Math.min(
        100,
        profileScore +
          skillScore +
          assessmentScore +
          Math.min(20, projects.length * 5)
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * ACTIVITY HELPER
   * ---------------------------------------------------------
   */

  const addActivity = (
    db,
    userId,
    type,
    title,
    extra = {}
  ) => {
    db.activity.push({
      id: uuid(),
      userId,
      type,
      title,
      createdAt: new Date().toISOString(),
      ...extra,
    });
  };

  /*
   * ---------------------------------------------------------
   * CREDIT HELPER
   * ---------------------------------------------------------
   */

  const awardCredits = (
    user,
    amount,
    reason
  ) => {
    return addCredits(user, amount, reason);
  };

  /*
   * ---------------------------------------------------------
   * CORS + BODY
   * ---------------------------------------------------------
   */

  app.use(
    cors({
      origin: allowed.length ? allowed : true,
      credentials: true,
    })
  );

  app.use(
    express.json({
      limit: '10mb',
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  /*
   * ---------------------------------------------------------
   * BASIC ROUTES
   * ---------------------------------------------------------
   */

  app.get('/', (req, res) => {
    res.json({
      success: true,
      application: 'CARRER-X Student Backend',
      status: 'running',
      version: '2.0.0',
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'CARRER-X backend is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  /*
   * ---------------------------------------------------------
   * REGISTER
   * ---------------------------------------------------------
   */

  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        college,
        institution,
        degree,
        program,
        graduationYear,
        primaryCareerInterest,
        interests,
      } = req.body;

      if (!fullName || !email || !password) {
        return res.status(400).json({
          success: false,
          message:
            'Full name, email and password are required',
        });
      }

      const db = readDB();

      const normalizedEmail = String(email)
        .toLowerCase()
        .trim();

      const existing = db.users.find(
        (user) => user.email === normalizedEmail
      );

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      const user = {
        id: uuid(),

        fullName,

        email: normalizedEmail,

        passwordHash: await bcrypt.hash(password, 12),

        college: college || institution || '',

        degree: degree || program || '',

        graduationYear: graduationYear || '',

        primaryCareerInterest:
          primaryCareerInterest || '',

        interests: Array.isArray(interests)
          ? interests
          : [],

        profile: {
          completed: false,
          bio: '',
          location: '',
          phone: '',
          github: '',
          linkedin: '',
          portfolio: '',
        },

        skills: [],

        readiness: {
          score: 0,
          level: 'Foundation',
        },

        credits: 0,

        creditHistory: [],

        completedChallenges: [],

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString(),
      };

      db.users.push(user);

      /*
       * Registration bonus
       */
      awardCredits(
        user,
        10,
        'Created CARRER-X account'
      );

      addActivity(
        db,
        user.id,
        'account',
        'Created CARRER-X account',
        {
          credits: 10,
        }
      );

      writeDB(db);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token: createToken(user),
        user: safe(user, true),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  });

  /*
   * ---------------------------------------------------------
   * LOGIN
   * ---------------------------------------------------------
   */

  app.post('/api/auth/login', async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.email ===
          String(email || '')
            .toLowerCase()
            .trim()
      );

      if (
        !user ||
        !(await bcrypt.compare(
          password || '',
          user.passwordHash
        ))
      ) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        token: createToken(user),
        user: safe(user, true),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  });

  /*
   * ---------------------------------------------------------
   * CURRENT USER
   * ---------------------------------------------------------
   */

  app.get('/api/auth/me', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: safe(user, true),
    });
  });

  /*
   * ---------------------------------------------------------
   * DASHBOARD
   * ---------------------------------------------------------
   */

  app.get('/api/dashboard', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const score = readiness(user, db);

    user.readiness = {
      score,
      level:
        score < 40
          ? 'Foundation'
          : score < 65
          ? 'Proficient'
          : score < 85
          ? 'Advanced'
          : 'Master',
    };

    writeDB(db);

    const assessments = db.assessments.filter(
      (item) => item.userId === user.id
    );

    const projects = db.projects.filter(
      (item) => item.userId === user.id
    );

    const activity = db.activity
      .filter((item) => item.userId === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 10);

    res.json({
      success: true,

      student: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        college: user.college,
        degree: user.degree,
        graduationYear: user.graduationYear,
        careerInterest:
          user.primaryCareerInterest,
      },

      readiness: user.readiness,

      credits: user.credits,

      creditSummary: getCreditSummary(user),

      skills: user.skills,

      statistics: {
        assessmentsCompleted:
          assessments.length,

        projectsCompleted:
          projects.filter(
            (item) =>
              item.status === 'completed'
          ).length,

        totalProjects: projects.length,

        skillsTracked:
          user.skills.length,

        challengesCompleted:
          user.completedChallenges.length,

        challengePoints:
          user.completedChallenges.reduce(
            (total, item) =>
              total + Number(item.points || 0),
            0
          ),
      },

      recentActivity: activity,
    });
  });

  /*
   * ---------------------------------------------------------
   * PROFILE
   * ---------------------------------------------------------
   */

  app.put('/api/profile', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const wasCompleted =
      user.profile?.completed === true;

    [
      'fullName',
      'college',
      'degree',
      'graduationYear',
      'primaryCareerInterest',
      'interests',
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    if (req.body.profile) {
      user.profile = {
        ...user.profile,
        ...req.body.profile,
      };
    }

    user.profile.completed = true;

    let creditResult;

    if (!wasCompleted) {
      creditResult = awardCredits(
        user,
        50,
        'Completed student profile'
      );

      addActivity(
        db,
        user.id,
        'profile',
        'Completed your profile',
        {
          credits: 50,
        }
      );
    } else {
      creditResult = awardCredits(
        user,
        10,
        'Updated student profile'
      );

      addActivity(
        db,
        user.id,
        'profile',
        'Updated your profile',
        {
          credits: 10,
        }
      );
    }

    user.updatedAt =
      new Date().toISOString();

    writeDB(db);

    res.json({
      success: true,
      message: 'Profile updated',
      reward: creditResult,
      user: safe(user, true),
    });
  });

  /*
   * ---------------------------------------------------------
   * CREDITS
   * ---------------------------------------------------------
   */

  app.get('/api/credits', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      ...getCreditSummary(user),
    });
  });

  /*
   * ---------------------------------------------------------
   * SKILLS
   * ---------------------------------------------------------
   */

  app.get('/api/skills', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) => item.id === req.user.id
    );

    res.json({
      success: true,
      skills: user?.skills || [],
    });
  });

  app.post('/api/skills', auth, (req, res) => {
    const {
      name,
      category,
      score,
      level,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required',
      });
    }

    const db = readDB();

    const user = db.users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const existing = user.skills.find(
      (skill) =>
        skill.name.toLowerCase() ===
        String(name).toLowerCase()
    );

    let reward;

    if (existing) {
      const oldScore = Number(existing.score || 0);
      const newScore = Number(
        score ?? oldScore
      );

      existing.score = newScore;
      existing.level =
        level || existing.level;

      /*
       * Reward improvement only when score
       * actually increases.
       */
      if (newScore > oldScore) {
        reward = awardCredits(
          user,
          30,
          `Improved ${existing.name}`
        );

        addActivity(
          db,
          user.id,
          'skill',
          `Improved ${existing.name}`,
          {
            credits: 30,
          }
        );
      }
    } else {
      const skill = {
        id: uuid(),
        name,
        category:
          category || 'Core CS',
        score: Number(score || 0),
        level:
          level || 'Foundation',
        verification: 'UNVERIFIED',
        growthDelta: 0,
        createdAt:
          new Date().toISOString(),
      };

      user.skills.push(skill);

      reward = awardCredits(
        user,
        20,
        `Added ${name} skill`
      );

      addActivity(
        db,
        user.id,
        'skill',
        `Added ${name} skill`,
        {
          credits: 20,
        }
      );
    }

    writeDB(db);

    res.status(201).json({
      success: true,
      skills: user.skills,
      reward: reward || null,
    });
  });

  /*
   * ---------------------------------------------------------
   * ASSESSMENTS
   * ---------------------------------------------------------
   */

  app.get('/api/assessments', auth, (req, res) => {
    const db = readDB();

    res.json({
      success: true,
      assessments:
        db.assessments.filter(
          (item) =>
            item.userId === req.user.id
        ),
    });
  });

  app.post(
    '/api/assessments/submit',
    auth,
    (req, res) => {
      const {
        title,
        category,
        company,
        totalQuestions,
        correctAnswers,
        answers,
        duration,
      } = req.body;

      const total =
        Number(totalQuestions || 0);

      const correct =
        Number(correctAnswers || 0);

      const score = total
        ? Math.round(
            (correct / total) * 100
          )
        : 0;

      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.id === req.user.id
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const assessment = {
        id: uuid(),
        userId: req.user.id,
        title: title || 'Assessment',
        category:
          category || 'General',
        company: company || null,
        totalQuestions: total,
        correctAnswers: correct,
        score,
        answers: answers || [],
        duration: duration || 0,
        completedAt:
          new Date().toISOString(),
      };

      db.assessments.push(assessment);

      let reward = awardCredits(
        user,
        100,
        `Completed ${assessment.title}`
      );

      addActivity(
        db,
        user.id,
        'assessment',
        `Completed ${assessment.title}`,
        {
          score,
          credits: 100,
        }
      );

      /*
       * High-score bonus
       */
      if (score >= 80) {
        const bonus = awardCredits(
          user,
          50,
          `High score bonus for ${assessment.title}`
        );

        reward = {
          ...reward,
          highScoreBonus: 50,
          credits: bonus.credits,
          level: bonus.level,
          nextLevel: bonus.nextLevel,
        };

        addActivity(
          db,
          user.id,
          'achievement',
          `High score achievement: ${score}%`,
          {
            score,
            credits: 50,
          }
        );
      }

      writeDB(db);

      res.status(201).json({
        success: true,
        message: 'Assessment submitted',
        result: assessment,
        reward,
      });
    }
  );

  /*
   * ---------------------------------------------------------
   * PROJECTS
   * ---------------------------------------------------------
   */

  app.get('/api/projects', auth, (req, res) => {
    const db = readDB();

    res.json({
      success: true,
      projects: db.projects.filter(
        (item) =>
          item.userId === req.user.id
      ),
    });
  });

  app.post('/api/projects', auth, (req, res) => {
    const {
      title,
      description,
      technologies,
      difficulty,
      status,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required',
      });
    }

    const db = readDB();

    const project = {
      id: uuid(),
      userId: req.user.id,
      title,
      description: description || '',
      technologies:
        technologies || [],
      difficulty:
        difficulty || 'Beginner',
      status:
        status || 'in-progress',
      proofHash: uuid(),
      verification: 'UNVERIFIED',
      createdAt:
        new Date().toISOString(),
    };

    db.projects.push(project);

    const user = db.users.find(
      (item) =>
        item.id === req.user.id
    );

    const reward = awardCredits(
      user,
      50,
      `Created project: ${title}`
    );

    addActivity(
      db,
      user.id,
      'project',
      `Started ${title}`,
      {
        credits: 50,
      }
    );

    writeDB(db);

    res.status(201).json({
      success: true,
      project,
      reward,
    });
  });

  /*
   * ---------------------------------------------------------
   * CHALLENGES
   * ---------------------------------------------------------
   */

  app.get('/api/challenges', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) =>
        item.id === req.user.id
    );

    const completed =
      user?.completedChallenges || [];

    const challenges =
      CHALLENGE_CATALOG.map(
        (challenge) => ({
          ...challenge,
          completed: completed.some(
            (item) =>
              item.challengeId ===
              challenge.id
          ),
        })
      );

    res.json({
      success: true,
      challenges,
      completedChallenges:
        completed,
      credits:
        user?.credits || 0,
    });
  });

  app.get(
    '/api/challenges/:id',
    auth,
    (req, res) => {
      const challenge =
        CHALLENGE_CATALOG.find(
          (item) =>
            item.id === req.params.id
        );

      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found',
        });
      }

      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.id === req.user.id
      );

      const completed =
        user?.completedChallenges?.find(
          (item) =>
            item.challengeId ===
            challenge.id
        );

      res.json({
        success: true,
        challenge: {
          ...challenge,
          completed: Boolean(completed),
          completion: completed || null,
        },
      });
    }
  );

  /*
   * Challenge completion
   */
  app.post(
    '/api/challenges/:id/complete',
    auth,
    (req, res) => {
      const challenge =
        CHALLENGE_CATALOG.find(
          (item) =>
            item.id === req.params.id
        );

      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found',
        });
      }

      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.id === req.user.id
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!Array.isArray(user.completedChallenges)) {
        user.completedChallenges = [];
      }

      const alreadyCompleted =
        user.completedChallenges.find(
          (item) =>
            item.challengeId ===
            challenge.id
        );

      if (alreadyCompleted) {
        return res.status(409).json({
          success: false,
          message:
            'Challenge already completed',
          completion: alreadyCompleted,
          credits:
            user.credits || 0,
          creditSummary:
            getCreditSummary(user),
        });
      }

      const response =
        String(
          req.body.response ||
            req.body.answer ||
            req.body.solution ||
            ''
        ).trim();

      if (response.length < 20) {
        return res.status(400).json({
          success: false,
          message:
            'Please submit a meaningful response of at least 20 characters.',
        });
      }

      const completion = {
        id: uuid(),

        challengeId:
          challenge.id,

        title:
          challenge.title,

        category:
          challenge.category,

        difficulty:
          challenge.difficulty,

        points:
          challenge.points,

        response,

        completedAt:
          new Date().toISOString(),
      };

      user.completedChallenges.push(
        completion
      );

      /*
       * Challenge credits
       */
      const reward = awardCredits(
        user,
        challenge.points,
        `Completed challenge: ${challenge.title}`
      );

      addActivity(
        db,
        user.id,
        'challenge',
        `Completed ${challenge.title}`,
        {
          credits: challenge.points,
          challengeId:
            challenge.id,
        }
      );

      writeDB(db);

      res.status(201).json({
        success: true,
        message:
          'Challenge completed successfully',
        completion,
        reward,
        creditSummary:
          getCreditSummary(user),
      });
    }
  );

  /*
   * ---------------------------------------------------------
   * RECOMMENDATIONS
   * ---------------------------------------------------------
   */

  app.get(
    '/api/recommendations',
    auth,
    (req, res) => {
      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.id === req.user.id
      );

      const names =
        (user?.skills || []).map(
          (skill) =>
            skill.name.toLowerCase()
        );

      const recommendations = [];

      if (!names.includes('data structures')) {
        recommendations.push({
          id: uuid(),
          title:
            'Master Data Structures & Algorithms',
          category: 'Core CS',
          reason:
            'Important for technical assessments',
          priority: 'HIGH',
        });
      }

      if (!names.includes('system design')) {
        recommendations.push({
          id: uuid(),
          title:
            'Learn System Design Fundamentals',
          category: 'Architecture',
          reason:
            'Build scalable-system thinking',
          priority: 'MEDIUM',
        });
      }

      if (!names.includes('communication')) {
        recommendations.push({
          id: uuid(),
          title:
            'Improve Technical Communication',
          category: 'Soft Skills',
          reason:
            'Useful for interviews and teamwork',
          priority: 'MEDIUM',
        });
      }

      recommendations.push({
        id: uuid(),
        title:
          'Build a Real-World Project',
        category:
          'Practical Experience',
        reason:
          'Create verifiable career evidence',
        priority: 'HIGH',
      });

      res.json({
        success: true,
        recommendations,
      });
    }
  );

  /*
   * ---------------------------------------------------------
   * COMPANIES
   * ---------------------------------------------------------
   */

  app.get('/api/companies', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) =>
        item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const map = {};

    (user.skills || []).forEach(
      (skill) => {
        map[
          String(skill.name).toLowerCase()
        ] = Number(skill.score || 0);
      }
    );

    const skillOf = (label) => {
      const key =
        label.toLowerCase();

      if (map[key] != null) {
        return map[key];
      }

      if (key === 'dsa') {
        return (
          map['data structures'] ??
          map['algorithms'] ??
          35
        );
      }

      return 35;
    };

    const companies =
      COMPANY_CATALOG.map(
        (company) => {
          const scores =
            company.skills.map(
              skillOf
            );

          const score = Math.round(
            scores.reduce(
              (a, b) => a + b,
              0
            ) / scores.length
          );

          return {
            ...company,
            score,
          };
        }
      );

    res.json({
      success: true,
      companies,
    });
  });

  /*
   * ---------------------------------------------------------
   * ROADMAP
   * ---------------------------------------------------------
   */

  app.get('/api/roadmap', auth, (req, res) => {
    const db = readDB();

    const user = db.users.find(
      (item) =>
        item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const score =
      readiness(user, db);

    const names =
      (user.skills || []).map(
        (skill) =>
          skill.name.toLowerCase()
      );

    const items = [];

    if (
      !names.includes('javascript') &&
      !names.includes('java script')
    ) {
      items.push({
        title:
          'Strengthen JavaScript',
        desc:
          'Closures, async programming and ES6+ patterns',
      });
    }

    if (
      !names.includes(
        'data structures'
      )
    ) {
      items.push({
        title:
          'Master Data Structures',
        desc:
          'Arrays, trees, graphs and problem solving',
      });
    }

    if (
      !names.includes(
        'system design'
      )
    ) {
      items.push({
        title:
          'System Design Basics',
        desc:
          'APIs, databases, caching and scalability',
      });
    }

    items.push({
      title:
        'Interview Simulation',
      desc:
        'Timed DSA + behavioral mock interviews',
    });

    items.push({
      title:
        'Build a Real-World Project',
      desc:
        'Create verifiable career evidence',
    });

    const weeks =
      items.slice(0, 4).map(
        (item, index) => ({
          week:
            `Week ${index + 1}`,
          title: item.title,
          desc: item.desc,
          progress: Math.max(
            0,
            Math.min(
              100,
              score - index * 18
            )
          ),
        })
      );

    res.json({
      success: true,
      target:
        user.primaryCareerInterest ||
        'Software Engineer',
      readiness: score,
      overall: Math.round(
        weeks.reduce(
          (total, week) =>
            total + week.progress,
          0
        ) / weeks.length
      ),
      weeks,
    });
  });

  /*
   * ---------------------------------------------------------
   * ANALYTICS
   * ---------------------------------------------------------
   */

  app.get(
    '/api/analytics',
    auth,
    (req, res) => {
      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.id === req.user.id
      );

      const assessments =
        db.assessments.filter(
          (item) =>
            item.userId === req.user.id
        );

      const projects =
        db.projects.filter(
          (item) =>
            item.userId === req.user.id
        );

      res.json({
        success: true,

        readiness:
          readiness(user, db),

        credits:
          user?.credits || 0,

        creditSummary:
          getCreditSummary(user),

        skillAnalytics:
          user?.skills || [],

        assessmentAnalytics:
          assessments.map(
            (item) => ({
              title: item.title,
              category: item.category,
              score: item.score,
              date: item.completedAt,
            })
          ),

        projectAnalytics: {
          total: projects.length,

          completed:
            projects.filter(
              (item) =>
                item.status ===
                'completed'
            ).length,

          verified:
            projects.filter(
              (item) =>
                item.verification ===
                'VERIFIED'
            ).length,
        },

        challengeAnalytics: {
          completed:
            user?.completedChallenges
              ?.length || 0,

          points:
            user?.completedChallenges?.reduce(
              (total, item) =>
                total +
                Number(
                  item.points || 0
                ),
              0
            ) || 0,
        },
      });
    }
  );

  /*
   * ---------------------------------------------------------
   * ACTIVITY
   * ---------------------------------------------------------
   */

  app.get('/api/activity', auth, (req, res) => {
    const db = readDB();

    res.json({
      success: true,

      activity: db.activity
        .filter(
          (item) =>
            item.userId ===
            req.user.id
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        ),
    });
  });

  /*
   * ---------------------------------------------------------
   * NOTIFICATIONS
   * ---------------------------------------------------------
   */

  app.get(
    '/api/notifications',
    auth,
    (req, res) => {
      const db = readDB();

      const user = db.users.find(
        (item) =>
          item.id === req.user.id
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const notifications =
        db.activity
          .filter(
            (item) =>
              item.userId === user.id
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )
          .slice(0, 20)
          .map((activity) => ({
            id: activity.id,

            title:
              activity.title,

            body:
              activity.score != null
                ? `Score ${activity.score}%. Saved to your career record.`
                : activity.credits
                ? `You earned ${activity.credits} CARRER-X Credits.`
                : 'Update from your CARRER-X workspace.',

            createdAt:
              activity.createdAt,

            unread:
              Date.now() -
                new Date(
                  activity.createdAt
                ).getTime() <
              1000 * 60 * 60 * 24,
          }));

      if (!notifications.length) {
        notifications.push({
          id: 'welcome',

          title:
            'Welcome to CARRER-X',

          body:
            'Add skills, take an assessment, complete challenges and build projects to earn credits.',

          createdAt:
            new Date().toISOString(),

          unread: true,
        });
      }

      res.json({
        success: true,
        notifications,
      });
    }
  );

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */

  app.post(
    '/api/auth/logout',
    auth,
    (req, res) => {
      res.json({
        success: true,
        message:
          'Logout successful',
      });
    }
  );

  /*
   * ---------------------------------------------------------
   * SERVE FRONTEND
   * ---------------------------------------------------------
   */

  const dist = path.join(
    __dirname,
    '..',
    'dist'
  );

  if (
    (process.env.NODE_ENV ===
      'production' ||
      process.env.SERVE_WEB === 'true') &&
    fs.existsSync(dist)
  ) {
    app.use(
      express.static(dist)
    );
  }

  /*
   * ---------------------------------------------------------
   * 404
   * ---------------------------------------------------------
   */

  app.use((req, res) => {
    if (
      (process.env.NODE_ENV ===
        'production' ||
        process.env.SERVE_WEB === 'true') &&
      fs.existsSync(
        path.join(
          dist,
          'index.html'
        )
      ) &&
      req.method === 'GET' &&
      !req.path.startsWith('/api')
    ) {
      return res.sendFile(
        path.join(
          dist,
          'index.html'
        )
      );
    }

    res.status(404).json({
      success: false,
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  /*
   * ---------------------------------------------------------
   * SAFE USER RESPONSE
   * ---------------------------------------------------------
   */

  function safe(user, full = false) {
    return {
      id: user.id,

      fullName:
        user.fullName,

      email:
        user.email,

      college:
        user.college,

      degree:
        user.degree,

      graduationYear:
        user.graduationYear,

      primaryCareerInterest:
        user.primaryCareerInterest,

      credits:
        user.credits || 0,

      creditSummary:
        getCreditSummary(user),

      completedChallenges:
        user.completedChallenges || [],

      ...(full
        ? {
            interests:
              user.interests,

            profile:
              user.profile,

            skills:
              user.skills,
          }
        : {}),
    };
  }

  return app;
}

module.exports = {
  createServer,
};