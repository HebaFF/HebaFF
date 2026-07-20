import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { communityPostSchema } from "@/lib/validation";
import { checkRateLimit, rateLimitedResponse } from "@/lib/rateLimit";

// Blunts spam from a single account without needing full moderation tooling.
const POST_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

function toPostDTO(p: { id: string; content: string; createdAt: Date; user: { username: string } }) {
  return {
    id: p.id,
    username: p.user.username,
    content: p.content,
    createdAt: p.createdAt.getTime(),
  };
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const posts = await prisma.communityPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { username: true } } },
  });
  return NextResponse.json({ posts: posts.map(toPostDTO) });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rateCheck = checkRateLimit(`community:post:user:${userId}`, POST_LIMIT.limit, POST_LIMIT.windowMs);
  if (!rateCheck.allowed) return rateLimitedResponse(rateCheck.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const parsed = communityPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid post." }, { status: 400 });
  }

  const post = await prisma.communityPost.create({
    data: { userId, content: parsed.data.content },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json({ post: toPostDTO(post) });
}
