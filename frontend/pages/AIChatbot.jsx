import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';
const VISITOR_QUESTION_LIMIT = 3;

const WELCOME_MESSAGE = {
  role: 'bot',
  text: "Hi! I'm PawBot 🐾, your AI dog care assistant. Ask me about dog health, feeding, training, grooming, or behavior. Set your dog's profile for personalized tips!",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const getGuestSessionId = () => {
  let sessionId = sessionStorage.getItem('pawbotGuestSessionId');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('pawbotGuestSessionId', sessionId);
  }
  return sessionId;
};

const getGuestQuestionCount = () => {
  const count = parseInt(sessionStorage.getItem('pawbotGuestQuestionCount') || '0', 10);
  return Number.isNaN(count) ? 0 : count;
};

const setGuestQuestionCount = (count) => {
  sessionStorage.setItem('pawbotGuestQuestionCount', String(count));
};

const AIChatbot = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const authToken = token || localStorage.getItem('authToken');
  const isVisitor = !authToken;

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dogProfile, setDogProfile] = useState({ breed: '', age: '', name: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [visitorQuestionsUsed, setVisitorQuestionsUsed] = useState(getGuestQuestionCount);
  const [visitorLimitReached, setVisitorLimitReached] = useState(
    () => getGuestQuestionCount() >= VISITOR_QUESTION_LIMIT
  );
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    'What should I feed my puppy?',
    'What vaccines does my dog need?',
    'How often should I bathe my dog?',
    'How do I train basic commands?',
    'My dog has anxiety, help!',
    'How to prevent ticks and fleas?',
  ];

  useEffect(() => {
    if (!authToken) {
      setHistoryLoading(false);
      return;
    }
    fetch(`${API_BASE}/chat/history`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages.length > 0) {
          setMessages(data.messages.map((m) => ({
            ...m,
            time: new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [authToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    if (isVisitor && visitorLimitReached) return;

    setInput('');

    const userMsg = {
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      let response;
      let data;

      if (authToken) {
        response = await fetch(`${API_BASE}/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            message: userText,
            dogProfile: dogProfile.name || dogProfile.breed || dogProfile.age ? dogProfile : null,
          }),
        });
      } else {
        const sessionId = getGuestSessionId();
        const conversationHistory = [...messages, userMsg]
          .filter((m) => !m.isError)
          .map((m) => ({ role: m.role, text: m.text }));

        response = await fetch(`${API_BASE}/chat/guest-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            sessionId,
            history: conversationHistory,
            dogProfile: dogProfile.name || dogProfile.breed || dogProfile.age ? dogProfile : null,
          }),
        });
      }

      data = await response.json();

      if (!data.success) {
        if (data.limitReached) {
          setVisitorLimitReached(true);
          setVisitorQuestionsUsed(VISITOR_QUESTION_LIMIT);
          setGuestQuestionCount(VISITOR_QUESTION_LIMIT);
        }
        throw new Error(data.message || 'Something went wrong.');
      }

      if (isVisitor && typeof data.questionsUsed === 'number') {
        setVisitorQuestionsUsed(data.questionsUsed);
        setGuestQuestionCount(data.questionsUsed);
        if (data.questionsRemaining === 0) {
          setVisitorLimitReached(true);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: err.message === 'Please sign in to continue chatting.'
            ? err.message
            : '⚠️ ' + (err.message || 'Failed to get response. Please try again.'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/chat/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setMessages([{
        ...WELCOME_MESSAGE,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      // ignore
    }
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i, arr) => {
      const formatted = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      return (
        <span key={i}>
          {formatted}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });
  };

  const chatDisabled = loading || (isVisitor && visitorLimitReached);
  const visitorQuestionsRemaining = Math.max(0, VISITOR_QUESTION_LIMIT - visitorQuestionsUsed);

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div className="bg-white border-b border-orange-100 px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl shadow font-bold">
              🐾
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">PawBot AI Assistant</h1>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                Powered by OpenAI GPT-4o
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authToken && (
              <button
                onClick={clearHistory}
                title="Clear history"
                className="px-3 py-2 text-xs border border-gray-200 text-gray-500 rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="px-4 py-2 text-sm border border-orange-300 text-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-colors"
            >
              🐕 Dog Profile
            </button>
          </div>
        </div>

        {showProfile && (
          <div className="max-w-3xl mx-auto mt-4 bg-orange-50 rounded-2xl p-4 border border-orange-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Set your dog's profile for personalized advice:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <input
                placeholder="Dog's name"
                value={dogProfile.name}
                onChange={(e) => setDogProfile({ ...dogProfile, name: e.target.value })}
                className="px-3 py-2 text-sm rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                placeholder="Breed (e.g. Labrador)"
                value={dogProfile.breed}
                onChange={(e) => setDogProfile({ ...dogProfile, breed: e.target.value })}
                className="px-3 py-2 text-sm rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                placeholder="Age (e.g. 2 years)"
                value={dogProfile.age}
                onChange={(e) => setDogProfile({ ...dogProfile, age: e.target.value })}
                className="px-3 py-2 text-sm rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <button
              onClick={() => setShowProfile(false)}
              className="mt-3 px-4 py-1.5 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors"
            >
              Save Profile ✓
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="flex gap-1 items-center text-orange-400">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="ml-2 text-sm text-gray-400">Loading history...</span>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1 shadow">
                    🐾
                  </div>
                )}
                <div
                  className={`max-w-sm lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : msg.isError
                      ? 'bg-red-50 text-red-700 rounded-bl-none border border-red-200'
                      : 'bg-white text-gray-800 rounded-bl-none border border-orange-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{formatText(msg.text)}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-orange-200' : 'text-gray-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-sm mr-2 shadow">
                🐾
              </div>
              <div className="bg-white border border-orange-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {isVisitor && !historyLoading && !visitorLimitReached && (
            <div className="text-center py-2">
              <div className="inline-block px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl">
                Guest mode: {visitorQuestionsRemaining} of {VISITOR_QUESTION_LIMIT} free questions remaining this session.
              </div>
            </div>
          )}

          {isVisitor && !historyLoading && visitorLimitReached && (
            <div className="text-center py-4">
              <div className="inline-block px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl">
                Please sign in to continue chatting.
              </div>
              <div className="mt-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-orange-100 px-4 pt-3 pb-1">
        <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-2">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              disabled={chatDisabled}
              className="flex-shrink-0 px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs rounded-full hover:bg-orange-100 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-orange-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={
              visitorLimitReached && isVisitor
                ? 'Please sign in to continue chatting.'
                : 'Ask PawBot anything about your dog...'
            }
            disabled={chatDisabled}
            className="flex-1 px-5 py-3 rounded-full border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatDisabled}
            className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 shadow text-lg"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
