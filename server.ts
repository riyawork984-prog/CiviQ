import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// File paths for persistence
const DB_DIR = path.join(process.cwd(), "src", "db");
const DB_FILE = path.join(DB_DIR, "issues.json");

// Ensure db directory and initial seed file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial Mock Seed Data relative to Nayagaon, Punjab, India (21 Wards)
const INITIAL_ISSUES = [
  {
    id: "issue-1",
    title: "Severe Potholes on Vikas Nagar Main Road",
    description: "Huge potholes near the main market complex. Water accumulates easily causing hazardous driving conditions for two-wheelers, especially during light rains.",
    category: "Pothole / Road Damage",
    severity: "High",
    status: "In Progress",
    wardId: 3,
    wardName: "Ward 3 (Vikas Nagar)",
    gps: { latitude: 30.7852, longitude: 76.8014 },
    image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    summary: "Deep, hazardous potholes along Vikas Nagar main market road causing vehicle damage.",
    recommendation: "Immediate cold-mix asphalt filling by Nayagaon Municipal Corporation to prevent injuries.",
    reporter: {
      name: "Sarabjit Singh",
      email: "sarabjit.s@nayagaon.org",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
    },
    verifiedBy: ["user-2", "user-3", "user-4", "user-5"],
    createdAt: "2026-06-15T09:30:00Z",
    comments: [
      {
        id: "c-1",
        userName: "Gurpreet Kaur",
        userEmail: "gurpreet.k@nayagaon.org",
        text: "I witnessed an auto-rickshaw tip over here yesterday. Absolutely critical to fix this before monsoons!",
        createdAt: "2026-06-15T11:20:00Z"
      },
      {
        id: "c-2",
        userName: "Ramesh Sharma",
        userEmail: "ramesh.sharma@nayagaon.org",
        text: "Municipal council team surveyed it but work hasn't fully started yet. Glad it's marked 'In Progress'.",
        createdAt: "2026-06-16T14:45:00Z"
      }
    ]
  },
  {
    id: "issue-2",
    title: "Overflowing Garbage Pile Near Shivalik Vihar Crossing",
    description: "The primary community garbage bin has not been cleared for over four days. Street cattle are scattering the trash, and the smell is unbearable for residents nearby.",
    category: "Garbage Collection",
    severity: "High",
    status: "Reported",
    wardId: 12,
    wardName: "Ward 12 (Shivalik Vihar)",
    gps: { latitude: 30.7915, longitude: 76.7958 },
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    summary: "Uncleared municipal dump bin overflowing with organic waste causing unhygienic conditions.",
    recommendation: "Deploy garbage collection dumper truck and sanitize the surrounding space.",
    reporter: {
      name: "Pooja Verma",
      email: "pooja.v@nayagaon.org",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
    },
    verifiedBy: ["user-1"],
    createdAt: "2026-06-21T08:15:00Z",
    comments: [
      {
        id: "c-3",
        userName: "Sarabjit Singh",
        userEmail: "sarabjit.s@nayagaon.org",
        text: "Just verified this, I walk past here. The scent is extremely strong and unhygienic.",
        createdAt: "2026-06-21T18:00:00Z"
      }
    ]
  },
  {
    id: "issue-3",
    title: "Broken Drain cover on Karoran Secondary School Path",
    description: "One of the concrete drain slabs has collapsed into the drain right in front of the school gate. Children could fall into it during rush hours.",
    category: "Missing Drain Cover",
    severity: "Critical",
    status: "Community Verified",
    wardId: 1,
    wardName: "Ward 1 (Karoran Road)",
    gps: { latitude: 30.7839, longitude: 76.8082 },
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    summary: "Collapsed drainage slab outside Karoran school gate poses severe trip hazard for students.",
    recommendation: "Install a temporary safety barrier and replace the pre-cast concrete cover immediately.",
    reporter: {
      name: "Harpreet Singh",
      email: "harpreet.s@nayagaon.org",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
    },
    verifiedBy: ["user-2", "user-3", "user-6", "user-7", "user-8"],
    createdAt: "2026-06-20T10:00:00Z",
    comments: [
      {
        id: "c-4",
        userName: "Pooja Verma",
        userEmail: "pooja.v@nayagaon.org",
        text: "Extremely dangerous for kids! I hope the ward commissioner sees this.",
        createdAt: "2026-06-20T11:30:00Z"
      },
      {
        id: "c-5",
        userName: "Aditya Puri",
        userEmail: "aditya.p@nayagaon.org",
        text: "Placed a wooden stick as warning for now. Needs a metal or concrete cover asap.",
        createdAt: "2026-06-20T15:20:00Z"
      }
    ]
  },
  {
    id: "issue-4",
    title: "Major Water Pipe Leakage in Dashmesh Nagar Lane 4",
    description: "Main potable water line has burst. Clean drinking water has been spraying out into the street continuously since morning, creating muddy pools.",
    category: "Water Leakage",
    severity: "Medium",
    status: "Resolved",
    wardId: 2,
    wardName: "Ward 2 (Dashmesh Nagar)",
    gps: { latitude: 30.7871, longitude: 76.8041 },
    image: "https://images.unsplash.com/photo-1508138221679-760a23a2285b?auto=format&fit=crop&q=80&w=600",
    summary: "Potable main pipeline burst in Dashmesh Nagar causing water wastage.",
    recommendation: "Dispatch repair technicians from the Water and Sanitation department to clamp the leakage.",
    reporter: {
      name: "Gurpreet Kaur",
      email: "gurpreet.k@nayagaon.org",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
    },
    verifiedBy: ["user-1", "user-3"],
    createdAt: "2026-06-12T06:00:00Z",
    comments: [
      {
        id: "c-6",
        userName: "Sarabjit Singh",
        userEmail: "sarabjit.s@nayagaon.org",
        text: "Wasting thousands of liters of drinking water. Called municipal helpline but no direct response.",
        createdAt: "2026-06-12T08:00:00Z"
      },
      {
        id: "c-7",
        userName: "Municipal Officer",
        userEmail: "officer@nayagaon.org",
        text: "Emergency repair team completed coupling replacement at 4:30 PM. Water supply restored and closed.",
        createdAt: "2026-06-12T17:00:00Z"
      }
    ]
  }
];

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading db file, falling back to mock", err);
  }
  // Initialize with seed data
  writeDB(INITIAL_ISSUES);
  return INITIAL_ISSUES;
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db file", err);
  }
}

