// Common types for the Synkora platform
import { Prisma } from '@prisma/client';

// Re-export Prisma types for convenience
export type {
    User,
    Account,
    Session,
    Team,
    TeamMember,
    Project,
    ProjectInvitation,
    Task,
    Canvas,
    MarkdownFile,
    Spreadsheet,
    GitRepository,
    GitCommit,
    AIMessage,
    Activity,
    Role,
    TaskStatus,
    TaskPriority,
    ActivityType,
    InvitationStatus,
} from '@prisma/client';

// Type aliases for common use cases
export type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        teamMembers: { include: { team: true } };
        tasks: true;
    };
}>;

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        team: { include: { members: { include: { user: true } } } };
        tasks: true;
        canvas: true;
        markdownFiles: true;
        spreadsheet: true;
        gitRepo: { include: { commits: true } };
        activities: true;
    };
}>;

export type TaskWithRelations = Prisma.TaskGetPayload<{
    include: {
        assignee: true;
        createdBy: true;
        project: true;
    };
}>;
