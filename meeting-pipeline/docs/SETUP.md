# Setup: can you even run Forge from this laptop?

Welcome. We need a word with your company laptop before we deploy anything. This is the most important page in the workshop, and it is not about meetings. This page exists because the hardest part of making Forge apps is not the syntax, it is your company settings and the VPN.

A lot of you are on a **company laptop**. Company laptops have opinions. VPNs intercept HTTPS. Proxies want a username. `npm` is blocked. Node was installed with the wrong permissions in 2019 and nobody has forgiven it. If we skip this and jump to Lab 0, half the room spends two hours fighting IT while the other half opens files they cannot run.

**Do this before we deploy the clone.** You already have the working app on disk. Setup is whether this laptop can talk to Forge. If you can do it the night before, do it. If you are stuck, we fix it in the first block of the room. We do not start [Lab 0](labs/00-front-door.md) until the gate at the bottom is green.

You are setting up a **developer environment**, not installing this app on your work Jira. Work Jira is where app installs go to get a ticket opened against you.

## What you need

- **Node.js** 20 or newer, with `npm`
- The **Forge CLI**, installed globally
- An **Atlassian account** you can log into
- An **Atlassian API token**
- A **cloud developer test site** (Jira, and Confluence later)

You do not need your company Jira. You do not need a production site. You do not need permission from a platform team to install a workshop app.

## 1. Node.js

Check what you already have:

```bash
node --version
npm --version
```

**If your version of Node is not old enough to rent a car, it's time for an upgrade!** You want **Node 20+**. If those commands fail, or you are on Node 16 and a prayer, install Node first.

**macOS:** install Node with [nvm](https://github.com/nvm-sh/nvm). The `nodejs.org` installer on a Mac is how people end up with permission errors for the rest of the afternoon.

**Windows:** install the current LTS from [nodejs.org](https://nodejs.org). If Windows blocks the installer, that is an IT policy problem, and we solve it now, not in Lab 3.

**Linux:** use your package manager or nvm. Same rule: `node --version` has to print something we can live with.

## 2. Install the Forge CLI

```bash
npm install -g @forge/cli
forge --version
```

You should see a version number. If you do not, the install failed. Read the terminal. Do not run this with `sudo` or as root. That is how Forge works for root and then refuses to work for you.

`forge --help` prints the full command list if you want to stare at it.

## 3. Create an API token and log in

The CLI does not want your password. It wants a token.

1. Go to [id.atlassian.com/manage/api-tokens](https://id.atlassian.com/manage/api-tokens).
2. Click **Create API token**.
3. Name it something you will recognize later, like `forge-workshop`.
4. Set an expiry within a year.
5. Click **Create**, then **Copy**.
6. Paste it into a temporary text file so you can get it back if the clipboard eats it. You will delete that file when login works.

Then:

```bash
forge login
```

Use the email on your Atlassian account, then paste the token.

You should see a confirmation that you are logged in. If you see `Unable to get local issuer certificate`, that is almost always the **VPN**. Disconnect, try again, and do not spend twenty minutes rotating tokens that were never the problem.

## 4. Get a developer test site

This app installs on a cloud site. Use a **developer site**, not the Jira your company actually runs.

**Recommended:** let the CLI provision one.

```bash
forge site provision
```

When it finishes, copy the site URL from the table and open it in a browser. Log in. You should land on a real Atlassian site with Jira ready.

**Backup:** [go.atlassian.com/cloud-dev](http://go.atlassian.com/cloud-dev) and create a site with the same email you used for `forge login`. Finish the setup wizard.

You can install an app on more than one site. Data does not follow you from site to site. For this workshop, pick **one** developer site and stay there.

## 5. The gate

Do not go to Lab 0 until every line here is true.


| Check         | Command or action               | You should see                                                   |
| ------------- | ------------------------------- | ---------------------------------------------------------------- |
| Node          | `node --version`                | `v20` or newer                                                   |
| npm           | `npm --version`                 | A version number                                                 |
| Forge CLI     | `forge --version`               | A version number                                                 |
| Logged in     | `forge login` already succeeded | Your name or email confirmed                                     |
| Site          | Open the developer site URL     | Jira loads in the browser                                        |
| Not work Jira | Look at the URL                 | Something you provisioned today, not `yourcompany.atlassian.net` |


If the gate is green, go to [Lab 0](labs/00-front-door.md). That is where we deploy **this** app onto the site you just proved you can reach.

Then install the **[Atlassian MCP](MCP.md)** in Cursor and connect it to this same developer site. The labs will ask you to check tickets from the editor so you are not bouncing into the board after every deploy. If you cannot connect MCP, you can still finish the day in the browser. You will just be slower.

## When it breaks

These are the failures that eat workshops. Read the one you have.

### VPN: `Unable to get local issuer certificate`

Your VPN is intercepting HTTPS and Node does not trust the corporate certificate. **Disconnect the VPN** and run `forge login` or `npm install` again. If your company forbids that, we need a hotspot or a personal machine, because the rest of the day will look like this error with different wording.

### Proxy

Some networks require npm to go through a proxy:

```bash
npm config set proxy http://user:password@proxy-url:port
npm config set https-proxy http://user:password@proxy-url:port
```

Use the values your IT docs actually specify. If you do not have those values, you cannot guess them, and we should stop pretending npm will suddenly work.

### macOS: npm permission errors

You probably installed Node with the official installer. Try `npm config set unsafe-perm true`. If that is still a mess, install Node with **nvm** and use that Node for the rest of the day.

### `spawn ts-node ENOENT` while installing the CLI

Node may be in development mode. On macOS or Linux run `unset NODE_ENV`. On Windows run `set NODE_ENV=`. Then install the CLI again.

### `Error: Command failed due to validation error`

You ran a Forge command outside the project directory. `cd` into the app folder first.

### Ngrok errors on `forge tunnel`

You are on an old CLI. Tunnel does not use ngrok anymore.

```bash
npm install -g @forge/cli@latest
forge --version
```

You want 10.1.0 or newer. We are not tunneling in Lab 0 anyway, but an ancient CLI will still make you sad later.

### Windows will not install Node

That is an OS / IT block. Follow [Microsoft's guide for installers that will not run](https://support.microsoft.com/en-us/topic/fix-problems-that-block-programs-from-being-installed-or-removed-cca7d1b6-65a9-3d98-426b-e9f927e1eb4d), or use a machine that will let you install developer tools.

### Do not use sudo

`sudo npm install -g @forge/cli` feels like it worked. Then every later command fails with permissions that only root understands. Install the CLI as yourself.