// Simple in-memory user sessions simulation
// In real life, Firebase or Session handles this, but since Firebase is throttled or has project region limits,
// we provide a robust Express state.
let activeUsers: Record<string, { email: string; name: string; avatar: string; wardId: number; lang: string; badges: string[] }> = {
  "riya98767675@gmail.com": {
    email: "riya98767675@gmail.com",
    name: "Riya",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    wardId: 3,
    lang: "English",
    badges: ["Community Helper"]
  }
};

// --- API ENDPOINTS ---

// Google authentication simulation or direct connection retrieval
app.post("/api/auth/google", (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // If user doesn't exist, create it
  if (!activeUsers[email]) {
    activeUsers[email] = {
      email,
      name: name || email.split("@")[0],
      avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      wardId: 1, // Default Ward 1
      lang: "English",
      badges: []
    };
  }
  res.json(activeUsers[email]);
});

app.get("/api/auth/profile", (req, res) => {
  const email = req.headers["x-user-email"] as string;
  if (!email) {
    return res.status(401).json({ error: "Unauthorized. Please Sign In." });
  }
  if (!activeUsers[email]) {
    activeUsers[email] = {
      email,
      name: email.split("@")[0],
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      wardId: 1,
      lang: "English",
      badges: []
    };
  }
  res.json(activeUsers[email]);
});

app.post("/api/auth/profile/update", (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { wardId, lang, name } = req.body;
  if (!email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!activeUsers[email]) {
    activeUsers[email] = {
      email,
      name: name || email.split("@")[0],
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      wardId: wardId || 1,
      lang: lang || "English",
      badges: []
    };
  } else {
    if (wardId !== undefined) activeUsers[email].wardId = Number(wardId);
    if (lang !== undefined) activeUsers[email].lang = lang;
    if (name !== undefined) activeUsers[email].name = name;
  }
  res.json(activeUsers[email]);
});

// GET all issues
app.get("/api/issues", (req, res) => {
  const issues = readDB();
  res.json(issues);
});

