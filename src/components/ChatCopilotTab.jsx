import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function ChatCopilotTab({ meetingData, apiKey, model }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I have fully processed "${meetingData?.meetingTitle || 'this meeting'}". Ask me any question about decisions, deadlines, attendees, or viewpoints.`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (question) => {
    const q = (question || inputVal).trim();
    if (!q || loading) return;

    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingSummary: meetingData,
          userQuestion: q,
          chatHistory: messages.slice(1),
          model: model || 'gemini-2.5-flash',
          apiKey: apiKey
        })
      });

      if (!res.ok) throw new Error('Failed to fetch AI reply');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error answering your question. Please verify your connection or API key.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="res-panel active">
      <div className="chat-copilot-container">
        <div className="chat-header">
          <div className="chat-header-info">
            <span className="bot-avatar">🤖</span>
            <div>
              <h4>OmniNote AI Meeting Copilot</h4>
              <p>Ask anything about this meeting: decisions, specific quotes, numbers, or next steps.</p>
            </div>
          </div>
          <div className="quick-prompts">
            {[
              'What are the highest priority action items?',
              'What were the main reasons for the key decisions?',
              'Who spoke the most and what were their concerns?'
            ].map((qp, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-chip"
                onClick={() => handleSend(qp)}
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-messages-box">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role === 'user' ? 'user' : 'bot'}`}>
              <p>{m.content}</p>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble bot">
              <p>
                <em>Consulting meeting notes...</em>
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            placeholder="Ask a question about this meeting..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-send" disabled={loading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
