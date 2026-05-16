const fs = require('node:fs');

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
const coveragePath = 'coverage/ChronoScope-frontend/coverage-summary.json';
const threshold = 70;

let markdown = '\n## Branch Coverage\n\n';

if (!summaryPath) {
  console.log('GITHUB_STEP_SUMMARY is not set; skipping job summary update.');
  process.exit(0);
}

if (!fs.existsSync(coveragePath)) {
  markdown += 'Coverage summary was not generated. Check the test output above.\n';
  fs.appendFileSync(summaryPath, markdown);
  process.exit(0);
}

const summary = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const branches = summary.total.branches;
const status = branches.pct >= threshold ? 'passed ✅' : 'failed ❌';

markdown += '| Metric | Covered | Total | Coverage | Threshold | Status |\n';
markdown += '|---|---:|---:|---:|---:|---|\n';
markdown += `| Branches | ${branches.covered} | ${branches.total} | ${branches.pct}% | ${threshold}% | ${status} |\n`;

fs.appendFileSync(summaryPath, markdown);
