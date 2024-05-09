const { Octokit } = require("@octokit/core");
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });

const repos = [
  { owner: "castingnetworks", repo: "apps-monorepo" },
  { owner: "castingnetworks", repo: "pf-core-api" },
  // Add more repositories as needed
];

async function analyzeRepos(repos) {
    for (const { owner, repo } of repos) {
      let totalTestFilesUpdated = 0;
      let totalNonTestFilesUpdated = 0;
      let totalTestChanges = 0;
      let totalNonTestChanges = 0;
      let prCount = 0;
  
      const startDate = "2024-05-01";
      const endDate = "2024-05-07";
  
      const { data: prs } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        state: 'open',
        sort: 'updated',
        direction: 'desc',
      });
  
      for (const pr of prs) {
        const prCreatedAt = new Date(pr.created_at);
        if (prCreatedAt >= new Date(startDate) && prCreatedAt <= new Date(endDate)) {
          prCount += 1;
          const { data: files } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
            owner,
            repo,
            pull_number: pr.number,
          });
  
          files.forEach(file => {
            const isTestFile = file.filename.endsWith('.test.tsx');
            const changes = file.additions + file.deletions;
  
            if (isTestFile) {
              totalTestFilesUpdated += 1;
              totalTestChanges += changes;
            } else {
              totalNonTestFilesUpdated += 1;
              totalNonTestChanges += changes;
            }
          });
        }
      }
  
      const avgTestChangesPerPR = prCount ? totalTestChanges / prCount : 0;
      const avgNonTestChangesPerPR = prCount ? totalNonTestChanges / prCount : 0;
  
      console.log(`Repository: ${owner}/${repo}`);
      console.log(`Total PRs analyzed: ${prCount}`);
      console.log(`Total Test File Updates: ${totalTestFilesUpdated}`);
      console.log(`Total Non-Test File Updates: ${totalNonTestFilesUpdated}`);
      console.log(`Average Test Changes (lines) per PR: ${avgTestChangesPerPR.toFixed(2)}`);
      console.log(`Average Non-Test Changes (lines) per PR: ${avgNonTestChangesPerPR.toFixed(2)}`);
      console.log('-----------------------------------');
    }
  }
  
  analyzeRepos(repos);
  