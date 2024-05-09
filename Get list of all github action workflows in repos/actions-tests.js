require('dotenv').config(); // Load environment variables from .env file

const { Octokit } = require("@octokit/rest");

// Initialize Octokit with your GitHub token
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });

// Specify the organizations you want to audit
const orgs = ["SpotlightUK", "Castingnetworks"];;


// Function to fetch the workflow files and extract the lines containing 'uses'
async function getWorkflowUses(org) {
  try {
    // Fetch all repositories from the organization using pagination

    const repos = await octokit.paginate(octokit.repos.listForOrg, { org });
    for (const repo of repos) {
      try {
        // List the contents of the .github/workflows directory
        const contents = await octokit.repos.getContent({
          owner: org,
          repo: repo.name,
          path: '.github/workflows'
        });

        for (const content of contents.data) {
          if (content.type === 'file' && content.name.endsWith('.yml')) {
            // Get the content of each workflow file
            const fileData = await octokit.repos.getContent({
              owner: org,
              repo: repo.name,
              path: content.path
            });

            const fileContent = Buffer.from(fileData.data.content, 'base64').toString('utf8');
            // Extract lines containing 'uses'
            const lines = fileContent.split('\n').filter(line => line.includes('uses'));
            lines.forEach(line => {
              console.log(`Org: ${org}, Repo: ${repo.name}, Package: ${line.trim()}`);
            });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch workflows for ${repo.name} in ${org}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Failed to list repositories for org ${org}: ${error.message}`);
  }
}

async function runAudit() {
  for (const org of orgs) {
    await getWorkflowUses(org);
  }
}

runAudit();