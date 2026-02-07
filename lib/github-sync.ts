import { prisma } from "./prisma";
import { decrypt } from "./encryption";
import { GitHubClient } from "./github-client";
import { logActivity } from "./activity-logger";

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_COMMITS_PER_SYNC = 100;

export async function syncGitHubRepository(repositoryId: string) {
    try {
        // Get repository details
        const repository = await prisma.gitRepository.findUnique({
            where: { id: repositoryId },
            include: {
                project: true,
            },
        });

        if (!repository) {
            console.error(`Repository ${repositoryId} not found`);
            return;
        }

        // Decrypt access token
        const accessToken = decrypt(repository.accessToken);
        const githubClient = new GitHubClient(accessToken);

        // Get the last synced commit date
        const lastCommit = await prisma.gitCommit.findFirst({
            where: { repositoryId },
            orderBy: { committedAt: "desc" },
        });

        // Fetch new commits since last sync
        const { commits } = await githubClient.getCommits(
            repository.owner,
            repository.name,
            {
                since: lastCommit?.committedAt || repository.createdAt,
                perPage: MAX_COMMITS_PER_SYNC,
            }
        );

        // Store new commits in database
        let newCommitsCount = 0;
        for (const commit of commits) {
            try {
                await prisma.gitCommit.upsert({
                    where: {
                        repositoryId_sha: {
                            repositoryId,
                            sha: commit.sha,
                        },
                    },
                    update: {},
                    create: {
                        repositoryId,
                        sha: commit.sha,
                        message: commit.message,
                        author: commit.author,
                        authorEmail: commit.authorEmail,
                        committedAt: commit.committedAt,
                        url: commit.url,
                    },
                });

                // Log activity for new commit
                await logActivity(
                    repository.projectId,
                    "GIT_COMMIT",
                    {
                        sha: commit.sha,
                        message: commit.message,
                        author: commit.author,
                        url: commit.url,
                    },
            );

                newCommitsCount++;
            } catch (error) {
                console.error(`Error storing commit ${commit.sha}:`, error);
            }
        }

        // Update last synced timestamp
        await prisma.gitRepository.update({
            where: { id: repositoryId },
            data: { lastSyncedAt: new Date() },
        });

        console.log(
            `Synced ${newCommitsCount} new commits for repository ${repository.fullName}`
        );

        return { success: true, newCommitsCount };
    } catch (error) {
        console.error(`Error syncing repository ${repositoryId}:`, error);

        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes("rate limit")) {
            console.warn("GitHub API rate limit reached, will retry later");
        }

        return { success: false, error };
    }
}

export async function syncAllRepositories() {
    try {
        // Get all repositories that need syncing
        const repositories = await prisma.gitRepository.findMany({
            where: {
                OR: [
                    { lastSyncedAt: null },
                    {
                        lastSyncedAt: {
                            lt: new Date(Date.now() - SYNC_INTERVAL),
                        },
                    },
                ],
            },
        });

        console.log(`Starting sync for ${repositories.length} repositories`);

        const results = await Promise.allSettled(
            repositories.map((repo) => syncGitHubRepository(repo.id))
        );

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        console.log(
            `Sync completed: ${successful} successful, ${failed} failed`
        );

        return { successful, failed };
    } catch (error) {
        console.error("Error in syncAllRepositories:", error);
        throw error;
    }
}

// Start periodic sync if in production
let syncInterval: NodeJS.Timeout | null = null;

export function startPeriodicSync() {
    if (syncInterval) {
        console.warn("Periodic sync already running");
        return;
    }

    console.log("Starting periodic GitHub sync (every 5 minutes)");

    // Run initial sync
    syncAllRepositories().catch(console.error);

    // Set up periodic sync
    syncInterval = setInterval(() => {
        syncAllRepositories().catch(console.error);
    }, SYNC_INTERVAL);
}

export function stopPeriodicSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log("Stopped periodic GitHub sync");
    }
}
