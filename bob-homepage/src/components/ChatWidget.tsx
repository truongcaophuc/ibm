import { useState, useRef, useCallback, useEffect } from 'react';
import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js';
import { WebSocketTransport } from '@pipecat-ai/websocket-transport';
import './ChatWidget.css';

const WS_URL = import.meta.env.VITE_BOT_START_URL || 'ws://localhost:7860/ws';

const EMOTION_DISPLAY_TIME = 5000; // show each emotion gif for 5s

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const EMOTIONS = ['active','aware_L','aware_R','confident','default','default_still','doubting','expecting','happy','helpless','impatient','innocent','interested','lazy','pleased','pretending','proud','questioning','serious','shocked','shy','singing','tired','worried'];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  // displayEmotion = what's currently showing as gif src
  // activeEmotion = emotion set by bot (non-idle), null when idle
  const [displayEmotion, setDisplayEmotion] = useState('default_still');
  const activeEmotionRef = useRef<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleCycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idlePhaseRef = useRef<'default' | 'default_still'>('default_still');

  const pcClientRef = useRef<PipecatClient | null>(null);
  const botAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(1);
  const hasConnectedRef = useRef(false);

  // Preload all emotion GIFs
  useEffect(() => {
    EMOTIONS.forEach(emo => {
      const img = new Image();
      img.src = `/emotions/${emo}/${emo}.gif`;
    });
  }, []);

  // Start idle cycle: default (5s) → default_still (5s) → repeat
  const startIdleCycle = useCallback(() => {
    // Clear any existing cycle
    if (idleCycleRef.current) clearInterval(idleCycleRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    activeEmotionRef.current = null;
    idlePhaseRef.current = 'default_still';
    setDisplayEmotion('default_still');

    idleCycleRef.current = setInterval(() => {
      idlePhaseRef.current = idlePhaseRef.current === 'default_still' ? 'default' : 'default_still';
      setDisplayEmotion(idlePhaseRef.current);
    }, EMOTION_DISPLAY_TIME);
  }, []);

  // Set a non-idle emotion: show for 5s, then return to idle
  const triggerEmotion = useCallback((emotion: string) => {
    // Skip if it's a default emotion
    if (emotion === 'default' || emotion === 'default_still') return;

    // Stop idle cycle
    if (idleCycleRef.current) clearInterval(idleCycleRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    activeEmotionRef.current = emotion;
    setDisplayEmotion(emotion);

    // After 5s, return to idle
    idleTimerRef.current = setTimeout(() => {
      startIdleCycle();
    }, EMOTION_DISPLAY_TIME);
  }, [startIdleCycle]);

  // Start idle cycle on mount
  useEffect(() => {
    startIdleCycle();
    return () => {
      if (idleCycleRef.current) clearInterval(idleCycleRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [startIdleCycle]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Bot audio element
  useEffect(() => {
    botAudioRef.current = document.createElement('audio');
    botAudioRef.current.autoplay = true;
    document.body.appendChild(botAudioRef.current);
    return () => { botAudioRef.current?.remove(); };
  }, []);

  const now = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const addMsg = useCallback((sender: 'user' | 'bot', text: string) => {
    setIsTyping(false);
    setMessages(prev => [...prev, { id: msgIdRef.current++, sender, text, time: now() }]);
  }, []);

  const setupBotAudio = useCallback((track: MediaStreamTrack) => {
    if (botAudioRef.current) {
      botAudioRef.current.srcObject = new MediaStream([track]);
    }
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);
    try {
      const convId = 'conv_' + Date.now();

      const client = new PipecatClient({
        transport: new WebSocketTransport(),
        enableMic: true,
        enableCam: false,
        callbacks: {
          onConnected: () => {
            console.log('[Chat] Connected');
            setIsConnected(true);
            setIsConnecting(false);
            setIsMicActive(true);
          },
          onDisconnected: () => {
            console.log('[Chat] Disconnected');
            setIsConnected(false);
            setIsConnecting(false);
            pcClientRef.current = null;
          },
          onBotReady: () => {
            console.log('[Chat] Bot ready');
            if (pcClientRef.current) {
              const tracks = pcClientRef.current.tracks();
              console.log('[Chat] Tracks:', {
                localAudio: !!tracks.local?.audio,
                localAudioEnabled: tracks.local?.audio?.enabled,
                localAudioMuted: tracks.local?.audio?.muted,
                botAudio: !!tracks.bot?.audio,
              });
              if (tracks.bot?.audio) setupBotAudio(tracks.bot.audio);
              // Monitor mic audio level
              if (tracks.local?.audio) {
                const stream = new MediaStream([tracks.local.audio]);
                const ctx = new AudioContext();
                const src = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                src.connect(analyser);
                const data = new Uint8Array(analyser.frequencyBinCount);
                const checkLevel = () => {
                  analyser.getByteFrequencyData(data);
                  const avg = data.reduce((a, b) => a + b, 0) / data.length;
                  if (avg > 5) console.log('[Chat] Mic level:', avg.toFixed(1));
                  requestAnimationFrame(checkLevel);
                };
                checkLevel();
              }
            }
          },
          onUserTranscript: (data) => {
            console.log('[Chat] User transcript:', data);
            if (data.final) {
              addMsg('user', data.text);
              setIsTyping(true);
              triggerEmotion('expecting');
            }
          },
          onBotOutput: (data) => {
            console.log('[Chat] Bot output:', data);
            if (!data.spoken) {
              let text = data.text;

              // Parse [EMO:xxx] tag from BE
              const emoMatch = text.match(/^\[EMO:(\w+)\]$/);
              if (emoMatch) {
                const emotion = emoMatch[1];
                console.log('[Chat] Emotion detected:', emotion);
                triggerEmotion(emotion);
                return;
              }

              // Strip inline [EMO:xxx] if embedded in text
              const inlineEmo = text.match(/\[EMO:(\w+)\]/);
              if (inlineEmo) {
                triggerEmotion(inlineEmo[1]);
                text = text.replace(/\[EMO:\w+\]\s*/, '');
              }

              addMsg('bot', text);
            }
          },
          onBotStartedSpeaking: () => console.log('[Chat] Bot speaking'),
          onBotStoppedSpeaking: () => console.log('[Chat] Bot stopped'),
          onError: (error) => {
            console.error('[Chat] Error:', error);
            setIsConnecting(false);
          },
        },
      });

      client.on(RTVIEvent.TrackStarted, (track: MediaStreamTrack, participant: any) => {
        if (!participant?.local && track.kind === 'audio') {
          setupBotAudio(track);
        }
      });

      pcClientRef.current = client;
      await client.initDevices();
      await client.connect({ wsUrl: WS_URL + '?conversation_id=' + encodeURIComponent(convId) });

    } catch (error: any) {
      console.error('[Chat] Connection error:', error);
      addMsg('bot', 'Không thể kết nối. Vui lòng thử lại sau.');
      setIsConnecting(false);
    }
  }, [addMsg, setupBotAudio, triggerEmotion, isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    if (pcClientRef.current) {
      try { await pcClientRef.current.disconnect(); } catch (e) { console.error(e); }
      pcClientRef.current = null;
    }
    setIsConnected(false);
    hasConnectedRef.current = false;
  }, []);

  // Auto-connect when widget opens
  useEffect(() => {
    if (isOpen && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect();
    }
  }, [isOpen, connect]);

  const sendMsg = useCallback(() => {
    if (!input.trim()) return;
    if (pcClientRef.current && isConnected) {
      addMsg('user', input.trim());
      setIsTyping(true);
      triggerEmotion('expecting');
      pcClientRef.current.sendText(input.trim());
      setInput('');
    }
  }, [input, isConnected, addMsg, triggerEmotion]);

  const toggleMic = () => {
    if (pcClientRef.current && isConnected) {
      const newState = !isMicActive;
      pcClientRef.current.enableMic(newState);
      setIsMicActive(newState);
    }
  };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>&#128172;</button>
      )}

      {/* Panel + Emotion Avatar */}
      {isOpen && (
        <div className="chat-widget-container">
          {/* Emotion GIF */}
          <div className="chat-emotion">
            <img
              src={`/emotions/${displayEmotion}/${displayEmotion}.gif`}
              alt={displayEmotion}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/emotions/default_still/default_still.gif';
              }}
            />
            {/* <span className="chat-emotion-label">{displayEmotion}</span> */}
          </div>
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-header-avatar">
                <img src="/assets/BobAnimationPlaceholder-BWZj7W25.svg" alt="Bob" />
              </div>
              <div className="chat-header-info">
                <h4>POPTECH VoiceChat</h4>
                <div className="chat-status">
                  <div className={`chat-status-dot ${isConnected ? '' : 'offline'}`} />
                  <p>{isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline'}</p>
                </div>
              </div>
            </div>
            <button className="chat-close" onClick={() => { setIsOpen(false); if (isConnected) disconnect(); }}>&times;</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.sender}`}>
                <div className="bubble">{m.text}</div>
                <span className="time">{m.time}</span>
              </div>
            ))}
            {isTyping && (
              <div className="chat-msg bot">
                <div className="bubble">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <button
              className={`chat-mic ${isMicActive ? 'active' : ''}`}
              onClick={toggleMic}
              title={isMicActive ? 'Tắt mic' : 'Bật mic'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMicActive ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>
            <input
              className="chat-input"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
            />
            <button className="chat-send" onClick={sendMsg}>&#10148;</button>
          </div>
        </div>
        </div>
      )}
    </>
  );
}
