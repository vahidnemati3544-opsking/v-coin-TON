import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { Address, beginCell, storeStateInit } from "@ton/core";
import { VCoinMaster } from "../build/VCoinMaster_VCoinMaster";

type Args = { network?: string; owner?: string; metadataUri?: string; sourceCommit?: string; out?: string };

function parseArgs(argv: string[]): Args {
  const result: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error("Usage: --network mainnet --owner <raw-or-friendly-address> --metadata-uri <https-uri> --source-commit <40-char-git-sha> [--out <directory>]");
    }
    if (key === "--network") result.network = value;
    else if (key === "--owner") result.owner = value;
    else if (key === "--metadata-uri") result.metadataUri = value;
    else if (key === "--source-commit") result.sourceCommit = value;
    else if (key === "--out") result.out = value;
    else throw new Error(`Unknown argument: ${key}`);
    i += 1;
  }
  return result;
}

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.network !== "mainnet") throw new Error("Fail-closed: only --network mainnet is accepted. This tool does not connect to any TON network.");
  if (!args.owner || !args.metadataUri || !args.sourceCommit) throw new Error("--owner, --metadata-uri, and --source-commit are required.");
  if (!/^[0-9a-f]{40}$/i.test(args.sourceCommit)) throw new Error("--source-commit must be a full 40-character Git commit SHA.");
  const actualCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (actualCommit.toLowerCase() !== args.sourceCommit.toLowerCase()) throw new Error(`Source commit mismatch: requested ${args.sourceCommit}, checked out ${actualCommit}.`);
  const owner = Address.parse(args.owner);
  const uri = new URL(args.metadataUri);
  if (uri.protocol !== "https:") throw new Error("TEP-64 metadata URI must use HTTPS.");
  if (uri.username || uri.password || uri.hash) throw new Error("Metadata URI must not contain credentials or a fragment.");

  // TEP-64 off-chain content: 0x01 prefix followed by the UTF-8 URI.
  const content = beginCell().storeUint(1, 8).storeStringTail(uri.toString()).endCell();
  const contract = await VCoinMaster.fromInit(owner, content);
  if (!contract.init) throw new Error("Generated wrapper did not return StateInit.");

  const stateInitCell = beginCell().store(storeStateInit(contract.init)).endCell();
  const stateInitBoc = stateInitCell.toBoc({ idx: false, crc32: true });
  const codeBoc = contract.init.code.toBoc({ idx: false, crc32: true });
  const dataBoc = contract.init.data.toBoc({ idx: false, crc32: true });

  const packageBytes = await readFile(resolve(process.cwd(), "package.json"));
  const lockBytes = await readFile(resolve(process.cwd(), "package-lock.json"));
  const tactConfigBytes = await readFile(resolve(process.cwd(), "tact.config.json"));
  const packageJson = JSON.parse(packageBytes.toString("utf8"));
  const sourcePaths = ["src/vcoin.tact", "src/jetton.tact", "src/messages.tact"];
  const sourceParts = await Promise.all(sourcePaths.map(async (path) => ({ path, content: await readFile(resolve(process.cwd(), path)) })));
  const sourceBundle = Buffer.concat(sourceParts.flatMap((part) => [Buffer.from(part.path + "\\0"), part.content, Buffer.from("\\0")]));
  const outputDir = resolve(process.cwd(), args.out ?? "artifacts/mainnet-predeploy");
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "state-init.boc"), stateInitBoc);

  const manifest = {
    artifact_type: "offline-mainnet-jetton-state-init",
    project: "V COIN – TON",
    network_label: "mainnet",
    source_commit: args.sourceCommit,
    network_connection_performed: false,
    transaction_created: false,
    transaction_signed: false,
    transaction_broadcast: false,
    private_key_handled: false,
    master_address: contract.address.toString({ bounceable: false, urlSafe: true }),
    master_address_raw: contract.address.toRawString(),
    owner_address: owner.toString({ bounceable: false, urlSafe: true }),
    metadata_uri: uri.toString(),
    metadata_content_format: "TEP-64 off-chain (0x01 + UTF-8 HTTPS URI)",
    compiler: { package: "@tact-lang/compiler", version: packageJson.devDependencies["@tact-lang/compiler"] },
    ton_core_version: packageJson.devDependencies["@ton/core"],
    hashes: {
      source_bundle_sha256: sha256(sourceBundle),
      package_json_sha256: sha256(packageBytes),
      package_lock_sha256: sha256(lockBytes),
      tact_config_sha256: sha256(tactConfigBytes),
      code_cell_sha256: contract.init.code.hash().toString("hex"),
      data_cell_sha256: contract.init.data.hash().toString("hex"),
      state_init_cell_sha256: stateInitCell.hash().toString("hex"),
      state_init_boc_sha256: sha256(stateInitBoc),
      code_boc_sha256: sha256(codeBoc),
      data_boc_sha256: sha256(dataBoc)
    },
    files: {
      state_init_boc: "state-init.boc",
      state_init_boc_encoding: "base64",
      code_boc_sha256_only: true,
      data_boc_sha256_only: true
    },
    review_status: "NOT_A_DEPLOYMENT_APPROVAL",
    required_before_any_deployment: [
      "Rebuild twice from the same reviewed commit and compare every hash.",
      "Independently verify the master address derivation and TEP-64 metadata cell.",
      "Confirm the metadata URI is immutable, publicly accessible, and contains the Founder-approved logo and token metadata.",
      "Complete independent smart-contract audit and all Mainnet readiness gates.",
      "Founder reviews this exact manifest and deployment payload, then signs locally in the Founder-controlled wallet."
    ]
  };
  await writeFile(resolve(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify({ outputDir, masterAddress: manifest.master_address, hashes: manifest.hashes, transactionSigned: false, transactionBroadcast: false }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
