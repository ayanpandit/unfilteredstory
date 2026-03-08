"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Article } from "../../lib/api";
import { getArticleBySlug } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const IconRss = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="6.18" cy="17.82" r="2.18" />
    <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
  </svg>
);

export default function ArticlePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug)
      .then(setArticle)
      .catch(() => setError("Article not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-slate-500 text-lg">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <p className="text-slate-500 text-lg">{error || "Article not found."}</p>
        <Link href="/" className="text-[#ff3dab] font-semibold hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Parse content — stored as JSON object (e.g. { text: "..." })
  const contentText =
    typeof article.content === "string"
      ? article.content
      : typeof article.content === "object" && article.content !== null
        ? (article.content.text || JSON.stringify(article.content))
        : "";

  return (
    <div className="min-h-screen bg-white font-[var(--font-inter)] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/50 px-4 md:px-10 py-3.5 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[#ff3dab] hover:opacity-80 transition-opacity">
            <h2 className="text-slate-900 text-lg font-black">UnfilterStory</h2>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href={`${API_URL.replace("/api/v1", "")}/api/v1/rss`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 transition-colors p-2"
              title="RSS Feed"
            >
              <IconRss />
            </a>
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-[#ff3dab] transition-colors">
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-20">
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {article.category && (
            <span className="px-3 py-1 bg-gradient-to-r from-[#ff3dab] to-purple-600 text-white text-[10px] font-black tracking-widest rounded-md uppercase">
              {article.category.name}
            </span>
          )}
          {article.tags?.map((t: any) => (
            <span key={t.id} className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase">
              {t.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">{article.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff3dab] to-purple-600 flex items-center justify-center font-bold text-white text-sm">
            {article.author?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?"}
          </div>
          <div>
            <p className="font-bold text-slate-900">{article.author?.name}</p>
            <p className="text-sm text-slate-500">
              {publishedDate}
              {article.viewCount > 0 ? ` · ${article.viewCount} views` : ""}
            </p>
          </div>
        </div>

        {/* Featured image */}
        {article.featuredImage && (
          <div className="mb-10 rounded-2xl overflow-hidden bg-slate-200">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-xl text-slate-600 leading-relaxed mb-8 font-medium italic border-l-4 border-[#ff3dab] pl-6">
            {article.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap">
          {contentText}
        </div>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#ff3dab] font-bold hover:underline"
          >
            ← Back to all articles
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 px-4 md:px-10 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} UnfilterStory. All rights reserved.</p>
      </footer>
    </div>
  );
}
