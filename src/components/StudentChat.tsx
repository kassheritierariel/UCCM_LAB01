import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Users, Volume2, Loader2, Play } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { GoogleGenAI, Modality } from '@google/genai';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'other';
  timestamp: Date;
  senderName?: string;
  senderId?: string;
}

export default function StudentChat() {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<'ai' | 'general'>('ai');
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! Je suis votre Assistant IA. Comment puis-je vous aider dans vos études aujourd\'hui ?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [generalMessages, setGeneralMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, generalMessages, isTyping, activeChat]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'generalChat'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          sender: data.senderId === user.uid ? 'user' : 'other',
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          senderName: data.senderName,
          senderId: data.senderId
        };
      });
      setGeneralMessages(msgs);
    }, (error) => {
      console.error("Error fetching general chat messages:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const messageText = inputText;
    setInputText('');

    if (activeChat === 'ai') {
      const newUserMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'user',
        timestamp: new Date()
      };

      setAiMessages(prev => [...prev, newUserMessage]);
      setIsTyping(true);
      
      try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
        
        // Format history for Gemini Chat
        const chat = ai.chats.create({
          model: 'gemini-3.1-pro-preview',
          config: {
            systemInstruction: 'Vous êtes un tuteur IA bienveillant pour des étudiants universitaires. Répondez de manière claire et concise.'
          }
        });

        // Send the new message
        const response = await chat.sendMessage({ message: newUserMessage.text });
        
        const newAiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.text || 'Désolé, je n\'ai pas pu générer de réponse.',
          sender: 'ai',
          timestamp: new Date()
        };
        
        setAiMessages(prev => [...prev, newAiMessage]);
      } catch (error) {
        console.error('Error with AI Chat:', error);
        setAiMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Une erreur de connexion est survenue.',
          sender: 'ai',
          timestamp: new Date()
        }]);
      } finally {
        setIsTyping(false);
      }
    } else if (activeChat === 'general') {
      try {
        await addDoc(collection(db, 'generalChat'), {
          text: messageText,
          senderId: user.uid,
          senderName: user.name || 'Étudiant',
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Error sending general chat message:", error);
      }
    }
  };

  const handlePlayAudio = async (text: string, messageId: string) => {
    if (isPlayingAudio) return; // Prevent multiple plays
    setIsPlayingAudio(messageId);
    
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/pcm;rate=24000;base64,${base64Audio}`);
        audio.onended = () => setIsPlayingAudio(null);
        await audio.play();
      } else {
        setIsPlayingAudio(null);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(null);
    }
  };

  return (
    <div className="flex h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800">Discussions</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveChat('ai')}
            className={`w-full p-4 flex items-center gap-3 transition-colors text-left ${activeChat === 'ai' ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-slate-100 border-l-4 border-transparent'}`}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-slate-800 truncate">Assistant IA</h3>
              <p className="text-xs text-slate-500 truncate">Tuteur virtuel disponible 24/7</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveChat('general')}
            className={`w-full p-4 flex items-center gap-3 transition-colors text-left ${activeChat === 'general' ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'hover:bg-slate-100 border-l-4 border-transparent'}`}
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-semibold text-slate-800 truncate">Campus Général</h3>
              <p className="text-xs text-slate-500 truncate">Discussion avec les étudiants</p>
            </div>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#efeae2]">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeChat === 'ai' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
            {activeChat === 'ai' ? <Bot className="w-5 h-5 text-blue-600" /> : <Users className="w-5 h-5 text-emerald-600" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{activeChat === 'ai' ? 'Assistant IA' : 'Campus Général'}</h3>
            <p className="text-xs text-slate-500">{activeChat === 'ai' ? 'En ligne' : '120 participants'}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeChat === 'general' ? (
            <>
              {generalMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Users className="w-12 h-12 mb-3 opacity-20" />
                  <p>Soyez le premier à envoyer un message !</p>
                </div>
              ) : (
                generalMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative group ${
                      msg.sender === 'user' 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none'
                    }`}>
                      {msg.sender !== 'user' && (
                        <p className="text-xs font-semibold text-emerald-600 mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <>
              {aiMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm relative group ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {/* TTS Button for AI messages */}
                    {msg.sender === 'ai' && (
                      <button 
                        onClick={() => handlePlayAudio(msg.text, msg.id)}
                        disabled={isPlayingAudio !== null}
                        className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Écouter"
                      >
                        {isPlayingAudio === msg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez un message..."
              disabled={isTyping && activeChat === 'ai'}
              className="flex-1 py-3 px-4 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || (isTyping && activeChat === 'ai')}
              className={`w-12 h-12 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ${
                activeChat === 'ai' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
