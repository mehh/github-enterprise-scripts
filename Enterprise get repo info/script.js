require('dotenv').config(); // Load environment variables from .env file

const { Octokit } = require("@octokit/core");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Define the organizations
const orgs = ['castingnetworks', 'casting-frontier', 'spotlightuk', 'ts-staffmeup'];

// Initialize Octokit with your GitHub token
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });

// Set up the CSV writer
const csvWriter = createCsvWriter({
    path: 'github-repos.csv',
    header: [
        {id: 'org', title: 'ORG'},
        {id: 'description', title: 'DESCRIPTION'},
        {id: 'url', title: 'URL'},
        {id: 'full_name', title: 'FULL_NAME'},
        {id: 'name', title: 'NAME'},
        {id: 'created_at', title: 'CREATED_AT'},
        {id: 'pushed_at', title: 'PUSHED_AT'},
        {id: 'updated_at', title: 'UPDATED_AT'},
        {id: 'archived', title: 'ARCHIVED'} // New column for archived status
    ]
});

// Function to fetch repositories of an organization
async function fetchRepos(org) {
    let allRepos = [];
    let page = 1;
    let totalFetched = 0;

    while (true) {
        console.log(`Sending request for ${org}, page ${page}...`);
        try {
            const response = await octokit.request(`GET /orgs/${org}/repos`, {
                org: org,
                per_page: 100,
                page: page
            });

            const repos = response.data;
            totalFetched += repos.length;
            console.log(`Received ${repos.length} repos for ${org}. Total fetched so far: ${totalFetched}`);

            allRepos = allRepos.concat(repos.map(repo => ({
                org: org,
                description: repo.description || '',
                url: repo.html_url,
                full_name: repo.full_name,
                name: repo.name,
                created_at: repo.created_at,
                pushed_at: repo.pushed_at,
                updated_at: repo.updated_at,
                archived: repo.archived // Extract archived status
            })));

            if (repos.length < 100) {
                console.log(`Finished fetching repos for ${org}. Total repos fetched: ${totalFetched}`);
                break;
            } else {
                page++;
            }
        } catch (error) {
            console.error(`Error fetching repos for org ${org}:`, error.message);
            break;
        }
    }

    return allRepos;
}

// Main function to process all organizations
async function processOrgs() {
    let allRepos = [];

    for (const org of orgs) {
        const repos = await fetchRepos(org);
        allRepos = allRepos.concat(repos);
    }

    console.log('Writing data to CSV...');
    await csvWriter.writeRecords(allRepos);
    console.log('CSV file created successfully.');
}

// Execute the main function
processOrgs();