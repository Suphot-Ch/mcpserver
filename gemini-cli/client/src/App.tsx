import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Send, Terminal, Loader2 } from 'lucide-react';
import './App.css';

const socket = io('http://localhost:3001');

interface Message {
  id: string;
  type: 'user' | 'gemini';
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-pro-preview');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const models = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ];

  useEffect(() => {
    socket.on('response', (data: string) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.type === 'gemini') {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, text: lastMessage.text + data },
          ];
        } else {
          return [
            ...prev,
            { id: Date.now().toString(), type: 'gemini', text: data },
          ];
        }
      });
    });

    socket.on('done', () => {
      setIsLoading(false);
    });

    return () => {
      socket.off('response');
      socket.off('done');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    socket.emit('message', { text: input, model: selectedModel });
    setInput('');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <Terminal className="header-icon" />
          <h1>Gemini CLI Web</h1>
        </div>
        <div className="header-right">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
          >
            {models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="chat-container">
        <div className="messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.type}`}>
              <div className="message-bubble">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper gemini">
              <div className="message-bubble loading">
                <Loader2 className="spinner" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="footer">
        <div className="input-group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your command here..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
