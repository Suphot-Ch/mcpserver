const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn, execSync } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gemini CLI API',
      version: '1.0.0',
      description: 'A simple API to interact with Gemini models via CLI wrapper',
    },
    servers: [
      {
        url: 'http://localhost:3001',
      },
    ],
  },
  apis: ['./index.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * Function to dynamically find the path to the Gemini CLI's index.js.
 */
function findGeminiCliPath() {
  const cliRelativePath = path.join('@google', 'gemini-cli', 'dist', 'index.js');
  let globalNodeModulesPath;

  // Attempt to find via npm root -g
  try {
    globalNodeModulesPath = execSync('npm root -g', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    let fullPath = path.join(globalNodeModulesPath, cliRelativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  } catch (error) {
    console.warn(`'npm root -g' failed or gemini-cli not found there.`);
  }

  // Fallback to common global paths
  const commonGlobalPaths = [];
  if (process.platform === 'win32') {
    if (process.env.ProgramFiles) {
      commonGlobalPaths.push(path.join(process.env.ProgramFiles, 'nodejs', 'node_modules'));
    }
    if (process.env.APPDATA) {
      commonGlobalPaths.push(path.join(process.env.APPDATA, 'npm', 'node_modules'));
    }
    commonGlobalPaths.push(path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'npm', 'node_modules'));
  } else {
    commonGlobalPaths.push('/usr/local/lib/node_modules', '/usr/lib/node_modules');
    if (process.env.NVM_DIR && process.version) {
      commonGlobalPaths.push(path.join(process.env.NVM_DIR, 'versions', 'node', process.version, 'lib', 'node_modules'));
    }
  }

  for (const basePath of commonGlobalPaths) {
    const fullPath = path.join(basePath, cliRelativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Last resort: assume it's in the PATH or just return the known Windows path if everything else fails
  return 'C:\\Program Files\\nodejs\\node_modules\\@google\\gemini-cli\\dist\\index.js';
}

const geminiJsPath = findGeminiCliPath();

/**
 * @openapi
 * /api/models:
 *   get:
 *     summary: Get available Gemini models
 *     description: Returns a list of supported Gemini model names.
 *     tags:
 *       - Models
 *     responses:
 *       200:
 *         description: A list of available models.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["gemini-1.5-pro", "gemini-1.0-pro", "gemini-2.0-pro-exp-02-05", "gemini-2.0-flash"]
 */
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ]
  });
});

/**
 * @openapi
 * /v1/models:
 *   get:
 *     summary: Get available models (OpenAI style)
 *     tags:
 *       - OpenAI
 *     responses:
 *       200:
 *         description: A list of available models.
 */
app.get('/v1/models', (req, res) => {
  const models = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];
  
  res.json({
    object: 'list',
    data: models.map(m => ({
      id: m,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'google'
    }))
  });
});

/**
 * @openapi
 * /v1/chat/completions:
 *   post:
 *     summary: Chat completions (OpenAI style)
 *     tags:
 *       - OpenAI
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               model:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Chat completion response.
 */
app.post('/v1/chat/completions', (req, res) => {
  const { model, messages, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages is required and must be an array' });
  }

  // Combine messages into a single prompt for the CLI
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const selectedModel = model || 'gemini-2.0-flash';

  let args = [geminiJsPath, '--prompt', prompt, '--model', selectedModel];

  const geminiProcess = spawn('node', args);
  let output = '';
  let errorOutput = '';

  geminiProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    if (!chunk.includes('Loaded cached credentials') && !chunk.includes('I am your senior software engineer')) {
      output += chunk;
    }
  });

  geminiProcess.stderr.on('data', (data) => {
    const errChunk = data.toString();
    if (!errChunk.includes('Loaded cached credentials')) {
      errorOutput += errChunk;
    }
  });

  geminiProcess.on('close', (code) => {
    if (code !== 0 && errorOutput) {
      return res.status(500).json({ error: errorOutput.substring(0, 500) });
    }

    const response = {
      id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: selectedModel,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: output.trim()
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: -1,
        completion_tokens: -1,
        total_tokens: -1
      }
    };

    res.json(response);
  });
});

/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: List local models (Ollama style)
 *     tags:
 *       - Ollama
 *     responses:
 *       200:
 *         description: A list of available models.
 */
app.get('/api/tags', (req, res) => {
  const models = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];

  res.json({
    models: models.map(m => ({
      name: m,
      modified_at: new Date().toISOString(),
      size: 0,
      digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000'
    }))
  });
});

/**
 * @openapi
 * /api/generate:
 *   post:
 *     summary: Generate a completion (Ollama style)
 *     tags:
 *       - Ollama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *               - prompt
 *             properties:
 *               model:
 *                 type: string
 *               prompt:
 *                 type: string
 *               stream:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Generation response.
 */
app.post('/api/generate', (req, res) => {
  const { model, prompt, stream } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const selectedModel = model || 'gemini-2.0-flash';
  let args = [geminiJsPath, '--prompt', prompt, '--model', selectedModel];

  const geminiProcess = spawn('node', args);
  let output = '';
  let errorOutput = '';

  geminiProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    if (!chunk.includes('Loaded cached credentials') && !chunk.includes('I am your senior software engineer')) {
      output += chunk;
    }
  });

  geminiProcess.stderr.on('data', (data) => {
    const errChunk = data.toString();
    if (!errChunk.includes('Loaded cached credentials')) {
      errorOutput += errChunk;
    }
  });

  geminiProcess.on('close', (code) => {
    if (code !== 0 && errorOutput) {
      return res.status(500).json({ error: errorOutput.substring(0, 500) });
    }

    res.json({
      model: selectedModel,
      created_at: new Date().toISOString(),
      response: output.trim(),
      done: true,
      context: [],
      total_duration: 0,
      load_duration: 0,
      prompt_eval_count: 0,
      prompt_eval_duration: 0,
      eval_count: 0,
      eval_duration: 0
    });
  });
});

