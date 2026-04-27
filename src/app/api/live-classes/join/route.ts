import { NextResponse } from "next/server";
import { bbb } from "@/lib/bbb";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, classId } = body;

        if (!userId || !classId) {
            return NextResponse.json({ message: "User ID and Class ID are required" }, { status: 400 });
        }

        if (!bbb) {
            return NextResponse.json({ message: "BigBlueButton is not configured" }, { status: 500 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        const liveClass = await prisma.liveClass.findUnique({ where: { id: classId } });
        if (!liveClass) return NextResponse.json({ message: "Class not found" }, { status: 404 });

        if (liveClass.status !== "ACTIVE") {
            return NextResponse.json({ message: "Class has ended or is not active" }, { status: 400 });
        }

        const isModerator = liveClass.facultyId === user.id || user.role === "ADMIN";
        const password = isModerator ? liveClass.moderatorPw : liveClass.attendeePw;
        const userName = user.name || user.email.split("@")[0] || "Student";

        const joinUrl = bbb.administration.join(
            userName,
            liveClass.meetingID,
            password,
            {
                userID: user.id,
                redirect: true,
            }
        );

        // We return the URL here so the frontend can open it
        return NextResponse.json({ joinUrl : joinUrl });
    } catch (error: any) {
        console.error("BBB Join Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
