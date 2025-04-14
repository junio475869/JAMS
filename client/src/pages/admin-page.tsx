import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");

  useEffect(() => {
    fetchChannels();
    fetchUsers();
  }, []);

  const fetchChannels = async () => {
    const response = await fetch('/api/admin/channels');
    const data = await response.json();
    setChannels(data);
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/admin/users');
    const data = await response.json();
    setUsers(data);
  };

  const createChannel = async () => {
    const response = await fetch('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChannelName })
    });

    if (response.ok) {
      toast({
        title: "Channel created",
        description: "New channel has been created successfully"
      });
      fetchChannels();
      setNewChannelName("");
    }
  };

  const deleteChannel = async (channelId) => {
    const response = await fetch(`/api/admin/channels/${channelId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      toast({
        title: "Channel deleted",
        description: "Channel has been deleted successfully"
      });
      fetchChannels();
    }
  };

  const updateUserRole = async (userId, role) => {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });

    if (response.ok) {
      toast({
        title: "User updated",
        description: "User role has been updated successfully"
      });
      fetchUsers();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Manage Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="New channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                />
                <Button onClick={createChannel}>Create Channel</Button>
              </div>

              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">#{channel.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {channel.memberCount} members
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => deleteChannel(channel.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h3 className="font-medium">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="border rounded p-2"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}