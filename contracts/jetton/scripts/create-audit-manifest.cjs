const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { readFile, readdir, stat, writeFile } = require("node:fs/promises");
const path = require("node:path");

const root = process.cwd();
const outputDir = path.resolve(root, process.argv[2] || "artifacts/mainnet-predeploy");
const fixedFiles = [
  "src/vcoin.tact",
  "src/jetton.tact",
  "src/messages.tact",
  "tests/jetton-sandbox.integration.spec.ts",
  "tests/supply-policy.spec.ts",
  "deploy/prepare-mainnet.ts",
  "scripts/verify-metadata.cjs",
  "scripts/verify-mainnet-network.cjs",
  "scripts/create-audit-manifest.cjs",
  "package.json",
  "package-lock.json",
  "tact.config.json",
  "tsconfig.deploy.json",
  "metadata.json",
  "deployment.config.template.json",
  "allocation-manifest.template.json",
  "../../.github/workflows/vcoin-jetton.yml",
  "../../docs/INDEPENDENT_AUDIT_PREDEPLOY_DOSSIER.md",
  "../../docs/MAINNET_DEPLOYMENT_READINESS.md",
  "assets/VCOIN-canonical-logo.png",
  "artifacts/mainnet-predeploy/state-init.boc",
  "artifacts/mainnet-predeploy/manifest.json",
];
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error("Could not resolve exact source commit");

async function addFile(relative, kind) {
  const absolute = path.resolve(root, relative);
  const bytes = await readFile(absolute);
  let gitBlobSha = null;
  try {
    const gitPath = relative.startsWith("../../") ? relative.slice(6) : "contracts/jetton/" + relative;
    gitBlobSha = execFileSync("git", ["rev-parse", "HEAD:" + gitPath], { encoding: "utf8" }).trim();
  } catch {}
  return { path: relative, kind, bytes: bytes.length, sha256: sha256(bytes), git_blob_sha: gitBlobSha };
}

async function walkBuild(dir, prefix = "build") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkBuild(absolute, relative));
    else if (entry.isFile()) files.push(await addFile(relative, "generated_compiler_output"));
  }
  return files;
}

async function main() {
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const config = JSON.parse(await readFile(path.join(root, "deployment.config.template.json"), "utf8"));
  const metadata = JSON.parse(await readFile(path.join(root, "metadata.json"), "utf8"));
  if (config.metadata?.uri !== process.env.VCOIN_METADATA_URL) {
    throw new Error("Deployment template metadata URI does not match the verified immutable metadata URL");
  }
  if (metadata.image !== config.metadata.image_uri) {
    throw new Error("Deployment template image URI does not match TEP-64 metadata image URI");
  }
  if (packageJson.devDependencies["@tact-lang/compiler"] !== "1.6.13") {
    throw new Error("Unexpected Tact compiler version; stop and review the toolchain pin");
  }
  const files = [];
  for (const relative of fixedFiles) files.push(await addFile(relative, relative.startsWith("artifacts/") ? "deployment_candidate" : relative.startsWith("assets/") ? "canonical_asset" : "reviewed_source_or_configuration"));
  files.push(...await walkBuild(path.join(root, "build")));
  files.sort((a, b) => a.path.localeCompare(b.path));

  const manifest = {
    document: "V COIN TON deterministic audit and predeployment artifact manifest",
    manifest_version: "1.0.0",
    source_commit: commit,
    network_scope: "TON Mainnet candidate only; no network transaction created",
    metadata_uri: config.metadata.uri,
    image_uri: metadata.image,
    token: { name: metadata.name, symbol: metadata.symbol, decimals: metadata.decimals, initial_supply: config.initial_supply_tokens },
    compiler: { tact: packageJson.devDependencies["@tact-lang/compiler"], ton_core: packageJson.devDependencies["@ton/core"] },
    generated_outputs: ["artifacts/mainnet-predeploy/state-init.boc", "artifacts/mainnet-predeploy/manifest.json"],
    files,
    safety: {
      network_connection_performed_by_builder: false,
      network_identity_verified_by_builder: false,
      transaction_created: false,
      transaction_signed: false,
      transaction_broadcast: false,
      private_key_handled: false,
      review_status: "NOT_A_DEPLOYMENT_APPROVAL"
    }
  };
  await writeFile(path.join(outputDir, "audit-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify({
    status: "PASS",
    source_commit: commit,
    files_hashed: files.length,
    state_init_boc_sha256: files.find((f) => f.path.endsWith("/state-init.boc"))?.sha256,
    canonical_logo_sha256: files.find((f) => f.path.endsWith("/VCOIN-canonical-logo.png"))?.sha256,
    transaction_signed: false,
    transaction_broadcast: false
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
