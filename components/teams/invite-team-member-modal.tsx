"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InviteTeamMemberModalProps {
    open: boolean;
    onClose(): void;
    teamId: string;
    teamName: string;
    onInviteSent(): void;
}

export function InviteTeamMemberModal({
    open,
    onClose,
    teamId,
    teamName,
    onInviteSent,
}: InviteTeamMemberModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"OWNER" | "EDITOR" | "VIEWER">("EDITOR");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            const response = await fetch(`/api/teams/${teamId}/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, role }),
            });

            if (response.ok) {
                setSuccess(true);
                setEmail("");
                setRole("EDITOR");
                setTimeout(() => {
                    onInviteSent();
                    setSuccess(false);
                }, 1500);
            } else {
                const data = await response.json();
                setError(data.error || "Failed to send invitation");
            }
        } catch (error) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail("");
        setRole("EDITOR");
        setError("");
        setSuccess(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Member to {teamName}</DialogTitle>
                    <DialogDescription>
                        Send an invitation to join this team. The invitation will expire in 7 days.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="colleague@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={(value: any) => setRole(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEWER">Viewer - Can view projects</SelectItem>
                                    <SelectItem value="EDITOR">Editor - Can edit projects</SelectItem>
                                    <SelectItem value="OWNER">Owner - Full access</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500">{error}</div>
                        )}

                        {success && (
                            <div className="text-sm text-green-600">
                                Invitation sent successfully!
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !email.trim()}>
                            {loading ? "Sending..." : "Send Invitation"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
