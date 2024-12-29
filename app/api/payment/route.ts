import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    const payment = await razorpay.orders.create({
      amount: amount * 100, // Convert to smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        currency: "INR",
        status: "pending",
        razorpayId: payment.id,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}