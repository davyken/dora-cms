import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- <your-admin-password>");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log("\nAdd this to your .env as DORA_ADMIN_PASSWORD_HASH:\n");
  console.log(hash);
  console.log("\nNever commit the plain password or this hash to a public repo's git history.\n");
});
