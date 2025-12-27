import { generateToken, hashPassword, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/prisma/prisma";
import { Role } from "@/types";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();
        if(!email || !password) {
            return NextResponse.json(
                {
                    "error": "Email and Password must be provided",
                },
                { status : 400 }
            );
        }

        // Checking for existing user

        const existingUser  = await prisma.user.findUnique(
            { where: { email } }
        );

        if(!existingUser) {
            return NextResponse.json(
                {
                    "error": "User not registered",
                },
                { status : 409 }
            );
        }

        const user = await prisma.user.findUnique(
            { where : { email: email}}
        );

        if(!user) {
            return NextResponse.json(
                {
                    "error": "Invalid Credentials",
                },
                { status : 401 }
            );
        
        }

        const isValidPassword = await verifyPassword(password, user.password);

        if(!isValidPassword) {
            return NextResponse.json(
                {
                    "error": "Invalid Credentials",
                },
                { status : 401 }
            );
        
        }

        const token = generateToken(user.id);

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                teamId: user.teamId,
                token
            }
        })

        // setting cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60*60*24*7
        });


        return response;

    }
    catch (err) {
        console.log("Failed Login ",err)
        return NextResponse.json(
            {
                error: "Login process failed"
            },
            { status: 500 }
        )
    }
}