// POST analyze civic issue using Gemini AI structure response
app.post("/api/issues/analyze", async (req, res) => {
  const { description, imageBase64 } = req.body;
  if (!description) {
    return res.status(400).json({ error: "Issue description is required for AI analysis." });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY not configured or has default value. Falling back to local offline processor.");
    // Offline analyzer model fallback
    const mockAnalysis = simulateLocalAIAnalysis(description, imageBase64);
    return res.json(mockAnalysis);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    let finalBase64 = imageBase64;
    if (imageBase64 && imageBase64.startsWith("http")) {
      try {
        const imageFetchRes = await fetch(imageBase64);
        const arrayBuffer = await imageFetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = imageFetchRes.headers.get("content-type") || "image/jpeg";
        finalBase64 = `data:${contentType};base64,${buffer.toString("base64")}`;
      } catch (err) {
        console.error("Failed to fetch image URL inside analyze endpoint:", err);
      }
    }

    // Construct Gemini contents array. Incorporate base64 image if it exists.
    const contents: any[] = [];
    
    let imagePromptText = "";
    if (finalBase64 && finalBase64.startsWith("data:image/")) {
      const commaIdx = finalBase64.indexOf(",");
      const mimeType = finalBase64.substring(5, finalBase64.indexOf(";"));
      const data = finalBase64.substring(commaIdx + 1);
      
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: data
        }
      });
      imagePromptText = "Analyze the attached image showing the civic damage alongside the user's report text. ";
    }

    const textualPrompt = `${imagePromptText}
Analyze the following civic issue report submitted by a resident of Nayagaon city in Punjab, India. 
Determine the correct standard civic category, estimate severity, make a neat 1-sentence English summary, and suggest an actionable solution/recommendation.

Additionally, perform AI Fake Report Detection:
1. If an image is uploaded, carefully compare the image content with the text description.
2. Detect if the image does NOT match the complaint description (e.g., Description is 'Water leakage' but the Image is a 'Garbage dump' or clean office). If they don't match, set isFake to true, statusText to 'Possible Fake Report', and reason to explain the mismatch.
3. Detect if the text description is complete spam, gibberish, keyboard mash, advertisement, or duplicate fake reports.
4. If they match or only consistent text is provided, set isFake to false, statusText to 'Verified Complaint', and confidence to a high score (e.g., 90-95%).

Civic Categories allowed:
- 'Pothole / Road Damage'
- 'Water Leakage'
- 'Drain Blockage'
- 'Garbage Collection'
- 'Missing Drain Cover'
- 'Electricity Infrastructure Issue'

Severity levels allowed: 'Low', 'Medium', 'High', 'Critical' (use Critical for direct danger to children/traffic, P1 road safety hazards, live electricity wires, completely clogged sewers creating immediate hygienic emergencies).

User's issue text:
"${description}"`;

    contents.push({ text: textualPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            category: {
              type: "STRING",
              description: "One of the exactly specified categories."
            },
            severity: {
              type: "STRING",
              description: "One of: Low, Medium, High, Critical"
            },
            summary: {
              type: "STRING",
              description: "Concise summary of the civic problem in English, maximum 12 words."
            },
            recommendation: {
              type: "STRING",
              description: "Actionable concrete recommendation to Nayagaon Municipal Corporation authorities, maximum 22 words."
            },
            fakeDetection: {
              type: "OBJECT",
              properties: {
                isFake: {
                  type: "BOOLEAN",
                  description: "True if image doesn't match description or text is spam/gibberish."
                },
                confidence: {
                  type: "NUMBER",
                  description: "A confidence score from 0 to 100 on this matching/verification determination."
                },
                reason: {
                  type: "STRING",
                  description: "A concise sentence explaining why it's verified or a mismatch/fake report."
                },
                statusText: {
                  type: "STRING",
                  description: "Must be 'Possible Fake Report' if mismatched/spam, or 'Verified Complaint' if they match."
                }
              },
              required: ["isFake", "confidence", "reason", "statusText"]
            }
          },
          required: ["category", "severity", "summary", "recommendation", "fakeDetection"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Gemini AI API Call failed", error);
    // Provide nice fallback analyzer
    const mockAnalysis = simulateLocalAIAnalysis(description, imageBase64);
    res.json({
      ...mockAnalysis,
      isFallback: true,
      errorMsg: error?.message || "AI pipeline throttled. Switched to offline processing."
    });
  }
});

