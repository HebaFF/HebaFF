"use client";

import { useEffect, useState } from "react";
import { Card, Button, Modal, TextArea } from "@/components/ui";
import { useLang } from "@/context/LangContext";
import { api, ApiError, type CommunityPost } from "@/lib/api";

function formatRelative(ts: number, T: ReturnType<typeof useLang>["t"]["community"]) {
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return T.justNow;
  if (minutes < 60) return T.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return T.hoursAgo(hours);
  return T.daysAgo(Math.floor(hours / 24));
}

export default function CommunityPage() {
  const { t } = useLang();
  const T = t.community;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listCommunityPosts()
      .then(({ posts }) => {
        if (!cancelled) setPosts(posts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitPost() {
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const { post } = await api.createCommunityPost(content.trim());
      setPosts((prev) => [post, ...prev]);
      setContent("");
      setComposeOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.postError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{T.title}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{T.subtitle}</div>
      </div>

      <Button onClick={() => setComposeOpen(true)}>{T.newPostBtn}</Button>

      {!loading && posts.length === 0 && (
        <Card style={{ textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{T.emptyTitle}</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{T.emptyDesc}</div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.map((p) => (
          <Card key={p.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>@{p.username}</span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{formatRelative(p.createdAt, T)}</span>
            </div>
            <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.content}</div>
          </Card>
        ))}
      </div>

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={T.composeTitle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder={T.composePlaceholder} autoFocus maxLength={500} />
          {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <Button full onClick={submitPost} disabled={submitting || !content.trim()}>
            {submitting ? t.common.savingBtn : T.postBtn}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
