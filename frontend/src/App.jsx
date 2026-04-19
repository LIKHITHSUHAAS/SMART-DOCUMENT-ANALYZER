import { useState } from 'react';
import { BrainCircuit } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';

const INITIAL_MESSAGE = [
  { 
    role: 'ai', 
    content: 'Hello! I am your Smart Document Assistant. Upload a file and ask me anything about it!', 
    citations: [] 
  }
];

function App() {
  const [messages, setMessages] = useState(INITIAL_MESSAGE);

  const resetChat = () => {
    setMessages(INITIAL_MESSAGE);
  };

  return (
    <div className="app-container">
      {/* Sidebar config / file upload */}
      <aside className="sidebar">
        <div className="brand">
          <BrainCircuit size={28} color="var(--primary)" />
          <span>SmartDoc AI</span>
        </div>
        
        <FileUpload onUploadSuccess={resetChat} />
      </aside>

      {/* Main chat interface */}
      <main className="main-content">
        <ChatInterface messages={messages} setMessages={setMessages} />
      </main>
    </div>
  );
}

export default App;
