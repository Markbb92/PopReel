import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
    try {
        console.log("Received upload request...");

        const formData = await req.formData();
        const file = formData.get("file");
        const title = formData.get("title") || "Untitled Video";
        const uploader = formData.get("uploader") || "Anonymous";

        if (!file) {
            console.error("No file received in formData");
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        console.log("Uploading video to Cloudinary using Unsigned Upload...");

        // Manually add the unsigned upload preset
        formData.append("upload_preset", "popreel_preset"); // Replace with your actual preset name

        const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!cloudinaryRes.ok) {
            console.error(`Cloudinary upload failed: ${cloudinaryRes.status}`);
            return NextResponse.json({ error: "Cloudinary upload failed" }, { status: cloudinaryRes.status });
        }

        const data = await cloudinaryRes.json().catch(() => null);

        if (!data || !data.secure_url) {
            console.error("Invalid Cloudinary response:", data);
            return NextResponse.json({ error: "Invalid Cloudinary response" }, { status: 500 });
        }

        const videoUrl = data.secure_url;

        // Store metadata in Firestore
        const videoDoc = await addDoc(collection(db, "videos"), {
            title,
            url: videoUrl,
            uploader,
            likes: 0,
            createdAt: serverTimestamp(),
        });

        return NextResponse.json({ videoUrl, id: videoDoc.id });
    } catch (error) {
        console.error("Upload API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
