import { getCurrentUser } from "@/app/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if(!user) {
            return NextResponse.json(
                {
                    "error": "You are not authenticated",
                },
                { status : 401 }
            );

        }
        return NextResponse.json(user);
    } catch (err) {
        console.log(err);
        return NextResponse.json(
                {
                    "error": "Internal Server Error",
                },
                { status : 500 }
            );
    }
}