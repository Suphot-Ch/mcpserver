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
      title: 'Gemini CLI API Gateway',
      version: '2.0.0',
      description: 'Multi-format API gateway supporting OpenAI, Anthropic, and Ollama protocols',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local development server',
      },
    ],
    tags: [
      { name: 'General', description: 'General endpoints' },
      { name: 'OpenAI', description: 'OpenAI-compatible API' },
      { name: 'Anthropic', description: 'Anthropic-compatible API' },
      { name: 'Ollama', description: 'Ollama-compatible API' },
      { name: 'Gemini', description: 'Native Gemini API' },
    ],
  },
  apis: ['./index.js'],
};

const specs = swaggerJsdoc(options);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * Function to dynamically find the path to the Gemini CLI's entry point.
 */
function findGeminiCliPath() {
  // Check environment variable first
  if (process.env.GEMINI_CLI_PATH && fs.existsSync(process.env.GEMINI_CLI_PATH)) {
    return process.env.GEMINI_CLI_PATH;
  }

  const cliRelativePath = path.join('@google', 'gemini-cli', 'bundle', 'gemini.js');
  let globalNodeModulesPath;

  // Attempt to find via npm root -g
  try {
    globalNodeModulesPath = execSync('npm root -g', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    let fullPath = path.join(globalNodeModulesPath, cliRelativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  } catch (error) {
    // Silent fail
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
    if (process.env.USERPROFILE) {
      commonGlobalPaths.push(path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'npm', 'node_modules'));
    }
  } else {
    commonGlobalPaths.push('/usr/local/lib/node_modules', '/usr/lib/node_modules');
    if (process.env.NVM_DIR) {
      commonGlobalPaths.push(path.join(process.env.NVM_DIR, 'versions', 'node', process.version, 'lib', 'node_modules'));
    }
  }

  for (const basePath of commonGlobalPaths) {
    const fullPath = path.join(basePath, cliRelativePath);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Default fallback for Windows
  return 'C:\\Program Files\\nodejs\\node_modules\\@google\\gemini-cli\\bundle\\gemini.js';
}

const geminiJsPath = findGeminiCliPath();

// Supported models
const SUPPORTED_MODELS = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

// Session management for conversation history
const sessions = new Map(); // sessionId -> { history: [], createdAt, lastAccess }

function generateSessionId() {
  return `sess_${Math.random().toString(36).substring(2, 11)}`;
}

function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    const newId = generateSessionId();
    sessions.set(newId, {
      id: newId,
      history: [],
      createdAt: new Date(),
      lastAccess: new Date()
    });
    return newId;
  }

  const session = sessions.get(sessionId);
  session.lastAccess = new Date();
  return sessionId;
}

function addToSessionHistory(sessionId, role, content) {
  const session = sessions.get(sessionId);
  if (session) {
    session.history.push({ role, content });
  }
}

function getSessionHistory(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.history : [];
}

function clearSession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * @openapi
 * /:
 *   get:
 *     summary: Welcome endpoint
 *     description: Returns a welcome message with API documentation links.
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: Returns a welcome message with documentation links.
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Gemini CLI API Gateway',
    version: '2.0.0',
    documentation: {
      swagger: 'http://localhost:3001/api-docs',
      alternative: 'http://localhost:3001/docs'
    },
    supportedFormats: ['OpenAI', 'Anthropic', 'Ollama', 'Native Gemini'],
    baseModels: SUPPORTED_MODELS,
    sessionSupport: true,
    sessionNote: 'Include "session-id" header to maintain conversation history across requests'
  });
});

// ============ Session Management ============

/**
 * @openapi
 * /sessions:
 *   post:
 *     summary: Create a new session
 *     description: Creates a new conversation session with empty history.
 *     tags:
 *       - Sessions
 *     responses:
 *       200:
 *         description: Session created successfully.
 */
app.post('/sessions', (req, res) => {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    id: sessionId,
    history: [],
    createdAt: new Date(),
    lastAccess: new Date()
  });

  res.json({
    sessionId,
    message: 'Session created. Use session-id header in requests to maintain conversation history.',
    createdAt: sessions.get(sessionId).createdAt
  });
});

/**
 * @openapi
 * /sessions/{sessionId}:
 *   get:
 *     summary: Get session history
 *     description: Retrieve the conversation history for a session.
 *     tags:
 *       - Sessions
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session history retrieved.
 */
app.get('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: `Session ${sessionId} not found` });
  }

  res.json({
    sessionId,
    history: session.history,
    createdAt: session.createdAt,
    lastAccess: session.lastAccess,
    messageCount: session.history.length
  });
});

/**
 * @openapi
 * /sessions/{sessionId}:
 *   delete:
 *     summary: Clear session history
 *     description: Delete a session and its conversation history.
 *     tags:
 *       - Sessions
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session cleared.
 */
app.delete('/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessions.has(sessionId)) {
    return res.status(404).json({ error: `Session ${sessionId} not found` });
  }

  clearSession(sessionId);
  res.json({ message: `Session ${sessionId} cleared` });
});

/**
 * @openapi
 * /api/models:
 *   get:
 *     summary: Get available Gemini models (Native)
 *     description: Returns a list of supported Gemini model names.
 *     tags:
 *       - Gemini
 *     responses:
 *       200:
 *         description: A list of available models.
 */
app.get('/api/models', (req, res) => {
  res.json({
    models: SUPPORTED_MODELS
  });
});

/**
 * @openapi
 * /v1/models:
 *   get:
 *     summary: List models (OpenAI-compatible)
 *     description: Returns available models in OpenAI format.
 *     tags:
 *       - OpenAI
 *     responses:
 *       200:
 *         description: List of available models in OpenAI format.
 */
app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: SUPPORTED_MODELS.map(m => ({
      id: m,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'google',
      permission: [],
      root: m,
      parent: null
    }))
  });
});

/**
 * @openapi
 * /v1/chat/completions:
 *   post:
 *     summary: Create chat completion (OpenAI-compatible)
 *     description: Supports conversation sessions - include "session-id" header to maintain history.
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
 *                 example: "gemini-2.5-flash"
 *               messages:
 *                 type: array
 *               temperature:
 *                 type: number
 *               stream:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Chat completion response.
 */
