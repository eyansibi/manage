const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
const fileUpload = require('express-fileupload');
app.use(express.json({ limit: '50mb' })); // Increase from default ~1MB to 50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST",'PATCH', "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
  fileUpload({
    useTempFiles: true,
    limits: { fileSize: 10 * 1024 * 1024 }, // 5 MB limit
    responseOnLimit: 'File size limit has been reached',
  })

);

connectDB();

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const projectRoutes = require("./routes/projectRoutes");
const workspaceRoutes = require("./routes/WorkspaceRoutes");
const experienceRoutes = require("./routes/experienceRoutes");
const ressourceRoutes = require("./routes/ressourceRoutes");
const certificationRoutes = require('./routes/certificationsRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api", taskRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/ressources", ressourceRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.post('/api/match-profiles', async (req, res) => {
  const { workspace_id, task_description } = req.body;
  
  try {
    // Get absolute path to the Python script and virtual environment
    const path = require('path');
    const scriptPath = path.resolve(__dirname, '../Moetaz.py');
    const pythonPath = 'C:\\Users\\moeta\\OneDrive\\Desktop\\pi\\project-management-platform\\venv\\Scripts\\python.exe';
    
    console.log(`Running Python script with:`, {
      workspace_id,
      task_description,
      scriptPath,
      pythonPath
    });
    
    // Execute Python script with parameters using the virtual environment Python
    const { spawn } = require('child_process');
    const python = spawn(pythonPath, [
      scriptPath,
      '--workspace_id', workspace_id,
      '--task_description', task_description
    ]);
    
    let matchData = '';
    let errorData = '';
    
    // Capture standard output - should be only JSON now
    python.stdout.on('data', (data) => {
      matchData += data.toString();
    });
    
    // Capture error output - all logs should go here
    python.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python script log: ${data}`);
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        return res.status(500).json({ 
          error: 'Profile matching failed', 
          details: errorData || 'Unknown error' 
        });
      }
      
      try {
        // Clean up the output - try to extract just the JSON part
        let jsonStr = matchData.trim();
        
        // If output contains log messages, try to extract just the JSON part
        if (jsonStr.includes('[{') && jsonStr.includes('}]')) {
          const jsonStart = jsonStr.indexOf('[{');
          const jsonEnd = jsonStr.lastIndexOf('}]') + 2;
          jsonStr = jsonStr.substring(jsonStart, jsonEnd);
        }
        
        // Parse the output from the Python script
        const results = JSON.parse(jsonStr);
        res.json(results);
      } catch (error) {
        console.error('Failed to parse Python output:', error);
        console.error('Raw output:', matchData);
        return res.status(500).json({ 
          error: 'Failed to parse matching results',
          details: 'Check server logs for the raw output' 
        });
      }
    });
  } catch (error) {
    console.error('Error executing Python script:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("Project Management Platform Backend");
});

const http = require('http');
const { initializeSocket } = require('./Socket');

const server = http.createServer(app);

initializeSocket(server);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});