# @pipeworx/npi-registry

CMS NPI Registry MCP — every US healthcare provider with a National Provider Identifier (~7M individuals + organizations). No auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search(number?, name?, first_name?, last_name?, organization_name?, taxonomy?, city?, state?, postal_code?, country_code?, npi_type?, address_purpose?, limit?, skip?)`
- `get_provider(npi)` — convenience: lookup by 10-digit NPI

## Data source

`https://npiregistry.cms.hhs.gov/api/?version=2.1` — public REST.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "npi-registry": {
      "url": "https://gateway.pipeworx.io/npi-registry/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Npi Registry data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
