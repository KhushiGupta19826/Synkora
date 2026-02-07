import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDemoData() {
    console.log('🔍 Verifying demo data...\n');

    try {
        // Check demo project exists
        const project = await prisma.project.findUnique({
            where: { id: 'demo-ecommerce' },
            include: {
                team: true,
            }
        });

        if (!project) {
            console.log('❌ Demo project not found');
            return false;
        }
        console.log('✅ Demo project exists:', project.name);

        // Check components
        const components = await prisma.component.findMany({
            where: {
                canvas: {
                    projectId: project.id
                }
            }
        });
        console.log(`✅ Components: ${components.length}/10 expected`);
        if (components.length < 10) {
            console.log('⚠️  Expected 10 components, found', components.length);
        }

        // Check decision records
        const decisions = await prisma.decisionRecord.findMany({
            where: { projectId: project.id }
        });
        console.log(`✅ Decision Records: ${decisions.length}/5 expected`);
        if (decisions.length < 5) {
            console.log('⚠️  Expected 5 decisions, found', decisions.length);
        }

        // Check knowledge documents
        const knowledge = await prisma.markdownFile.findMany({
            where: { projectId: project.id }
        });
        console.log(`✅ Knowledge Documents: ${knowledge.length}/3 expected`);
        if (knowledge.length < 3) {
            console.log('⚠️  Expected 3 knowledge docs, found', knowledge.length);
        }

        // Check git commits
        const gitRepo = await prisma.gitRepository.findUnique({
            where: { projectId: project.id },
            include: {
                commits: true
            }
        });
        if (gitRepo) {
            console.log(`✅ Git Commits: ${gitRepo.commits.length}/6 expected`);
            if (gitRepo.commits.length < 6) {
                console.log('⚠️  Expected 6 commits, found', gitRepo.commits.length);
            }
        } else {
            console.log('❌ Git repository not found');
        }

        // Check discussions
        const discussions = await prisma.discussion.findMany({
            where: { projectId: project.id },
            include: {
                messages: true
            }
        });
        console.log(`✅ Discussions: ${discussions.length}/3 expected`);
        if (discussions.length < 3) {
            console.log('⚠️  Expected 3 discussions, found', discussions.length);
        }

        // Check component-decision links
        const componentDecisions = await prisma.componentDecision.findMany({
            where: {
                component: {
                    canvas: {
                        projectId: project.id
                    }
                }
            }
        });
        console.log(`✅ Component-Decision Links: ${componentDecisions.length}`);

        // Check component-knowledge links
        const componentKnowledge = await prisma.componentMarkdown.findMany({
            where: {
                component: {
                    canvas: {
                        projectId: project.id
                    }
                }
            }
        });
        console.log(`✅ Component-Knowledge Links: ${componentKnowledge.length}`);

        // Check component-commit links
        const componentCommits = await prisma.componentCommit.findMany({
            where: {
                component: {
                    canvas: {
                        projectId: project.id
                    }
                }
            }
        });
        console.log(`✅ Component-Commit Links: ${componentCommits.length}`);

        // Check demo users
        const demoUsers = await prisma.user.findMany({
            where: {
                email: {
                    in: [
                        'alice.architect@synkora.com',
                        'bob.backend@synkora.com',
                        'carol.frontend@synkora.com',
                        'david.devops@synkora.com'
                    ]
                }
            }
        });
        console.log(`✅ Demo Users: ${demoUsers.length}/4 expected`);

        // Check tasks (for Execution Board)
        const tasks = await prisma.task.findMany({
            where: { projectId: project.id }
        });
        console.log(`✅ Execution Board Tasks: ${tasks.length}/4 expected`);

        console.log('\n🎉 Demo data verification complete!');

        if (components.length >= 10 && decisions.length >= 5 && knowledge.length >= 3 &&
            discussions.length >= 3 && demoUsers.length >= 4) {
            console.log('✅ All critical demo data is present');
            return true;
        } else {
            console.log('⚠️  Some demo data is missing - consider re-running demo:seed');
            return false;
        }

    } catch (error) {
        console.error('❌ Error verifying demo data:', error);
        return false;
    }
}

async function main() {
    const success = await verifyDemoData();

    if (success) {
        console.log('\n🚀 Demo is ready!');
        console.log('\n📋 Next steps:');
        console.log('1. Start the application: npm run dev');
        console.log('2. Login with: alice.architect@synkora.com / demo123');
        console.log('3. Navigate to E-commerce Platform project');
        console.log('4. Follow the demo script in DEMO-SCRIPT.md');
        console.log('5. Use DEMO-TEST-CHECKLIST.md to verify all features');
    } else {
        console.log('\n❌ Demo data incomplete');
        console.log('Run: npm run demo:seed');
    }
}

main()
    .catch((e) => {
        console.error('❌ Verification failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });