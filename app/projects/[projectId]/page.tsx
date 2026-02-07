"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    useEffect(() => {
        // Redirect to Architecture Map as the default view
        router.replace(`/projects/${projectId}/canvas`);
    }, [projectId, router]);

    return null;
}
