import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const liveClasses = await prisma.liveClass.findMany({
            where: { status: "ACTIVE" },
            include: {
                faculty: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(liveClasses);
    } catch (error: any) {
        console.error("Fetch Live Classes Error:", error);
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
    }
}