app.post('/v1/chat/completions', (req, res) => {
  const { model, messages, stream } = req.body;
  const sessionId = req.get('session-id');

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: { message: 'messages is required and must be an array', type: 'invalid_request_error' } });
  }

  let actualSessionId = sessionId;
  let allMessages = messages;

  // If session-id provided, prepend session history
  if (sessionId) {
    actualSessionId = getOrCreateSession(sessionId);
    const history = getSessionHistory(actualSessionId);
    allMessages = [...history, ...messages];
  }

  const prompt = allMessages.map(m => `${m.role}: ${m.content}`).join('\n');
  const selectedModel = model || 'gemini-2.5-flash';

  if (!SUPPORTED_MODELS.includes(selectedModel)) {
    return res.status(400).json({ error: { message: `Model ${selectedModel} not supported`, type: 'invalid_request_error' } });
  }

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
      return res.status(500).json({ error: { message: errorOutput.substring(0, 500), type: 'server_error' } });
    }

    const assistantMessage = output.trim();

    // Store in session history if provided
    if (sessionId) {
      const lastUserMessage = messages[messages.length - 1];
      addToSessionHistory(actualSessionId, lastUserMessage.role, lastUserMessage.content);
      addToSessionHistory(actualSessionId, 'assistant', assistantMessage);
    }

    res.json({
      id: `chatcmpl-${Math.random().toString(36).substring(7)}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: selectedModel,
      sessionId: actualSessionId,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: assistantMessage
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: -1,
        completion_tokens: -1,
        total_tokens: -1
      }
    });
  });
});

// ============ Anthropic API ============

/**
 * @openapi
 * /anthropic/models:
 *   get:
 *     summary: List available models (Anthropic-compatible)
 *     description: Returns models in Anthropic format.
 *     tags:
 *       - Anthropic
 *     responses:
 *       200:
 *         description: List of available models.
 */
app.get('/anthropic/models', (req, res) => {
  res.json({
    data: SUPPORTED_MODELS.map(m => ({
      id: m,
      type: 'model',
      display_name: m,
      created_at: new Date().toISOString(),
      input_tokens: 200000,
      output_tokens: 4096
    })),
    _request_id: `req_${Math.random().toString(36).substring(7)}`
  });
});

/**
 * @openapi
 * /anthropic/messages:
 *   post:
 *     summary: Create a message (Anthropic-compatible)
 *     description: Supports conversation sessions - include "session-id" header to maintain history.
 *     tags:
 *       - Anthropic
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *               - max_tokens
 *               - messages
 *             properties:
 *               model:
 *                 type: string
 *               max_tokens:
 *                 type: integer
 *               messages:
 *                 type: array
 *               system:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message response.
 */
app.post('/anthropic/messages', (req, res) => {
  const { model, messages, max_tokens, system, stream } = req.body;
  const sessionId = req.get('session-id');

  if (!model || !messages || !Array.isArray(messages) || !max_tokens) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: 'model, messages (array), and max_tokens are required'
      }
    });
  }

  const selectedModel = model || 'gemini-2.5-flash';

  if (!SUPPORTED_MODELS.includes(selectedModel)) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: `Model ${selectedModel} not supported`
      }
    });
  }

  let actualSessionId = sessionId;
  let allMessages = messages;

  // If session-id provided, prepend session history
  if (sessionId) {
    actualSessionId = getOrCreateSession(sessionId);
    const history = getSessionHistory(actualSessionId);
    allMessages = [...history, ...messages];
  }

  let prompt = '';
  if (system) {
    prompt = `System: ${system}\n\n`;
  }
  prompt += allMessages.map(m => `${m.role}: ${m.content}`).join('\n');

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
      return res.status(500).json({
        type: 'error',
        error: {
          type: 'api_error',
          message: errorOutput.substring(0, 500)
        }
      });
    }

    const assistantMessage = output.trim();

    // Store in session history if provided
    if (sessionId) {
      const lastUserMessage = messages[messages.length - 1];
      addToSessionHistory(actualSessionId, lastUserMessage.role, lastUserMessage.content);
      addToSessionHistory(actualSessionId, 'assistant', assistantMessage);
    }

    res.json({
      content: [
        {
          type: 'text',
          text: assistantMessage
        }
      ],
      id: `msg_${Math.random().toString(36).substring(7)}`,
      model: selectedModel,
      role: 'assistant',
      sessionId: actualSessionId,
      stop_reason: 'end_turn',
      stop_sequence: null,
      type: 'message',
      usage: {
        input_tokens: -1,
        output_tokens: -1
      }
    });
  });
});

// ============ Ollama API ============

/**
 * @openapi
 * /api/tags:
 *   get:
 *     summary: List available models (Ollama-compatible)
 *     tags:
 *       - Ollama
 *     responses:
 *       200:
 *         description: A list of available models.
 */
app.get('/api/tags', (req, res) => {
  res.json({
    models: SUPPORTED_MODELS.map(m => ({
      name: m,
      modified_at: new Date().toISOString(),
      size: 0,
      digest: `sha256:${Math.random().toString(16).substring(2)}`
    }))
  });
});

/**
 * @openapi
 * /api/generate:
 *   post:
 *     summary: Generate a completion (Ollama-compatible)
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

  const selectedModel = model || 'gemini-2.5-flash';

  if (!SUPPORTED_MODELS.includes(selectedModel)) {
    return res.status(400).json({ error: `Model ${selectedModel} not supported` });
  }

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
 *     summary: Generate a chat completion (Ollama-compatible)
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
  const selectedModel = model || 'gemini-2.5-flash';

  if (!SUPPORTED_MODELS.includes(selectedModel)) {
    return res.status(400).json({ error: `Model ${selectedModel} not supported` });
  }

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

// ============ Native Gemini API ============

/**
 * @openapi
 * /api/gemini/chat:
 *   post:
 *     summary: Send a message to Gemini (Native API)
 *     description: Sends a prompt to a Gemini model. Supports sessions - include "session-id" header to maintain history.
 *     tags:
 *       - Gemini
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
 *                 example: "gemini-2.5-flash"
 *     responses:
 *       200:
 *         description: The response from the Gemini model.
 */
app.post('/api/gemini/chat', (req, res) => {
  const { text, model } = req.body;
  const sessionId = req.get('session-id');

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  const selectedModel = model || 'gemini-2.5-flash';

  if (!SUPPORTED_MODELS.includes(selectedModel)) {
    return res.status(400).json({ error: `Model ${selectedModel} not supported` });
  }

  let actualSessionId = sessionId;
  let prompt = text;

  // If session-id provided, prepend session history
  if (sessionId) {
    actualSessionId = getOrCreateSession(sessionId);
    const history = getSessionHistory(actualSessionId);
    if (history.length > 0) {
      const historyText = history.map(m => `${m.role}: ${m.content}`).join('\n');
      prompt = `${historyText}\nuser: ${text}`;
    }
  }

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
      if (errorOutput.includes('status 429') || errorOutput.includes('rateLimitExceeded')) {
        return res.status(429).json({ error: 'API Rate Limit Reached (429)' });
      } else if (errorOutput.includes('ModelNotFoundError')) {
        return res.status(400).json({ error: 'Model not found. Please check the model name.' });
      }
      return res.status(500).json({ error: errorOutput.substring(0, 500) });
    }

    const assistantMessage = output.trim();

    // Store in session history if provided
    if (sessionId) {
      addToSessionHistory(actualSessionId, 'user', text);
      addToSessionHistory(actualSessionId, 'assistant', assistantMessage);
    }

    res.json({
      response: assistantMessage,
      model: selectedModel,
      sessionId: actualSessionId
    });
  });

  geminiProcess.on('error', (err) => {
    res.status(500).json({ error: `Failed to start gemini process: ${err.message}` });
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// ============ WebSocket Support ============

io.on('connection', (socket) => {
  console.log('User connected via WebSocket');

  let geminiProcess = null;

  socket.on('message', ({ text, model }) => {
    if (!text) {
      socket.emit('response', '**Error:** Please provide text for the prompt.');
      socket.emit('done', 1);
      return;
    }

    const selectedModel = model || 'gemini-2.5-flash';

    if (!SUPPORTED_MODELS.includes(selectedModel)) {
      socket.emit('response', `**Error:** Model '${selectedModel}' is not supported. Supported models: ${SUPPORTED_MODELS.join(', ')}`);
      socket.emit('done', 1);
      return;
    }

    console.log(`WebSocket message: text="${text}", model="${selectedModel}"`);

    let args = [geminiJsPath, '--prompt', text, '--model', selectedModel];

    geminiProcess = spawn('node', args);

    geminiProcess.on('error', (err) => {
      console.error('Failed to start gemini process:', err);
      socket.emit('response', `**Error:** Failed to start Gemini process: ${err.message}`);
      socket.emit('done', 1);
    });

    geminiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Loaded cached credentials') && !output.includes('I am your senior software engineer')) {
        socket.emit('response', output);
      }
    });

    geminiProcess.stderr.on('data', (data) => {
      const errOutput = data.toString();
      if (errOutput.includes('Loaded cached credentials')) return;

      if (errOutput.includes('status 429') || errOutput.includes('rateLimitExceeded')) {
        socket.emit('response', '\n**Error: API Rate Limit Reached (429).**');
      } else if (errOutput.includes('ModelNotFoundError')) {
        socket.emit('response', `\n**Error:** Model not found. Please use one of: ${SUPPORTED_MODELS.join(', ')}`);
      } else if (errOutput.length < 500) {
        socket.emit('response', `\n**Error:** ${errOutput}`);
      }
    });

    geminiProcess.on('close', (code) => {
      socket.emit('done', code);
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    if (geminiProcess) {
      geminiProcess.kill();
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Gemini CLI API Gateway (v2.0.0)`);
  console.log(`\n📡 Server listening on http://localhost:${PORT}`);
  console.log(`\n📚 Supported API Formats:`);
  console.log(`   • OpenAI-compatible  → /v1/*`);
  console.log(`   • Anthropic-compatible → /anthropic/*`);
  console.log(`   • Ollama-compatible  → /api/*`);
  console.log(`   • Native Gemini      → /api/gemini/*`);
  console.log(`\n📖 Documentation:`);
  console.log(`   • Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`   • Alternative: http://localhost:${PORT}/docs`);
  console.log(`\n✅ Supported Models:`);
  console.log(`   • ${SUPPORTED_MODELS.join('\n   • ')}`);
  console.log(`\n`);
});
