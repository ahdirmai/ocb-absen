require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// Backup DB sebelum DDL/migrasi. Dump timestamped ke backups/, tak overwrite.
// Auto-detect: pakai `mysqldump` native bila ada di PATH (server prod);
// fallback `docker exec` ke container MySQL (dev lokal).
// Override:
//   BACKUP_MODE=native|docker  → paksa mode
//   DB_CONTAINER=<nama>        → nama container docker (default mysql-db-1)
//   DB_HOST / DB_PORT          → host+port utk mode native

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USERNAME;
const DB_PASS = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "3306";
const CONTAINER = process.env.DB_CONTAINER || "mysql-db-1";

if (!DB_NAME || !DB_USER) {
  console.error("[fatal] DB_NAME / DB_USERNAME kosong di .env");
  process.exit(1);
}

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp =
  `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

const backupDir = path.resolve(__dirname, "../backups");
fs.mkdirSync(backupDir, { recursive: true });

const outFile = path.join(backupDir, `${DB_NAME}_${stamp}.sql`);

// Deteksi mysqldump native di PATH.
const hasNativeDump = () => {
  const probe = spawnSync(process.platform === "win32" ? "where" : "which", [
    "mysqldump",
  ]);
  return probe.status === 0;
};

const forcedMode = process.env.BACKUP_MODE; // 'native' | 'docker' | undefined
const useNative =
  forcedMode === "native" || (forcedMode !== "docker" && hasNativeDump());

const dumpFlags = ["--single-transaction", "--quick", "--routines", "--triggers"];

let cmd, dumpArgs, spawnOpts;
if (useNative) {
  // mysqldump langsung (server prod). Password via env MYSQL_PWD.
  console.log(`[..] dump ${DB_NAME} via mysqldump native (${DB_HOST}:${DB_PORT}) → ${outFile}`);
  cmd = "mysqldump";
  dumpArgs = [`-h${DB_HOST}`, `-P${DB_PORT}`, `-u${DB_USER}`, ...dumpFlags, DB_NAME];
  spawnOpts = { env: { ...process.env, MYSQL_PWD: DB_PASS } };
} else {
  // Fallback docker exec (dev lokal). Cek container hidup.
  const check = spawnSync("docker", ["inspect", "-f", "{{.State.Running}}", CONTAINER], {
    encoding: "utf8",
  });
  if (check.status !== 0 || check.stdout.trim() !== "true") {
    console.error(
      `[fatal] mysqldump native tak ada & container '${CONTAINER}' tidak running.`
    );
    console.error("Set BACKUP_MODE=native (server) atau DB_CONTAINER (docker).");
    console.error(check.stderr || check.stdout);
    process.exit(1);
  }
  console.log(`[..] dump ${DB_NAME} via docker exec '${CONTAINER}' → ${outFile}`);
  cmd = "docker";
  dumpArgs = [
    "exec",
    "-e",
    `MYSQL_PWD=${DB_PASS}`,
    CONTAINER,
    "mysqldump",
    `-u${DB_USER}`,
    ...dumpFlags,
    DB_NAME,
  ];
  spawnOpts = {};
}

const out = fs.openSync(outFile, "w");
const dump = spawnSync(cmd, dumpArgs, {
  ...spawnOpts,
  stdio: ["ignore", out, "pipe"],
  maxBuffer: 1024 * 1024 * 1024,
});
fs.closeSync(out);

if (dump.status !== 0) {
  console.error("[fatal] mysqldump gagal:");
  console.error(dump.stderr?.toString() || "(no stderr)");
  // Buang file gagal biar tak menyesatkan.
  try {
    fs.unlinkSync(outFile);
  } catch (_) {}
  process.exit(1);
}

// Assert size > 0.
const size = fs.statSync(outFile).size;
if (size === 0) {
  console.error("[fatal] dump file kosong (size 0). Hapus.");
  fs.unlinkSync(outFile);
  process.exit(1);
}

// Verifikasi footer restore-ability.
const tail = fs.readFileSync(outFile, "utf8").slice(-200);
if (!tail.includes("Dump completed")) {
  console.error(
    "[fatal] footer '-- Dump completed' tak ditemukan → dump kemungkinan terpotong. Hapus."
  );
  fs.unlinkSync(outFile);
  process.exit(1);
}

const mb = (size / (1024 * 1024)).toFixed(2);
console.log(`[ok] backup selesai: ${outFile} (${mb} MB)`);
process.exit(0);
