"use client";

import { useState, useEffect } from "react";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [uploading, setUploading] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    const handleUpload = async () => {
        if (!file || !user) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("uploader", user.displayName); // Store uploader's name

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        setVideoUrl(data.videoUrl);
        setUploading(false);
    };

    return (
        <div>
            <h1>Upload Video</h1>
            
            {user ? (
                <>
                    <p>👤 Logged in as {user.displayName}</p>
                    <input type="text" placeholder="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files[0])} />
                    <button onClick={handleUpload} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                </>
            ) : (
                <>
                    <p>⚠ You must be logged in to upload videos</p>
                    <button onClick={signInWithGoogle}>🔑 Sign in with Google</button>
                </>
            )}

            {videoUrl && (
                <div>
                    <h3>Uploaded Video:</h3>
                    <video src={videoUrl} controls width="300"></video>
                </div>
            )}
        </div>
    );
}
