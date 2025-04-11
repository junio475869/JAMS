import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessagesSquare,
  Plus,
  Search,
  Send,
  PhoneCall,
  Video,
  Users,
  Settings,
  User,
  Info,
  Hash,
  MessageCircle,
  Heart,
  FileImage,
  Paperclip,
  Smile,
  Mic,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { io } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const socket = io({
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  secure: true
});

// Mock data for channels and messages
const CHANNELS = [
  { id: "general", name: "General", type: "channel", unread: 0 },
  { id: "jobs-alerts", name: "Job Alerts", type: "channel", unread: 3 },
  { id: "interview-tips", name: "Interview Tips", type: "channel", unread: 0 },
  {
    id: "tech-discussions",
    name: "Tech Discussions",
    type: "channel",
    unread: 12,
  },
];

const DIRECT_MESSAGES = [
  { id: "user1", name: "Sarah Johnson", status: "online", avatar: null },
  { id: "user2", name: "Michael Chen", status: "offline", avatar: null },
  { id: "user3", name: "Jessica Taylor", status: "away", avatar: null },
  { id: "user4", name: "Robert Garcia", status: "online", avatar: null },
];

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState(CHANNELS);
  const [directMessages, setDirectMessages] = useState(DIRECT_MESSAGES);
  const [activeChat, setActiveChat] = useState("general");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatType, setChatType] = useState("channel");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingUsers = new Set();


  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      toast({
        title: "Connected to chat",
        description: "You're now connected to the chat server",
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Lost connection to chat server",
        variant: "destructive",
      });
    });

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });
    socket.on('typing', (username) => {
      typingUsers.add(username);
    });
    socket.on('stopTyping', (username) => {
      typingUsers.delete(username);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.off('typing');
      socket.off('stopTyping');
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      userId: user.id,
      name: user.username,
      message: newMessage,
      timestamp: new Date().toISOString(),
      reactions: []
    };

    socket.emit('message', messageData);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    socket.emit('typing', user.username);
    setTimeout(() => {
      socket.emit('stopTyping', user.username);
    }, 2000); // Stop typing after 2 seconds of inactivity
  };

  const handleFileUpload = () => {
    // Placeholder for file upload handling
    const file = fileInputRef.current?.files?.[0];
    if(file){
      console.log("File uploaded:", file);
      // Implement actual file upload logic here
    }
  };

  const getActiveChannelName = () => {
    if (chatType === "channel") {
      const channel = channels.find((c) => c.id === activeChat);
      return channel ? `# ${channel.name}` : "";
    } else {
      const dm = directMessages.find((d) => d.id === activeChat);
      return dm ? dm.name : "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/50" />
              <Input
                type="search"
                placeholder="Search chats..."
                className="pl-8 bg-[var(--sidebar-item-hover)] border-[var(--border)] text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* Channels */}
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-xs font-medium text-foreground/70">
                  CHANNELS
                </h3>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {channels
                  .filter((channel) =>
                    channel.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                  )
                  .map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className={`w-full justify-start text-sm ${
                        activeChat === channel.id && chatType === "channel"
                          ? "sidebar-item-active text-foreground"
                          : "text-foreground/70 hover:text-foreground sidebar-item"
                      }`}
                      onClick={() => {
                        setActiveChat(channel.id);
                        setChatType("channel");
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Hash className="h-4 w-4 mr-3" />
                        <span className="truncate">{channel.name}</span>
                        {channel.unread > 0 && (
                          <span className="ml-auto bg-primary text-white rounded-full text-xs px-1.5 py-0.5">
                            {channel.unread}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            <Separator className="my-2 bg-[var(--border)]" />

            {/* Direct Messages */}
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-xs font-medium text-foreground/70">
                  DIRECT MESSAGES
                </h3>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                {directMessages
                  .filter((dm) =>
                    dm.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  .map((dm) => (
                    <Button
                      key={dm.id}
                      variant="ghost"
                      className={`w-full justify-start text-sm ${
                        activeChat === dm.id && chatType === "direct"
                          ? "sidebar-item-active text-foreground"
                          : "text-foreground/70 hover:text-foreground sidebar-item"
                      }`}
                      onClick={() => {
                        setActiveChat(dm.id);
                        setChatType("direct");
                      }}
                    >
                      <div className="flex items-center w-full">
                        <div className="relative mr-3">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">
                              {getInitials(dm.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${getStatusClass(dm.status)} border border-[var(--card)]`}
                          ></span>
                        </div>
                        <span className="truncate">{dm.name}</span>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main chat content */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="border-b border-[var(--border)] bg-[var(--card)] p-3 flex items-center justify-between">
            <div className="flex items-center">
              {chatType === "channel" ? (
                <Hash className="h-5 w-5 mr-2 text-foreground/70" />
              ) : (
                <div className="relative mr-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(getActiveChannelName())}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${
                      chatType === "direct"
                        ? getStatusClass(
                            directMessages.find((d) => d.id === activeChat)
                              ?.status || "offline",
                          )
                        : "bg-transparent"
                    } border border-[var(--card)]`}
                  ></span>
                </div>
              )}
              <div>
                <h2 className="font-medium text-base">
                  {getActiveChannelName()}
                </h2>
                {chatType === "channel" && (
                  <p className="text-xs text-foreground/70">
                    {Math.floor(Math.random() * 20) + 5} members
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]"
                onClick={() => {
                  if (chatType === 'direct') {
                    socket.emit('initiate_call', {
                      type: 'audio',
                      channelId: activeChat,
                      caller: user.id
                    });
                  }
                }}
              >
                <PhoneCall className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]"
                onClick={() => {
                  if (chatType === 'direct') {
                    socket.emit('initiate_call', {
                      type: 'video',
                      channelId: activeChat,
                      caller: user.id
                    });
                  }
                }}
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground/70 hover:text-foreground hover:bg-[var(--sidebar-item-hover)]"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === user.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] ${msg.userId === user.id ? "order-2" : "order-1"}`}
                  >
                    {msg.userId !== user.id && (
                      <div className="flex items-center mb-1">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>
                            {getInitials(msg.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{msg.name}</span>
                        <span className="text-xs text-foreground/60 ml-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        msg.userId === user.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-[var(--sidebar-item-hover)] text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    {msg.reactions?.length > 0 && (
                      <div className="flex mt-1 space-x-1">
                        {msg.reactions.map((reaction, index) => (
                          <span
                            key={index}
                            className="text-xs bg-[var(--card)] border border-[var(--border)] rounded-full px-1.5 py-0.5"
                          >
                            {reaction} 1
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input */}
          <div className="p-3 border-t border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  placeholder={`Message ${getActiveChannelName()}`}
                  className="min-h-[60px] resize-none pr-12 bg-[var(--sidebar-item-hover)] border-[var(--border)] rounded-md px-3 py-2 w-full"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                />
                {typingUsers.size > 0 && (
                  <div className="absolute -top-6 left-0 text-sm text-foreground/70">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="absolute bottom-2 right-2 flex space-x-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-foreground/70 hover:text-foreground"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <div className="emoji-mart">
                        <data-picker 
                          onEmojiSelect={(emoji) => {
                            setNewMessage(prev => prev + emoji.native);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/70 hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <Button
                size="icon"
                className="h-10 w-10"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 border-l border-[var(--border)] bg-[var(--card)] hidden lg:flex flex-col">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-medium mb-2">About</h3>
            <p className="text-xs text-foreground/70">
              {chatType === "channel"
                ? "This channel is for discussing " +
                  getActiveChannelName().replace("# ", "").toLowerCase() +
                  "-related topics."
                : `Direct message with ${getActiveChannelName()}`}
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {chatType === "channel" && (
              <>
                <h4 className="text-xs uppercase font-medium text-foreground/70 mb-2">
                  Members
                </h4>
                <div className="space-y-2">
                  {directMessages.map((user) => (
                    <div key={user.id} className="flex items-center">
                      <Avatar className="h-7 w-7 mr-2">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">{user.name}</p>
                        <p className="text-xs text-foreground/60 capitalize">
                          {user.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {chatType === "direct" && (
              <>
                <h4 className="text-xs uppercase font-medium text-foreground/70 mb-2">
                  Shared Files
                </h4>
                <div className="rounded-md border border-[var(--border)] p-3 mb-4">
                  <p className="text-xs text-center text-foreground/70">
                    No shared files yet
                  </p>
                </div>

                <h4 className="text-xs uppercase font-medium text-foreground/70 mb-2">
                  Shared Links
                </h4>
                <div className="rounded-md border border-[var(--border)] p-3">
                  <p className="text-xs text-center text-foreground/70">
                    No shared links yet
                  </p>
                </div>
              </>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}