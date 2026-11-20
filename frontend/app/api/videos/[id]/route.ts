import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await req.json();
    const { title } = body;

    if (!id || typeof title !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid video id or title" },
        { status: 400 }
      );
    }

    await prisma.video.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating video title:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update video record" },
      { status: 500 }
    );
  }
}
