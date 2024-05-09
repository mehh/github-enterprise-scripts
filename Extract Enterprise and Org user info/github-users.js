require('dotenv').config(); // Load environment variables from .env file

const { Octokit } = require("@octokit/rest");
const { stringify } = require("csv-stringify");
const fs = require("fs");

// Initialize Octokit with your GitHub token
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });

const orgList = ['castingnetworks', 'casting-frontier', 'spotlightuk', 'ts-staffmeup'];

// Function to fetch detailed user information
async function fetchUserDetails(username) {
  const { data } = await octokit.request('GET /users/{username}', {
    username,
  });
  return data;
}

// Convert and save data to CSV
function saveToCSV(users, filename) {
  stringify(users, {
    header: true,
  }, (err, output) => {
    if (err) {
      console.error('Error generating CSV:', err);
      return;
    }
    fs.writeFile(filename, output, (err) => {
      if (err) {
        console.error('Error saving CSV:', err);
        return;
      }
      console.log(`${filename} has been saved.`);
    });
  });
}

// Main function to orchestrate everything
async function listMembersForOrgs(orgList) {
  let users = [];

  for (const orgLogin of orgList) {
    console.log(`Fetching members for organization: ${orgLogin}`);
    const members = await octokit.paginate('GET /orgs/{org}/members', {
      org: orgLogin,
    });

    for (const member of members) {
      const userDetails = await fetchUserDetails(member.login);
      users.push({
        login: userDetails.login,
        id: userDetails.id,
        name: userDetails.name, // This might be null if the user hasn't set their name
        company: userDetails.company,
        location: userDetails.location,
        email: userDetails.email, // Note: Email might be null if not public
        bio: userDetails.bio,
      });
    }
  }

  // Specify your CSV filename
  saveToCSV(users, "github_users.csv");
}

listMembersForOrgs(orgList);