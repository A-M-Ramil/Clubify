"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/UI/card";
import { Input } from "@/components/UI/input";
import { Label } from "@/components/UI/label";
import { Textarea } from "@/components/UI/textarea";
import { Button } from "@/components/UI/button";
import { ScrollArea } from "@/components/UI/scroll-area";
import { Checkbox } from "@/components/UI/checkbox";
import { Badge } from "@/components/UI/badge";
import { Loader2, Mail, Users, Send } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/UI/table";

// Types based on your Prisma schema
interface User {
  id: string;
  name: string;
  email: string;
  authUserId: string;
}

interface Department {
  id: string;
  name: string;
}

interface MemberData {
  id: string;
  role: string;
  joinedAt: string;
  user: User;
  department: Department | null;
}

export default function EmailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.clubId;
  const [members, setMembers] = useState<MemberData[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(true);
  const [canSendEmail, setCanSendEmail] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        console.log("Fetching members for club:", clubId);
        setIsFetchingMembers(true);
        setError("");

        const response = await fetch(
          `/api/dashboard/joinedclubs/${clubId}/members`
        );
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(
            `Failed to fetch members: ${response.status} - ${errorText}`
          );
        }

        const result = await response.json();
        console.log("Members API response:", result);

        if (
          result.success &&
          result.data &&
          Array.isArray(result.data.members)
        ) {
          setMembers(result.data.members);
          setCanSendEmail(result.data.canManage || false);
          console.log(
            "Successfully loaded",
            result.data.members.length,
            "members"
          );
        } else {
          console.error("Invalid response format:", result);
          throw new Error("Invalid response format from members API");
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsFetchingMembers(false);
      }
    };

    if (clubId) {
      fetchMembers();
    }
  }, [clubId]);

  const toggleMemberSelection = (memberId: string) => {
    const newSelection = new Set(selectedMembers);
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId);
    } else {
      newSelection.add(memberId);
    }
    setSelectedMembers(newSelection);
  };

  const toggleAllMembers = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)));
    }
  };

  const getSelectedEmails = () => {
    return members
      .filter((member) => selectedMembers.has(member.id))
      .map((member) => member.user.email);
  };

  const handleSendEmail = async () => {
    if (!canSendEmail) {
      toast.error("You don't have permission to send emails.");
      return;
    }

    const recipients = getSelectedEmails();

    if (recipients.length === 0) {
      toast.warning("Please select at least one member to send an email to.");
      return;
    }

    if (!subject.trim()) {
      toast.warning("Please enter an email subject.");
      return;
    }

    if (!body.trim()) {
      toast.warning("Please enter email content.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending email to:", recipients);
      const response = await fetch(
        `/api/dashboard/joinedclubs/${clubId}/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: recipients, subject, body }),
        }
      );

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "Failed to send email.");
      }

      const result = await response.json();
      toast.success(
        `Email sent successfully to ${recipients.length} member(s)!`
      );

      // Reset form
      setSubject("");
      setBody("");
      setSelectedMembers(new Set());
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while sending the email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show permission error if user can't send emails
  if (!isFetchingMembers && !canSendEmail) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Bulk Email
            </CardTitle>
            <CardDescription>
              You don't have permission to send bulk emails. Only presidents and
              HR members can send emails.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 dark:text-white/80 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 " />
            Send Bulk Email
          </CardTitle>
          <CardDescription>
            Select members from the list below, compose your message, and send
            it to them.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Members Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Recipients ({selectedMembers.size} selected)
              </h3>
              {members.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleAllMembers}>
                  {selectedMembers.size === members.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>

            <Card>
              <ScrollArea className="h-80 w-full">
                {isFetchingMembers ? (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Loading members...
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-destructive">Error: {error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-8">
                    <p className="text-sm text-muted-foreground">
                      No members found in this club.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedMembers.size === members.length &&
                              members.length > 0
                            }
                            onCheckedChange={toggleAllMembers}
                            aria-label="Select all members"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMembers.has(member.id)}
                              onCheckedChange={() =>
                                toggleMemberSelection(member.id)
                              }
                              aria-label={`Select ${member.user.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {member.user.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {member.user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {member.department ? (
                              <Badge variant="secondary">
                                {member.department.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Email Composition Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Compose Email</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Message *</Label>
                <Textarea
                  id="body"
                  placeholder="Write your email content here..."
                  className="min-h-[150px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedMembers.size > 0 && (
              <span>Ready to send to {selectedMembers.size} member(s)</span>
            )}
          </div>
          <Button
            onClick={handleSendEmail}
            disabled={
              isLoading ||
              selectedMembers.size === 0 ||
              !subject.trim() ||
              !body.trim()
            }
            className="flex bg-purple-700 hover:bg-purple-800 text-white rounded-full items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p>Club ID: {clubId}</p>
            <p>Can Send Email: {canSendEmail.toString()}</p>
            <p>Members Count: {members.length}</p>
            <p>Selected Count: {selectedMembers.size}</p>
            <p>Is Fetching: {isFetchingMembers.toString()}</p>
            {error && <p className="text-destructive">Error: {error}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
