"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActiveUser {
    userId: string;
    userName: string;
    userImage?: string;
    joinedAt: string;
}

interface UserPresenceProps {
    users: ActiveUser[];
    currentUserId?: string;
    className?: string;
}

export function UserPresence({ users, currentUserId, className }: UserPresenceProps) {
    const otherUsers = users.filter((u) => u.userId !== currentUserId);
    const displayCount = otherUsers.length;

    if (displayCount === 0) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
                <Users className="h-4 w-4" />
                <span>Only you</span>
            </div>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 hover:bg-accent rounded-md px-2 py-1 transition-colors",
                        className
                    )}
                >
                    <div className="flex -space-x-2">
                        {otherUsers.slice(0, 3).map((user) => (
                            <Avatar
                                key={user.userId}
                                className="h-6 w-6 border-2 border-background"
                            >
                                <AvatarImage src={user.userImage} alt={user.userName} />
                                <AvatarFallback className="text-xs">
                                    {user.userName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {displayCount} {displayCount === 1 ? "other" : "others"}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Active Users</h4>
                        <Badge variant="secondary">{displayCount + 1} online</Badge>
                    </div>
                    <div className="space-y-2">
                        {users.map((user) => {
                            const isCurrentUser = user.userId === currentUserId;
                            return (
                                <div
                                    key={user.userId}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                                >
                                    <div className="relative">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage
                                                src={user.userImage}
                                                alt={user.userName}
                                            />
                                            <AvatarFallback>
                                                {user.userName
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">
                                                {user.userName}
                                            </p>
                                            {isCurrentUser && (
                                                <Badge variant="outline" className="text-xs">
                                                    You
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Joined{" "}
                                            {formatDistanceToNow(new Date(user.joinedAt), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
