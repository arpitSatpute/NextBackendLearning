import { generateToken, hashPassword } from "@/app/lib/auth";
import { prisma } from "@/prisma/prisma";
import { Role } from "@/types";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const { name, email, password, teamCode } = await request.json();
        if(!name || !email || !password) {
            return NextResponse.json(
                {
                    "error": "Name, Email and Password must be provided",
                },
                { status : 400 }
            );
        }

        // Checking for existing user

        const existingUser  = await prisma.user.findUnique(
            { where: { email } }
        );

        if(existingUser) {
            return NextResponse.json(
                {
                    "error": "User exist with this email",
                },
                { status : 409 }
            );
        }

        let teamId: string | undefined;
        if(teamCode) {
            const team = await prisma.team.findUnique(
                {where: { code: teamCode }}
            )

            if(!team) {
                return NextResponse.json(
                    {
                        "error": "Enter a valid team code"
                    },
                    {
                        status: 400
                    }
                )
            }

            teamId = team.id;
        }
        const hashedPassword = await hashPassword(password);

        const userCount = await prisma.user.count();
        const role = userCount === 0? Role.ADMIN : Role.USER;

        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: hashedPassword,
                role: role,
                teamId: teamId
            },
            include: {
                team: true,
            }
        });

        const token = generateToken(user.id);

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                team: user.team,
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
        console.log("Error Failed Registration ",err)

    }
}