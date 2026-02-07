"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveUser {
    userId: string;
    userName: string;
    userImage?: string;
    joinedAt: string;
}

interface ActiveUsersProps {
    users: ActiveUser[];
    maxDisplay?: number;
    className?: string;
}

export function ActiveUsers({ users, maxDisplay = 5, className }: ActiveUsersProps) {
    const displayUsers = users.slice(0, maxDisplay);
    const remainingCount = users.length - maxDisplay;

    if (users.length === 0) {
        return null;
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex items-center">
                <Users className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">
                    {users.length} {users.length === 1 ? "user" : "users"} active
                </span>
            </div>
            <div className="flex -space-x-2">
                {displayUsers.map((user) => (
                    <Avatar
                        key={user.userId}
                        className="h-8 w-8 border-2 border-background"
                        title={user.userName}
                    >
                        <AvatarImage src={user.userImage} alt={user.userName} />
                        <AvatarFallback>
                            {user.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                ))}
                {remainingCount > 0 && (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs font-medium">+{remainingCount}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
