require('dotenv').config(); // Load environment variables from .env file

const { Octokit } = require("@octokit/core");
const stringify = require("csv-stringify").stringify;
const fs = require("fs");

// Initialize Octokit with your GitHub token
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });

// Function to fetch users with pagination
async function fetchUsers() {
    let users = [];
    let since = 0; // Initialize 'since' to start from the beginning
    do {
      console.log(`Fetching users since ID: ${since}`);
      const response = await octokit.request('GET /users', {
        since: since,
        per_page: 100, // Adjust per_page to manage response volume
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
  
      // Break if no users are returned
      if (response.data.length === 0) {
        console.log('No more users found.');
        break;
      }
  
      users = users.concat(response.data);
      since = response.data[response.data.length - 1].id;
      console.log(`Fetched ${response.data.length} users. Last ID: ${since}`);
  
      // Safety break - in case of unexpected behavior (remove once confirmed working)
      if (users.length > 5000) { // Assuming you don't expect to fetch more than 5000 users at once
        console.log('Safety break - too many users fetched.');
        break;
      }
  
    } while (true);
  
    return users;
  }

// Convert and save data to CSV
function saveToCSV(users) {
    console.log(`Saving to CSV.`);
  const formattedUsers = users.map(user => ({
    login: user.login,
    id: user.id,
    node_id: user.node_id,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    type: user.type,
    site_admin: user.site_admin
    // Add other fields as necessary
  }));

  stringify(formattedUsers, { header: true }, (err, output) => {
    if (err) {
      console.error('Error generating CSV:', err);
      return;
    }
    fs.writeFile('github_enterprise_users.csv', output, err => {
      if (err) {
        console.error('Error saving CSV:', err);
        return;
      }
      console.log('github_enterprise_users.csv has been saved.');
    });
  });
}

// Main function to orchestrate the fetching and saving process
async function main() {
    console.log(`Main, fetching users.`);
  const users = await fetchUsers();
  saveToCSV(users);
}

main().catch(console.error);