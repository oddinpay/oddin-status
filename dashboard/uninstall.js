import { execSync } from "child_process";
import os from "os";

const platform = os.platform();

function runCommand(command) {
  try {
    console.log(`\n> ${command}`);
    execSync(command, { stdio: "inherit" });
  } catch (e) {
    console.log("⚠️ Command skipped or already removed.");
  }
}

console.log("\n--- 1. Stopping & Removing App from PM2 ---");

runCommand("pm2 delete ohstatus");
runCommand("pm2 save");

console.log("\n--- 2. Removing OS Auto-Boot Hooks ---");
if (platform === "win32") {
  console.log("Windows detected: Removing Registry hook...");
  runCommand("pm2-startup uninstall");
} else {
  console.log(`\n${platform} detected: Extracting native unstartup hook...`);
  try {
    const unstartupOutput = execSync("pm2 unstartup").toString();
    const sudoCommand = unstartupOutput
      .split("\n")
      .find((line) => line.trim().startsWith("sudo"));

    if (sudoCommand) {
      console.log("\nRemoving system hook (Password may be required)...");
      execSync(sudoCommand.trim(), { stdio: "inherit" });
      console.log("✅ System hook removed.");
    } else {
      console.log("System hook is already deactivated.");
    }
  } catch (e) {
    console.log("⚠️ Could not remove system hook automatically.");
  }
}

console.log(
  "\n✅ Uninstall complete. App is stopped and OS auto-boot is disabled.",
);
