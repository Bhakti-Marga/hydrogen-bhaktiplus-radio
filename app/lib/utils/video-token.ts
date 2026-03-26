/**
 * Generate a short token for a numeric videoId.
 * Format: "<Base64URL(id)>.<Base64URL(truncated-HMAC)>"
 */
export async function signVideoId(videoId: number): Promise<string> {
  console.log('[signVideoId] Input videoId:', videoId, 'type:', typeof videoId);
  const secret = "Radha1008%%RamaKrishna";
  const idString = videoId.toString();

  // 1. Convert strings to Uint8Arrays
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(idString);

  // 2. Import the key for HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // 3. Compute HMAC-SHA256
  const signature = await crypto.subtle.sign("HMAC", key, data);

  // 4. Truncate to first 8 bytes
  const fullHmac = new Uint8Array(signature);
  const truncated = fullHmac.slice(0, 8);

  // 5. Base64URL-encode helper (no padding)
  const toBase64Url = (bytes: Uint8Array): string => {
    // Convert Uint8Array to base64
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  // 6. Encode parts
  const sigPart = toBase64Url(truncated);
  const idPart = toBase64Url(encoder.encode(idString));

  const token = `${idPart}.${sigPart}`;
  console.log('[signVideoId] Output token:', token);
  return token;
}

// Example usage:
// const tokenFor4 = signVideoId(4);
// console.log(tokenFor4); // e.g., "NA.sXyZ1a2b3c4"
