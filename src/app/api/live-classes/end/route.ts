import { NextResponse } from "next/server";
import { bbb } from "@/lib/bbb";
import { prisma } from "@/lib/prisma";
import axios from "axios";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, classId } = body;

        if (!userId || !classId) {
            return NextResponse.json({ message: "User ID and Class ID are required" }, { status: 400 });
        }

        if (!bbb) return NextResponse.json({ message: "BigBlueButton is not configured" }, { status: 500 });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

        const liveClass = await prisma.liveClass.findUnique({ where: { id: classId } });
        if (!liveClass) return NextResponse.json({ message: "Class not found" }, { status: 404 });

        if (liveClass.facultyId !== user.id && user.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized to end this class" }, { status: 403 });
        }

        try {
            const endUrl = bbb.administration.end(
                liveClass.meetingID,
                liveClass.moderatorPw
            );
            await axios.get(endUrl);
        } catch (e) {
            console.warn("BBB API End class failed, maybe already ended", e);
        }

        const updatedClass = await prisma.liveClass.update({
            where: { id: classId },
            data: { status: "ENDED" }
        });

        return NextResponse.json(updatedClass);
    } catch (error: any) {
        console.error("BBB End Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
