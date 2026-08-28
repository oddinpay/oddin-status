import { execSync } from "child_process";
import os from "os";
import fs from "fs";
import readline from "readline";

const platform = os.platform();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getPackageManager() {
  try {
    execSync(`${platform === "win32" ? "where" : "which"} pnpm`, {
      stdio: "ignore",
    });
    return "pnpm";
  } catch {
    try {
      execSync(`${platform === "win32" ? "where" : "which"} npm`, {
        stdio: "ignore",
      });
      return "npm";
    } catch {
      return null;
    }
  }
}

const pkgManager = getPackageManager();

if (!pkgManager) {
  console.error("\n❌ Neither pnpm nor npm was found on this system.");
  console.error(
    "Please install Node.js (which includes npm) or pnpm to continue.",
  );
  process.exit(1);
}

function runCommand(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}

function checkGlobalPM2() {
  try {
    execSync(`${platform === "win32" ? "where" : "which"} pm2`, {
      stdio: "ignore",
    });
  } catch {
    console.log(
      `\n--- PM2 not found. Installing globally via ${pkgManager} ---`,
    );
    runCommand(`${pkgManager} install -g pm2`);
  }
}

function setupPM2() {
  try {
    checkGlobalPM2();

    console.log("\n--- Starting App with PM2 (No OS Auto-Boot) ---");
    runCommand("pm2 start ecosystem.config.cjs");
    runCommand("pm2 save");

    console.log(
      "\n✅ App is running in the background! (Note: It will not start automatically if the server reboots).",
    );
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Start failed:", error.message);
    process.exit(1);
  }
}

function buildAndDeploy() {
  console.log(`\n--- Installing Dependencies via ${pkgManager} ---`);
  runCommand(`${pkgManager} install`);

  console.log(`\n--- Building App via ${pkgManager} ---`);
  runCommand(`${pkgManager} run build`);

  setupPM2();
}

function init() {
  console.log(`⚙️  Using package manager: ${pkgManager}`);

  if (fs.existsSync("./build")) {
    rl.question(
      "📦 Build folder detected. Do you want to reinstall packages and rebuild? (y/n): ",
      (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          buildAndDeploy();
        } else {
          console.log("\n--- Skipping Build ---");
          setupPM2();
        }
      },
    );
  } else {
    buildAndDeploy();
  }
}

init();