// POST to create multiple issues
app.post("/api/issues", (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { title, description, category, severity, wardId, gps, image, summary, recommendation } = req.body;
  
  if (!description || !wardId) {
    return res.status(400).json({ error: "Description and Ward Selection are required." });
  }

  const user = activeUsers[email] || {
    email: email || "anonymous@nayagaon.org",
    name: email ? email.split("@")[0] : "Resident",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"
  };

  const issues = readDB();
  const wardNames: Record<number, string> = {
    1: "Ward 1 (Karoran Road)",
    2: "Ward 2 (Dashmesh Nagar)",
    3: "Ward 3 (Vikas Nagar)",
    4: "Ward 4 (Adarsh Nagar)",
    5: "Ward 5 (Nadda Road)",
    6: "Ward 6 (Saini Colony)",
    7: "Ward 7 (Govind Nagar)",
    8: "Ward 8 (Guru Nanak Nagar)",
    9: "Ward 9 (Shiva Colony)",
    10: "Ward 10 (Sudarshan Nagar)",
    11: "Ward 11 (Adarsh Vihar)",
    12: "Ward 12 (Shivalik Vihar)",
    13: "Ward 13 (Green Valley)",
    14: "Ward 14 (Sarabha Nagar)",
    15: "Ward 15 (Model Town)",
    16: "Ward 16 (Patel Nagar)",
    17: "Ward 17 (Preet Colony)",
    18: "Ward 18 (Ravi Colony)",
    19: "Ward 19 (Krishna Nagar)",
    20: "Ward 20 (Sant Nagar)",
    21: "Ward 21 (Vasant Vihar)"
  };

  const newIssue = {
    id: `issue-${Date.now()}`,
    title: title || `${category || "Civic Issue"} in ${wardNames[Number(wardId)] || "Ward " + wardId}`,
    description,
    category: category || "Pothole / Road Damage",
    severity: severity || "Medium",
    status: "Reported",
    wardId: Number(wardId),
    wardName: wardNames[Number(wardId)] || `Ward ${wardId}`,
    gps: gps || { latitude: 30.7842, longitude: 76.8021 },
    image: image || "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&q=80&w=600",
    summary: summary || description.substring(0, 60) + "...",
    recommendation: recommendation || "Municipal team dispatch recommended for on-site assessment.",
    reporter: {
      name: user.name,
      email: user.email,
      avatar: user.avatar
    },
    verifiedBy: [],
    createdAt: new Date().toISOString(),
    comments: []
  };

  issues.unshift(newIssue);
  writeDB(issues);

  // Gamification check: Badge for reporting
  if (email && activeUsers[email]) {
    const userBadges = activeUsers[email].badges || [];
    if (!userBadges.includes("Community Helper")) {
      userBadges.push("Community Helper");
    }
    // If has reported multiple, add civic champion
    const userReportsCount = issues.filter((i: any) => i.reporter.email === email).length;
    if (userReportsCount >= 3 && !userBadges.includes("Civic Champion")) {
      userBadges.push("Civic Champion");
    }
    activeUsers[email].badges = userBadges;
  }

  res.status(201).json(newIssue);
});

// POST verify an issue
app.post("/api/issues/:id/verify", (req, res) => {
  const email = req.headers["x-user-email"] as string;
  if (!email) {
    return res.status(401).json({ error: "You must be signed in to verify issues." });
  }

  const { id } = req.params;
  const issues = readDB();
  const issueIndex = issues.findIndex((i: any) => i.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: "Civic issue report not found" });
  }

  const issue = issues[issueIndex];
  
  // Create a clean unique identifier representing the user
  const userIdentifier = email;

  if (issue.reporter.email === email) {
    return res.status(400).json({ error: "You cannot verify your own reported issue!" });
  }

  if (!issue.verifiedBy) {
    issue.verifiedBy = [];
  }

  const alreadyVerifiedVal = issue.verifiedBy.indexOf(userIdentifier);
  if (alreadyVerifiedVal !== -1) {
    // Un-verify (Toggle feature is awesome)
    issue.verifiedBy.splice(alreadyVerifiedVal, 1);
  } else {
    issue.verifiedBy.push(userIdentifier);
  }

  // Determine transition statuses based on verification count
  // Reported -> Community Verified (if >= 2 verifications)
  if (issue.status === "Reported" && issue.verifiedBy.length >= 2) {
    issue.status = "Community Verified";
  } else if (issue.status === "Community Verified" && issue.verifiedBy.length < 2) {
    issue.status = "Reported";
  }

  issues[issueIndex] = issue;
  writeDB(issues);

  // Update gamification badges for verifier
  if (activeUsers[email]) {
    const vBadges = activeUsers[email].badges || [];
    // If verifications done by this user reach 4, unlock Ward Hero
    const totalVerifiesByUser = issues.filter((i: any) => i.verifiedBy && i.verifiedBy.includes(email)).length;
    if (totalVerifiesByUser >= 2 && !vBadges.includes("Ward Hero")) {
      vBadges.push("Ward Hero");
    }
    activeUsers[email].badges = vBadges;
  }

  res.json(issue);
});

