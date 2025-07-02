import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, Send, Users, MessageCircle, Plus, Copy, Check, Home, Rocket } from 'lucide-react'

function App() {
  const roomIdref = useRef<HTMLInputElement>(null);
  const msgref = useRef<HTMLInputElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(true);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Space background animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star system
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * 0.02 + 0.005
    }));

    // Nebula particles
    const nebula = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 100 + 50,
      speed: Math.random() * 0.2 + 0.05,
      hue: Math.random() * 60 + 240, // Blue to purple range
      opacity: Math.random() * 0.1 + 0.05
    }));

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = isDark ? '#0a0a0f' : '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula
      nebula.forEach(particle => {
        particle.x -= particle.speed;
        if (particle.x + particle.size < 0) {
          particle.x = canvas.width + particle.size;
          particle.y = Math.random() * canvas.height;
        }

        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, ${particle.opacity})`);
        gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 50%, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${particle.hue}, 100%, 30%, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          particle.x - particle.size,
          particle.y - particle.size,
          particle.size * 2,
          particle.size * 2
        );
      });

      // Draw stars
      stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }

        star.opacity += Math.sin(Date.now() * star.twinkle) * 0.1;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        // Add star glow
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 3
        );
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity * 0.8})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    ws.current = new WebSocket("wss://chatwithroom.onrender.com")
    
    ws.current.onopen = () => {
      setIsConnected(true);
      console.log("🔗 Connected to server");
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      setIsJoined(false);
      setCurrentRoomId('');
      setTypingUsers(new Set());
      console.log("❌ Disconnected from server");
    };

    ws.current.onmessage = (event) => {
      console.log("📩 Message from server:", event.data);
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          if (data.isTyping) {
            setTypingUsers(prev => new Set([...prev, data.userId]));
          } else {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
          }
        } else {
          setMessages(prev => [...prev, event.data]);
        }
      } catch (e) {
        setMessages(prev => [...prev, event.data]);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [])

  // Generate unique room ID
  const generateRoomId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `galaxy_${timestamp}_${randomStr}`;
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setCurrentRoomId(newRoomId);
    
    if (roomIdref.current) {
      roomIdref.current.value = newRoomId;
    }
    
    if (ws.current) {
      const payload = {
        "type": "join",
        "payload": {
          "roomId": newRoomId
        }
      }
      console.log("🚀 Creating and joining galaxy:", payload);
      const spay = JSON.stringify(payload);
      ws.current.send(spay);
      setIsJoined(true);
    }
  };

  const copyRoomId = async () => {
    if (currentRoomId) {
      try {
        await navigator.clipboard.writeText(currentRoomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy galaxy ID:', err);
      }
    }
  };

  const sendTypingIndicator = (typing: boolean) => {
    if (ws.current && isJoined) {
      const payload = {
        "type": "typing",
        "payload": {
          "isTyping": typing,
          "roomId": currentRoomId
        }
      };
      ws.current.send(JSON.stringify(payload));
    }
  };

  const handleInputChange = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(false);
    }, 2000);
  };

  const sendmessage = () => {
    const msg = msgref.current?.value;
    if (msg && ws.current && isJoined) {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
      
      const payload = {
        "type": "chat",
        "payload": {
          "message": msg
        }
      }
      console.log(payload)
      const spay = JSON.stringify(payload)
      ws.current.send(spay);
      if (msgref.current) msgref.current.value = '';
    }
  }

  const joinUser = () => {
    const roomid = roomIdref.current?.value;
    if (roomid && ws.current) {
      const payload = {
        "type": "join",
        "payload": {
          "roomId": roomid
        }
      }
      console.log("🌌 Joining galaxy:", payload)
      const spay = JSON.stringify(payload);
      ws.current.send(spay);
      setIsJoined(true);
      setCurrentRoomId(roomid);
    }
  }

  const leaveRoom = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    setIsJoined(false);
    setCurrentRoomId('');
    setMessages([]);
    setTypingUsers(new Set());
    if (roomIdref.current) {
      roomIdref.current.value = '';
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  }

  const canChat = isConnected && isJoined && currentRoomId;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Inter:wght@300;400;500;600&display=swap');
        
        .space-font {
          font-family: 'Orbitron', monospace;
        }
        
        .text-font {
          font-family: 'Inter', sans-serif;
        }
        
        .typing-indicator {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        
        .typing-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: linear-gradient(45deg, #00d4ff, #7c3aed);
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-morphism-light {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .neon-glow {
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
        }
        
        .neon-glow:hover {
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
        }
        
        .cosmic-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .aurora-gradient {
          background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 50%, #f093fb 100%);
        }
        
        .star-field {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
      `}</style>
      
      {/* Animated Space Background */}
      <canvas 
        ref={canvasRef} 
        className="star-field"
      />
      
      <div className="min-h-screen relative z-10">
        
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-3 rounded-2xl transition-all duration-300 neon-glow ${
              isDark 
                ? 'glass-morphism text-cyan-400 hover:text-cyan-300' 
                : 'glass-morphism-light text-purple-600 hover:text-purple-700'
            }`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Connection Status */}
        <div className="absolute top-6 left-6 z-20">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-font ${
            isDark 
              ? 'glass-morphism text-cyan-300' 
              : 'glass-morphism-light text-purple-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 shadow-green-400' : 'bg-red-400 shadow-red-400'
            } shadow-lg`}></div>
            <span>{isConnected ? 'Connected to Starbase' : 'Lost in Space'}</span>
          </div>
        </div>

        <div className="min-h-screen flex p-6 gap-6">
          {/* Sidebar - Galaxy Control */}
          <div className={`w-80 h-fit rounded-3xl transition-all duration-300 ${
            isDark 
              ? 'glass-morphism neon-glow' 
              : 'glass-morphism-light'
          }`}>
            
            <div className="p-6">
              {/* Sidebar Header */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 aurora-gradient">
                  <Rocket className="w-8 h-8 text-white" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-purple-600/20 animate-pulse"></div>
                </div>
                <h2 className={`text-xl font-bold mb-2 space-font ${
                  isDark ? 'text-cyan-300' : 'text-purple-700'
                }`}>
                  GALAXY CONTROL
                </h2>
                <p className={`text-sm text-font ${
                  isDark ? 'text-cyan-200/70' : 'text-purple-600/70'
                }`}>
                  Create or join a galaxy to start transmitting
                </p>
              </div>

              {/* Galaxy Actions */}
              <div className="space-y-4">
                {/* Create Galaxy Button */}
                <button
                  onClick={createRoom}
                  disabled={!isConnected}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed space-font neon-glow ${
                    isDark 
                      ? 'aurora-gradient text-white hover:shadow-cyan-500/30' 
                      : 'cosmic-gradient text-white hover:shadow-purple-500/30'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>CREATE GALAXY</span>
                </button>

                {/* Divider */}
                <div className={`text-center text-sm space-font ${
                  isDark ? 'text-cyan-400/50' : 'text-purple-500/50'
                }`}>
                  — OR NAVIGATE TO —
                </div>
                
                {/* Join Galaxy */}
                <div className="space-y-3">
                  <input
                    ref={roomIdref}
                    placeholder="Enter galaxy coordinates..."
                    onKeyPress={(e) => handleKeyPress(e, joinUser)}
                    className={`w-full px-4 py-3 rounded-2xl border-0 transition-all duration-300 text-sm text-font ${
                      isDark 
                        ? 'glass-morphism text-cyan-100 placeholder-cyan-300/50 focus:shadow-cyan-500/20' 
                        : 'glass-morphism-light text-purple-700 placeholder-purple-500/50 focus:shadow-purple-500/20'
                    } focus:outline-none focus:shadow-lg`}
                  />
                  <button
                    onClick={joinUser}
                    disabled={!isConnected}
                    className={`w-full px-4 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed space-font ${
                      isDark 
                        ? 'glass-morphism text-cyan-300 hover:bg-cyan-500/10 neon-glow' 
                        : 'glass-morphism-light text-purple-700 hover:bg-purple-500/10'
                    }`}
                  >
                    JOIN GALAXY
                  </button>
                </div>
              </div>

              {/* Current Galaxy Display */}
              {currentRoomId && (
                <div className={`mt-6 p-4 rounded-2xl ${
                  isDark 
                    ? 'glass-morphism border-cyan-500/30' 
                    : 'glass-morphism-light border-purple-400/30'
                } border`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-1 space-font ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}>
                        CURRENT GALAXY
                      </p>
                      <p className={`font-mono text-sm break-all ${
                        isDark ? 'text-cyan-200' : 'text-purple-700'
                      }`}>
                        {currentRoomId}
                      </p>
                    </div>
                    <button
                      onClick={copyRoomId}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        isDark 
                          ? 'hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300' 
                          : 'hover:bg-purple-500/20 text-purple-600 hover:text-purple-700'
                      }`}
                      title="Copy Galaxy Coordinates"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={leaveRoom}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 space-font ${
                      isDark 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30' 
                        : 'bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-400/30'
                    }`}
                  >
                    LEAVE GALAXY
                  </button>
                </div>
              )}

              {/* Connection Status in Sidebar */}
              {!isConnected && (
                <div className={`mt-6 p-3 rounded-2xl border ${
                  isDark 
                    ? 'glass-morphism border-red-500/30 text-red-300' 
                    : 'glass-morphism-light border-red-400/30 text-red-600'
                }`}>
                  <p className="text-center text-xs space-font">
                    ⚠️ TRANSMISSION LOST
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Communication Array */}
          <div className="flex-1 flex flex-col">
            {canChat ? (
              <div className={`flex-1 rounded-3xl transition-all duration-300 flex flex-col ${
                isDark 
                  ? 'glass-morphism neon-glow' 
                  : 'glass-morphism-light'
              }`}>
                
                {/* Communication Header */}
                <div className={`p-6 border-b ${
                  isDark ? 'border-cyan-500/20' : 'border-purple-400/20'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative p-3 rounded-2xl aurora-gradient">
                      <MessageCircle className="w-6 h-6 text-white" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-purple-600/20 animate-pulse"></div>
                    </div>
                    <div>
                      <h1 className={`text-xl font-bold space-font ${
                        isDark ? 'text-cyan-300' : 'text-purple-700'
                      }`}>
                        GALACTIC COMMUNICATIONS
                      </h1>
                      <p className={`text-sm text-font ${
                        isDark ? 'text-cyan-200/70' : 'text-purple-600/70'
                      }`}>
                        {currentRoomId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div key={index} className={`p-4 rounded-2xl max-w-2xl backdrop-blur-sm ${
                          isDark 
                            ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20' 
                            : 'bg-purple-500/10 text-purple-800 border border-purple-400/20'
                        }`}>
                          <p className="text-sm leading-relaxed text-font">{msg}</p>
                        </div>
                      ))}
                      
                      {/* Typing Indicator */}
                      {typingUsers.size > 0 && (
                        <div className={`p-4 rounded-2xl max-w-xs backdrop-blur-sm ${
                          isDark 
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' 
                            : 'bg-cyan-500/10 text-cyan-700 border border-cyan-400/20'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs space-font">TRANSMISSION INCOMING</span>
                            <div className="typing-indicator">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${
                          isDark ? 'text-cyan-500/50' : 'text-purple-500/50'
                        }`} />
                        <p className={`text-lg font-bold mb-2 space-font ${
                          isDark ? 'text-cyan-400/70' : 'text-purple-600/70'
                        }`}>
                          CHANNEL SILENT
                        </p>
                        <p className={`text-sm text-font ${
                          isDark ? 'text-cyan-300/50' : 'text-purple-500/50'
                        }`}>
                          Begin transmission to establish communication
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className={`p-6 border-t ${
                  isDark ? 'border-cyan-500/20' : 'border-purple-400/20'
                }`}>
                  <div className="flex space-x-3">
                    <input
                      ref={msgref}
                      placeholder="Transmit message across the galaxy..."
                      onChange={handleInputChange}
                      onKeyPress={(e) => handleKeyPress(e, sendmessage)}
                      className={`flex-1 px-4 py-3 rounded-2xl border-0 transition-all duration-300 text-font ${
                        isDark 
                          ? 'glass-morphism text-cyan-100 placeholder-cyan-300/50 focus:shadow-cyan-500/20' 
                          : 'glass-morphism-light text-purple-700 placeholder-purple-500/50 focus:shadow-purple-500/20'
                      } focus:outline-none focus:shadow-lg`}
                    />
                    <button
                      onClick={sendmessage}
                      className="p-3 rounded-2xl transition-all duration-300 aurora-gradient text-white neon-glow hover:shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Welcome Screen */
              <div className={`flex-1 rounded-3xl flex items-center justify-center ${
                isDark 
                  ? 'glass-morphism neon-glow' 
                  : 'glass-morphism-light'
              }`}>
                <div className="text-center p-8">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 aurora-gradient">
                    <Home className="w-12 h-12 text-white" />
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/20 to-purple-600/20 animate-pulse"></div>
                  </div>
                  <h1 className={`text-4xl font-bold mb-4 space-font ${
                    isDark ? 'text-cyan-300' : 'text-purple-700'
                  }`}>
                    COSMIC CHAT
                  </h1>
                  <p className={`text-lg mb-6 max-w-md mx-auto text-font ${
                    isDark ? 'text-cyan-200/70' : 'text-purple-600/70'
                  }`}>
                    {!isConnected 
                      ? "Establishing connection to the cosmos..."
                      : "Create a new galaxy or join existing coordinates to begin interstellar communication"
                    }
                  </p>
                  {isConnected && (
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-sm ${
                      isDark 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-green-500/20 text-green-700 border border-green-400/30'
                    }`}>
                      <div className="w-2 h-2 bg-green-400 rounded-full shadow-green-400 shadow-lg animate-pulse"></div>
                      <span className="text-sm font-semibold space-font">READY FOR TRANSMISSION</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App