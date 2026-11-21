const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const EXPECTED = {
  sha256: "08d71b17fecb86ae6006ba0fc498675dc4024b13d3f40459dcd578dfc09719d1",
  bytes: 2728338,
  width: 1254,
  height: 1254,
};
const PINNED_RAW = /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[0-9a-f]{40}\/.+$/i;

async function get(url, label) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: "error" });
  if (!response.ok) throw new Error(label + " HTTP " + response.status);
  return response;
}

async function main() {
  const local = JSON.parse(readFileSync(path.join(__dirname, "..", "metadata.json"), "utf8"));
  if (local.name !== "V COIN" || local.symbol !== "VCOIN" || local.decimals !== "6") {
    throw new Error("Unexpected TEP-64 token identity or decimals");
  }
  if (typeof local.image !== "string" || !PINNED_RAW.test(local.image)
      || !local.image.endsWith("/contracts/jetton/assets/VCOIN-canonical-logo.png")) {
    throw new Error("Image URL must be an immutable commit-pinned URL to the canonical PNG path");
  }
  const metadataUrl = process.env.VCOIN_METADATA_URL;
  if (!metadataUrl || !PINNED_RAW.test(metadataUrl)
      || !metadataUrl.endsWith("/contracts/jetton/metadata.json")) {
    throw new Error("VCOIN_METADATA_URL must be an immutable commit-pinned raw GitHub metadata URL");
  }

  const remoteMetadataResponse = await get(metadataUrl, "Metadata");
  const remoteMetadata = await remoteMetadataResponse.json();
  if (JSON.stringify(remoteMetadata) !== JSON.stringify(local)) {
    throw new Error("Public pinned metadata does not match the reviewed repository metadata.json");
  }

  const imageResponse = await get(local.image, "Canonical logo");
  const mime = (imageResponse.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (mime !== "image/png") throw new Error("Canonical logo HTTP MIME type is not image/png: " + mime);
  const image = Buffer.from(await imageResponse.arrayBuffer());
  if (image.length !== EXPECTED.bytes) throw new Error("Canonical PNG byte count mismatch: " + image.length);
  if (image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Canonical asset does not have a PNG signature");
  if (image.readUInt32BE(16) !== EXPECTED.width || image.readUInt32BE(20) !== EXPECTED.height) {
    throw new Error("Canonical PNG dimensions mismatch");
  }
  const sha256 = createHash("sha256").update(image).digest("hex");
  if (sha256 !== EXPECTED.sha256) throw new Error("Canonical PNG SHA-256 mismatch: " + sha256);

  console.log(JSON.stringify({
    status: "PASS",
    metadata_url: metadataUrl,
    image_url: local.image,
    image_bytes: image.length,
    image_dimensions: EXPECTED.width + "x" + EXPECTED.height,
    image_sha256: sha256,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
