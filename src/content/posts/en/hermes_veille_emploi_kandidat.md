---
title: "Automating a job watch with a self-hosted AI agent and MCP"
date: "2026-09-14"
author: "Xavier GUERET"
description: "Part two of the 'Hermes Agent' series: plugging an AI agent into an existing tool through its MCP server, writing the brief for a scheduled task, and what to plan for so it doesn't write junk into your database."
tags:
  - "ai"
  - "MCP"
  - "automation"
  - "local-first"
  - "HomeLab"
  - "Telegram"
categories:
  - "Hermes Agent"
  - "Artificial Intelligence"
  - "Personal Projects"
  - "DevOps"
image: "/images/posts/hermes_veille_emploi_kandidat.png"
draft: false
toc: true
series: "Hermes Agent"
seriesOrder: 2
---
*Part 2 of the **"Hermes Agent"** series.*

I wanted my job listings watch to run itself: every Monday at 8am, filtered on my own criteria, with whatever it keeps recorded straight into Kandidat, my job application tracker.

Both pieces were already running on my homelab, each on its own. What was left was connecting them, then writing the rules.

## What was already running on both sides

[Kandidat](/en/blog/kandidat/) is my job application tracker: a REST API, a database, a dashboard, and the business rules that go with them (valid statuses, company categories, the link between an application and its target company). Back in March I had added an MCP server exposing 23 typed tools, so I could drive it from Claude Code.

Hermes Agent, deployed in August on its own VM, knows how to consume MCP and schedule tasks.

If you are considering the same kind of setup, take inventory before writing any code. A tool that already exposes a clean API and explicit business rules is halfway integrated: what remains is a declaration, not a development project. I wrote neither a scraper nor an insertion script.

## Raw API or MCP

The agent has a terminal. Nothing stopped me from handing it the API URL and letting it build its own requests.

|  | Raw API | MCP |
|---|---|---|
| Requests | improvised from prose | typed tools, constrained parameters |
| Disabling an operation | impossible | `hermes tools disable kandidat:delete_candidature` |
| Business rules | restated in the prompt | stay inside Kandidat |
| Exposed surface | the whole API | the tools you enable |

The deciding row is the second one. With MCP, removing `delete_candidature` removes the capability. With the raw API, all you have is an instruction in a prompt, and no leverage at all once the agent is running.

## Plugging the server into the agent

One command, with the server name, its URL and the tools to enable:

```bash
hermes mcp add kandidat --url https://kandidat-mcp.internal/mcp --connect-timeout 20
```

Its output says exactly what was written, and what was refused:

```
Note: 7 managed setting(s) were not saved (managed by your administrator):
  dashboard.public_url, model.default, model.provider,
  providers.deepseek.base_url, providers.deepseek.default_model,
  providers.deepseek.key_env, providers.deepseek.name

✓ Saved 'kandidat' to config.yaml (23/23 tools enabled)
```

Those seven refused keys are the ones Ansible pins in my setup: inference provider, secrets, dashboard URL. The MCP declaration is not among them, it belongs to the agent. So it survives a replayed playbook.

Check that the link answers before writing a single line of brief:

```bash
hermes mcp list
hermes mcp test kandidat
```

One thing to know: this declaration lives in the agent's data volume, outside the infrastructure repository. Plan on putting it back if you rebuild the VM.

## Writing the brief

This is where the work concentrates, not in the plumbing.

A scheduled task runs with nobody in front of it. The agent cannot ask for clarification, and nobody reviews its decisions while it makes them. If you write a brief of this kind, assume that any decision missing from the text will be made at random.

Mine comes down to five families of rules:

- **A reference profile that has authority.** The agent reads two files from its workspace, a condensed CV and a profile more clear-eyed than the CV. Where they disagree, the profile wins.
- **Job families with asymmetric boundaries.** Many years on one technology make a senior listing acceptable; few years on another means discarding the listings that ask for more.
- **A location rule** that accepts on-site work in one area and requires fully remote everywhere else. "Even partial or occasional" is spelled out, because that is the phrasing listings use to stay vague.
- **A cap of three listings**, with the instruction to keep none rather than keep a bad one. Without that cap, the agent optimises for having found something.
- **Deduplication before writing.** The agent looks for the company among those already recorded, ignoring case, accents and legal suffixes, then looks for the role among existing applications. If the company exists, it reuses its identifier.

If you plug an agent into a database you keep up to date, write that last rule first. Accents and legal suffixes are spelled out because without them, the same company gets recorded twice under two spellings. An automation that writes to a database first has to know how not to write.

## The trigger and the report

The task fires every Monday at 8am. The report lands on Telegram:

> Job watch, 8 September: 2 listing(s) saved in kandidat — ready to review.
> • Company X (esn) — DevOps Engineer — full remote — [A] — high priority
> • Company Y (entreprises) — Java/Spring Developer — on site — [C] — medium priority

The listings are already in Kandidat by the time I read the message: company created if it did not exist, link to the posting, matched job family, and three to five lines of justification including reservations. The message is a notification, not the result.

Plan a format for weeks with no results. Mine prints "no matching listings this week", plus a line on what blocked things if any near-misses came up. Without that message, an empty week looks exactly like a broken task.

Plan for failure too. My brief requires naming the step and the listing involved if a tool does not answer, and forbids announcing a save that was not confirmed.

## Where things stand

The watch has been running for three weeks. Every Monday morning I read the report on Telegram, open Kandidat, and decide on the listings it kept. It has become the only moment of the week when I deal with the watch, and it happens even on the weeks I would not have thought about it.

It is the first task the agent runs without me launching it, and its result lands in a tool I was already using. Kandidat's data stays current without data entry, so its statistics cover the real stream.

What remains open:

- The agent takes no outward action. It reads, filters and records. That is deliberate and I don't plan to extend it.
- It still gets things wrong. It sometimes keeps a listing whose "remote" label covered two days on site. I archive the row, it takes two minutes.
- Kandidat's API has no authentication, and the MCP server adds none: it is a translator, not an access gateway. Acceptable on a closed home network, nowhere else. MCP bounds what the agent can do, not what the network can do.
- The MCP declaration is lost when the VM is rebuilt.

The brief and the Ansible roles were written with Claude Code, like the rest of the homelab. The filtering rules come from me.

Next episode: the wiring between the two machines, and the three silent failures met along the way.
