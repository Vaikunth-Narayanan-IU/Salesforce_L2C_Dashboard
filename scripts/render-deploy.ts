#!/usr/bin/env ts-node
async function main() {
  const {
    RENDER_API_KEY,
    RENDER_OWNER_ID,
    RENDER_REPO,
    RENDER_SERVICE_NAME = 'salesforce-l2o-dashboard',
    RENDER_REGION = 'oregon',
    RENDER_BRANCH = 'main',
  } = process.env as Record<string, string | undefined>;

  if (!RENDER_API_KEY) {
    console.error('Missing required env: RENDER_API_KEY');
    process.exit(1);
  }
  if (!RENDER_OWNER_ID) {
    console.error('Missing required env: RENDER_OWNER_ID');
    process.exit(1);
  }
  if (!RENDER_REPO) {
    console.error('Missing required env: RENDER_REPO');
    process.exit(1);
  }

  const API_BASE = 'https://api.render.com/v1';
  const headers = {
    Authorization: `Bearer ${RENDER_API_KEY}`,
    'Content-Type': 'application/json',
  };

  async function fetchJson(url: string, opts: RequestInit = {}) {
    const res = await fetch(url, { headers, ...opts });
    const text = await res.text();
    let json: any = undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch (e) {
      // ignore JSON parse error
    }
    if (!res.ok) {
      const message = json && json.message ? json.message : text || res.statusText;
      throw new Error(`${res.status} ${res.statusText}: ${message}`);
    }
    return json;
  }

  console.log('Listing services...');
  const services = await fetchJson(`${API_BASE}/services?limit=100`);
  const found = Array.isArray(services) ? services.find((s: any) => s.name === RENDER_SERVICE_NAME) : undefined;

  let service: any = found;
  if (!service) {
    console.log(`Service '${RENDER_SERVICE_NAME}' not found — creating new Web Service...`);
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
    };

    service = await fetchJson(`${API_BASE}/services`, { method: 'POST', body: JSON.stringify(body) });
    console.log('Created service:', service.name || service.id || '<unknown>');
  } else {
    console.log(`Found existing service '${RENDER_SERVICE_NAME}' (id=${service.id}).`);
  }

  if (!service || !service.id) {
    console.error('Failed to obtain service id. Aborting.');
    process.exit(1);
  }

  console.log('Triggering deploy...');
  const deploy = await fetchJson(`${API_BASE}/services/${service.id}/deploys`, { method: 'POST', body: JSON.stringify({}) });

  const serviceId = service.id;
  const deployId = deploy && (deploy.id || deploy.deployId || deploy.uuid) ? (deploy.id || deploy.deployId || deploy.uuid) : undefined;

  if (!deployId) {
    console.warn('Deploy created but no deploy id found in response. Full response:');
    console.log(JSON.stringify(deploy, null, 2));
  }

  console.log(`Service ID: ${serviceId}`);
  console.log(`Deploy ID: ${deployId ?? '<unknown>'}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
