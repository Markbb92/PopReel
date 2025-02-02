"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, limit, startAfter, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import styles from "./feed.module.css";

export default function FeedPage() {
    const [videos, setVideos] = useState([]);
    const [lastVideo, setLastVideo] = useState(null);
    const [loading, setLoading] = useState(false);
    const videoRefs = useRef([]);
    const storage = getStorage();

    const saveVideoMetadata = async (downloadURL) => {
        try {
            await addDoc(collection(db, "videos"), {
                url: downloadURL,
                createdAt: serverTimestamp(),
                title: "New Video",
                uploader: "Pexels API"
            });
            console.log("Video metadata saved to Firestore");
        } catch (error) {
            console.error("Error saving video metadata:", error);
        }
    };

    const fetchPexelsVideo = async () => {
        try {
            console.log("Fetching video from Pexels API...");
            const response = await fetch("https://api.pexels.com/videos/search?query=nature&per_page=1", {
                headers: {
                    Authorization: process.env.NEXT_PUBLIC_PEXELS_API_KEY,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch Pexels videos");

            const data = await response.json();
            if (!data.videos || data.videos.length === 0) throw new Error("No videos found in Pexels API response");

            console.log("Fetched video from Pexels:", data.videos[0].video_files[0].link);
            return data.videos[0].video_files[0].link;
        } catch (error) {
            console.error("Error fetching Pexels video:", error);
            return null;
        }
    };

    const uploadNewVideo = async () => {
        try {
            console.log("Fetching new video from Pexels...");
            const videoUrl = await fetchPexelsVideo();
            if (!videoUrl) return;
    
            console.log("Downloading video from:", videoUrl);
            const response = await fetch(videoUrl);
            if (!response.ok) throw new Error("Failed to fetch video data");
    
            const blob = await response.blob();
            const uniqueFileName = `pexels_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`; // ✅ Unique file name
            const storageRef = ref(storage, `videos/${uniqueFileName}`);
            const uploadTask = uploadBytesResumable(storageRef, blob);
    
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        console.log(`Upload Progress: ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`);
                    },
                    (error) => {
                        console.error("Upload error:", error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log("Upload successful, URL:", downloadURL);
                        await saveVideoMetadata(downloadURL);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error("Error uploading video:", error);
        }
    };
    

    const fetchVideos = useCallback(async (isLoadMore = false) => {
        if (loading) return;
        setLoading(true);
    
        let videoQuery = isLoadMore && lastVideo
            ? query(collection(db, "videos"), orderBy("createdAt", "desc"), startAfter(lastVideo), limit(5))
            : query(collection(db, "videos"), orderBy("createdAt", "desc"), limit(5));
    
        const videoCollection = await getDocs(videoQuery);
        if (!videoCollection.empty) {
            const newVideos = videoCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
            // 🔥 **Prevent duplicate videos**
            setVideos(prevVideos => {
                const existingIds = new Set(prevVideos.map(video => video.id));
                const filteredNewVideos = newVideos.filter(video => !existingIds.has(video.id));
                return [...prevVideos, ...filteredNewVideos];
            });
    
            setLastVideo(videoCollection.docs[videoCollection.docs.length - 1]);
        }
        setLoading(false);
    }, [lastVideo, loading]);
    

    useEffect(() => {
        fetchVideos();
    }, []);

    return (
        <div className={styles.feedContainer}>
            {videos.length === 0 ? (
                <p>Loading videos...</p>
            ) : (
                videos.map((video, index) => (
                    <div key={video.id} className={styles.videoWrapper}>
                        <video
                            ref={(el) => {
                                if (el) {
                                    videoRefs.current[index] = el;
                                    el.muted = true;
                                    el.setAttribute("playsinline", "true");
                                    setTimeout(() => {
                                        if (el.paused) {
                                            el.play().catch((error) => console.warn("Auto-play error:", error));
                                        }
                                    }, 500);
                                }
                            }}
                            src={video.url}
                            controls
                            playsInline
                            muted
                            autoPlay
                            loop
                            preload="auto"
                            className={styles.video}
                        />
                        <div className={styles.overlay}>
                            <h3 className={styles.title}>{video.title}</h3>
                            <p className={styles.uploader}>@{video.uploader}</p>
                            <div className={styles.actions}>
                                <button>❤️ Like</button>
                                <button>💬 Comment</button>
                                <button>🔗 Share</button>
                            </div>
                        </div>
                    </div>
                ))
            )}
            <button
                className={styles.loadMoreButton}
                onClick={async () => {
                    setLoading(true);
                    console.log("Load More button clicked");
                    await uploadNewVideo();
                    await fetchVideos(true);
                    setLoading(false);
                }}
                disabled={loading}
            >
                {loading ? "Loading..." : "Load More Videos"}
            </button>
            {loading && <p>Loading more videos...</p>}
        </div>
    );
}