// Public local-demo credentials; never use for real accounts.
const DEMO_PASSWORD = "DemoRide2026!";
const DEMO_ACCOUNTS = [
  { name: "Demo Driver", email: "driver@example.test", role: "DRIVER" },
  { name: "Passenger One", email: "passenger1@example.test", role: "PASSENGER" },
  { name: "Passenger Two", email: "passenger2@example.test", role: "PASSENGER" },
];

async function createDemoAccounts(base = "http://localhost:8000") {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname)) {
    throw new Error("Demo accounts may only be created on a local API.");
  }
  for (const account of DEMO_ACCOUNTS) {
    const response = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...account, password: DEMO_PASSWORD }),
    });
    const result = await response.json();
    if (response.status === 400 && result.message === "Email already exists") {
      console.log(`${account.role}: ${account.email} already exists (unchanged)`);
    } else if (response.status === 201 && result.data?.id) {
      console.log(`${account.role}: ${account.email} created`);
    } else {
      throw new Error(result.message || "Demo registration failed");
    }
  }
}

module.exports = { createDemoAccounts, DEMO_ACCOUNTS, DEMO_PASSWORD };
if (require.main === module) {
  createDemoAccounts(process.env.DEMO_API_URL || "http://localhost:8000").catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
