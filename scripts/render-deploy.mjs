#!/usr/bin/env node
/*
  Render deploy script (plain Node.js, uses global fetch in Node 18+)
  - Lists services
  - Creates a web_service if missing
  - Triggers a deploy
*/

const API_BASE = 'https://api.render.com/v1';

function exitWith(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function getEnv(name, required = false, defaultValue = undefined) {
  const v = process.env[name];
  if (!v) {
    if (required) exitWith(`Missing required environment variable: ${name}`);
    return defaultValue;
  }
  return v;
}

async function fetchJson(url, opts = {}) {
  const headers = Object.assign({}, opts.headers || {}, {
    'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
    'Content-Type': 'application/json',
  });
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { /* ignore */ }
  if (!res.ok) {
    const body = json ? JSON.stringify(json, null, 2) : text;
    exitWith(`Request failed: ${res.status} ${res.statusText}\n${body}`);
  }
  return json;
}

async function main() {
  const RENDER_API_KEY = getEnv('RENDER_API_KEY', true);
  const RENDER_OWNER_ID = getEnv('RENDER_OWNER_ID', true);
  const RENDER_REPO = getEnv('RENDER_REPO', true);
  const RENDER_SERVICE_NAME = getEnv('RENDER_SERVICE_NAME', false, 'salesforce-l2o-dashboard');
  const RENDER_REGION = getEnv('RENDER_REGION', false, 'oregon');
  const RENDER_BRANCH = getEnv('RENDER_BRANCH', false, 'main');
  const RENDER_PLAN = getEnv('RENDER_PLAN', false, 'free');

  console.log('Fetching services...');
  const services = await fetchJson(`${API_BASE}/services?limit=100`);
  const found = Array.isArray(services) ? services.find(s => s.name === RENDER_SERVICE_NAME) : null;

  let service = found;
  if (!service) {
    console.log(`Service '${RENDER_SERVICE_NAME}' not found. Creating...`);
    const body = {
      type: 'web_service',
      ownerId: RENDER_OWNER_ID,
      name: RENDER_SERVICE_NAME,
      repo: RENDER_REPO,
      branch: RENDER_BRANCH,
      region: RENDER_REGION,
      runtime: 'node',
      buildCommand: 'npm install && npm run build',
      startCommand: 'npm run start',
      plan: RENDER_PLAN,
      // Best-effort attempt to disable PR previews (field accepted by API if supported)
      pullRequestPreviewsEnabled: false,
    };

    service = await fetchJson(`${API_BASE}/services`, { method: 'POST', body: JSON.stringify(body) });
    console.log('Service created.');
  } else {
    console.log(`Found service '${RENDER_SERVICE_NAME}' (id=${service.id}).`);
  }

  if (!service || !service.id) exitWith('Failed to determine service id after create/list.');

  console.log('Triggering deploy...');
  const deploy = await fetchJson(`${API_BASE}/services/${service.id}/deploys`, { method: 'POST', body: JSON.stringify({}) });

  const serviceId = service.id;
  const deployId = deploy && (deploy.id || deploy.deployId || deploy.uuid) ? (deploy.id || deploy.deployId || deploy.uuid) : null;

  console.log(`Service ID: ${serviceId}`);
  console.log(`Deploy ID: ${deployId ?? JSON.stringify(deploy)}`);
  console.log('Deploy triggered successfully.');
}

main().catch(err => {
  console.error('Error:', err && err.message ? err.message : String(err));
  process.exit(1);
});
