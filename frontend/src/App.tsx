import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, Send, Users, MessageCircle, Plus, Copy, Check, Home } from 'lucide-react'

function App() {
  const roomIdref = useRef<HTMLInputElement>(null);
  const msgref = useRef<HTMLInputElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080")
    
    ws.current.onopen = () => {
      setIsConnected(true);
      console.log("🔗 Connected to server");
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      setIsJoined(false);
      setCurrentRoomId('');
      console.log("❌ Disconnected from server");
    };

    ws.current.onmessage = (event) => {
      console.log("📩 Message from server:", event.data);
      setMessages(prev => [...prev, event.data]);
    };

    return () => {
      ws.current?.close();
    };
  }, [])

  // Generate unique room ID
  const generateRoomId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `room_${timestamp}_${randomStr}`;
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setCurrentRoomId(newRoomId);
    
    if (roomIdref.current) {
      roomIdref.current.value = newRoomId;
    }
    
    // Automatically join the created room
    if (ws.current) {
      const payload = {
        "type": "join",
        "payload": {
          "roomId": newRoomId
        }
      }
      console.log("🏠 Creating and joining room:", payload);
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
        console.error('Failed to copy room ID:', err);
      }
    }
  };

  const sendmessage = () => {
    const msg = msgref.current?.value;
    if (msg && ws.current && isJoined) {
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
      console.log("🚪 Joining room:", payload)
      const spay = JSON.stringify(payload);
      ws.current.send(spay);
      setIsJoined(true);
      setCurrentRoomId(roomid);
    }
  }

  const leaveRoom = () => {
    setIsJoined(false);
    setCurrentRoomId('');
    setMessages([]);
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
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
      `}</style>
      
      <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} relative overflow-hidden`}>
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-4 -left-4 w-72 h-72 ${isDark ? 'bg-purple-500' : 'bg-blue-400'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob`}></div>
          <div className={`absolute -top-4 -right-4 w-72 h-72 ${isDark ? 'bg-blue-500' : 'bg-purple-400'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000`}></div>
          <div className={`absolute -bottom-8 left-20 w-72 h-72 ${isDark ? 'bg-pink-500' : 'bg-green-400'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000`}></div>
          <div className={`absolute bottom-8 right-20 w-72 h-72 ${isDark ? 'bg-indigo-500' : 'bg-yellow-400'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000`}></div>
        </div>

        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-3 rounded-full transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                : 'bg-white hover:bg-gray-100 text-gray-700'
            } shadow-lg hover:shadow-xl transform hover:scale-110`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Connection Status */}
        <div className="absolute top-6 left-6 z-10">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            isDark ? 'bg-gray-800/80' : 'bg-white/80'
          } backdrop-blur-sm shadow-lg`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="relative z-10 min-h-screen flex p-6 gap-6">
          {/* Sidebar - Room Management */}
          <div className={`w-80 ${
            isDark 
              ? 'bg-gray-800/90 border-gray-700' 
              : 'bg-white/90 border-gray-200'
          } backdrop-blur-lg rounded-3xl shadow-2xl border p-6 h-fit`}>
            
            {/* Sidebar Header */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${
                isDark ? 'bg-purple-600' : 'bg-blue-600'
              } rounded-xl mb-3`}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                Room Manager
              </h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Create or join a room
              </p>
            </div>

            {/* Room Actions */}
            <div className="space-y-4">
              {/* Create Room Button */}
              <button
                onClick={createRoom}
                disabled={!isConnected}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span>Create New Room</span>
              </button>

              {/* Divider */}
              <div className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                — or —
              </div>
              
              {/* Join Room */}
              <div className="space-y-3">
                <input
                  ref={roomIdref}
                  placeholder="Enter existing room ID"
                  onKeyPress={(e) => handleKeyPress(e, joinUser)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    isDark ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
                  }`}
                />
                <button
                  onClick={joinUser}
                  disabled={!isConnected}
                  className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  Join Room
                </button>
              </div>
            </div>

            {/* Current Room Display */}
            {currentRoomId && (
              <div className={`mt-6 p-4 rounded-xl ${
                isDark ? 'bg-gray-700/50 border border-gray-600' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                      Current Room:
                    </p>
                    <p className={`font-mono text-sm ${isDark ? 'text-green-400' : 'text-green-600'} break-all`}>
                      {currentRoomId}
                    </p>
                  </div>
                  <button
                    onClick={copyRoomId}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isDark 
                        ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-blue-100 text-gray-600 hover:text-gray-800'
                    }`}
                    title="Copy Room ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={leaveRoom}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300' 
                      : 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700'
                  }`}
                >
                  Leave Room
                </button>
              </div>
            )}

            {/* Connection Status in Sidebar */}
            {!isConnected && (
              <div className={`mt-6 p-3 rounded-xl ${
                isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-center text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                  ⚠️ WebSocket disconnected
                </p>
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {canChat ? (
              <div className={`flex-1 ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-700' 
                  : 'bg-white/90 border-gray-200'
              } backdrop-blur-lg rounded-3xl shadow-2xl border flex flex-col`}>
                
                {/* Chat Header */}
                <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${isDark ? 'bg-purple-600' : 'bg-blue-600'} rounded-lg`}>
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Chat Room
                      </h1>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Connected to {currentRoomId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div key={index} className={`p-3 rounded-lg ${
                          isDark ? 'bg-gray-700/50' : 'bg-gray-100'
                        }`}>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {msg}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          No messages yet
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Start the conversation by sending a message below
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex space-x-3">
                    <input
                      ref={msgref}
                      placeholder="Type your message..."
                      onKeyPress={(e) => handleKeyPress(e, sendmessage)}
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:bg-gray-600' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                        isDark ? 'focus:ring-purple-500' : 'focus:ring-blue-500'
                      }`}
                    />
                    <button
                      onClick={sendmessage}
                      className={`p-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                        isDark 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Welcome/Instructions Screen */
              <div className={`flex-1 ${
                isDark 
                  ? 'bg-gray-800/90 border-gray-700' 
                  : 'bg-white/90 border-gray-200'
              } backdrop-blur-lg rounded-3xl shadow-2xl border flex items-center justify-center`}>
                <div className="text-center p-8">
                  <div className={`inline-flex items-center justify-center w-20 h-20 ${
                    isDark ? 'bg-purple-600' : 'bg-blue-600'
                  } rounded-3xl mb-6`}>
                    <Home className="w-10 h-10 text-white" />
                  </div>
                  <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Welcome to WebSocket Chat
                  </h1>
                  <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md`}>
                    {!isConnected 
                      ? "Connecting to server..."
                      : "Create a new room or join an existing one to start chatting"
                    }
                  </p>
                  {isConnected && (
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                      isDark ? 'bg-green-900/30' : 'bg-green-50'
                    }`}>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        Ready to chat
                      </span>
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