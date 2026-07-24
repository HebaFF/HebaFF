"use client";

import { useEffect, useState } from "react";
import { Card, Button, Modal, TextArea, SegmentedControl } from "@/components/ui";
import { WarningIcon, UtensilsIcon, CalendarIcon } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useAppData } from "@/context/AppDataContext";
import { useLang } from "@/context/LangContext";
import { generateTips, type Tip } from "@/lib/tips";
import { api, ApiError, type CommunityPost } from "@/lib/api";

function tipText(tip: Tip, T: ReturnType<typeof useLang>["t"]["tips"]): { icon: React.ReactNode; text: string; bg: string } {
  switch (tip.kind) {
    case "timeInRangeHigh":
      return { icon: <WarningIcon color="var(--warn)" />, text: T.timeInRangeHighTip(tip.pct), bg: "var(--warn-tint)" };
    case "timeInRangeLow":
      return { icon: <WarningIcon color="var(--danger)" />, text: T.timeInRangeLowTip(tip.pct), bg: "var(--danger-tint)" };
    case "timeOfDay": {
      const windowLabel =
        tip.window === "breakfast" ? T.windowBreakfast : tip.window === "lunch" ? T.windowLunch : tip.window === "dinner" ? T.windowDinner : T.windowOther;
      return { icon: <UtensilsIcon color="var(--primary)" />, text: T.timeOfDayTip(windowLabel, tip.pct), bg: "var(--primary-tint)" };
    }
    case "loggingGap":
      return { icon: <CalendarIcon color="var(--text-2)" />, text: T.loggingGapTip, bg: "var(--surface-2)" };
  }
}

function formatRelative(ts: number, T: ReturnType<typeof useLang>["t"]["community"]) {
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return T.justNow;
  if (minutes < 60) return T.minutesAgo(minutes);
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return T.hoursAgo(hours);
  return T.daysAgo(Math.floor(hours / 24));
}

export default function CarePage() {
  const { user } = useAuth();
  const { entries } = useAppData();
  const { t } = useLang();
  const T = t.tips;
  const TC = t.community;
  const [section, setSection] = useState<"tips" | "community">("tips");

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (section !== "community") return;
    let cancelled = false;
    api
      .listCommunityPosts()
      .then(({ posts }) => {
        if (!cancelled) setPosts(posts);
      })
      .finally(() => {
        if (!cancelled) setLoadingPosts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section]);

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
      setError(err instanceof ApiError ? err.message : TC.postError);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user?.profile) return null;
  const tips = generateTips(entries, user.profile.units);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{t.nav.care}</div>

      <SegmentedControl
        value={section}
        onChange={setSection}
        options={[
          { value: "tips", label: t.nav.tips },
          { value: "community", label: t.nav.community },
        ]}
      />

      {section === "tips" ? (
        tips.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{T.emptyTitle}</div>
            <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{T.emptyDesc}</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tips.map((tip, i) => {
              const { icon, text, bg } = tipText(tip, T);
              return (
                <Card key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: bg, border: "none" }}>
                  <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>{text}</span>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <>
          <Button onClick={() => setComposeOpen(true)}>{TC.newPostBtn}</Button>

          {!loadingPosts && posts.length === 0 && (
            <Card style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{TC.emptyTitle}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{TC.emptyDesc}</div>
            </Card>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {posts.map((p) => (
              <Card key={p.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>@{p.username}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{formatRelative(p.createdAt, TC)}</span>
                </div>
                <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p.content}</div>
              </Card>
            ))}
          </div>

          <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title={TC.composeTitle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder={TC.composePlaceholder} autoFocus maxLength={500} />
              {error && <div style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
              <Button full onClick={submitPost} disabled={submitting || !content.trim()}>
                {submitting ? t.common.savingBtn : TC.postBtn}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
