import React, { useState, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessagesSquare,
  Plus,
  Search,
  Send,
  FileImage,
  Paperclip,
  Smile,
  Download,
  Eye,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";

const socket = io('http://0.0.0.0:5000', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

    socket.on('typing', ({ userId, username }) => {
      setTypingUsers(prev => new Set([...prev, username]));
    });

    socket.on('stop_typing', ({ userId, username }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    });

    socket.on('reaction', ({ messageId, reaction }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
          : msg
      ));
    });

    return () => {
      socket.off('message');
      socket.off('reaction');
    };
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      userId: user.id,
      name: user.username,
      message: newMessage,
      timestamp: new Date().toISOString(),
      reactions: [],
    };

    socket.emit('message', messageData);
    setNewMessage("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const { url } = await response.json();

      const messageData = {
        id: Date.now(),
        userId: user.id,
        name: user.username,
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        timestamp: new Date().toISOString(),
        reactions: [],
      };

      socket.emit('message', messageData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const handleReaction = (messageId, reaction) => {
    socket.emit('reaction', { messageId, reaction, userId: user.id });
  };

  const handleFilePreview = (fileUrl, fileType) => {
    if (fileType.startsWith('image/')) {
      window.open(fileUrl, '_blank');
    } else if (fileType === 'text/plain' || fileType === 'text/csv') {
      fetch(fileUrl)
        .then(response => response.text())
        .then(content => {
          // Create preview dialog
          toast({
            title: "File Preview",
            description: <pre className="max-h-[400px] overflow-auto">{content}</pre>,
            duration: 10000,
          });
        });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === user.id ? "justify-end" : "justify-start"}`}
                >
                  <Card className={`max-w-[80%] ${msg.userId === user.id ? "bg-primary text-primary-foreground" : ""}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center mb-2">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>
                            {msg.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{msg.name}</span>
                        <span className="text-xs ml-2 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {msg.message && (
                        <p className="text-sm">{msg.message}</p>
                      )}

                      {msg.fileUrl && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFilePreview(msg.fileUrl, msg.fileType)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(msg.fileUrl, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}

                      {msg.reactions?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {msg.reactions.map((reaction, idx) => (
                            <span key={idx} className="text-sm bg-background/10 rounded px-1">
                              {reaction}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="pr-24"
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji) => {
                          setNewMessage(prev => prev + emoji.native);
                          setShowEmojiPicker(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.txt,.csv,.pdf,.doc,.docx"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}