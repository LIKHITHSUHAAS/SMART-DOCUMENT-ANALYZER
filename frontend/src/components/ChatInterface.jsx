import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

export default function ChatInterface({ messages, setMessages }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send history excluding citations for API
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await axios.post('/chat', {
        query: userMessage.content,
        history: history
      });

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: response.data.answer, 
        citations: response.data.citations 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I encountered an error. Please ensure the backend is running.',
        citations: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel chat-container">
      <div className="chat-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
          <Bot color="var(--primary)" /> Contextual Engine
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ask questions. Get cited answers.</p>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {msg.role === 'user' ? <User size={18} color="var(--primary)" /> : <Bot size={18} color="var(--accent)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0, wordWrap: 'break-word' }}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="markdown">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
                
                {msg.citations && msg.citations.length > 0 && (
                  <div className="citations-box">
                    <div className="citations-title">
                      <BookOpen size={14} /> Sources
                    </div>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {msg.citations.map((cite, i) => (
                        <li key={i}>{cite}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-bubble message-ai" style={{ alignSelf: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
               <Bot size={18} color="var(--accent)" />
               <div className="typing-indicator">
                 <div className="dot"></div>
                 <div className="dot"></div>
                 <div className="dot"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-wrapper">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about your documents..."
          />
          <button 
            className="send-btn" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
