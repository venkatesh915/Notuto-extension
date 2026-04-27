import { NextResponse } from "next/server";
import { bbb } from "@/lib/bbb";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, name } = body;

        if (!userId) {
            return NextResponse.json({ message: "User ID is required" }, { status: 400 });
        }

        if (!bbb) {
            return NextResponse.json({ message: "BigBlueButton is not configured" }, { status: 500 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        // Basic check for Faculty / Admin role. You might want to customize this logic.
        if (user.role !== "FACULTY" && user.role !== "ADMIN") {
            return NextResponse.json({ message: "Only faculty can start classes" }, { status: 403 });
        }

        const meetingID = `mtg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const meetingName = name || `Live Class - ${new Date().toLocaleDateString()}`;
        const moderatorPW = Math.random().toString(36).substring(2, 10);
        const attendeePW = Math.random().toString(36).substring(2, 10);

        // Create BBB Meeting
        const createUrl = bbb.administration.create(
            meetingName,
            meetingID,
            {
                attendeePW,
                moderatorPW,
                record: false,
            }
        );
        await axios.get(createUrl);

        // Save in database
        const liveClass = await prisma.liveClass.create({
            data: {
                meetingID,
                name: meetingName,
                status: "ACTIVE",
                facultyId: user.id,
                moderatorPw: moderatorPW,
                attendeePw: attendeePW,
            }
        });

        return NextResponse.json(liveClass);
    } catch (error: any) {
        console.error("BBB Create Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
