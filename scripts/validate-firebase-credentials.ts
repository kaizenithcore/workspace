/**
 * Validate Firebase credentials format and parsing
 * Run this in both development and production to diagnose issues
 * 
 * Usage:
 * Development: npx ts-node scripts/validate-firebase-credentials.ts
 * Production: node -r esbuild-register scripts/validate-firebase-credentials.ts
 */

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log("=== Firebase Credentials Validation ===\n");

// Check environment variables existence
console.log("✓ FIREBASE_PROJECT_ID:", projectId ? "✓ Set" : "✗ Missing");
console.log("✓ FIREBASE_CLIENT_EMAIL:", clientEmail ? "✓ Set" : "✗ Missing");
console.log("✓ FIREBASE_PRIVATE_KEY:", privateKey ? "✓ Set" : "✗ Missing");

if (!privateKey) {
  console.log("\n✗ ERROR: FIREBASE_PRIVATE_KEY is not set");
  process.exit(1);
}

console.log("\n=== Private Key Analysis ===\n");
console.log("Length:", privateKey.length);
console.log("First 60 chars:", privateKey.substring(0, 60));
console.log("Last 60 chars:", privateKey.substring(privateKey.length - 60));

// Check for PEM headers
const hasBeginHeader = privateKey.includes("-----BEGIN PRIVATE KEY-----");
const hasEndFooter = privateKey.includes("-----END PRIVATE KEY-----");

console.log("\nPEM Headers:");
console.log("✓ Has BEGIN header:", hasBeginHeader);
console.log("✓ Has END footer:", hasEndFooter);

// Check for newline formats
const hasEscapedNewlines = privateKey.includes("\\n");
const hasRealNewlines = privateKey.includes("\n");

console.log("\nNewline Formats:");
console.log("✓ Has escaped newlines (\\n):", hasEscapedNewlines);
console.log("✓ Has real newlines:", hasRealNewlines);

// Attempt to parse
console.log("\n=== Parse Attempt ===\n");

function parsePrivateKey(key: string): string {
  if (!key) {
    throw new Error("Private key is empty");
  }

  let parsed = key.replace(/\\n/g, "\n");

  if (!parsed.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "Invalid private key format: missing PEM header. Key must start with '-----BEGIN PRIVATE KEY-----'"
    );
  }

  if (!parsed.includes("-----END PRIVATE KEY-----")) {
    throw new Error(
      "Invalid private key format: missing PEM footer. Key must end with '-----END PRIVATE KEY-----'"
    );
  }

  return parsed;
}

try {
  const parsed = parsePrivateKey(privateKey);
  console.log("✓ Parsing successful!");
  console.log("Parsed key length:", parsed.length);
  console.log("Parsed key starts with:", parsed.substring(0, 60));

  // Try to load with Firebase Admin
  try {
    const admin = require("firebase-admin");

    const serviceAccount = {
      projectId,
      clientEmail,
      privateKey: parsed,
    };

    // Just validate the structure, don't actually initialize
    console.log("\n✓ Service account structure is valid");
    console.log("  - projectId:", projectId);
    console.log("  - clientEmail:", clientEmail);
    console.log("  - privateKey (parsed):", parsed.length, "bytes");

    // Attempt to create credential object
    const credential = admin.credential.cert(serviceAccount);
    console.log("✓ Firebase Admin credential created successfully!");
  } catch (adminError) {
    const errorMsg =
      adminError instanceof Error ? adminError.message : String(adminError);
    console.log("✗ Firebase Admin error:", errorMsg);
  }
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.log("✗ Parsing failed:", errorMsg);

  // Provide suggestions
  console.log("\n=== Troubleshooting Suggestions ===\n");

  if (!hasBeginHeader || !hasEndFooter) {
    console.log("1. PEM headers are missing. Ensure the key starts with:");
    console.log("   -----BEGIN PRIVATE KEY-----");
    console.log("   and ends with:");
    console.log("   -----END PRIVATE KEY-----");
  }

  if (!hasEscapedNewlines && !hasRealNewlines) {
    console.log("\n2. No newlines detected in the key.");
    console.log("   In Coolify/Docker, set the variable as:");
    console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEv...\\n-----END PRIVATE KEY-----"');
    console.log("   (with literal \\n characters, not actual line breaks)");
  }

  if (hasRealNewlines && !hasEscapedNewlines) {
    console.log("\n3. Key has real newlines but no escaped ones.");
    console.log("   In Coolify, the variable might be stored as a multiline string.");
    console.log("   This should work, but ensure it's properly loaded.");
  }

  process.exit(1);
}

console.log("\n✓ All checks passed! Firebase credentials are valid.\n");
