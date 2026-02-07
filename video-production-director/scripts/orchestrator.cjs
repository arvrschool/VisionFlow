const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Video Production Director - Orchestrator
 * Implements the planning-with-files workflow.
 */

const targetUrl = process.argv[2];
if (!targetUrl) {
    console.error('Usage: node orchestrator.cjs <URL>');
    process.exit(1);
}

// 1. Setup Project Workspace
const urlObj = new URL(targetUrl);
const domain = urlObj.hostname.replace('www.', '').replace(/\./g, '_');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const projectDir = path.join(process.cwd(), 'projects', `${domain}_${timestamp}`);
const planPath = path.join(projectDir, 'plan.md');

if (!fs.existsSync(path.join(process.cwd(), 'projects'))) {
    fs.mkdirSync(path.join(process.cwd(), 'projects'), { recursive: true });
}
fs.mkdirSync(projectDir, { recursive: true });

const initialPlan = `# Production Plan: ${targetUrl}
Created: ${new Date().toLocaleString()}

## Workflow Status
- [ ] **Stage 1: Content Intelligence** (extraction of scripts/titles)
- [ ] **Stage 2: Media Harvesting** (sniffing videos/images)
- [ ] **Stage 3: Video Architecture** (TTS, layout, rendering)
- [ ] **Final Product: Publishing Ready**

## Log
- [System] Workspace initialized at ${projectDir}
`;

fs.writeFileSync(planPath, initialPlan, 'utf8');
console.log(`--- Director: Project Initialized ---`);
console.log(`PROJECT_DIR: ${projectDir}`);
console.log(`PLAN_PATH: ${planPath}`);

// Helper to update the plan file
function updatePlan(taskIndex, message, isDone = false) {
    let content = fs.readFileSync(planPath, 'utf8');
    const lines = content.split(/\r?\n/);
    let taskCounter = 0;
    
    let updatedLines = lines.map(line => {
        if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
            if (taskCounter === taskIndex) {
                const mark = isDone ? 'x' : ' ';
                line = line.replace(/-\s\[.\]/, `- [${mark}]`);
            }
            taskCounter++;
        }
        return line;
    });
    
    updatedLines.push(`- [${new Date().toLocaleTimeString()}] ${message}`);
    fs.writeFileSync(planPath, updatedLines.join('\n'), 'utf8');
}

// Export the project directory for the agent to use
console.log(`READY_FOR_STAGE_1`);