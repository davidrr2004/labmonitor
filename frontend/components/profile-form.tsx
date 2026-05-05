"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStoredUser } from "@/lib/api"

export function ProfileForm() {
  const [isEditing, setIsEditing] = useState(false)

  const [adminData, setAdminData] = useState({
    name: "John Doe",
    email: "john.doe@university.edu",
    id: "ADMIN-2023-001",
    department: "Computer Science",
    phone: "+1 (555) 123-4567",
    bio: "Lab administrator with 5 years of experience managing computer resources and maintaining system security.",
    role: "Senior Lab Administrator",
  })

  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      setAdminData((prev) => ({
        ...prev,
        name: user.username,
        email: user.username,
        id: user.id,
        role: user.role === "admin" ? "Administrator" : "User",
      }))
    }
  }, [])

  const handleSave = () => {
    setIsEditing(false)
    // In a real app, you would save the data to the server here
    alert("Profile updated successfully!")
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt={adminData.name} />
                <AvatarFallback className="text-2xl">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              {!isEditing ? (
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{adminData.name}</h3>
                  <p className="text-sm text-muted-foreground">{adminData.role}</p>
                  <p className="text-sm text-muted-foreground">{adminData.email}</p>
                </div>
              ) : (
                <div className="grid w-full gap-2">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Change Avatar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id">Admin ID</Label>
                  <Input
                    id="id"
                    value={adminData.id}
                    onChange={(e) => setAdminData({ ...adminData, id: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={adminData.department}
                    onChange={(e) => setAdminData({ ...adminData, department: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={adminData.role}
                    onChange={(e) => setAdminData({ ...adminData, role: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={adminData.phone}
                    onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={adminData.bio}
                  onChange={(e) => setAdminData({ ...adminData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Change Password</h3>
              <p className="text-sm text-muted-foreground">Update your password to maintain account security</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              <div className="flex items-center space-x-2 pt-2">
                <Button variant="outline">Enable 2FA</Button>
                <Button variant="outline">Setup Backup Codes</Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Login Sessions</h3>
              <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
              <div className="rounded-md border">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">Windows 10 • Chrome • 192.168.1.5</p>
                  </div>
                  <Badge>Active Now</Badge>
                </div>
                <div className="flex items-center justify-between border-t p-4">
                  <div>
                    <p className="font-medium">Previous Session</p>
                    <p className="text-sm text-muted-foreground">macOS • Safari • 192.168.1.10</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Revoke
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
