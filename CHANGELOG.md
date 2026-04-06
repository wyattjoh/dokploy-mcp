# Changelog

## [0.6.0](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.5.1...dokploy-mcp-v0.6.0) (2026-04-06)


### Features

* add userConfig for Dokploy credentials in plugin manifest ([edec15f](https://github.com/wyattjoh/dokploy-mcp/commit/edec15ff60212527dafa6f8be9a204367e1abc2b))

## [0.5.1](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.5.0...dokploy-mcp-v0.5.1) (2026-04-05)


### Bug Fixes

* **ci:** exclude CHANGELOG.md from oxfmt checks ([756920f](https://github.com/wyattjoh/dokploy-mcp/commit/756920f9724bdb01c94eaad6f80afd424b4bd2e8))

## [0.5.0](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.4.1...dokploy-mcp-v0.5.0) (2026-04-05)


### Features

* add bin entry for global dokploy-mcp command ([fabae80](https://github.com/wyattjoh/dokploy-mcp/commit/fabae801da55b5bd5513b2bd2e4727289f538579))
* add compose and operational tools, fix list applications ([2e91ca0](https://github.com/wyattjoh/dokploy-mcp/commit/2e91ca0d4f294ea6665ca57e3c9f1aadfc922685))
* add config and auth modules ([45ad55b](https://github.com/wyattjoh/dokploy-mcp/commit/45ad55b31a2a89972c5bc19161ddabbdbaa87696))
* add Dokploy API client ([60580c7](https://github.com/wyattjoh/dokploy-mcp/commit/60580c79dc7c9ee2b217b8039afeb2b33f79aeef))
* add entry point with stdio and HTTP transport ([390366d](https://github.com/wyattjoh/dokploy-mcp/commit/390366d85609eb318ad795b612b6a651535c4b87))
* add InstanceAwareServer wrapper for multi-instance support ([48a9161](https://github.com/wyattjoh/dokploy-mcp/commit/48a9161135f2bce48bb4b9ab80fe1a7f90e2127e))
* add marketplace update step to release workflow ([53f0b29](https://github.com/wyattjoh/dokploy-mcp/commit/53f0b2993ffa3cb7727a88c6db0c568d6a645cd7))
* add MCP server setup with tool registration ([28703c9](https://github.com/wyattjoh/dokploy-mcp/commit/28703c9fb941dcad8b576e0c8f5bef9a53154cde))
* add MCP server to plugin and auto-sync version on release ([4074c2d](https://github.com/wyattjoh/dokploy-mcp/commit/4074c2d9d5ab02421f15d17c395bdb071f367698))
* add MCP tool modules for all Dokploy operations ([58a9bf7](https://github.com/wyattjoh/dokploy-mcp/commit/58a9bf7bca0b7498e91436f41dcc4a8c4d05ac1b))
* add npm publishing with release-please and CI workflows ([ebabe0d](https://github.com/wyattjoh/dokploy-mcp/commit/ebabe0d33374ed131f502bb126e988c697e14622))
* **auth:** read DOKPLOY_MCP_TOKEN from env, export getMcpToken ([dcf9246](https://github.com/wyattjoh/dokploy-mcp/commit/dcf9246865f01c55e5d2ecdaab9659d3031fb38c))
* auto-append /api to base URLs, update .mcp.json with all instances ([ddf5974](https://github.com/wyattjoh/dokploy-mcp/commit/ddf597416bc8dc26b57b493e6c54f1f53f18503e))
* **config:** rewrite config with single and multi-instance discovery ([4076597](https://github.com/wyattjoh/dokploy-mcp/commit/4076597a5d97238b8626c9d085676875eac8c1ed))
* **index:** validate DOKPLOY_MCP_TOKEN before starting HTTP transport ([f638f44](https://github.com/wyattjoh/dokploy-mcp/commit/f638f448f8b17eade6faf2fabbc33d168e8b6e53))
* integrate InstanceAwareServer and add dokploy_list_instances tool ([f1ddff2](https://github.com/wyattjoh/dokploy-mcp/commit/f1ddff2fdb90b0e3b1dae15befb345f60327d915))


### Bug Fixes

* address review findings from Codex ([47529b6](https://github.com/wyattjoh/dokploy-mcp/commit/47529b6b187dbee79e1fc443d9ca83948f355a1e))
* **apps:** redact env and secrets from get_application response ([cf60309](https://github.com/wyattjoh/dokploy-mcp/commit/cf60309dcda8ac03599b635fef06ca6a44d66309))
* **auth:** replace Bun.CryptoHasher with node:crypto createHash ([c95b6b3](https://github.com/wyattjoh/dokploy-mcp/commit/c95b6b3d3af3b514a9880a2639d970377f753eb1))
* **build:** move bundled deps to devDependencies ([ec98bb1](https://github.com/wyattjoh/dokploy-mcp/commit/ec98bb1b16c6504cb4ab32d083e4781f10fe11d1))
* **client:** add 30s timeout to outbound Dokploy API requests ([91f32d1](https://github.com/wyattjoh/dokploy-mcp/commit/91f32d17075a09349465873e7ad763d2b6c23050))
* **client:** handle 204 No Content and empty API responses ([271482f](https://github.com/wyattjoh/dokploy-mcp/commit/271482f7cf1473ab8ecce3c43d57ba8ea4ca5a5e))
* **env:** preserve createEnvFile value during environment updates ([19cce8e](https://github.com/wyattjoh/dokploy-mcp/commit/19cce8e94eabd1cb488d73bce94deda3c1fa6fa1))
* resolve lint warnings and Zod v4 type errors ([c9c9046](https://github.com/wyattjoh/dokploy-mcp/commit/c9c90461d9bb391d8bf36c927f47a34853d31171))
* **server:** read version from package.json instead of hardcoding 1.0.0 ([fb4a3da](https://github.com/wyattjoh/dokploy-mcp/commit/fb4a3dabdf01d7bc68eb835db2c0c628ced75d5c))
* use release-please extra-files for plugin.json args version sync ([68f37c3](https://github.com/wyattjoh/dokploy-mcp/commit/68f37c34079ff1df1a66ade2b24c1e65089ce2b4))

## [0.4.1](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.4.0...dokploy-mcp-v0.4.1) (2026-04-05)

### Bug Fixes

- use release-please extra-files for plugin.json args version sync ([68f37c3](https://github.com/wyattjoh/dokploy-mcp/commit/68f37c34079ff1df1a66ade2b24c1e65089ce2b4))

## [0.4.0](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.3.0...dokploy-mcp-v0.4.0) (2026-04-04)

### Features

- add marketplace update step to release workflow ([53f0b29](https://github.com/wyattjoh/dokploy-mcp/commit/53f0b2993ffa3cb7727a88c6db0c568d6a645cd7))
- add MCP server to plugin and auto-sync version on release ([4074c2d](https://github.com/wyattjoh/dokploy-mcp/commit/4074c2d9d5ab02421f15d17c395bdb071f367698))

## [0.3.0](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.2.2...dokploy-mcp-v0.3.0) (2026-04-03)

### Features

- add bin entry for global dokploy-mcp command ([fabae80](https://github.com/wyattjoh/dokploy-mcp/commit/fabae801da55b5bd5513b2bd2e4727289f538579))
- add compose and operational tools, fix list applications ([2e91ca0](https://github.com/wyattjoh/dokploy-mcp/commit/2e91ca0d4f294ea6665ca57e3c9f1aadfc922685))
- add config and auth modules ([45ad55b](https://github.com/wyattjoh/dokploy-mcp/commit/45ad55b31a2a89972c5bc19161ddabbdbaa87696))
- add Dokploy API client ([60580c7](https://github.com/wyattjoh/dokploy-mcp/commit/60580c79dc7c9ee2b217b8039afeb2b33f79aeef))
- add entry point with stdio and HTTP transport ([390366d](https://github.com/wyattjoh/dokploy-mcp/commit/390366d85609eb318ad795b612b6a651535c4b87))
- add InstanceAwareServer wrapper for multi-instance support ([48a9161](https://github.com/wyattjoh/dokploy-mcp/commit/48a9161135f2bce48bb4b9ab80fe1a7f90e2127e))
- add MCP server setup with tool registration ([28703c9](https://github.com/wyattjoh/dokploy-mcp/commit/28703c9fb941dcad8b576e0c8f5bef9a53154cde))
- add MCP tool modules for all Dokploy operations ([58a9bf7](https://github.com/wyattjoh/dokploy-mcp/commit/58a9bf7bca0b7498e91436f41dcc4a8c4d05ac1b))
- add npm publishing with release-please and CI workflows ([ebabe0d](https://github.com/wyattjoh/dokploy-mcp/commit/ebabe0d33374ed131f502bb126e988c697e14622))
- **auth:** read DOKPLOY_MCP_TOKEN from env, export getMcpToken ([dcf9246](https://github.com/wyattjoh/dokploy-mcp/commit/dcf9246865f01c55e5d2ecdaab9659d3031fb38c))
- auto-append /api to base URLs, update .mcp.json with all instances ([ddf5974](https://github.com/wyattjoh/dokploy-mcp/commit/ddf597416bc8dc26b57b493e6c54f1f53f18503e))
- **config:** rewrite config with single and multi-instance discovery ([4076597](https://github.com/wyattjoh/dokploy-mcp/commit/4076597a5d97238b8626c9d085676875eac8c1ed))
- **index:** validate DOKPLOY_MCP_TOKEN before starting HTTP transport ([f638f44](https://github.com/wyattjoh/dokploy-mcp/commit/f638f448f8b17eade6faf2fabbc33d168e8b6e53))
- integrate InstanceAwareServer and add dokploy_list_instances tool ([f1ddff2](https://github.com/wyattjoh/dokploy-mcp/commit/f1ddff2fdb90b0e3b1dae15befb345f60327d915))

### Bug Fixes

- address review findings from Codex ([47529b6](https://github.com/wyattjoh/dokploy-mcp/commit/47529b6b187dbee79e1fc443d9ca83948f355a1e))
- **apps:** redact env and secrets from get_application response ([cf60309](https://github.com/wyattjoh/dokploy-mcp/commit/cf60309dcda8ac03599b635fef06ca6a44d66309))
- **auth:** replace Bun.CryptoHasher with node:crypto createHash ([c95b6b3](https://github.com/wyattjoh/dokploy-mcp/commit/c95b6b3d3af3b514a9880a2639d970377f753eb1))
- **build:** move bundled deps to devDependencies ([ec98bb1](https://github.com/wyattjoh/dokploy-mcp/commit/ec98bb1b16c6504cb4ab32d083e4781f10fe11d1))
- **client:** add 30s timeout to outbound Dokploy API requests ([91f32d1](https://github.com/wyattjoh/dokploy-mcp/commit/91f32d17075a09349465873e7ad763d2b6c23050))
- **client:** handle 204 No Content and empty API responses ([271482f](https://github.com/wyattjoh/dokploy-mcp/commit/271482f7cf1473ab8ecce3c43d57ba8ea4ca5a5e))
- **env:** preserve createEnvFile value during environment updates ([19cce8e](https://github.com/wyattjoh/dokploy-mcp/commit/19cce8e94eabd1cb488d73bce94deda3c1fa6fa1))
- resolve lint warnings and Zod v4 type errors ([c9c9046](https://github.com/wyattjoh/dokploy-mcp/commit/c9c90461d9bb391d8bf36c927f47a34853d31171))
- **server:** read version from package.json instead of hardcoding 1.0.0 ([fb4a3da](https://github.com/wyattjoh/dokploy-mcp/commit/fb4a3dabdf01d7bc68eb835db2c0c628ced75d5c))

## [0.2.2](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.2.1...dokploy-mcp-v0.2.2) (2026-04-03)

### Bug Fixes

- **build:** move bundled deps to devDependencies ([ec98bb1](https://github.com/wyattjoh/dokploy-mcp/commit/ec98bb1b16c6504cb4ab32d083e4781f10fe11d1))

## [0.2.1](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.2.0...dokploy-mcp-v0.2.1) (2026-04-03)

### Bug Fixes

- **apps:** redact env and secrets from get_application response ([cf60309](https://github.com/wyattjoh/dokploy-mcp/commit/cf60309dcda8ac03599b635fef06ca6a44d66309))
- **auth:** replace Bun.CryptoHasher with node:crypto createHash ([c95b6b3](https://github.com/wyattjoh/dokploy-mcp/commit/c95b6b3d3af3b514a9880a2639d970377f753eb1))
- **client:** add 30s timeout to outbound Dokploy API requests ([91f32d1](https://github.com/wyattjoh/dokploy-mcp/commit/91f32d17075a09349465873e7ad763d2b6c23050))
- **client:** handle 204 No Content and empty API responses ([271482f](https://github.com/wyattjoh/dokploy-mcp/commit/271482f7cf1473ab8ecce3c43d57ba8ea4ca5a5e))
- **env:** preserve createEnvFile value during environment updates ([19cce8e](https://github.com/wyattjoh/dokploy-mcp/commit/19cce8e94eabd1cb488d73bce94deda3c1fa6fa1))
- **server:** read version from package.json instead of hardcoding 1.0.0 ([fb4a3da](https://github.com/wyattjoh/dokploy-mcp/commit/fb4a3dabdf01d7bc68eb835db2c0c628ced75d5c))

## [0.2.0](https://github.com/wyattjoh/dokploy-mcp/compare/dokploy-mcp-v0.1.0...dokploy-mcp-v0.2.0) (2026-04-03)

### Features

- add bin entry for global dokploy-mcp command ([fabae80](https://github.com/wyattjoh/dokploy-mcp/commit/fabae801da55b5bd5513b2bd2e4727289f538579))
- add compose and operational tools, fix list applications ([2e91ca0](https://github.com/wyattjoh/dokploy-mcp/commit/2e91ca0d4f294ea6665ca57e3c9f1aadfc922685))
- add config and auth modules ([45ad55b](https://github.com/wyattjoh/dokploy-mcp/commit/45ad55b31a2a89972c5bc19161ddabbdbaa87696))
- add Dokploy API client ([60580c7](https://github.com/wyattjoh/dokploy-mcp/commit/60580c79dc7c9ee2b217b8039afeb2b33f79aeef))
- add entry point with stdio and HTTP transport ([390366d](https://github.com/wyattjoh/dokploy-mcp/commit/390366d85609eb318ad795b612b6a651535c4b87))
- add InstanceAwareServer wrapper for multi-instance support ([48a9161](https://github.com/wyattjoh/dokploy-mcp/commit/48a9161135f2bce48bb4b9ab80fe1a7f90e2127e))
- add MCP server setup with tool registration ([28703c9](https://github.com/wyattjoh/dokploy-mcp/commit/28703c9fb941dcad8b576e0c8f5bef9a53154cde))
- add MCP tool modules for all Dokploy operations ([58a9bf7](https://github.com/wyattjoh/dokploy-mcp/commit/58a9bf7bca0b7498e91436f41dcc4a8c4d05ac1b))
- add npm publishing with release-please and CI workflows ([ebabe0d](https://github.com/wyattjoh/dokploy-mcp/commit/ebabe0d33374ed131f502bb126e988c697e14622))
- **auth:** read DOKPLOY_MCP_TOKEN from env, export getMcpToken ([dcf9246](https://github.com/wyattjoh/dokploy-mcp/commit/dcf9246865f01c55e5d2ecdaab9659d3031fb38c))
- auto-append /api to base URLs, update .mcp.json with all instances ([ddf5974](https://github.com/wyattjoh/dokploy-mcp/commit/ddf597416bc8dc26b57b493e6c54f1f53f18503e))
- **config:** rewrite config with single and multi-instance discovery ([4076597](https://github.com/wyattjoh/dokploy-mcp/commit/4076597a5d97238b8626c9d085676875eac8c1ed))
- **index:** validate DOKPLOY_MCP_TOKEN before starting HTTP transport ([f638f44](https://github.com/wyattjoh/dokploy-mcp/commit/f638f448f8b17eade6faf2fabbc33d168e8b6e53))
- integrate InstanceAwareServer and add dokploy_list_instances tool ([f1ddff2](https://github.com/wyattjoh/dokploy-mcp/commit/f1ddff2fdb90b0e3b1dae15befb345f60327d915))

### Bug Fixes

- address review findings from Codex ([47529b6](https://github.com/wyattjoh/dokploy-mcp/commit/47529b6b187dbee79e1fc443d9ca83948f355a1e))
- resolve lint warnings and Zod v4 type errors ([c9c9046](https://github.com/wyattjoh/dokploy-mcp/commit/c9c90461d9bb391d8bf36c927f47a34853d31171))
