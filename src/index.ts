interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * CMS NPI Registry MCP
 *
 * Auth: none. Free public registry of every US healthcare provider with an NPI.
 *
 * Quirks:
 *  - Must include version=2.1 in query
 *  - Search requires at least one filter besides "limit"; the API rejects empty queries
 *
 * Docs: https://npiregistry.cms.hhs.gov/help-api
 */


const BASE = 'https://npiregistry.cms.hhs.gov/api';

const tools: McpToolExport['tools'] = [
  {
    name: 'search',
    description:
      'Search providers by any combination of fields. NPI Registry requires at least one filter — supply at least name/organization/taxonomy/postal_code/state.',
    inputSchema: {
      type: 'object',
      properties: {
        number: { type: 'string', description: '10-digit NPI' },
        name: { type: 'string', description: 'Full provider name (use along with type)' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        organization_name: { type: 'string' },
        taxonomy: { type: 'string', description: 'Taxonomy code or description (e.g. "Internal Medicine")' },
        city: { type: 'string' },
        state: { type: 'string', description: 'Two-letter state code' },
        postal_code: { type: 'string', description: '5-digit ZIP (or first 3 with wildcard "*")' },
        country_code: { type: 'string', description: 'US (default) | other ISO country' },
        npi_type: { type: 'string', description: 'NPI-1 (individual) | NPI-2 (organization)' },
        address_purpose: { type: 'string', description: 'LOCATION (default) | MAILING | PRIMARY | SECONDARY' },
        limit: { type: 'number', description: '1-200 (default 10)' },
        skip: { type: 'number', description: '0-based offset (max 1000)' },
      },
    },
  },
  {
    name: 'get_provider',
    description: 'Fetch a provider by 10-digit NPI.',
    inputSchema: {
      type: 'object',
      properties: { npi: { type: 'string', description: '10-digit NPI' } },
      required: ['npi'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search':
      return search(args);
    case 'get_provider':
      return search({ number: reqStr(args, 'npi', '"1234567890"'), limit: 1 });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function search(args: Record<string, unknown>) {
  const params = new URLSearchParams({ version: '2.1' });
  const map: Record<string, string> = {
    number: 'number',
    name: 'name',
    first_name: 'first_name',
    last_name: 'last_name',
    organization_name: 'organization_name',
    taxonomy: 'taxonomy_description',
    city: 'city',
    state: 'state',
    postal_code: 'postal_code',
    country_code: 'country_code',
    npi_type: 'enumeration_type',
    address_purpose: 'address_purpose',
  };
  let hasFilter = false;
  for (const [k, v] of Object.entries(args)) {
    if (k.startsWith('_')) continue;
    const apiKey = map[k];
    if (!apiKey) continue;
    if (v === undefined || v === null || String(v).trim() === '') continue;
    params.set(apiKey, String(v));
    hasFilter = true;
  }
  if (!hasFilter) {
    throw new Error('NPI Registry requires at least one filter (number, name, organization_name, postal_code, state, etc).');
  }
  params.set('limit', String(Math.min(200, Math.max(1, (args.limit as number) ?? 10))));
  params.set('skip', String(Math.min(1000, Math.max(0, (args.skip as number) ?? 0))));
  return npiGet(`/?${params}`);
}

async function npiGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'pipeworx-mcp-npi-registry/1.0 (+https://pipeworx.io)',
    },
  });
  if (res.status === 429) throw new Error('NPI Registry: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`NPI Registry error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