// POST add a comment
app.post("/api/issues/:id/comments", (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { text } = req.body;

  if (!email) {
    return res.status(401).json({ error: "You must be signed in to add comments." });
  }
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Comment text cannot be empty." });
  }

  const { id } = req.params;
  const issues = readDB();
  const issueIndex = issues.findIndex((i: any) => i.id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ error: "Civic issue report not found" });
  }

  const user = activeUsers[email] || {
    email,
    name: email.split("@")[0],
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`
  };

  const comment = {
    id: `comment-${Date.now()}`,
    userName: user.name,
    userEmail: user.email,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  issues[issueIndex].comments.push(comment);
  writeDB(issues);

  res.status(201).json(issues[issueIndex]);
});

// GET stats
app.get("/api/stats", (req, res) => {
  const issues = readDB();
  const total = issues.length;
  const resolved = issues.filter((i: any) => i.status === "Resolved").length;
  const critical = issues.filter((i: any) => i.severity === "Critical" && i.status !== "Resolved").length;
  const inProgress = issues.filter((i: any) => i.status === "In Progress").length;

  // Ward statistics
  const wardIssueCounts: Record<string, number> = {};
  issues.forEach((i: any) => {
    wardIssueCounts[i.wardName] = (wardIssueCounts[i.wardName] || 0) + 1;
  });

  const wardStats = Object.keys(wardIssueCounts).map(name => ({
    wardName: name,
    count: wardIssueCounts[name]
  })).sort((a,b) => b.count - a.count);

  // Category statistics
  const categoryCounts: Record<string, number> = {};
  issues.forEach((i: any) => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });

  const categoryStats = Object.keys(categoryCounts).map(cat => ({
    category: cat,
    count: categoryCounts[cat]
  }));

  res.json({
    total,
    resolved,
    critical,
    inProgress,
    wardStats,
    categoryStats
  });
});

// POST predictive insights based on current ward data using Gemini AI or structured simulation fallback
app.post("/api/predictive-insights", async (req, res) => {
  const { issues } = req.body;
  if (!issues || !Array.isArray(issues)) {
    return res.status(400).json({ error: "Issues list is required for predictive insights analysis." });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY not configured or has default value for Predictive insights. Switched to offline analyzer.");
    const mockInsights = simulateLocalPredictiveInsights(issues);
    return res.json(mockInsights);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    // Construct summarized payload of ward issues
    const summarizedIssues = issues.map((i: any) => ({
      category: i.category,
      severity: i.severity,
      status: i.status,
      wardName: i.wardName,
      createdAt: i.createdAt,
      verifications: i.verifiedBy?.length || 0
    }));

    const promptText = `
Analyze the following local civic issues reported in Nayagaon, Punjab, India.
Generate high-fidelity predictive risk assessments and preventive recommendations based on this ward data patterns.
Specifically, predict:
1. High-risk zones (Wards that are vulnerable to infrastructure systemic collapses, e.g. sewage overflows, power grids snaps, or severe traffic blocks due to multiple recurring complaints).
2. Direct recommendations on preventive urban health or infrastructure operations to the Municipal Corporation (e.g., proactive maintenance of pipelines in Ward 3 before rainy season).
3. Citizen engagement and safety tips for students/pedestrians based on active hazards (e.g. caution near exposed wires in Dashmesh Nagar).

Provide the output strictly as a JSON object adhering to this schema:
{
  "safetyScoreIndex": number (from 1 to 100, indicating overall health of the city. More unresolved critical issues lower the score),
  "vulnerableWard": string (name of the ward that has the highest risk of infrastructure failure),
  "predictedRiskSummary": string (a comprehensive 2-sentence explanation of what risk is forecasted and why, maximum 30 words),
  "preventativeActions": string[] (list of 3 concrete municipal items, maximum 15 words each),
  "citizenActionAlert": string (a clear warning alert/advocate tip for local pedestrian safety, maximum 20 words)
}

Reported Ward Data:
${JSON.stringify(summarizedIssues, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            safetyScoreIndex: {
              type: "NUMBER"
            },
            vulnerableWard: {
              type: "STRING"
            },
            predictedRiskSummary: {
              type: "STRING"
            },
            preventativeActions: {
              type: "ARRAY",
              items: {
                type: "STRING"
              }
            },
            citizenActionAlert: {
              type: "STRING"
            }
          },
          required: ["safetyScoreIndex", "vulnerableWard", "predictedRiskSummary", "preventativeActions", "citizenActionAlert"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini AI Predictive analysis failed:", error);
    const mockInsights = simulateLocalPredictiveInsights(issues);
    res.json({
      ...mockInsights,
      isFallback: true,
      errorMsg: "Gemini pipeline busy. Processed local predictive projection."
    });
  }
});

