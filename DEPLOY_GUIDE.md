# Lumen Deployment Script Guide

Automated deployment of Lumen to Vercel using Claude Code CLI.

## Prerequisites

1. **Extract the zip** to a local folder:
   ```bash
   unzip lumen-bible-study.zip
   cd lumen-bible-study
   ```

2. **Get required tokens** (takes ~5 minutes):
   - **GitHub**: [Create Personal Access Token](https://github.com/settings/tokens)
     - Needs: `repo` (full control), `workflow` (optional)
   - **Vercel**: [Create API Token](https://vercel.com/account/tokens)
   - **GitHub Username**: Your GitHub username (e.g., `bryanlim`)

3. **Have Node.js installed** (`node --version` should show v18+)

---

## Installation

### Option A: Using Claude Code CLI (Recommended)

```bash
# Install Claude Code CLI globally (one-time)
npm install -g @anthropic-ai/claude-cli

# Run the deployment script
claude-code deploy-lumen.ts
```

### Option B: Direct Node.js

```bash
# Run the script directly
node deploy-lumen.ts

# Or with npx
npx ts-node deploy-lumen.ts
```

---

## Running the Script

When you run the script, it will interactively ask for:

```
🕯️  Lumen Deployment Automation
📋 Configuration

Project directory (default: current): 
GitHub username: bryanlim
Repository name (default: lumen): lumen
GitHub personal access token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
Vercel API token: vercel_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Then it automates:**

| Step | What Happens | Time |
|------|--------------|------|
| **1. Git Push** | Initializes git repo, commits code, pushes to GitHub | 1 min |
| **2. Vercel Deploy** | Creates Vercel project, links GitHub, starts build | 2-3 min |
| **3. Supabase** | *(Optional)* Sets up Postgres database, seeds Bible data | 10-15 min |
| **4. Anthropic** | *(Optional)* Adds Claude API for AI assistant | <1 min |
| **5. OpenAI** | *(Optional)* Adds embeddings for semantic search | 1-2 min |

---

## What You'll Get After Running

✅ **GitHub repo** ready for updates
✅ **Vercel deployment** live at `https://lumen-xxx.vercel.app`
✅ App fully functional with search, reader, graph, timeline
✅ *(Optional)* Database with full Bible text
✅ *(Optional)* AI assistant powered by Claude
✅ *(Optional)* Semantic search with OpenAI

---

## Testing Your Deployment

Once Vercel finishes building (~2-3 min), visit your app and test:

```
✓ Homepage:     https://lumen-xxx.vercel.app
✓ Search:       https://lumen-xxx.vercel.app/search?q=anxiety
✓ Reader:       https://lumen-xxx.vercel.app/read/psalms/23
✓ Graph:        https://lumen-xxx.vercel.app/graph
✓ Timeline:     https://lumen-xxx.vercel.app/timeline
✓ Assistant:    https://lumen-xxx.vercel.app/assistant
```

---

## Next Steps (Optional, After Deployment)

### Add Custom Domain
```
Vercel Dashboard → Settings → Domains
Point your DNS to: cname.vercel-dns.com
```

### Add Google OAuth Sign-In
1. [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth credentials (Web application)
3. Add redirect URI: `https://your-domain/api/auth/callback/google`
4. In Vercel env vars:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_URL=https://your-domain
   NEXTAUTH_SECRET=<from script output>
   ```

### Add Licensed Translations (NIV, NLT, NKJV, MSG)
See **Part 6** of DEPLOYMENT.md

---

## Troubleshooting

### "GitHub push failed"
- Check your PAT is valid and has `repo` scope
- Verify username matches GitHub profile
- Make sure the repo doesn't already exist

### "Vercel deployment initiated but manual completion needed"
This is normal! The script starts the process; you can:
1. Watch it on [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Check build logs if it fails
3. Re-run deployment from Vercel dashboard once GitHub is linked

### "Database seed times out"
The seed is idempotent — every row is an upsert. Safe to re-run:
```bash
npm run db:seed
```

### "Environment variables not set in Vercel"
Manually add them in Vercel dashboard:
```
Project Settings → Environment Variables (Production)
```

### "Build fails on 'prisma generate'"
Check that `DATABASE_URL` in Vercel is correct format. The schema doesn't need a live DB — only valid syntax.

---

## Script Structure (if you want to modify)

```typescript
// 1. Initialize git and push to GitHub
step1GitHubPush(projectDir, githubToken, githubUsername, repoName)

// 2. Create Vercel project and link GitHub
step2VercelDeploy(vercelToken, githubUsername, repoName)

// 3. Set up Supabase database (optional)
step3SupabaseSetup(projectDir)

// 4. Add Anthropic API key for AI assistant (optional)
step4AnthropicAPI(vercelToken)

// 5. Add OpenAI API for semantic search (optional)
step5OpenAIEmbeddings(projectDir, vercelToken)
```

Each step is independent — you can skip any optional step.

---

## Getting Help

- **Deployment issues**: See troubleshooting section in `DEPLOYMENT.md`
- **Script errors**: Check the error message — it usually points to which step failed
- **Vercel build logs**: Available in Vercel dashboard → Deployments
- **Prisma issues**: Check `.env` and connection strings are valid

---

## Automation Checklist

- [ ] GitHub PAT generated and copied
- [ ] Vercel API token generated and copied
- [ ] GitHub username ready
- [ ] Project folder has `package.json`
- [ ] Run: `claude-code deploy-lumen.ts`
- [ ] Follow the prompts
- [ ] Watch Vercel dashboard for build completion
- [ ] Visit your live app URL
- [ ] Test search/reader/graph/timeline
- [ ] *(Optional)* Add database, API keys, custom domain later

---

**Expected total time: ~5-7 minutes to live deployment (or ~20 min if adding database + AI)**
