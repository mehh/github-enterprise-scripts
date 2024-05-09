require('dotenv').config(); // Load environment variables from .env file

const { Octokit } = require("@octokit/rest");
const { stringify } = require("csv-stringify");
const fs = require("fs");

// Initialize Octokit with your GitHub token
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });


const enterprise = "talent-systems";


const orgs = ['castingnetworks', 'casting-frontier', 'spotlightuk', 'ts-staffmeup'];

async function fetchTeamsAndMembers(org) {
    const orgTeams = await octokit.paginate(octokit.teams.list, { org: org });
    const teamMemberData = [];
  
    for (const team of orgTeams) {
      const members = await octokit.paginate(octokit.teams.listMembersInOrg, {
        org: org,
        team_slug: team.slug,
      });
  
      members.forEach(member => {
        teamMemberData.push({
          Org: org,
          Team: team.name,
          "Parent Team": team.parent ? team.parent.name : "N/A",
          Member_Login: member.login,
          Member_ID: member.id,
        });
      });
    }
  
    return teamMemberData;
}
  
async function generateDataAndCSV() {
    let masterData = "Organization,Team Name,Parent Team,Member Login,Member ID\n";
  
    for (const org of orgs) {
      const data = await fetchTeamsAndMembers(org); // Ensure this returns data in expected format
      data.forEach(({ Org, Team, "Parent Team": ParentTeam, Member_Login, Member_ID }) => {
        masterData += `${Org},${Team},${ParentTeam},${Member_Login},${Member_ID}\n`;
      });
    }
  
    fs.writeFileSync('./master-teams-members.csv', masterData);
    console.log('Master CSV generated: master-teams-members.csv');
  }
  
  generateDataAndCSV();