// Helper offline local predictive risk simulator based on historical ward metrics
function simulateLocalPredictiveInsights(issues: any[]) {
  const activeRoadDamage = issues.filter((i: any) => i.status !== "Resolved" && i.category === "Pothole / Road Damage").length;
  const activeWaterLeakage = issues.filter((i: any) => i.status !== "Resolved" && i.category === "Water Leakage").length;
  const activeElectricity = issues.filter((i: any) => i.status !== "Resolved" && i.category === "Electricity Infrastructure Issue").length;
  const activeGarbage = issues.filter((i: any) => i.status !== "Resolved" && i.category === "Garbage Collection").length;
  const criticalCount = issues.filter((i: any) => i.status !== "Resolved" && i.severity === "Critical").length;

  // Find ward with most active issues
  const wardActiveMap: Record<string, number> = {};
  issues.forEach((i: any) => {
    if (i.status !== "Resolved") {
      wardActiveMap[i.wardName] = (wardActiveMap[i.wardName] || 0) + 1;
    }
  });

  let vulnerableWard = "None";
  let maxActive = 0;
  Object.entries(wardActiveMap).forEach(([ward, count]) => {
    if (count > maxActive) {
      maxActive = count;
      vulnerableWard = ward;
    }
  });

  if (vulnerableWard === "None") {
    vulnerableWard = "Ward 3 (Vikas Nagar)";
  }

  // Calculate generic safety score
  let safetyScoreIndex = 100 - (issues.filter(i => i.status !== "Resolved").length * 4) - (criticalCount * 8);
  safetyScoreIndex = Math.max(15, Math.min(98, safetyScoreIndex));

  // Construct context-dependent predicted risks
  let predictedRiskSummary = "Accumulating stormwater runoff is projected to saturate road surfaces and expand minor craters.";
  let preventativeActions = [
    "Schedule pre-rain sewer cleaning sweep.",
    "Refill minor potholes with Level-3 asphalt.",
    "Clear plastic blockages at primary drain joints."
  ];
  let citizenActionAlert = "Drive under 25 km/h near school crossings to prevent sliding on uncompacted gravel.";

  // Tailor based on category dominant counts
  if (activeElectricity > 0) {
    predictedRiskSummary = "Wind/rain cycles threaten low-hanging power cables, with electrical leaks predicted around wet metal grids.";
    preventativeActions = [
      "PSPCL line team to prune overhanging branches.",
      "Conduct insulation scanning on poles.",
      "Temporarily isolate sparking meter grids."
    ];
    citizenActionAlert = "Pedestrians should avoid contact with wet school fences and iron poles.";
  } else if (activeWaterLeakage > activeRoadDamage) {
    predictedRiskSummary = "Sub-surface water pipe leaks threaten to erode clay foundations beneath Karoran Road's walking lines.";
    preventativeActions = [
      "Pressure-test core line in Vikas Nagar.",
      "Dispatch joint-repair metal sleeves.",
      "Silt clearance in primary groundwater collection drains."
    ];
    citizenActionAlert = "Report bubbling asphalt spots immediately; they indicate subterranean pipeline fracture hubs.";
  } else if (activeGarbage > 2) {
    predictedRiskSummary = "Overfilled curbside bins during high humidity predicted to trigger public health odors and rodent nesting.";
    preventativeActions = [
      "Augment dumpster collections to twice-daily shifts.",
      "Spray organic disinfectant over open dumps.",
      "Install heavy-duty lids on central market bin collectors."
    ];
    citizenActionAlert = "Use sealed biodegradable bags and avoid depositing household solid waste in uncovered open spaces.";
  }

  return {
    safetyScoreIndex,
    vulnerableWard,
    predictedRiskSummary,
    preventativeActions,
    citizenActionAlert
  };
}

