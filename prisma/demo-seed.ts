import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🎯 Starting DEMO database seed...');

    // Create demo users
    const hashedPassword = await bcrypt.hash('demo123', 12);

    const alice = await prisma.user.upsert({
        where: { email: 'alice.architect@synkora.com' },
        update: {},
        create: {
            email: 'alice.architect@synkora.com',
            name: 'Alice Chen',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    const bob = await prisma.user.upsert({
        where: { email: 'bob.backend@synkora.com' },
        update: {},
        create: {
            email: 'bob.backend@synkora.com',
            name: 'Bob Rodriguez',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    const carol = await prisma.user.upsert({
        where: { email: 'carol.frontend@synkora.com' },
        update: {},
        create: {
            email: 'carol.frontend@synkora.com',
            name: 'Carol Kim',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    const david = await prisma.user.upsert({
        where: { email: 'david.devops@synkora.com' },
        update: {},
        create: {
            email: 'david.devops@synkora.com',
            name: 'David Thompson',
            password: hashedPassword,
            emailVerified: new Date(),
        },
    });

    console.log('✅ Created demo users');

    // Create demo team
    const team = await prisma.team.upsert({
        where: { id: 'demo-team' },
        update: {},
        create: {
            id: 'demo-team',
            name: 'Engineering Intelligence Team',
        },
    });

    // Add team members
    await prisma.teamMember.upsert({
        where: { id: 'demo-tm-1' },
        update: {},
        create: {
            id: 'demo-tm-1',
            teamId: team.id,
            userId: alice.id,
            role: 'OWNER',
        },
    });

    await prisma.teamMember.upsert({
        where: { id: 'demo-tm-2' },
        update: {},
        create: {
            id: 'demo-tm-2',
            teamId: team.id,
            userId: bob.id,
            role: 'EDITOR',
        },
    });

    await prisma.teamMember.upsert({
        where: { id: 'demo-tm-3' },
        update: {},
        create: {
            id: 'demo-tm-3',
            teamId: team.id,
            userId: carol.id,
            role: 'EDITOR',
        },
    });

    await prisma.teamMember.upsert({
        where: { id: 'demo-tm-4' },
        update: {},
        create: {
            id: 'demo-tm-4',
            teamId: team.id,
            userId: david.id,
            role: 'EDITOR',
        },
    });

    console.log('✅ Added team members');

    // Create demo project - E-commerce Platform
    const project = await prisma.project.upsert({
        where: { id: 'demo-ecommerce' },
        update: {},
        create: {
            id: 'demo-ecommerce',
            name: 'E-commerce Platform',
            description: 'A scalable microservices-based e-commerce platform with real-time features and AI recommendations',
            teamId: team.id,
            createdById: alice.id,
        },
    });

    console.log('✅ Created demo project:', project.name);

    // Create Architecture Map (Canvas)
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

    // Create Components for the Architecture Map
    const userService = await prisma.component.create({
        data: {
            componentId: 'USER-SVC-001',
            canvasId: canvas.id,
            name: 'User Service',
            type: 'service',
            description: 'Handles user authentication, profiles, and account management. Provides JWT tokens and manages user sessions.',
            position: { x: 100, y: 100 },
            metadata: {
                technology: 'Node.js + Express',
                database: 'PostgreSQL',
                port: 3001,
                healthEndpoint: '/health'
            }
        },
    });

    const productService = await prisma.component.create({
        data: {
            componentId: 'PROD-SVC-002',
            canvasId: canvas.id,
            name: 'Product Catalog Service',
            type: 'service',
            description: 'Manages product information, categories, inventory, and search functionality. Supports real-time inventory updates.',
            position: { x: 300, y: 100 },
            metadata: {
                technology: 'Python + FastAPI',
                database: 'PostgreSQL + Elasticsearch',
                port: 3002,
                features: ['search', 'filtering', 'recommendations']
            }
        },
    });

    const orderService = await prisma.component.create({
        data: {
            componentId: 'ORDER-SVC-003',
            canvasId: canvas.id,
            name: 'Order Management Service',
            type: 'service',
            description: 'Processes orders, manages shopping carts, handles payments, and tracks order fulfillment.',
            position: { x: 500, y: 100 },
            metadata: {
                technology: 'Java + Spring Boot',
                database: 'PostgreSQL',
                port: 3003,
                integrations: ['Stripe', 'PayPal', 'Shipping APIs']
            }
        },
    });

    const paymentGateway = await prisma.component.create({
        data: {
            componentId: 'PAY-GW-004',
            canvasId: canvas.id,
            name: 'Payment Gateway',
            type: 'external',
            description: 'Third-party payment processing service (Stripe) for secure transaction handling.',
            position: { x: 700, y: 100 },
            metadata: {
                provider: 'Stripe',
                features: ['credit cards', 'digital wallets', 'subscriptions'],
                compliance: ['PCI DSS']
            }
        },
    });

    const notificationService = await prisma.component.create({
        data: {
            componentId: 'NOTIF-SVC-005',
            canvasId: canvas.id,
            name: 'Notification Service',
            type: 'service',
            description: 'Handles email, SMS, and push notifications. Manages notification templates and delivery tracking.',
            position: { x: 100, y: 300 },
            metadata: {
                technology: 'Node.js + Bull Queue',
                providers: ['SendGrid', 'Twilio', 'Firebase'],
                port: 3005
            }
        },
    });

    const webApp = await prisma.component.create({
        data: {
            componentId: 'WEB-APP-006',
            canvasId: canvas.id,
            name: 'Web Application',
            type: 'ui',
            description: 'React-based customer-facing web application with responsive design and real-time features.',
            position: { x: 300, y: 300 },
            metadata: {
                technology: 'React + Next.js',
                features: ['SSR', 'PWA', 'real-time updates'],
                deployment: 'Vercel'
            }
        },
    });

    const adminDashboard = await prisma.component.create({
        data: {
            componentId: 'ADMIN-UI-007',
            canvasId: canvas.id,
            name: 'Admin Dashboard',
            type: 'ui',
            description: 'Internal admin interface for managing products, orders, users, and system monitoring.',
            position: { x: 500, y: 300 },
            metadata: {
                technology: 'React + Material-UI',
                features: ['analytics', 'user management', 'order tracking'],
                access: 'internal only'
            }
        },
    });

    const database = await prisma.component.create({
        data: {
            componentId: 'DB-MAIN-008',
            canvasId: canvas.id,
            name: 'Main Database',
            type: 'database',
            description: 'Primary PostgreSQL database cluster with read replicas for high availability and performance.',
            position: { x: 700, y: 300 },
            metadata: {
                technology: 'PostgreSQL 14',
                configuration: 'Master-Slave with 2 read replicas',
                backup: 'Daily automated backups',
                monitoring: 'Prometheus + Grafana'
            }
        },
    });

    const redisCache = await prisma.component.create({
        data: {
            componentId: 'CACHE-009',
            canvasId: canvas.id,
            name: 'Redis Cache',
            type: 'database',
            description: 'In-memory cache for session storage, product data, and real-time features.',
            position: { x: 100, y: 500 },
            metadata: {
                technology: 'Redis Cluster',
                useCases: ['sessions', 'product cache', 'real-time data'],
                persistence: 'RDB + AOF'
            }
        },
    });

    const apiGateway = await prisma.component.create({
        data: {
            componentId: 'API-GW-010',
            canvasId: canvas.id,
            name: 'API Gateway',
            type: 'service',
            description: 'Central entry point for all API requests. Handles authentication, rate limiting, and request routing.',
            position: { x: 300, y: 500 },
            metadata: {
                technology: 'Kong Gateway',
                features: ['rate limiting', 'authentication', 'load balancing'],
                port: 8000
            }
        },
    });

    console.log('✅ Created 10 architecture components');

    // Create Decision Records
    const microservicesDecision = await prisma.decisionRecord.create({
        data: {
            projectId: project.id,
            title: 'Adopt Microservices Architecture',
            context: 'We need to build a scalable e-commerce platform that can handle high traffic and allow independent team development. The monolithic approach would create bottlenecks as the team grows.',
            decision: 'We will implement a microservices architecture with separate services for User Management, Product Catalog, Order Management, and Notifications.',
            rationale: 'Microservices will allow: 1) Independent scaling of components based on load, 2) Technology diversity (Node.js for real-time, Python for ML, Java for transactions), 3) Independent deployment and development cycles, 4) Better fault isolation.',
            consequences: 'Positive: Better scalability, team autonomy, technology flexibility. Negative: Increased complexity in service communication, distributed system challenges, need for service mesh.',
            status: 'ACCEPTED',
            createdBy: alice.id,
            tags: ['architecture', 'scalability', 'microservices'],
        },
    });

    const databaseDecision = await prisma.decisionRecord.create({
        data: {
            projectId: project.id,
            title: 'Use PostgreSQL as Primary Database',
            context: 'We need to choose a primary database that supports ACID transactions for financial data while providing good performance for product catalog queries.',
            decision: 'PostgreSQL will be our primary database with Elasticsearch for product search and Redis for caching.',
            rationale: 'PostgreSQL provides: 1) ACID compliance for financial transactions, 2) JSON support for flexible product attributes, 3) Full-text search capabilities, 4) Mature ecosystem and tooling, 5) Horizontal scaling options.',
            consequences: 'Positive: Data consistency, rich feature set, good performance. Negative: Need to manage multiple database technologies, potential complexity in data synchronization.',
            status: 'ACCEPTED',
            createdBy: bob.id,
            tags: ['database', 'postgresql', 'data-architecture'],
        },
    });

    const authDecision = await prisma.decisionRecord.create({
        data: {
            projectId: project.id,
            title: 'Implement JWT-based Authentication',
            context: 'We need a stateless authentication mechanism that works across multiple services and supports both web and mobile clients.',
            decision: 'Implement JWT (JSON Web Tokens) with refresh token rotation for authentication across all services.',
            rationale: 'JWT provides: 1) Stateless authentication suitable for microservices, 2) Cross-service compatibility, 3) Mobile-friendly, 4) Industry standard with good library support.',
            consequences: 'Positive: Scalable, stateless, cross-platform. Negative: Token management complexity, need for proper secret rotation, larger token size than session IDs.',
            status: 'ACCEPTED',
            createdBy: alice.id,
            tags: ['authentication', 'security', 'jwt'],
        },
    });

    const paymentDecision = await prisma.decisionRecord.create({
        data: {
            projectId: project.id,
            title: 'Integrate Stripe for Payment Processing',
            context: 'We need a reliable, secure payment processing solution that supports multiple payment methods and international transactions.',
            decision: 'Use Stripe as our primary payment processor with PayPal as a secondary option.',
            rationale: 'Stripe offers: 1) Comprehensive API and documentation, 2) PCI compliance handled by provider, 3) Support for multiple payment methods, 4) International support, 5) Strong fraud detection.',
            consequences: 'Positive: Reduced compliance burden, reliable service, good developer experience. Negative: Transaction fees, vendor lock-in, dependency on third-party service.',
            status: 'ACCEPTED',
            createdBy: bob.id,
            tags: ['payments', 'stripe', 'integration'],
        },
    });

    const frontendDecision = await prisma.decisionRecord.create({
        data: {
            projectId: project.id,
            title: 'Use React with Next.js for Frontend',
            context: 'We need a modern frontend framework that supports server-side rendering for SEO and provides good developer experience.',
            decision: 'Build the customer-facing application using React with Next.js framework.',
            rationale: 'Next.js provides: 1) Server-side rendering for better SEO, 2) Built-in performance optimizations, 3) Great developer experience, 4) Strong ecosystem, 5) Easy deployment options.',
            consequences: 'Positive: Better SEO, performance, developer productivity. Negative: Learning curve for team, framework-specific patterns, build complexity.',
            status: 'ACCEPTED',
            createdBy: carol.id,
            tags: ['frontend', 'react', 'nextjs', 'seo'],
        },
    });

    console.log('✅ Created 5 decision records');

    // Link Components to Decisions
    await prisma.componentDecision.createMany({
        data: [
            { componentId: userService.id, decisionId: microservicesDecision.id },
            { componentId: productService.id, decisionId: microservicesDecision.id },
            { componentId: orderService.id, decisionId: microservicesDecision.id },
            { componentId: notificationService.id, decisionId: microservicesDecision.id },
            { componentId: database.id, decisionId: databaseDecision.id },
            { componentId: redisCache.id, decisionId: databaseDecision.id },
            { componentId: userService.id, decisionId: authDecision.id },
            { componentId: apiGateway.id, decisionId: authDecision.id },
            { componentId: orderService.id, decisionId: paymentDecision.id },
            { componentId: paymentGateway.id, decisionId: paymentDecision.id },
            { componentId: webApp.id, decisionId: frontendDecision.id },
            { componentId: adminDashboard.id, decisionId: frontendDecision.id },
        ],
    });

    console.log('✅ Linked components to decisions');

    // Create System Knowledge (Markdown Files)
    const architectureDoc = await prisma.markdownFile.create({
        data: {
            projectId: project.id,
            title: 'System Architecture Overview',
            content: `# E-commerce Platform Architecture

## Overview
Our e-commerce platform follows a microservices architecture pattern to ensure scalability, maintainability, and team autonomy.

## Core Services

### User Service (USER-SVC-001)
- **Purpose**: Authentication, user profiles, account management
- **Technology**: Node.js + Express
- **Database**: PostgreSQL
- **Key Features**: JWT authentication, user sessions, profile management

### Product Catalog Service (PROD-SVC-002)
- **Purpose**: Product information, inventory, search
- **Technology**: Python + FastAPI
- **Database**: PostgreSQL + Elasticsearch
- **Key Features**: Product search, inventory tracking, recommendations

### Order Management Service (ORDER-SVC-003)
- **Purpose**: Order processing, cart management, fulfillment
- **Technology**: Java + Spring Boot
- **Database**: PostgreSQL
- **Key Features**: Order lifecycle, payment integration, shipping

## Data Flow
1. User authentication flows through User Service
2. Product browsing uses Product Catalog Service with Elasticsearch
3. Order placement coordinates between Order Service and Payment Gateway
4. Notifications are sent via Notification Service

## Security Considerations
- All services communicate via HTTPS
- JWT tokens for stateless authentication
- API Gateway handles rate limiting and request validation
- Payment data is processed securely through Stripe
`,
        },
    });

    const deploymentDoc = await prisma.markdownFile.create({
        data: {
            projectId: project.id,
            title: 'Deployment Guide',
            content: `# Deployment Guide

## Infrastructure
- **Cloud Provider**: AWS
- **Container Orchestration**: Kubernetes (EKS)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## Service Deployment

### Prerequisites
- Docker installed
- kubectl configured
- AWS CLI configured

### Deployment Steps
1. Build Docker images for each service
2. Push images to ECR
3. Apply Kubernetes manifests
4. Verify service health endpoints

### Environment Variables
Each service requires specific environment variables for database connections, API keys, and service discovery.

### Health Checks
All services expose /health endpoints for Kubernetes liveness and readiness probes.
`,
        },
    });

    const apiDoc = await prisma.markdownFile.create({
        data: {
            projectId: project.id,
            title: 'API Documentation',
            content: `# API Documentation

## Authentication
All API requests require a valid JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

## User Service API
- \`POST /auth/login\` - User login
- \`POST /auth/register\` - User registration
- \`GET /users/profile\` - Get user profile
- \`PUT /users/profile\` - Update user profile

## Product Service API
- \`GET /products\` - List products with pagination
- \`GET /products/:id\` - Get product details
- \`POST /products/search\` - Search products
- \`GET /categories\` - List product categories

## Order Service API
- \`POST /orders\` - Create new order
- \`GET /orders/:id\` - Get order details
- \`PUT /orders/:id/status\` - Update order status
- \`GET /cart\` - Get user's cart
- \`POST /cart/items\` - Add item to cart

## Error Handling
All APIs return consistent error responses:
\`\`\`json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": {}
}
\`\`\`
`,
        },
    });

    console.log('✅ Created system knowledge documents');

    // Link Knowledge to Components
    await prisma.componentMarkdown.createMany({
        data: [
            { componentId: userService.id, markdownId: architectureDoc.id },
            { componentId: productService.id, markdownId: architectureDoc.id },
            { componentId: orderService.id, markdownId: architectureDoc.id },
            { componentId: userService.id, markdownId: apiDoc.id },
            { componentId: productService.id, markdownId: apiDoc.id },
            { componentId: orderService.id, markdownId: apiDoc.id },
            { componentId: apiGateway.id, markdownId: deploymentDoc.id },
        ],
    });

    // Link Knowledge to Decisions
    await prisma.decisionMarkdown.createMany({
        data: [
            { decisionId: microservicesDecision.id, markdownId: architectureDoc.id },
            { decisionId: databaseDecision.id, markdownId: architectureDoc.id },
            { decisionId: authDecision.id, markdownId: apiDoc.id },
        ],
    });

    console.log('✅ Linked knowledge artifacts');

    // Create Spreadsheet with categorization
    await prisma.spreadsheet.upsert({
        where: { projectId: project.id },
        update: {},
        create: {
            projectId: project.id,
            category: 'metrics',
            data: {
                title: 'System Metrics Dashboard',
                rows: [
                    ['Service', 'Response Time (ms)', 'Error Rate (%)', 'Throughput (req/s)', 'Uptime (%)'],
                    ['User Service', '45', '0.1', '1200', '99.9'],
                    ['Product Service', '120', '0.3', '800', '99.8'],
                    ['Order Service', '200', '0.2', '400', '99.9'],
                    ['Notification Service', '80', '0.5', '600', '99.7'],
                    ['API Gateway', '25', '0.1', '2000', '99.95'],
                ],
            },
        },
    });

    console.log('✅ Created metrics spreadsheet');

    // Create Git Repository
    const gitRepo = await prisma.gitRepository.create({
        data: {
            projectId: project.id,
            githubRepoId: '12345',
            owner: 'synkora-team',
            name: 'ecommerce-platform',
            fullName: 'synkora-team/ecommerce-platform',
            accessToken: 'encrypted_token_placeholder',
            lastSyncedAt: new Date(),
        },
    });

    // Create Git Commits
    const commits = [
        {
            sha: 'abc123def456',
            message: 'feat(user-service): implement JWT authentication system\n\nAdded JWT token generation and validation for secure user authentication across microservices.',
            author: 'Alice Chen',
            authorEmail: 'alice.architect@synkora.com',
            committedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            url: 'https://github.com/synkora-team/ecommerce-platform/commit/abc123def456',
        },
        {
            sha: 'def456ghi789',
            message: 'feat(product-service): add elasticsearch integration for product search\n\nImplemented full-text search capabilities with filtering and sorting options.',
            author: 'Bob Rodriguez',
            authorEmail: 'bob.backend@synkora.com',
            committedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            url: 'https://github.com/synkora-team/ecommerce-platform/commit/def456ghi789',
        },
        {
            sha: 'ghi789jkl012',
            message: 'feat(order-service): integrate stripe payment processing\n\nAdded secure payment handling with Stripe API integration and webhook support.',
            author: 'Bob Rodriguez',
            authorEmail: 'bob.backend@synkora.com',
            committedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            url: 'https://github.com/synkora-team/ecommerce-platform/commit/ghi789jkl012',
        },
        {
            sha: 'jkl012mno345',
            message: 'feat(web-app): implement responsive product catalog UI\n\nBuilt React components for product listing, filtering, and search with mobile-first design.',
            author: 'Carol Kim',
            authorEmail: 'carol.frontend@synkora.com',
            committedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            url: 'https://github.com/synkora-team/ecommerce-platform/commit/jkl012mno345',
        },
        {
            sha: 'mno345pqr678',
            message: 'feat(notification-service): add email and SMS notification support\n\nImplemented notification templates and delivery tracking with SendGrid and Twilio.',
            author: 'David Thompson',
            authorEmail: 'david.devops@synkora.com',
            committedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            url: 'https://github.com/synkora-team/ecommerce-platform/commit/mno345pqr678',
        },
        {
            sha: 'pqr678stu901',
            message: 'fix(api-gateway): improve rate limiting configuration\n\nAdjusted rate limits and added better error responses for API gateway.',
            author: 'David Thompson',
            authorEmail: 'david.devops@synkora.com',
            committedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            url: 'https://github.com/synkora-team/ecommerce-platform/commit/pqr678stu901',
        },
    ];

    for (const commitData of commits) {
        await prisma.gitCommit.create({
            data: {
                repositoryId: gitRepo.id,
                ...commitData,
            },
        });
    }

    console.log('✅ Created git commits');

    // Tag commits with components
    await prisma.componentCommit.createMany({
        data: [
            { componentId: userService.id, commitSha: 'abc123def456', repositoryId: gitRepo.id, autoDetected: true },
            { componentId: productService.id, commitSha: 'def456ghi789', repositoryId: gitRepo.id, autoDetected: true },
            { componentId: orderService.id, commitSha: 'ghi789jkl012', repositoryId: gitRepo.id, autoDetected: true },
            { componentId: paymentGateway.id, commitSha: 'ghi789jkl012', repositoryId: gitRepo.id, autoDetected: false },
            { componentId: webApp.id, commitSha: 'jkl012mno345', repositoryId: gitRepo.id, autoDetected: true },
            { componentId: notificationService.id, commitSha: 'mno345pqr678', repositoryId: gitRepo.id, autoDetected: true },
            { componentId: apiGateway.id, commitSha: 'pqr678stu901', repositoryId: gitRepo.id, autoDetected: true },
        ],
    });

    console.log('✅ Tagged commits with components');

    // Create Contextual Discussions
    const authDiscussion = await prisma.discussion.create({
        data: {
            projectId: project.id,
            title: 'JWT Token Expiration Strategy',
            anchorType: 'COMPONENT',
            anchorId: userService.componentId,
            createdBy: alice.id,
        },
    });

    await prisma.discussionMessage.createMany({
        data: [
            {
                discussionId: authDiscussion.id,
                authorId: alice.id,
                content: 'We need to decide on JWT token expiration times. I\'m thinking 15 minutes for access tokens and 7 days for refresh tokens. Thoughts?',
            },
            {
                discussionId: authDiscussion.id,
                authorId: bob.id,
                content: 'That sounds reasonable for security. We should also implement automatic token refresh on the frontend to avoid user interruption.',
            },
            {
                discussionId: authDiscussion.id,
                authorId: carol.id,
                content: 'Agreed. I can implement the automatic refresh logic in the React app. Should we also add a warning before tokens expire?',
            },
        ],
    });

    const paymentDiscussion = await prisma.discussion.create({
        data: {
            projectId: project.id,
            title: 'Payment Failure Handling',
            anchorType: 'DECISION',
            anchorId: paymentDecision.id,
            createdBy: bob.id,
        },
    });

    await prisma.discussionMessage.createMany({
        data: [
            {
                discussionId: paymentDiscussion.id,
                authorId: bob.id,
                content: 'How should we handle payment failures? Should we retry automatically or require user action?',
            },
            {
                discussionId: paymentDiscussion.id,
                authorId: alice.id,
                content: 'For temporary failures (network issues), we should retry with exponential backoff. For permanent failures (declined cards), notify the user immediately.',
            },
        ],
    });

    const commitDiscussion = await prisma.discussion.create({
        data: {
            projectId: project.id,
            title: 'Rate Limiting Implementation',
            anchorType: 'COMMIT',
            anchorId: 'pqr678stu901',
            createdBy: david.id,
        },
    });

    await prisma.discussionMessage.create({
        data: {
            discussionId: commitDiscussion.id,
            authorId: david.id,
            content: 'Updated the rate limiting config. Now we have different limits for authenticated vs anonymous users. Authenticated users get 1000 req/hour, anonymous get 100 req/hour.',
        },
    });

    console.log('✅ Created contextual discussions');

    // Create some tasks for the Execution Board (to show it still exists but is deprioritized)
    await prisma.task.createMany({
        data: [
            {
                title: 'Implement user profile editing',
                description: 'Allow users to update their profile information including name, email, and preferences',
                status: 'IN_PROGRESS',
                priority: 'MEDIUM',
                position: 0,
                projectId: project.id,
                assigneeId: carol.id,
                createdById: alice.id,
            },
            {
                title: 'Add product recommendation engine',
                description: 'Implement ML-based product recommendations using collaborative filtering',
                status: 'TODO',
                priority: 'HIGH',
                position: 1,
                projectId: project.id,
                assigneeId: bob.id,
                createdById: alice.id,
            },
            {
                title: 'Set up monitoring dashboards',
                description: 'Configure Grafana dashboards for system metrics and alerts',
                status: 'DONE',
                priority: 'HIGH',
                position: 2,
                projectId: project.id,
                assigneeId: david.id,
                createdById: alice.id,
            },
            {
                title: 'Optimize database queries',
                description: 'Review and optimize slow database queries identified in performance testing',
                status: 'UNDER_REVIEW',
                priority: 'MEDIUM',
                position: 3,
                projectId: project.id,
                assigneeId: bob.id,
                createdById: alice.id,
            },
        ],
    });

    console.log('✅ Created execution board tasks');

    // Create Activities for the timeline
    await prisma.activity.createMany({
        data: [
            {
                projectId: project.id,
                type: 'GIT_COMMIT',
                data: {
                    commitSha: 'abc123def456',
                    message: 'feat(user-service): implement JWT authentication system',
                    author: 'Alice Chen',
                },
            },
            {
                projectId: project.id,
                type: 'GIT_COMMIT',
                data: {
                    commitSha: 'def456ghi789',
                    message: 'feat(product-service): add elasticsearch integration',
                    author: 'Bob Rodriguez',
                },
            },
            {
                projectId: project.id,
                type: 'MARKDOWN_CREATED',
                data: {
                    fileId: architectureDoc.id,
                    fileName: architectureDoc.title,
                    createdBy: 'Alice Chen',
                },
            },
            {
                projectId: project.id,
                type: 'TASK_COMPLETED',
                data: {
                    taskTitle: 'Set up monitoring dashboards',
                    completedBy: 'David Thompson',
                },
            },
        ],
    });

    console.log('✅ Created activity timeline entries');

    console.log('🎉 DEMO database seed completed successfully!');
    console.log('');
    console.log('📊 Demo Data Summary:');
    console.log('- Project: E-commerce Platform');
    console.log('- Components: 10 (services, databases, UIs)');
    console.log('- Decision Records: 5 (architecture, database, auth, payments, frontend)');
    console.log('- Knowledge Documents: 3 (architecture, deployment, API docs)');
    console.log('- Git Commits: 6 (tagged with components)');
    console.log('- Discussions: 3 (contextual to components/decisions/commits)');
    console.log('- Tasks: 4 (for Execution Board)');
    console.log('');
    console.log('🔑 Demo Login Credentials:');
    console.log('- alice.architect@synkora.com / demo123 (System Architect)');
    console.log('- bob.backend@synkora.com / demo123 (Backend Developer)');
    console.log('- carol.frontend@synkora.com / demo123 (Frontend Developer)');
    console.log('- david.devops@synkora.com / demo123 (DevOps Engineer)');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding demo database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });