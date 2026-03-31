---
title: "Analyze Your Emails with AI: Claude Code + Gmail Practical Guide"
date: "2025-01-18"
author: "Xavier GUERET"
description: "Complete tutorial to create your intelligent email analysis assistant with Claude Code. 30-minute setup, read-only access, risk-free."
tags:
  - "tutorial"
  - "claude-code"
  - "gmail-api"
  - "ai"
  - "automation"
  - "productivity"
categories:
  - "Tutorials"
  - "Artificial Intelligence"
image: "/images/posts/email-with-ia-clauded-code-gmail.png"
---
## 🎯 What does this AI email assistant do?

Imagine being able to ask your computer:

> *"Find all unread emails from this week about invoices"*
> *"Summarize yesterday's important emails for me"*
> *"List suspicious emails received this month"*

That's exactly what you'll build in this tutorial! We're going to create a personal assistant that can analyze your Gmail emails using Claude Code, all in **read-only mode** for maximum security.

### Why create an email analysis assistant?

- ✅ **Simple**: 30-minute setup
- ✅ **Secure**: Read-only access only
- ✅ **Free**: Uses free Gmail API
- ✅ **Powerful**: Artificial intelligence to analyze your emails
- ✅ **Revocable**: You can cut access with 1 click

### What you need

- A Gmail account
- A Linux computer (Ubuntu, Debian, Fedora, etc.)
- 30 minutes of your time
- No programming skills required!

## 🚀 How is this solution architected?

```
    Your Gmail Emails
          ↓
   [Gmail API - Read Only]
          ↓
     [MCP Server]
          ↓
     [Claude Code]
          ↓
  Intelligent Analysis!
```

**The idea**: Claude can "read" your emails (but not modify them) and help you analyze them with artificial intelligence.

**Important**: We start with **zero risk** - Claude can ONLY read. No deletion, no sending, no modification.

## 📋 Part 1: Setting Up Google Cloud (15 minutes)

### Step 1.1: Create Your Project

This is like creating a "folder" for your project in Google Cloud.

1. **Go to**: [console.cloud.google.com](https://console.cloud.google.com/)
2. **Log in** with your Gmail account
3. **Click** on the project dropdown menu (at the top)
4. **Click** on "New project"

**Fill in**:

- Name: `My Email Assistant` (or whatever you want)
- Click "Create"

⏱️ Wait 20 seconds... and there you go, your project is created!

### Step 1.2: Enable the Gmail API

Now we "turn on" the Gmail API to be able to read your emails.

1. **In the menu** ☰ → Click "APIs & Services" → "Library"
2. **Search for**: `Gmail API`
3. **Click** on it
4. **Click** on the big blue "ENABLE" button

✅ Done! You'll see "API enabled"

### Step 1.3: Configure Permissions (Important!)

Here we tell Google: "I only want to READ my emails, nothing else".

**Navigation**: Menu ☰ → APIs & Services → OAuth consent screen

**Choose**:

- Type: **External** ✅
- Click "Create"

**Page 1 - Basic info**:

Simply fill in:

- Application name: `My Email Assistant`
- Support email: your.email@gmail.com
- Developer email: your.email@gmail.com

The rest? Leave it blank!

Click "Save and continue"

**Page 2 - Permissions (THE important part!)**:

1. Click "Add or remove scopes"
2. A window opens
3. **Search for**: `gmail.readonly`
4. **Check ONLY** this box:
   ```
   ✅ https://www.googleapis.com/auth/gmail.readonly
   ```

🔴 **SUPER IMPORTANT**: Only check that one! This is your guarantee that Claude can only READ.

5. Click "Update"
6. Click "Save and continue"

**Page 3 - Add yourself as a tester**:

1. Click "+ Add users"
2. Enter your Gmail address
3. Click "Add"
4. Click "Save and continue"

**Page 4 - Summary**:

Check that everything is correct, then "Back to dashboard"

### Step 1.4: Download Your "Key"

Now we get a file that allows your computer to connect.

1. **Menu** ☰ → APIs & Services → **Credentials**
2. Click the big "+ CREATE CREDENTIALS" button
3. Choose "OAuth 2.0 Client ID"

**Configure**:

- Application type: **Desktop app**
- Name: `Local Email Assistant`
- Click "Create"

**A window appears**:

- Click "DOWNLOAD JSON"
- The file downloads (named something like `client_secret_xxx.json`)
- Click "OK"

🎉 **Congratulations!** Google Cloud part finished. The hardest part is done!

---

## 💻 Part 2: Installation on Your Computer (10 minutes)

### Step 2.1: Check Prerequisites

Open a terminal and type:

```bash
# Check Node.js (should display v18 or higher)
node --version

# Check pnpm
pnpm --version

# Check Claude Code
claude --version
```

**Not installed?** Don't panic:

```bash
# Install Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Install Claude Code
npm install -g @anthropic-ai/claude-code
```

### Step 2.2: Create the Folders

We create a "home" for our project:

```bash
# Create folders
mkdir -p ~/my-email-assistant
mkdir -p ~/.config/gmail-assistant/creds

# Secure (no one else can see)
chmod 700 ~/.config/gmail-assistant
```

### Step 2.3: Move the Downloaded File

Remember the `client_secret_xxx.json` file? Let's put it away:

```bash
# Move it (adjust the path if needed)
mv ~/Downloads/client_secret_*.json \
   ~/.config/gmail-assistant/creds/credentials.json

# Protect it (read-only for you)
chmod 600 ~/.config/gmail-assistant/creds/credentials.json

# Verify
ls -la ~/.config/gmail-assistant/creds/
# You should see: -rw------- credentials.json
```

### Step 2.4: Create the Server Code

We're going to create a small program that bridges Claude and Gmail.

```bash
cd ~/my-email-assistant

# Create the configuration file
cat > package.json << 'EOF'
{
  "name": "email-assistant",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "googleapis": "^140.0.0",
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
EOF

# Install dependencies
pnpm install
```

**Create the server** (copy-paste this entire block):

```bash
cat > server.js << 'EOFSRV'
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { google } from 'googleapis';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// READ ONLY - This is our security guarantee!
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = join(homedir(), '.config/gmail-assistant/creds/token.json');
const CREDENTIALS_PATH = join(homedir(), '.config/gmail-assistant/creds/credentials.json');

class EmailAssistant {
  constructor() {
    this.server = new Server(
      { name: 'email-assistant', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupTools();
    this.gmail = null;
  }

  async authorize() {
    const credentials = JSON.parse(await readFile(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try {
      const token = await readFile(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
    } catch (err) {
      return await this.getNewToken(oAuth2Client);
    }
    return oAuth2Client;
  }

  async getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.error('\n🔐 First connection - Authorization required\n');
    console.error('1. Open this URL in your browser:');
    console.error(`   ${authUrl}\n`);
    console.error('2. Log in and authorize');
    console.error('3. Copy the code you receive\n');
    console.error('Enter the code here: ');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    return new Promise((resolve, reject) => {
      rl.question('', async (code) => {
        rl.close();
        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          await writeFile(TOKEN_PATH, JSON.stringify(tokens));
          console.error('\n✅ Perfect! You are connected.\n');
          resolve(oAuth2Client);
        } catch (err) {
          console.error('\n❌ Oops, error:', err.message);
          reject(err);
        }
      });
    });
  }

  setupTools() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'list_emails',
          description: 'List your Gmail emails',
          inputSchema: {
            type: 'object',
            properties: {
              count: { type: 'number', description: 'Number of emails (max 100)', default: 10 },
              query: { type: 'string', description: 'Gmail search query (e.g., "is:unread")' },
            },
          },
        },
        {
          name: 'search_emails',
          description: 'Search for specific emails',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Your search query' },
              count: { type: 'number', default: 10 },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      if (!this.gmail) {
        const auth = await this.authorize();
        this.gmail = google.gmail({ version: 'v1', auth });
      }

      const args = request.params.arguments;
      const maxResults = Math.min(args.count || args.maxResults || 10, 100);
      const query = args.query || '';

      const res = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });

      const messages = res.data.messages || [];
      const details = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = detail.data.payload.headers;
          return {
            id: msg.id,
            from: headers.find((h) => h.name === 'From')?.value,
            subject: headers.find((h) => h.name === 'Subject')?.value,
            date: headers.find((h) => h.name === 'Date')?.value,
          };
        })
      );

      return {
        content: [{ type: 'text', text: JSON.stringify(details, null, 2) }],
      };
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Email Assistant ready (read-only)\n');
  }
}

const assistant = new EmailAssistant();
assistant.run().catch(console.error);
EOFSRV

# Make executable
chmod +x server.js
```

---

## 🔗 Part 3: Connect to Claude (5 minutes)

### Step 3.1: Just One Command!

This is the simplest part. Just one command line:

```bash
claude mcp add gmail /usr/bin/node ~/my-email-assistant/server.js
```

**Check that it worked**:

```bash
claude mcp list

# You should see:
# gmail: /usr/bin/node /home/[you]/my-email-assistant/server.js
```

### Step 3.2: First Connection

**Launch Claude**:

```bash
claude
```

**What will happen**:

1. A message displays with a long URL
2. You copy this URL
3. You open it in your browser
4. You log in to Gmail
5. Google tells you: "Warning, unverified application"
   - Click "Advanced settings"
   - Click "Go to [your app] (unsafe)"
6. Google shows: "View your email" ✅ (this is READ ONLY)
7. Click "Allow"
8. Google gives you a code
9. You copy it
10. You paste it in the Claude terminal
11. Press Enter

**Success message**:

```
✅ Perfect! You are connected.
🚀 Email Assistant ready (read-only)
```

---

## 🎮 Part 4: Using Your Assistant (The Fun Part!)

### First Test: Simple List

In Claude, simply type:

```
List my last 5 emails
```

**Result**: Claude shows you your last 5 emails with sender and subject!

### Practical Examples

#### 📧 Find an Email

```
Find Marie's email from last week
```

#### 📊 Daily Summary

```
Summarize today's important emails for me
```

#### 🔍 Advanced Search

```
Search all unread emails containing "invoice"
```

#### 📅 Organization

```
List this week's emails, grouped by sender
```

#### 🚨 Simple Detection

```
Are there any suspicious emails received today?
```

### More Advanced Prompts

Once comfortable, try:

```
Analyze my last 20 emails and tell me:
1. Which ones require an urgent response
2. Which ones are newsletters
3. Which ones contain attachments

Make a small summary for each category.
```

Or:

```
Among my emails from this week:
- Find those that mention meetings
- Extract the dates and times mentioned
- Make me a schedule

Format: clear and simple list
```

---

## 🛡️ Security: What You Need to Know

### ✅ What Claude CAN Do

- Read your emails
- Search in your inbox
- Analyze content
- Make summaries for you

### ❌ What Claude CANNOT Do

- Send emails ❌
- Delete emails ❌
- Modify emails ❌
- Forward emails ❌
- Create drafts ❌

**Why?** Because we configured `gmail.readonly` - read-only!

### 🔓 Revoke Access (If Needed)

Want to cut access? **2 clicks**:

1. Go to: [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Find "My Email Assistant"
3. Click "Remove access"

⚡ **Immediate effect** - Claude can no longer read your emails.

### 📊 See What's Happening

Google shows you everything:

- **When** Claude accesses your emails
- **How many** times
- **What type** of access (always "read")

Check it out at: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Dashboard

---

## 🎓 Practical Use Cases

### 1. Daily Productivity

**In the morning**:

```
Summarize important emails received overnight
```

**End of day**:

```
Which emails are still waiting for a response?
```

### 2. Organization

```
Find all emails from my boss this month and
summarize the action items requested
```

### 3. Historical Search

```
In 2024, how many emails did I receive from [company]?
What was the main topic?
```

### 4. Cleanup

```
List all newsletters I receive regularly.
Show me the ones I never open.
```

### 5. Simple Analysis

```
Among my last 50 emails, which ones look weird or suspicious?
Explain why for each one.
```

---

## 🔧 Troubleshooting

### Problem: Claude doesn't see Gmail

**Solution**:

```bash
# Check the config
claude mcp list

# If empty, redo:
claude mcp add gmail /usr/bin/node ~/my-email-assistant/server.js
```

### Problem: "Token expired"

**Solution**:

```bash
# Delete the token
rm ~/.config/gmail-assistant/creds/token.json

# Restart Claude
claude
# The authorization process starts again
```

### Problem: "Permission denied"

**Solution**:

```bash
# Check permissions
chmod 600 ~/.config/gmail-assistant/creds/credentials.json
chmod +x ~/my-email-assistant/server.js
```

---

## 💡 Tips and Tricks

### Make Claude More Effective

**Be specific**:

- ❌ "Find my emails"
- ✅ "Find this week's emails with 'project' in the subject"

**Ask for formats**:

```
List my emails in table format with:
- Date
- Sender
- Short subject
```

**Iterate**:

```
First request: "List my emails from today"
Refinement: "Now, show only those from client X"
```

### Create Routines

**Morning routine**:

```
Give me my email briefing for the day:
1. Total number of new emails
2. Top 3 most important ones
3. Those that require a quick response
4. Newsletters to read later

Format: concise and actionable
```

**Friday routine**:

```
Week summary:
- What topics came up often?
- Who emailed me the most?
- Are there any unanswered emails?
```

---

## The role of vibecoding in this project

This tutorial is itself a concrete example of vibecoding — the approach of building software by conversing with an AI in natural language. The entire MCP server, the OAuth configuration, the prompt examples, and even the structure of this article were designed in collaboration with Claude Code. Rather than writing every line of code by hand, I described what I wanted, iterated on the feedback, and refined the result through conversation. Vibecoding doesn't replace technical understanding — you still need to know what you're building and why — but it dramatically speeds up implementation when you have a clear vision of the expected outcome.

## ✅ Final Checklist

You succeeded if:

- [ ] Project created on Google Cloud
- [ ] Gmail API enabled
- [ ] OAuth configured (read-only only)
- [ ] Credentials downloaded and secured
- [ ] MCP server installed
- [ ] Claude connected (`claude mcp list` works)
- [ ] First test successful (email list)
- [ ] You know how to revoke access if needed

---

## 🎉 Congratulations!

You've created your own email analysis assistant with AI!

**You now know how to**:

- ✅ Configure the Gmail API in read-only mode
- ✅ Connect Claude Code to your emails
- ✅ Analyze your emails with artificial intelligence
- ✅ Control access and security

**Next steps**:

1. Experiment with different prompts
2. Create your own routines
3. Share your discoveries

**Need help?**

- Claude Documentation: [docs.claude.com](https://docs.claude.com)
- Gmail API: [developers.google.com/gmail](https://developers.google.com/gmail)
- Community: Reddit r/ClaudeAI

---

**Author**: Xavier GUERET & claude
**Date**: January 18, 2025
**License**: MIT

**Tags**: #tutorial #claude-code #gmail #ai #automation #beginner

---

*This tutorial shows you how to access your own Gmail data securely. Always respect others' privacy and the terms of service of the services.*
