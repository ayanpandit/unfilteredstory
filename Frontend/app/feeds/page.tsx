"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface FeedEntry {
  name: string;
  slug: string;
  rss: string;
  atom: string;
  json: string;
}

interface FeedDirectory {
  feeds: {
    main: { rss: string; atom: string; json: string };
    categories: FeedEntry[];
    tags: FeedEntry[];
  };
  sitemap: string;
}

const IconRss = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="6.18" cy="17.82" r="2.18" />
    <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
  </svg>
);

const IconAtom = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const IconJson = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
  </svg>
);

const IconCopy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

function CopyFeedButton({
  url,
  icon,
  label,
  className,
}: {
  url: string;
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : `Copy ${label} URL`}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${className}`}
    >
      {icon}
      <span>{label}</span>
      {copied ? <IconCheck /> : <IconCopy />}
    </button>
  );
}

/** Build correct feed URLs using the frontend's API_URL instead of whatever the backend returned */
function feedUrls(path: string) {
  return {
    rss: `${API_URL}/rss${path}`,
    atom: `${API_URL}/rss${path}/atom`,
    json: `${API_URL}/rss${path}/json`,
  };
}

function mainFeedUrls() {
  return {
    rss: `${API_URL}/rss`,
    atom: `${API_URL}/rss/atom`,
    json: `${API_URL}/rss/json`,
  };
}

function FeedBadges({ rss, atom, json }: { rss: string; atom: string; json: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <CopyFeedButton
        url={rss}
        icon={<IconRss />}
        label="RSS 2.0"
        className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
      />
      <CopyFeedButton
        url={atom}
        icon={<IconAtom />}
        label="Atom"
        className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
      />
      <CopyFeedButton
        url={json}
        icon={<IconJson />}
        label="JSON"
        className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
      />
    </div>
  );
}

export default function FeedsPage() {
  const [directory, setDirectory] = useState<FeedDirectory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/rss/directory`)
      .then((r) => r.json())
      .then((data) => setDirectory(data.data || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-[var(--font-inter)] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/50 px-4 md:px-10 py-3.5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <h2 className="text-slate-900 text-lg font-black leading-tight tracking-tight">UnfilterStory</h2>
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-[#ff3dab] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-10 py-12 md:py-20">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
              <IconRss />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">RSS Feeds</h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl leading-relaxed">
            Subscribe to our feeds in your favorite reader. We support RSS 2.0, Atom 1.0, and JSON Feed 1.1 — pick the format that works best for you.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-500 py-8">Loading feeds...</p>
        ) : !directory ? (
          <p className="text-slate-500 py-8">Unable to load feed directory.</p>
        ) : (
          <div className="space-y-12">
            {/* Main Feed */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff3dab]" />
                Main Feed
              </h2>
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-600 mb-4">All published articles across every category and topic.</p>
                <FeedBadges {...mainFeedUrls()} />
              </div>
            </section>

            {/* Category Feeds */}
            {directory.feeds.categories.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Category Feeds
                </h2>
                <div className="grid gap-4">
                  {directory.feeds.categories.map((cat) => (
                    <div key={cat.slug} className="p-5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                      <h3 className="font-bold text-base mb-3">{cat.name}</h3>
                      <FeedBadges {...feedUrls(`/category/${cat.slug}`)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tag Feeds */}
            {directory.feeds.tags.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Tag Feeds
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {directory.feeds.tags.map((tag) => (
                    <div key={tag.slug} className="p-5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                      <h3 className="font-bold text-sm mb-3">#{tag.name}</h3>
                      <FeedBadges {...feedUrls(`/tag/${tag.slug}`)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sitemap */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Sitemap
              </h2>
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                <p className="text-sm text-slate-600 mb-4">XML Sitemap for search engines.</p>
                <a
                  href={`${API_URL}/sitemap.xml`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 text-xs font-bold hover:bg-sky-100 transition-colors"
                >
                  sitemap.xml
                </a>
              </div>
            </section>

            {/* How to Subscribe */}
            <section className="p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
              <h2 className="text-xl font-bold mb-4">How to Subscribe</h2>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Desktop Readers</h3>
                  <p>Click any feed button to <strong>copy the URL</strong>, then paste it into apps like <strong>Feedly</strong>, <strong>Inoreader</strong>, <strong>NewsBlur</strong>, or <strong>NetNewsWire</strong>.</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Mobile</h3>
                  <p>Use <strong>Reeder</strong> (iOS), <strong>Read You</strong> (Android), or any RSS reader app — just paste the feed URL.</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Developers</h3>
                  <p>Use the <strong>JSON Feed</strong> format for easy parsing, or hit <code className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">/rss/directory</code> for the full API.</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-4 md:px-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} UnfilterStory. All rights reserved.</p>
          <Link href="/" className="hover:text-white transition-colors">Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}
