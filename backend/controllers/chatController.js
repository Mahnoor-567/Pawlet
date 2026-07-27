const ChatHistory = require('../models/ChatHistory');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const VISITOR_QUESTION_LIMIT = 3;

// In-memory visitor session counters (no chat history stored)
const guestSessions = new Map();

const SYSTEM_PROMPT = `You are PawBot, an expert AI dog care assistant for PawletApp — a platform for dog lovers in Pakistan. 
You help users with: dog health, nutrition, feeding, vaccination schedules, grooming, training, behavior, breed-specific advice, parasite prevention, and general dog care.
Always be friendly, concise, and helpful. If a user mentions their dog's name, breed, or age, use that info to personalize your advice.
Keep responses short and practical — use bullet points when listing steps. Respond in the same language the user writes in (Urdu or English).
Never answer questions unrelated to dogs or pets. If asked something unrelated, politely redirect back to dog care topics.`;

const buildUserMessageText = (message, dogProfile) => {
  let userMessageText = message;
  if (dogProfile && (dogProfile.name || dogProfile.breed || dogProfile.age)) {
    const profileInfo = [];
    if (dogProfile.name) profileInfo.push(`dog's name: ${dogProfile.name}`);
    if (dogProfile.breed) profileInfo.push(`breed: ${dogProfile.breed}`);
    if (dogProfile.age) profileInfo.push(`age: ${dogProfile.age}`);
    userMessageText = `[User's ${profileInfo.join(', ')}]\n${message}`;
  }
  return userMessageText;
};

const generateAIReply = async (userMessageText, priorMessages = []) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    throw new Error('AI API key not configured. Please add GEMINI_API_KEY or OPENAI_API_KEY in your .env file.');
  }

  const recentMessages = priorMessages.slice(-20);

  if (geminiKey) {
    const geminiContents = recentMessages.map(msg => ({
      role: msg.role === 'model' || msg.role === 'bot' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    geminiContents.push({
      role: 'user',
      parts: [{ text: userMessageText }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error('AI service error (Gemini). Please try again.');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  const openaiHistory = recentMessages.map(msg => ({
    role: msg.role === 'model' || msg.role === 'bot' ? 'assistant' : 'user',
    content: msg.text
  }));

  const openaiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...openaiHistory,
    { role: 'user', content: userMessageText }
  ];

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', errorData);
    throw new Error('AI service error (OpenAI). Please try again.');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
};

// Send a message and get AI response (authenticated users — unlimited, persisted)
const sendMessage = async (req, res) => {
  try {
    const { message, dogProfile } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, messages: [] });
    }

    const userMessageText = buildUserMessageText(message, dogProfile);
    const botReply = await generateAIReply(userMessageText, chatHistory.messages);

    if (!botReply) {
      return res.status(500).json({ success: false, message: 'No response from AI. Please try again.' });
    }

    chatHistory.messages.push({ role: 'user', text: message });
    chatHistory.messages.push({ role: 'model', text: botReply });
    chatHistory.updatedAt = new Date();
    await chatHistory.save();

    return res.json({ success: true, reply: botReply });
  } catch (error) {
    console.error('Chat error:', error);
    const status = error.message.includes('API key') ? 500 : 500;
    return res.status(status).json({ success: false, message: error.message || 'Server error. Please try again.' });
  }
};

// Visitor chat — limited questions per session, no history stored
const sendGuestMessage = async (req, res) => {
  try {
    const { message, dogProfile, sessionId, history } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const questionCount = guestSessions.get(sessionId) || 0;
    if (questionCount >= VISITOR_QUESTION_LIMIT) {
      return res.status(403).json({
        success: false,
        message: 'Please sign in to continue chatting.',
        limitReached: true
      });
    }

    const priorMessages = Array.isArray(history)
      ? history
          .filter(m => m && m.text && (m.role === 'user' || m.role === 'bot'))
          .map(m => ({ role: m.role === 'bot' ? 'model' : 'user', text: m.text }))
      : [];

    const userMessageText = buildUserMessageText(message, dogProfile);
    const botReply = await generateAIReply(userMessageText, priorMessages);

    if (!botReply) {
      return res.status(500).json({ success: false, message: 'No response from AI. Please try again.' });
    }

    guestSessions.set(sessionId, questionCount + 1);

    return res.json({
      success: true,
      reply: botReply,
      questionsUsed: questionCount + 1,
      questionsRemaining: Math.max(0, VISITOR_QUESTION_LIMIT - (questionCount + 1))
    });
  } catch (error) {
    console.error('Guest chat error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error. Please try again.' });
  }
};

// Get chat history for logged-in user
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      return res.json({ success: true, messages: [] });
    }

    const messages = chatHistory.messages.slice(-50).map(msg => ({
      role: msg.role === 'model' ? 'bot' : 'user',
      text: msg.text,
      time: msg.time
    }));

    return res.json({ success: true, messages });
  } catch (error) {
    console.error('Get history error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Clear chat history
const clearHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await ChatHistory.findOneAndUpdate(
      { userId },
      { messages: [], updatedAt: new Date() }
    );
    return res.json({ success: true, message: 'Chat history cleared.' });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { sendMessage, sendGuestMessage, getChatHistory, clearHistory };
