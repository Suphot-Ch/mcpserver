import { spawn } from "child_process";

const child = spawn("node", ["index.js"], {
  cwd: "D:/antigravity/MCP-Server/gemini-cli/mcp",
});

child.stdout.on("data", (data) => {
  console.log("STDOUT:", data.toString());
});

child.stderr.on("data", (data) => {
  console.error("STDERR:", data.toString());
});

const listToolsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {},
};

child.stdin.write(JSON.stringify(listToolsRequest) + "\n");

setTimeout(() => {
  const askGeminiRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "ask-gemini",
      arguments: {
        prompt: "Hello, what is your name?",
        model: "gemini-2.0-flash",
      },
    },
  };
  child.stdin.write(JSON.stringify(askGeminiRequest) + "\n");
}, 2000);

setTimeout(() => {
  child.kill();
  process.exit(0);
}, 10000);
