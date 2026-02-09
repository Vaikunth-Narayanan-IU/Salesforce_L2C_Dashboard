#!/usr/bin/env node
/*
  Lists Render owners for the current API key.
*/
const API_BASE = 'https://api.render.com/v1';

function exitWith(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function getEnv(name, required = false) {
  const v = process.env[name];
  if (!v && required) exitWith(`Missing required environment variable: ${name}`);
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
  try { json = text ? JSON.parse(text) : null; } catch (e) { }
  if (!res.ok) {
    const body = json ? JSON.stringify(json, null, 2) : text;
    exitWith(`Request failed: ${res.status} ${res.statusText}\n${body}`);
  }
  return json;
}

async function main() {
  getEnv('RENDER_API_KEY', true);
  const owners = await fetchJson(`${API_BASE}/owners`);
  if (!Array.isArray(owners) || owners.length === 0) {
    console.log('No owners found for this API key.');
    return;
  }

  owners.forEach((o, idx) => {
    console.log(`${idx + 1}. id=${o.id} name=${o.name} type=${o.type}`);
  });

  if (owners.length === 1) {
    console.log(`\nExport this owner id to use for deployments:`);
    console.log(`export RENDER_OWNER_ID="${owners[0].id}"`);
  } else {
    console.log(`\nPick an owner id from the list above and run:`);
    console.log(`export RENDER_OWNER_ID="<owner id>"`);
  }
}

main().catch(err => {
  console.error('Error:', err && err.message ? err.message : String(err));
  process.exit(1);
});
