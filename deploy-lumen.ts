#!/usr/bin/env node

/**
 * Lumen Deployment Automation Script
 * Automates steps 1-5 from DEPLOYMENT.md:
 * 1. Push to GitHub
 * 2. Deploy on Vercel
 * 3. Supabase database setup (optional)
 * 4. Anthropic API (optional)
 * 5. OpenAI semantic search (optional)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function exec(command: string, silent = false): string {
  try {
    const output = execSync(command, { encoding: "utf-8" });
    if (!silent) console.log(output);
    return output.trim();
  } catch (error: any) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

async function step1GitHubPush(
  projectDir: string,
  githubToken: string,
  githubUsername: string,
  repoName: string
) {
  console.log("\n📦 Step 1: Push to GitHub\n");

  const gitUrl = `https://${githubToken}@github.com/${githubUsername}/${repoName}.git`;

  try {
    console.log("✓ Initializing git repository...");
    exec(`cd "${projectDir}" && git init`, true);

    console.log("✓ Adding files...");
    exec(`cd "${projectDir}" && git add .`, true);

    console.log("✓ Creating initial commit...");
    exec(
      `cd "${projectDir}" && git config user.email "deploy@lumen.app" && git config user.name "Lumen Deploy"`,
      true
    );
    exec(`cd "${projectDir}" && git commit -m "Lumen — initial"`, true);

    console.log("✓ Renaming branch to main...");
    exec(`cd "${projectDir}" && git branch -M main`, true);

    console.log("✓ Adding remote origin...");
    exec(
      `cd "${projectDir}" && git remote add origin ${gitUrl}`,
      true
    );

    console.log("✓ Pushing to GitHub...");
    exec(
      `cd "${projectDir}" && git push -u origin main`,
      true
    );

    console.log("✅ Successfully pushed to GitHub!");
    return true;
  } catch (error) {
    console.error("❌ GitHub push failed");
    return false;
  }
}

async function step2VercelDeploy(
  vercelToken: string,
  githubUsername: string,
  repoName: string
) {
  console.log("\n🚀 Step 2: Create Vercel Project\n");

  try {
    console.log("✓ Installing Vercel CLI...");
    exec("npm install -g vercel@latest", true);

    console.log("✓ Authenticating with Vercel...");
    // Set token in environment for vercel CLI
    const env = { ...process.env, VERCEL_TOKEN: vercelToken };

    console.log("✓ Linking and deploying project...");
    // Using vercel CLI to create project and deploy
    const deployCmd = `vercel --yes --confirm --token="${vercelToken}" --prod`;
    exec(deployCmd, false);

    console.log(
      "✅ Vercel deployment initiated! Check your Vercel dashboard for status."
    );
    return true;
  } catch (error) {
    console.error(
      "⚠️  Vercel deployment needs manual completion via dashboard"
    );
    console.log(
      "\n📝 Manual steps:\n1. Go to https://vercel.com/new\n2. Import from GitHub: " +
        githubUsername +
        "/" +
        repoName +
        "\n3. Leave build settings default\n4. Click Deploy\n"
    );
    return false;
  }
}

async function step3SupabaseSetup(
  projectDir: string
): Promise<{
  databaseUrl: string;
  directUrl: string;
}> {
  console.log("\n🗄️  Step 3: Supabase Database Setup\n");

  const shouldSetup = await prompt(
    "Set up Supabase now? (y/n, you can skip for later): "
  );
  if (shouldSetup.toLowerCase() !== "y") {
    console.log("⏭️  Skipping Supabase setup for now");
    return { databaseUrl: "", directUrl: "" };
  }

  console.log(`
📝 Supabase Setup Instructions:
1. Go to https://supabase.com → New Project
2. Choose region: Southeast Asia (Singapore)
3. Copy the connection string (pooled, port 6543) for DATABASE_URL
4. Also note the direct connection string (port 5432) for migrations

Waiting for you to create the project...
  `);

  const databaseUrl = await prompt("Enter DATABASE_URL (pooled, port 6543): ");
  const directUrl = await prompt(
    "Enter DIRECT_URL (direct connection, port 5432): "
  );

  if (databaseUrl && directUrl) {
    console.log("✓ Creating .env file...");
    const envContent = `DATABASE_URL="${databaseUrl}"
DIRECT_URL="${directUrl}"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="${exec("openssl rand -base64 32", true)}"
`;

    fs.writeFileSync(path.join(projectDir, ".env.local"), envContent);
    console.log("✅ .env.local created");

    console.log("\n✓ Running Prisma migrations...");
    try {
      exec(`cd "${projectDir}" && npm run db:push`, true);
      console.log("✓ Database schema created");
    } catch (e) {
      console.warn("⚠️  db:push may need manual attention if DB isn't ready");
    }

    console.log("\n✓ Seeding database with Bible data (~10-15 min)...");
    try {
      exec(`cd "${projectDir}" && npm run db:seed`, false);
      console.log("✅ Database seeded with complete Bible text");
    } catch (e) {
      console.warn(
        "⚠️  Seeding in progress - this can be resumed later with 'npm run db:seed'"
      );
    }

    return { databaseUrl, directUrl };
  }

  console.log("⏭️  Skipping database setup");
  return { databaseUrl: "", directUrl: "" };
}

async function step4AnthropicAPI(vercelToken: string) {
  console.log("\n🤖 Step 4: Anthropic API (Claude Assistant)\n");

  const shouldSetup = await prompt(
    "Add Anthropic API key? (y/n, for AI assistant): "
  );
  if (shouldSetup.toLowerCase() !== "y") {
    console.log("⏭️  Skipping Anthropic API for now");
    return;
  }

  console.log(`
📝 Get your API key:
1. Go to https://console.anthropic.com/api/keys
2. Create a new API key
3. Copy it below
  `);

  const apiKey = await prompt("Enter ANTHROPIC_API_KEY: ");

  if (apiKey) {
    console.log("✓ Setting Anthropic API key in Vercel...");
    try {
      exec(
        `vercel --token="${vercelToken}" env add ANTHROPIC_API_KEY "${apiKey}"`,
        true
      );
      console.log("✅ Anthropic API key configured in Vercel");
    } catch (e) {
      console.warn("⚠️  Manual env var setup needed in Vercel dashboard");
      console.log("   Add: ANTHROPIC_API_KEY = " + apiKey);
    }
  }
}

async function step5OpenAIEmbeddings(
  projectDir: string,
  vercelToken: string
) {
  console.log("\n🔍 Step 5: OpenAI Semantic Search (Optional)\n");

  const shouldSetup = await prompt(
    "Set up semantic search with OpenAI? (y/n): "
  );
  if (shouldSetup.toLowerCase() !== "y") {
    console.log("⏭️  Skipping OpenAI semantic search for now");
    return;
  }

  console.log(`
📝 Get your OpenAI API key:
1. Go to https://platform.openai.com/api/keys
2. Create a new API key
3. Copy it below (cost: ~$0.05-0.10 for 31k verses)
  `);

  const openaiKey = await prompt("Enter OPENAI_API_KEY: ");

  if (openaiKey) {
    console.log("✓ Setting OpenAI key in Vercel...");
    try {
      exec(
        `vercel --token="${vercelToken}" env add OPENAI_API_KEY "${openaiKey}"`,
        true
      );
      exec(
        `vercel --token="${vercelToken}" env add EMBEDDINGS_PROVIDER "openai"`,
        true
      );
      console.log("✓ OpenAI credentials configured");

      console.log("\n✓ Generating embeddings for all verses (~1-2 min)...");
      exec(`cd "${projectDir}" && npm run db:embed`, false);
      console.log("✅ Semantic search ready!");
    } catch (e) {
      console.warn("⚠️  Manual setup needed");
      console.log("   1. Set env vars in Vercel dashboard");
      console.log("   2. Run: npm run db:embed locally");
    }
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════╗
║   🕯️  Lumen Deployment Automation      ║
║   Steps 1-5: GitHub → Vercel → DB     ║
╚════════════════════════════════════════╝
  `);

  // Collect required tokens and info
  console.log("\n📋 Configuration\n");

  const projectDir = await prompt(
    "Project directory (default: current): "
  );
  const projectPath = projectDir || process.cwd();

  if (!fs.existsSync(path.join(projectPath, "package.json"))) {
    console.error("❌ Not a Node.js project (no package.json found)");
    process.exit(1);
  }

  const githubUsername = await prompt("GitHub username: ");
  const repoName = await prompt("Repository name (default: lumen): ") || "lumen";
  const githubToken = await prompt("GitHub personal access token: ");
  const vercelToken = await prompt("Vercel API token: ");

  if (!githubUsername || !githubToken || !vercelToken) {
    console.error(
      "❌ GitHub username, token, and Vercel token are required"
    );
    process.exit(1);
  }

  console.log("\n🚀 Starting deployment automation...\n");

  // Step 1: GitHub
  const gitSuccess = await step1GitHubPush(
    projectPath,
    githubToken,
    githubUsername,
    repoName
  );

  if (!gitSuccess) {
    console.error("❌ GitHub push failed. Stopping.");
    process.exit(1);
  }

  // Step 2: Vercel
  const vercelSuccess = await step2VercelDeploy(
    vercelToken,
    githubUsername,
    repoName
  );

  // Step 3: Supabase (optional)
  const { databaseUrl } = await step3SupabaseSetup(projectPath);

  // Step 4: Anthropic (optional)
  if (databaseUrl) {
    await step4AnthropicAPI(vercelToken);

    // Step 5: OpenAI (optional)
    await step5OpenAIEmbeddings(projectPath, vercelToken);
  }

  // Summary
  console.log(`
╔════════════════════════════════════════╗
║        ✅ Deployment Complete!         ║
╚════════════════════════════════════════╝

📊 What's live:
  ✓ GitHub repo: https://github.com/${githubUsername}/${repoName}
  ✓ Vercel project: https://vercel.com/dashboard
  ${databaseUrl ? "✓ Supabase database connected" : "⏭️  Database: Set up later (optional)"}

📝 Next steps:
  1. Watch Vercel deployment complete (~2-3 min)
  2. Visit your Vercel URL to see the app live
  3. Test at: /search?q=anxiety
  4. (Optional) Add licensed translations, Google OAuth, custom domain

📚 Full docs: See DEPLOYMENT.md in your project

Questions? Check the troubleshooting section in DEPLOYMENT.md
  `);

  rl.close();
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});
