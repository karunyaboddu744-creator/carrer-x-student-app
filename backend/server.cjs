const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const COMPANY_CATALOG = [
  {name:'Google', role:'Software Engineer', skills:['DSA','JavaScript','System Design'], logo:'G'},
  {name:'Microsoft', role:'Software Engineer', skills:['DSA','React','SQL'], logo:'M'},
  {name:'Amazon', role:'SDE I', skills:['DSA','Cloud','System Design'], logo:'A'},
  {name:'Deloitte', role:'Technology Analyst', skills:['JavaScript','SQL','Communication'], logo:'D'}
];

function createServer(dataDir) {
  const app = express();
  const JWT_SECRET = process.env.JWT_SECRET || 'carrer_x_super_secret_key_2026';
  const allowed = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const DB_DIR = dataDir || path.join(__dirname, 'data');
  const DB_FILE = path.join(DB_DIR, 'db.json');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, {recursive:true});
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({users:[],assessments:[],projects:[],challenges:[],progress:[],activity:[]},null,2));
  const readDB=()=>JSON.parse(fs.readFileSync(DB_FILE,'utf8'));
  const writeDB=d=>fs.writeFileSync(DB_FILE,JSON.stringify(d,null,2));
  const token=u=>jwt.sign({id:u.id,email:u.email},JWT_SECRET,{expiresIn:'7d'});
  const auth=(req,res,next)=>{const h=req.headers.authorization;if(!h?.startsWith('Bearer '))return res.status(401).json({success:false,message:'Authentication required'});try{req.user=jwt.verify(h.slice(7),JWT_SECRET);next()}catch{return res.status(401).json({success:false,message:'Invalid or expired token'})}};
  const readiness=(u,db)=>{const p=u.profile?.completed?20:10,s=u.skills?.length?Math.min(30,u.skills.reduce((a,x)=>a+Number(x.score||0),0)/u.skills.length*.3):0,a=db.assessments.filter(x=>x.userId===u.id),as=a.length?Math.min(30,a.reduce((z,x)=>z+Number(x.score||0),0)/a.length*.3):0,pr=db.projects.filter(x=>x.userId===u.id);return Math.round(Math.min(100,p+s+as+Math.min(20,pr.length*5)))};
  app.use(cors({ origin: allowed.length ? allowed : true, credentials: true }));
  app.use(express.json({limit:'10mb'}));
  app.use(express.urlencoded({extended:true}));
  app.get('/',(q,r)=>r.json({success:true,application:'CARRER-X Student Desktop Backend',status:'running',version:'1.0.0'}));
  app.get('/api/health',(q,r)=>r.json({success:true,message:'CARRER-X backend is healthy',timestamp:new Date().toISOString()}));
  app.post('/api/auth/register',async(req,res)=>{try{const {fullName,email,password,college,institution,degree,program,graduationYear,primaryCareerInterest,interests}=req.body;if(!fullName||!email||!password)return res.status(400).json({success:false,message:'Full name, email and password are required'});const db=readDB(),e=String(email).toLowerCase().trim();if(db.users.find(u=>u.email===e))return res.status(409).json({success:false,message:'Email already registered'});const u={id:uuid(),fullName,email:e,passwordHash:await bcrypt.hash(password,12),college:college||institution||'',degree:degree||program||'',graduationYear:graduationYear||'',primaryCareerInterest:primaryCareerInterest||'',interests:interests||[],profile:{completed:false,bio:'',location:'',phone:'',github:'',linkedin:'',portfolio:''},skills:[],readiness:{score:0,level:'Foundation'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};db.users.push(u);writeDB(db);res.status(201).json({success:true,message:'Account created successfully',token:token(u),user:safe(u)})}catch(e){res.status(500).json({success:false,message:'Registration failed'})}});
  app.post('/api/auth/login',async(req,res)=>{try{const {email,password}=req.body,db=readDB(),u=db.users.find(x=>x.email===String(email).toLowerCase().trim());if(!u||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({success:false,message:'Invalid email or password'});res.json({success:true,message:'Login successful',token:token(u),user:safe(u)})}catch{res.status(500).json({success:false,message:'Login failed'})}});
  app.get('/api/auth/me',auth,(req,res)=>{const u=readDB().users.find(x=>x.id===req.user.id);if(!u)return res.status(404).json({success:false,message:'User not found'});res.json({success:true,user:safe(u,true)})});
  app.get('/api/dashboard',auth,(req,res)=>{const db=readDB(),u=db.users.find(x=>x.id===req.user.id);if(!u)return res.status(404).json({success:false,message:'User not found'});const score=readiness(u,db);u.readiness={score,level:score<40?'Foundation':score<65?'Proficient':score<85?'Advanced':'Master'};writeDB(db);const a=db.assessments.filter(x=>x.userId===u.id),p=db.projects.filter(x=>x.userId===u.id),act=db.activity.filter(x=>x.userId===u.id).sort((x,y)=>new Date(y.createdAt)-new Date(x.createdAt)).slice(0,10);res.json({success:true,student:{id:u.id,name:u.fullName,email:u.email,college:u.college,degree:u.degree,graduationYear:u.graduationYear,careerInterest:u.primaryCareerInterest},readiness:u.readiness,skills:u.skills,statistics:{assessmentsCompleted:a.length,projectsCompleted:p.filter(x=>x.status==='completed').length,totalProjects:p.length,skillsTracked:u.skills.length},recentActivity:act})});
  app.put('/api/profile',auth,(req,res)=>{const db=readDB(),u=db.users.find(x=>x.id===req.user.id);if(!u)return res.status(404).json({success:false,message:'User not found'});['fullName','college','degree','graduationYear','primaryCareerInterest','interests'].forEach(f=>{if(req.body[f]!==undefined)u[f]=req.body[f]});if(req.body.profile)u.profile={...u.profile,...req.body.profile};u.profile.completed=true;u.updatedAt=new Date().toISOString();writeDB(db);res.json({success:true,message:'Profile updated',user:safe(u,true)})});
  app.get('/api/skills',auth,(req,res)=>{const u=readDB().users.find(x=>x.id===req.user.id);res.json({success:true,skills:u?.skills||[]})});
  app.post('/api/skills',auth,(req,res)=>{const {name,category,score,level}=req.body;if(!name)return res.status(400).json({success:false,message:'Skill name is required'});const db=readDB(),u=db.users.find(x=>x.id===req.user.id);if(!u)return res.status(404).json({success:false,message:'User not found'});const old=u.skills.find(s=>s.name.toLowerCase()===name.toLowerCase());if(old){old.score=Number(score??old.score);old.level=level||old.level}else u.skills.push({id:uuid(),name,category:category||'Core CS',score:Number(score||0),level:level||'Foundation',verification:'UNVERIFIED',growthDelta:0,createdAt:new Date().toISOString()});writeDB(db);res.status(201).json({success:true,skills:u.skills})});
  app.get('/api/assessments',auth,(req,res)=>{const db=readDB();res.json({success:true,assessments:db.assessments.filter(x=>x.userId===req.user.id)})});
  app.post('/api/assessments/submit',auth,(req,res)=>{const {title,category,company,totalQuestions,correctAnswers,answers,duration}=req.body,total=Number(totalQuestions||0),correct=Number(correctAnswers||0),score=total?Math.round(correct/total*100):0,db=readDB(),a={id:uuid(),userId:req.user.id,title:title||'Assessment',category:category||'General',company:company||null,totalQuestions:total,correctAnswers:correct,score,answers:answers||[],duration:duration||0,completedAt:new Date().toISOString()};db.assessments.push(a);db.activity.push({id:uuid(),userId:req.user.id,type:'assessment',title:`Completed ${a.title}`,score,createdAt:new Date().toISOString()});writeDB(db);res.status(201).json({success:true,message:'Assessment submitted',result:a})});
  app.get('/api/projects',auth,(req,res)=>{const db=readDB();res.json({success:true,projects:db.projects.filter(x=>x.userId===req.user.id)})});
  app.post('/api/projects',auth,(req,res)=>{const {title,description,technologies,difficulty,status}=req.body;if(!title)return res.status(400).json({success:false,message:'Project title is required'});const db=readDB(),p={id:uuid(),userId:req.user.id,title,description:description||'',technologies:technologies||[],difficulty:difficulty||'Beginner',status:status||'in-progress',proofHash:uuid(),verification:'UNVERIFIED',createdAt:new Date().toISOString()};db.projects.push(p);db.activity.push({id:uuid(),userId:req.user.id,type:'project',title:`Started ${title}`,createdAt:new Date().toISOString()});writeDB(db);res.status(201).json({success:true,project:p})});
  app.get('/api/challenges',auth,(req,res)=>{const db=readDB();if(!db.challenges.length){db.challenges=[{id:uuid(),title:'Build a REST API',category:'Backend Systems',difficulty:'Intermediate',skills:['Node.js','Express','REST API'],points:100},{id:uuid(),title:'DSA Problem Solver',category:'Core CS',difficulty:'Intermediate',skills:['Data Structures','Algorithms'],points:100},{id:uuid(),title:'AI Data Analysis',category:'Data & AI',difficulty:'Advanced',skills:['Python','Pandas','Machine Learning'],points:150},{id:uuid(),title:'System Design Challenge',category:'Architecture',difficulty:'Advanced',skills:['System Design','Architecture'],points:200}];writeDB(db)}res.json({success:true,challenges:db.challenges})});
  app.get('/api/recommendations',auth,(req,res)=>{const u=readDB().users.find(x=>x.id===req.user.id),names=(u?.skills||[]).map(s=>s.name.toLowerCase()),r=[];if(!names.includes('data structures'))r.push({id:uuid(),title:'Master Data Structures & Algorithms',category:'Core CS',reason:'Important for technical assessments',priority:'HIGH'});if(!names.includes('system design'))r.push({id:uuid(),title:'Learn System Design Fundamentals',category:'Architecture',reason:'Build scalable-system thinking',priority:'MEDIUM'});if(!names.includes('communication'))r.push({id:uuid(),title:'Improve Technical Communication',category:'Soft Skills',reason:'Useful for interviews and teamwork',priority:'MEDIUM'});r.push({id:uuid(),title:'Build a Real-World Project',category:'Practical Experience',reason:'Create verifiable career evidence',priority:'HIGH'});res.json({success:true,recommendations:r})});
  app.get('/api/analytics',auth,(req,res)=>{const db=readDB(),u=db.users.find(x=>x.id===req.user.id),a=db.assessments.filter(x=>x.userId===req.user.id),p=db.projects.filter(x=>x.userId===req.user.id);res.json({success:true,readiness:readiness(u,db),skillAnalytics:u?.skills||[],assessmentAnalytics:a.map(x=>({title:x.title,category:x.category,score:x.score,date:x.completedAt})),projectAnalytics:{total:p.length,completed:p.filter(x=>x.status==='completed').length,verified:p.filter(x=>x.verification==='VERIFIED').length}})});
  app.get('/api/activity',auth,(req,res)=>{const db=readDB();res.json({success:true,activity:db.activity.filter(x=>x.userId===req.user.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))})});
  app.get('/api/companies',auth,(req,res)=>{
    const db=readDB(),u=db.users.find(x=>x.id===req.user.id); if(!u)return res.status(404).json({success:false,message:'User not found'});
    const map={}; (u.skills||[]).forEach(s=>{map[String(s.name).toLowerCase()]=Number(s.score||0)});
    const skillOf=(label)=>{const k=label.toLowerCase(); if(map[k]!=null)return map[k]; if(k==='dsa')return map['data structures']??map['algorithms']??35; return 35};
    const companies=COMPANY_CATALOG.map(c=>{const scores=c.skills.map(skillOf); const score=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length); return {...c,score}});
    res.json({success:true,companies});
  });
  app.get('/api/roadmap',auth,(req,res)=>{
    const db=readDB(),u=db.users.find(x=>x.id===req.user.id); if(!u)return res.status(404).json({success:false,message:'User not found'});
    const score=readiness(u,db);
    const names=(u.skills||[]).map(s=>s.name.toLowerCase());
    const items=[];
    if(!names.includes('javascript')&&!names.includes('java script')) items.push({title:'Strengthen JavaScript',desc:'Closures, async programming, ES6+ patterns'});
    if(!names.includes('data structures')) items.push({title:'Master Data Structures',desc:'Arrays, trees, graphs and problem solving'});
    if(!names.includes('system design')) items.push({title:'System Design Basics',desc:'APIs, databases, caching and scalability'});
    items.push({title:'Interview Simulation',desc:'Timed DSA + behavioral mock interviews'});
    items.push({title:'Build a Real-World Project',desc:'Create verifiable career evidence'});
    const weeks=items.slice(0,4).map((r,i)=>({week:`Week ${i+1}`,title:r.title,desc:r.desc,progress:Math.max(0,Math.min(100,score-(i*18)))}));
    res.json({success:true,target:u.primaryCareerInterest||'Software Engineer',readiness:score,overall:Math.round(weeks.reduce((a,w)=>a+w.progress,0)/weeks.length),weeks});
  });
  app.get('/api/notifications',auth,(req,res)=>{
    const db=readDB(),u=db.users.find(x=>x.id===req.user.id); if(!u)return res.status(404).json({success:false,message:'User not found'});
    const notes=db.activity.filter(x=>x.userId===u.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,20).map(a=>({
      id:a.id,title:a.title,body:a.score!=null?`Score ${a.score}%. Saved to your career record.`:'Update from your CARRER-X workspace.',createdAt:a.createdAt,unread:Date.now()-new Date(a.createdAt).getTime()<1000*60*60*24
    }));
    if(!notes.length) notes.push({id:'welcome',title:'Welcome to CARRER-X',body:'Add skills, take an assessment, and start a project to build verified career evidence.',createdAt:new Date().toISOString(),unread:true});
    res.json({success:true,notifications:notes});
  });
  app.post('/api/auth/logout',auth,(req,res)=>res.json({success:true,message:'Logout successful'}));
  const dist=path.join(__dirname,'..','dist');
  if ((process.env.NODE_ENV==='production' || process.env.SERVE_WEB==='true') && fs.existsSync(dist)) {
    app.use(express.static(dist));
  }
  app.use((req,res)=>{
    if ((process.env.NODE_ENV==='production' || process.env.SERVE_WEB==='true') && fs.existsSync(path.join(dist,'index.html')) && req.method==='GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(dist,'index.html'));
    }
    res.status(404).json({success:false,message:`Route not found: ${req.method} ${req.originalUrl}`});
  });
  return app;
  function safe(u,full=false){return {id:u.id,fullName:u.fullName,email:u.email,college:u.college,degree:u.degree,graduationYear:u.graduationYear,primaryCareerInterest:u.primaryCareerInterest,...(full?{interests:u.interests,profile:u.profile,skills:u.skills}: {})}}
}
module.exports={createServer};
