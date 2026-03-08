"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Article, PaginatedArticles } from "../lib/api";
import { getPublicArticles, getCategories } from "../lib/api";

/* ── Inline SVG icons ── */
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
  </svg>
);

const IconArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
  </svg>
);

const IconRss = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="6.18" cy="17.82" r="2.18" />
    <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
  </svg>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: "10" };
    if (selectedCategory) params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;

    getPublicArticles(params)
      .then((result) => {
        setArticles(result.data || []);
        if (result.meta) setTotalPages(result.meta.totalPages);
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [page, selectedCategory, searchQuery]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="home-landing bg-white font-[var(--font-inter)] text-slate-900">
      {/* ── TopNavBar ── */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/50 px-4 md:px-10 py-3.5 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 text-[#ff3dab] hover:opacity-80 transition-opacity cursor-pointer">
              <h2 className="text-slate-900 text-lg font-black leading-tight tracking-tight">
                UnfilterStory
              </h2>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button
                onClick={() => { setSelectedCategory(""); setPage(1); }}
                className={`text-sm font-semibold transition-colors ${!selectedCategory ? "text-[#ff3dab]" : "text-slate-600 hover:text-[#ff3dab]"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                  className={`text-sm font-semibold transition-colors ${selectedCategory === cat.slug ? "text-[#ff3dab]" : "text-slate-600 hover:text-[#ff3dab]"}`}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

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
            <div className="relative hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search articles..."
                className="pl-10 pr-4 py-2 bg-slate-100 border border-slate-300/50 rounded-full text-sm w-64 focus:ring-2 focus:ring-[#ff3dab]/50 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <button
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <IconMenu />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 flex flex-col gap-2">
            <button
              onClick={() => { setSelectedCategory(""); setPage(1); setMobileMenuOpen(false); }}
              className={`text-sm font-semibold text-left px-2 py-1 rounded ${!selectedCategory ? "text-[#ff3dab] bg-pink-50" : "text-slate-600"}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.slug); setPage(1); setMobileMenuOpen(false); }}
                className={`text-sm font-semibold text-left px-2 py-1 rounded ${selectedCategory === cat.slug ? "text-[#ff3dab] bg-pink-50" : "text-slate-600"}`}
              >
                {cat.name}
              </button>
            ))}
            <div className="relative sm:hidden mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-slate-100 border border-slate-300/50 rounded-full text-sm w-full"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="w-full">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden home-hero-gradient py-20 md:py-28 px-4 md:px-10 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center relative z-10 animate-slideDown">
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Unfiltered Stories. Real Insights.
            </h1>
            <p className="text-lg md:text-xl font-medium text-white/90 max-w-2xl leading-relaxed">
              No fluff. No bias. Just the stories that matter.
            </p>
          </div>
        </section>

        {/* ── Articles Section ── */}
        <section className="w-full bg-white py-16 md:py-24 px-4 md:px-10">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <p className="text-center text-slate-500 py-16 text-lg">Loading articles...</p>
            ) : articles.length === 0 ? (
              <p className="text-center text-slate-500 py-16 text-lg">No articles found.</p>
            ) : (
              <>
                {/* Featured article */}
                {featured && (
                  <div className="mb-12 md:mb-16">
                    <Link href={`/article/${featured.slug}`} className="group block">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 md:p-10 rounded-2xl border border-slate-200 hover:shadow-xl transition-all duration-300">
                        {featured.featuredImage && (
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-200">
                            <img
                              src={featured.featuredImage}
                              alt={featured.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="flex flex-col justify-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#ff3dab] to-purple-600 text-white text-[10px] font-black tracking-widest rounded-md uppercase">
                              {featured.category?.name || "Uncategorized"}
                            </span>
                            {featured.tags?.slice(0, 2).map((t) => (
                              <span key={t.id} className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase">
                                {t.name}
                              </span>
                            ))}
                          </div>
                          <h3 className="text-2xl md:text-3xl lg:text-4xl font-black leading-tight group-hover:text-[#ff3dab] transition-colors">
                            {featured.title}
                          </h3>
                          {featured.excerpt && (
                            <p className="text-slate-600 text-base leading-relaxed line-clamp-3">
                              {featured.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-3 pt-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3dab] to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                              {featured.author?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{featured.author?.name}</p>
                              <p className="text-xs text-slate-500">
                                {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : ""}
                                {featured.viewCount > 0 ? ` · ${featured.viewCount} views` : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Article grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((article) => (
                    <Link href={`/article/${article.slug}`} key={article.id} className="group">
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                        {article.featuredImage && (
                          <div className="aspect-video w-full bg-slate-200 overflow-hidden">
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-6 flex flex-col flex-1">
                          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black tracking-widest rounded-md mb-3 uppercase w-fit">
                            {article.category?.name || "Uncategorized"}
                          </span>
                          <h4 className="text-lg font-bold leading-tight group-hover:text-[#ff3dab] transition-colors mb-3 flex-1">
                            {article.title}
                          </h4>
                          {article.excerpt && (
                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{article.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                            <span>By {article.author?.name}</span>
                            <span>
                              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-4 mt-12">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="px-6 py-3 rounded-full border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ← Previous
                    </button>
                    <span className="flex items-center text-sm text-slate-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-6 py-3 rounded-full border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Newsletter Section ── */}
        <section className="w-full bg-gradient-to-br from-slate-100 to-slate-50 py-16 md:py-24 px-4 md:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="home-hero-gradient rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-6">
                <h2 className="text-3xl md:text-4xl font-black leading-tight">Stay Updated</h2>
                <p className="text-white/90 text-base md:text-lg">
                  Subscribe to our RSS feed for the latest stories.
                </p>
                <div className="flex justify-center gap-4 mt-4">
                  <a
                    href={`${API_URL.replace("/api/v1", "")}/api/v1/rss`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-[#ff3dab] px-8 py-4 rounded-full font-black hover:scale-105 transition-all duration-300 active:scale-95 shadow-xl inline-flex items-center gap-2"
                  >
                    <IconRss /> RSS Feed
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-400 pt-16 md:pt-20 pb-10 px-4 md:px-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 text-white mb-4">
                <h2 className="text-lg font-black">UnfilterStory</h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                The unfiltered source of news. Stories that matter.
              </p>
            </div>
            <div className="flex gap-8">
              <a
                href={`${API_URL.replace("/api/v1", "")}/api/v1/rss`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2 text-sm"
              >
                <IconRss /> RSS Feed
              </a>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} UnfilterStory. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
