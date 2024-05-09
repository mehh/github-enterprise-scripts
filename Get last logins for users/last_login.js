require('dotenv').config(); // Load environment variables from .env file

// Import necessary libraries
const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const csvStringify = require('csv-stringify');
const process = require('process');

// Initialize Octokit with your GitHub token
const octokit = new Octokit({ auth: process.env.OCTOKIT_TOKEN });

// Check command-line arguments to determine the mode (org or enterprise)
const mode = process.argv[2]; // 'org' or 'enterprise'
const target = process.argv[3]; // Either the enterprise name or an organization name

// Fetch audit logs based on mode
async function fetchAuditLogs(mode, target) {
    let events = [];
    if (mode === 'org') {
        // Fetching audit logs for an organization
        events = await octokit.request('GET /orgs/{org}/audit-log', {
            org: target,
            phrase: 'action:org.login' // Adjust this phrase according to the specific events you're interested in
        });
    } else if (mode === 'enterprise') {
        // Fetching audit logs at the enterprise level
        events = await octokit.request('GET /enterprises/{enterprise}/audit-log', {
            enterprise: target,
            phrase: 'action:org.login' // Adjust as needed
        });
    }
    return events.data;
}

// Convert fetched data to CSV format
async function convertToCSV(data, fileName) {
    csvStringify(data, { header: true }, (err, output) => {
        if (err) throw err;
        fs.writeFile(`${fileName}.csv`, output, (err) => {
            if (err) throw err;
            console.log(`${fileName}.csv saved.`);
        });
    });
}

// Main function to orchestrate the log fetching and CSV conversion
async function main(mode, target) {
    console.log(`Fetching audit logs for ${mode === 'org' ? 'organization' : 'enterprise'}: ${target}`);
    const events = await fetchAuditLogs(mode, target);
    const processedEvents = events.map(event => ({
        // Assuming `events` contains an array of event objects, customize as needed
        target: target,
        user: event.user, // Example field, adjust according to actual data structure
        action: event.action, // Example field
        // Add more fields as needed
    }));

    console.log(`Converting fetched data to CSV.`);
    await convertToCSV(processedEvents, `${target}-audit-log`);
}

// Verify command-line arguments
if (process.argv.length !== 4 || (mode !== 'org' && mode !== 'enterprise')) {
    console.log('Usage: node last_login.js <mode> <target>');
    console.log('<mode> should be "org" for an organization or "enterprise" for enterprise-level logs.');
    console.log('<target> should be the name of the organization or enterprise.');
} else {
    main(mode, target).catch(console.error);
}