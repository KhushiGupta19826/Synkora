import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const user1 = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            name: 'Alice Johnson',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            email: 'bob@example.com',
            name: 'Bob Smith',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
            email: 'charlie@example.com',
            name: 'Charlie Davis',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    console.log('✅ Created users:', { user1: user1.email, user2: user2.email, user3: user3.email });

    // Create a team
    const team = await prisma.team.upsert({
        where: { id: 'team-1' },
        update: {},
        create: {
            id: 'team-1',
            name: 'Development Team',
        },
    });

    console.log('✅ Created team:', team.name);

    // Add team members
    await prisma.teamMember.upsert({
        where: { id: 'tm-1' },
        update: {},
        create: {
            id: 'tm-1',
            teamId: team.id,
            userId: user1.id,
            role: 'OWNER',
        },
    });

    await prisma.teamMember.upsert({
        where: { id: 'tm-2' },
        update: {},
        create: {
            id: 'tm-2',
            teamId: team.id,
            userId: user2.id,
            role: 'EDITOR',
        },
    });

    await prisma.teamMember.upsert({
        where: { id: 'tm-3' },
        update: {},
        create: {
            id: 'tm-3',
            teamId: team.id,
            userId: user3.id,
            role: 'VIEWER',
        },
    });

    console.log('✅ Added team members');

    // Create a project
    const project = await prisma.project.upsert({
        where: { id: 'project-1' },
        update: {},
        create: {
            id: 'project-1',
            name: 'Synkora Platform',
            description: 'A collaborative project management platform with AI assistance',
            teamId: team.id,
            createdById: user1.id,
        },
    });

    console.log('✅ Created project:', project.name);

    // Create tasks
    const task1 = await prisma.task.create({
        data: {
            title: 'Set up authentication',
            description: 'Implement NextAuth.js with email/password and OAuth providers',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            position: 0,
            projectId: project.id,
            assigneeId: user1.id,
            createdById: user1.id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
    });

    const task2 = await prisma.task.create({
        data: {
            title: 'Design database schema',
            description: 'Create Prisma schema with all required models',
            status: 'DONE',
            priority: 'HIGH',
            position: 1,
            projectId: project.id,
            assigneeId: user2.id,
            createdById: user1.id,
        },
    });

    const task3 = await prisma.task.create({
        data: {
            title: 'Build Execution Board UI',
            description: 'Create drag-and-drop Execution Board with four columns',
            status: 'TODO',
            priority: 'MEDIUM',
            position: 2,
            projectId: project.id,
            assigneeId: user2.id,
            createdById: user1.id,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
    });

    const task4 = await prisma.task.create({
        data: {
            title: 'Integrate AI assistant',
            description: 'Set up OpenAI API integration for AI-powered features',
            status: 'TODO',
            priority: 'MEDIUM',
            position: 3,
            projectId: project.id,
            createdById: user1.id,
        },
    });

    console.log('✅ Created tasks:', { task1: task1.title, task2: task2.title, task3: task3.title, task4: task4.title });

    // Create canvas
    const canvas = await prisma.canvas.upsert({
        where: { projectId: project.id },
        update: {},
        create: {
            projectId: project.id,
            state: {
                objects: [],
                version: 1,
            },
            version: 1,
        },
    });

    console.log('✅ Created Architecture Map for project');

    // Create markdown file
    const existingMarkdown = await prisma.markdownFile.findFirst({
        where: {
            projectId: project.id,
            title: 'Project README',
        },
    });

    const markdown = existingMarkdown || await prisma.markdownFile.create({
        data: {
            projectId: project.id,
            title: 'Project README',
            content: '# Synkora Platform\n\nWelcome to the Synkora collaborative platform!\n\n## Features\n\n- Execution Board\n- Real-time collaboration\n- AI assistant\n- GitHub integration',
        },
    });

    console.log('✅ Created markdown file:', markdown.title);

    // Create spreadsheet
    const spreadsheet = await prisma.spreadsheet.upsert({
        where: { projectId: project.id },
        update: {},
        create: {
            projectId: project.id,
            data: {
                rows: [
                    ['Task', 'Status', 'Priority', 'Assignee'],
                    ['Set up authentication', 'In Progress', 'High', 'Alice'],
                    ['Design database schema', 'Done', 'High', 'Bob'],
                    ['Build Execution Board', 'To Do', 'Medium', 'Bob'],
                ],
            },
        },
    });

    console.log('✅ Created spreadsheet for project');

    // Create activities
    await prisma.activity.create({
        data: {
            projectId: project.id,
            type: 'TASK_CREATED',
            data: {
                taskId: task1.id,
                taskTitle: task1.title,
                createdBy: user1.name,
            },
        },
    });

    await prisma.activity.create({
        data: {
            projectId: project.id,
            type: 'TASK_COMPLETED',
            data: {
                taskId: task2.id,
                taskTitle: task2.title,
                completedBy: user2.name,
            },
        },
    });

    await prisma.activity.create({
        data: {
            projectId: project.id,
            type: 'MARKDOWN_CREATED',
            data: {
                fileId: markdown.id,
                fileName: markdown.title,
                createdBy: user1.name,
            },
        },
    });

    console.log('✅ Created activity feed entries');

    // Create a second project
    const project2 = await prisma.project.upsert({
        where: { id: 'project-2' },
        update: {},
        create: {
            id: 'project-2',
            name: 'Mobile App Development',
            description: 'Building a mobile app for iOS and Android',
            teamId: team.id,
            createdById: user2.id,
        },
    });

    console.log('✅ Created second project:', project2.name);

    // Add more activities
    await prisma.activity.create({
        data: {
            projectId: project.id,
            type: 'MEMBER_JOINED',
            data: {
                userName: user3.name,
            },
        },
    });

    await prisma.activity.create({
        data: {
            projectId: project.id,
            type: 'TASK_UPDATED',
            data: {
                taskId: task1.id,
                taskTitle: task1.title,
                updatedBy: user1.name,
            },
        },
    });

    console.log('✅ Created additional activities');

    console.log('🎉 Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
