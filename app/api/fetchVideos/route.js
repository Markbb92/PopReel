import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function GET() {
    try {
        console.log("Fetching videos from Pexels API...");

        const res = await fetch("https://api.pexels.com/videos/popular?per_page=5", {
            headers: { Authorization: process.env.NEXT_PUBLIC_PEXELS_API_KEY }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch videos from Pexels API. Status: ${res.status}`);
        }

        const data = await res.json();
        const videos = data.videos;

        if (!videos || videos.length === 0) {
            throw new Error("No videos returned from Pexels API.");
        }

        for (const video of videos) {
            await addDoc(collection(db, "videos"), {
                title: video.user.name || "Pexels Video",
                url: video.video_files?.[0]?.link || "",
                uploader: "Auto-Generated",
                likes: 0,
                createdAt: serverTimestamp()
            });
        }

        console.log("Videos successfully added to Firestore!");
        return NextResponse.json({ message: "Videos added to Firestore!" });
    } catch (error) {
        console.error("Error fetching videos:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
