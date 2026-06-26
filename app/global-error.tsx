"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <main style={{ minHeight: "100vh", background: "#020617", color: "#ffffff", padding: "64px 16px" }}>
          <div style={{ alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "center", margin: "0 auto", maxWidth: 720, minHeight: "70vh", textAlign: "center" }}>
            <p style={{ color: "#5eead4", fontSize: 14, fontWeight: 900, letterSpacing: "0.18em" }}>ERROR</p>
            <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.35, marginTop: 16 }}>アプリケーションエラーが発生しました</h1>
            <p style={{ color: "#cbd5e1", lineHeight: 1.8, marginTop: 20 }}>
              一時的な問題の可能性があります。再読み込みしても解消しない場合は、時間をおいて再度お試しください。
            </p>
            <button
              onClick={reset}
              style={{ background: "#2dd4bf", border: 0, borderRadius: 6, color: "#020617", cursor: "pointer", fontWeight: 900, marginTop: 32, minHeight: 48, padding: "12px 24px" }}
              type="button"
            >
              再読み込みする
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