/**
 * @openapi
 * /api/chat:
 *   post:
 *     summary: Generate a chat completion (Ollama style)
 *     tags:
 *       - Ollama
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *               - messages
 *             properties:
 *               model:
 *                 type: string
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *               stream:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Chat completion response.
 */
app.post('/api/chat', (req, res) => {
  const { model, messages, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages is required and must be an array' });
  }

  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const selectedModel = model || 'gemini-2.0-flash';
  let args = [geminiJsPath, '--prompt', prompt, '--model', selectedModel];

  const geminiProcess = spawn('node', args);
  let output = '';
  let errorOutput = '';

  geminiProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    if (!chunk.includes('Loaded cached credentials') && !chunk.includes('I am your senior software engineer')) {
      output += chunk;
    }
  });

  geminiProcess.stderr.on('data', (data) => {
    const errChunk = data.toString();
    if (!errChunk.includes('Loaded cached credentials')) {
      errorOutput += errChunk;
    }
  });

  geminiProcess.on('close', (code) => {
    if (code !== 0 && errorOutput) {
      return res.status(500).json({ error: errorOutput.substring(0, 500) });
    }

    res.json({
      model: selectedModel,
      created_at: new Date().toISOString(),
      message: {
        role: 'assistant',
        content: output.trim()
      },
      done: true,
      total_duration: 0,
      load_duration: 0,
      prompt_eval_count: 0,
      prompt_eval_duration: 0,
      eval_count: 0,
      eval_duration: 0
    });
  });
});

/**
 * @openapi
 * /api/gemini/chat:
 *   post:
 *     summary: Send a message to Gemini (Native style)
 *     description: Sends a prompt to a Gemini model and returns the full response.
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The prompt text to send.
 *                 example: "Hello, who are you?"
 *               model:
 *                 type: string
 *                 description: The Gemini model to use.
 *                 example: "gemini-2.0-flash"
 *     responses:
 *       200:
 *         description: The response from the Gemini model.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *       400:
 *         description: Missing required text field.
 *       500:
 *         description: Internal server error.
 */
app.post('/api/gemini/chat', (req, res) => {
  const { text, model } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  let args = [geminiJsPath, '--prompt', text];

  if (model) {
    args.push('--model', model);
  }

  const geminiProcess = spawn('node', args);
  let output = '';
  let errorOutput = '';

  geminiProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    if (!chunk.includes('Loaded cached credentials') && !chunk.includes('I am your senior software engineer')) {
      output += chunk;
    }
  });

  geminiProcess.stderr.on('data', (data) => {
    const errChunk = data.toString();
    if (!errChunk.includes('Loaded cached credentials')) {
      errorOutput += errChunk;
    }
  });

  geminiProcess.on('close', (code) => {
    if (code !== 0 && errorOutput) {
      if (errorOutput.includes('status 429') || errorOutput.includes('rateLimitExceeded')) {
        return res.status(429).json({ error: 'API Rate Limit Reached (429)' });
      } else if (errorOutput.includes('ModelNotFoundError')) {
        return res.status(400).json({ error: 'Model not found. Please check the model name.' });
      }
      return res.status(500).json({ error: errorOutput.substring(0, 500) });
    }
    res.json({ response: output });
  });

  geminiProcess.on('error', (err) => {
    res.status(500).json({ error: `Failed to start gemini process: ${err.message}` });
  });
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     description: Returns a welcome message with a link to the API docs.
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: Returns a welcome message.
 */
app.get('/', (req, res) => {
  res.send('Welcome to Gemini CLI API. Documentation at /api-docs');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  let geminiProcess = null;

  socket.on('message', ({ text, model }) => {
    console.log(`message: ${text}, model: ${model}`);

    let args = [
      geminiJsPath,
      '--prompt', text
    ];

    if (model) {
      args.push('--model', model);
    }

    // Directly call node with the gemini script
    geminiProcess = spawn('node', args);

    geminiProcess.on('error', (err) => {
      console.error('Failed to start gemini process:', err);
      socket.emit('response', `Error: Could not start gemini directly with Node. Please ensure the path to gemini is correct.`);
      socket.emit('done', 1);
    });

    geminiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Filter out common CLI initialization messages
      if (!output.includes('Loaded cached credentials') && !output.includes('I am your senior software engineer')) {
        socket.emit('response', output);
      }
    });

    geminiProcess.stderr.on('data', (data) => {
      const errOutput = data.toString();
      // Ignore common informational messages in stderr
      if (errOutput.includes('Loaded cached credentials')) return;
      
      // If it's a 429 error, simplify the message
      if (errOutput.includes('status 429') || errOutput.includes('rateLimitExceeded')) {
        socket.emit('response', "\n**Error: API Rate Limit Reached (429).**");
      } else if (errOutput.includes('ModelNotFoundError')) {
        socket.emit('response', "\n**Error: Model Not Found.** The selected model name is not recognized. Please try 'gemini-1.5-flash'.");
      } else if (errOutput.length < 500) {
        socket.emit('response', `\n*Error:* ${errOutput}`);
      }
    });

    geminiProcess.on('close', (code) => {
      socket.emit('done', `Process exited with code ${code}`);
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (geminiProcess) {
      geminiProcess.kill();
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
