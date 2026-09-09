# Labs

You cloned a **working** Meeting Pipeline. That is on purpose. The code is here so we can open it, run it, and talk about why it looks like this. We are not starting from an empty Forge app today. Later we may ship a hollow starter. Not this checkout.

**Stop.** If you have not finished [Setup](../SETUP.md), do that first. Company laptops, VPNs, and a missing developer site will eat this room. Lab 0 assumes `forge --version` works, you are logged in, and you can open a developer test site.

Eight short docs after that. You follow the steps. The stage adds the nuance, the war stories, and the part where I talk with my hands. Labs 0 to 6 peel the Forge app you just cloned. **Lab 7 is Studio.** That is the half you take back to work in a browser.

Each lab is the same shape: the belief that is about to break, **why** we took this path, the files to open, how you know it worked.

Do not paste modules on top of this tree. They are already here. Do not "also add a dark mode."

| Lab | File | You learn |
|---|---|---|
| 0 | [00-front-door.md](00-front-door.md) | Deploy the clone. The page talks to a resolver, not to Jira |
| 1 | [01-one-ticket.md](01-one-ticket.md) | Who creates the ticket: `asApp` on the worker, `asUser` in chat |
| 2 | [02-accept-fast.md](02-accept-fast.md) | KVS + queue. The button does not wait for Jira |
| 3 | [03-parse-and-fan-out.md](03-parse-and-fan-out.md) | Forge LLM splits the notes. Code creates the tickets |
| 4 | [04-plan-of-record.md](04-plan-of-record.md) | Optional Confluence page, as the app |
| 5 | [05-handoff.md](05-handoff.md) | Approve or assign. Comment only. Do not pick the worker |
| 6 | [06-one-worker.md](06-one-worker.md) | This Rovo agent works a ticket that already exists |
| 7 | [07-studio.md](07-studio.md) | A Studio specialist, assigned like a human |

After Setup, connect the **[Atlassian MCP](../MCP.md)** in Cursor. Labs that write to Jira or Confluence have a **Check it with MCP** prompt. Do not create workshop tickets through MCP. The pipeline does that.

If you rewrite the CSS I will know, because I always know.
