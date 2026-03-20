import { spawn } from "child_process";

// Simple test script to verify the server starts and responds to ListTools
async function test() {
  console.log("Starting OpenAI MCP server test...");
  
  const server = spawn("node", ["index.js"], {
    stdio: ["pipe", "pipe", "inherit"],
    env: { ...process.env, OPENAI_API_KEY: "mock-key" }
  });

  const listToolsRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  }) + "\n";

  server.stdout.on("data", (data) => {
    const output = data.toString();
    console.log("RAW STDOUT:", output);
    try {
      const resp = JSON.parse(output);
      console.log("Received response from server:");
      console.log(JSON.stringify(resp, null, 2));
      
      if (resp.result && resp.result.tools) {
        console.log(`✅ Server registered ${resp.result.tools.length} tools.`);
        process.exit(0);
      } else {
        console.log("❌ Failed to list tools.");
        process.exit(1);
      }
    } catch (e) {
      console.log("Failed to parse output as JSON, might be a chunk.");
    }
  });

  server.on("error", (err) => {
    console.error("❌ Server error:", err);
    process.exit(1);
  });

  setTimeout(() => {
    console.log("Sending tools/list request...");
    server.stdin.write(listToolsRequest);
  }, 1000);

  setTimeout(() => {
    console.log("Timed out waiting for server response.");
    server.kill();
    process.exit(1);
  }, 10000);
}

test();