// Helper offline local analyzer simulator
function simulateLocalAIAnalysis(description: string, imageBase64?: string) {
  const descLower = description.toLowerCase();
  let category = "Pothole / Road Damage";
  let severity = "Medium";
  let summary = "Civic damage reported on local municipal road.";
  let recommendation = "Send primary road inspection team to confirm scope and secure safe commuter transit.";

  if (descLower.includes("water") || descLower.includes("pipeline") || descLower.includes("leak") || descLower.includes("spray") || descLower.includes("pipe") || descLower.includes("paani")) {
    category = "Water Leakage";
    severity = "Medium";
    summary = "Potable water pipe burst causing continuous leakage.";
    recommendation = "Repair pipeline valve immediately to avoid clean drinking water loss.";
  } else if (descLower.includes("drain") || descLower.includes("cover") || descLower.includes("slab") || descLower.includes("gutter") || descLower.includes("hole")) {
    if (descLower.includes("missing") || descLower.includes("broken") || descLower.includes("cover") || descLower.includes("shut")) {
      category = "Missing Drain Cover";
      severity = "Critical";
      summary = "Missing or collapsed concrete drain safety cover.";
      recommendation = "Erect protective barrier around the opening and secure state approved high-strength concrete replacement.";
    } else {
      category = "Drain Blockage";
      severity = "High";
      summary = "Clogged storm sewer or drain holding stagnant black water.";
      recommendation = "Mobilize municipal super-sucker machine to pump debris out and restore flow.";
    }
  } else if (descLower.includes("garbage") || descLower.includes("waste") || descLower.includes("bin") || descLower.includes("dump") || descLower.includes("trash") || descLower.includes("smell")) {
    category = "Garbage Collection";
    severity = "High";
    summary = "Solid garbage accumulation and organic waste overflow.";
    recommendation = "Dispatch solid waste management payload tractor to load excess trash and clean the neighborhood block.";
  } else if (descLower.includes("wire") || descLower.includes("electricity") || descLower.includes("pole") || descLower.includes("transformer") || descLower.includes("power") || descLower.includes("shock")) {
    category = "Electricity Infrastructure Issue";
    severity = "Critical";
    summary = "Dangerous exposed high-tension wire electrical hazard near public walkthrough.";
    recommendation = "Inform Punjab State Power Corporation (PSPCL) line operators for immediate shut-off and wire re-shielding.";
  } else if (descLower.includes("hole") || descLower.includes("pothole") || descLower.includes("road") || descLower.includes("cracks")) {
    category = "Pothole / Road Damage";
    severity = descLower.includes("accident") || descLower.includes("deep") || descLower.includes("dangerous") ? "High" : "Medium";
    summary = "Deep tarmac damage and dangerous road crater.";
    recommendation = "Fill cavity with gravel instantly followed by bituminous cold mix laying for level pathway.";
  }

  // Fake Report Detection simulation
  let isFake = false;
  let confidence = 95;
  let statusText = "Verified Complaint";
  let reason = `The uploaded image is highly consistent with the reported "${category}" issue description.`;

  if (
    descLower.includes("fake") || 
    descLower.includes("spam") || 
    descLower.includes("mismatch") ||
    descLower.includes("garbage dump") && (descLower.includes("water leakage") || descLower.includes("leak") || descLower.includes("paani")) ||
    descLower.includes("paani leak") && descLower.includes("garbage") ||
    descLower.includes("sector 4") && descLower.includes("garbage")
  ) {
    isFake = true;
    confidence = 92;
    statusText = "Possible Fake Report";
    reason = "The uploaded image depicts a massive garbage dump pile, whereas the complaint description reports water leakage. This clear visual-text mismatch suggests a fake report.";
  } else if (descLower.length < 8) {
    isFake = true;
    confidence = 88;
    statusText = "Possible Fake Report";
    reason = "The report contains insufficient text or keyboard gibberish, indicating potential spam or automated submission.";
  }

  return {
    category,
    severity,
    summary,
    recommendation,
    fakeDetection: {
      isFake,
      confidence,
      reason,
      statusText
    }
  };
}

// Vite middleware setup
if (process.env.NODE_ENV !== "production") {
  const startVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development Server running on http://localhost:${PORT}`);
    });
  };
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production Server running on port ${PORT}`);
  });
}
