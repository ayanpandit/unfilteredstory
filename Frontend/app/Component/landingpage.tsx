"use client";

import React, { useEffect, useState, useMemo } from "react";
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

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const IconArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
  </svg>
);

const IconRss = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="6.18" cy="17.82" r="2.18" />
    <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z" />
  </svg>
);

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
  </svg>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

/* Helper: estimate reading time */
function readTime(article: Article): string {
  const words = (article.excerpt?.split(" ").length || 0) + (article.content ? 800 : 200);
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

/* Helper: format date */
function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/* Category badge color map */
const BADGE_COLORS: Record<string, string> = {
  spotlight: "bg-[#d121b6] text-white",
  news: "bg-red-500 text-white",
  breaking: "bg-red-600 text-white",
  policy: "bg-purple-500 text-white",
  funding: "bg-amber-500 text-white",
  "mega deal": "bg-orange-500 text-white",
  expansion: "bg-violet-500 text-white",
  startups: "bg-blue-500 text-white",
  default: "bg-slate-700 text-white",
};

function getBadgeColor(name: string): string {
  return BADGE_COLORS[name.toLowerCase()] || BADGE_COLORS.default;
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: "12" };
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

  /* Split articles into sections */
  const spotlightArticles = useMemo(() => articles.slice(0, 3), [articles]);
  const newsArticles = useMemo(() => articles.slice(3, 9), [articles]);
  const remainingArticles = useMemo(() => articles.slice(9), [articles]);

  const navLinks = [
    { label: "Home", slug: "" },
    { label: "Funding", slug: "funding" },
    { label: "News", slug: "news" },
    { label: "Startups", slug: "startups" },
    { label: "About", slug: "about" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-[var(--font-inter)] selection:bg-[#d121b6] selection:text-white pb-0">
      <div className="home-landing hero-rainbow-gradient text-white">
        {/* ══════════════ HEADER / NAV ══════════════ */}
        <header className="sticky top-0 z-50 w-full bg-black/10 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center gap-[1px] shrink-0 hover:scale-[1.02] transition-transform">
              <span className="text-white text-[22px] font-bold tracking-tight">unfilter</span>
              <span className="text-white/80 text-[22px] font-bold tracking-tight">story</span>
              <span className="text-white/60 text-[22px] font-bold tracking-tight">.com</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.slug + link.label}
                onClick={() => { setSelectedCategory(link.slug); setPage(1); }}
                className={`text-[15px] font-medium transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                  selectedCategory === link.slug || (link.slug === "" && !selectedCategory)
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex-1 flex justify-end items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Search"
            >
              <IconSearch />
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Expandable search bar */}
        {searchOpen && (
          <div className="border-t border-white/10 px-4 md:px-8 py-3 bg-black/20 backdrop-blur-xl animate-slideDown">
            <div className="max-w-2xl mx-auto relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"><IconSearch /></span>
              <input
                autoFocus
                type="text"
                placeholder="Search articles..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-[rgba(255,255,255,0.6)] text-sm focus:ring-2 focus:ring-white/50 outline-none transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1 bg-black/20 backdrop-blur-xl animate-slideDown">
            {navLinks.map((link) => (
              <button
                key={link.slug + link.label}
                onClick={() => { setSelectedCategory(link.slug); setPage(1); setMobileMenuOpen(false); }}
                className={`text-sm font-semibold text-left px-4 py-3 rounded-lg border border-transparent transition-all ${
                  selectedCategory === link.slug || (link.slug === "" && !selectedCategory) 
                     ? "text-white bg-white/20 border-white/20" 
                     : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ══════════════ HERO SECTION ══════════════ */}
      <section className="relative overflow-hidden py-16 md:py-28 lg:py-32 px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full max-w-[1400px] mx-auto relative z-10 text-left">
          
          {/* Left Hero Text Content */}
            <div className="animate-slideDown flex flex-col justify-center items-start">
              <h1 className="text-5xl md:text-6xl lg:text-[76px] font-bold leading-[1.05] tracking-tight text-white mb-8 drop-shadow-lg">
                World wants to hear more<br className="hidden sm:block" /> about you.
              </h1>
              <p className="text-lg md:text-2xl text-white/95 max-w-2xl leading-relaxed mb-10 font-medium drop-shadow">
                No fluff. No bias. Just raw insights into India&apos;s most ambitious startups,
                their funding, and the stories that matter.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/feeds"
                  className="group w-full sm:w-auto inline-flex justify-center items-center gap-3 bg-white text-[#d121b6] px-8 py-4 rounded-xl text-[16px] font-bold hover:scale-[1.03] hover:bg-white/95 transition-all duration-300 shadow-[0_10px_40px_rgba(255,255,255,0.3)]"
                >
                  Feature Your Raw Story with unfilterstory.com 
                  <svg className="transition-transform duration-300 group-hover:translate-x-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </Link>
                <button
                  onClick={() => { setSelectedCategory(""); setPage(1); }}
                  className="w-full sm:w-auto inline-flex justify-center items-center gap-3 bg-white/10 backdrop-blur-md text-white border border-white/40 px-8 py-4 rounded-xl text-[16px] font-bold hover:bg-white/20 hover:border-white transition-all duration-300 shadow-xl"
                >
                  Read Unfiltered News
                </button>
              </div>
            </div>

            {/* Right Bended Image / Visuals */}
            <div className="hidden lg:flex justify-end items-center relative w-full h-full min-h-[500px]" style={{ perspective: '1200px' }}>
               <div 
                  className="group relative w-[95%] transform-gpu transition-all duration-1000 ease-out hover:rotate-y-0 hover:rotate-x-0 hover:rotate-z-0 hover:scale-105"
                  style={{ transform: 'rotateY(-20deg) rotateX(15deg) rotateZ(3deg)' }}
               >
                 <div className="rounded-3xl overflow-hidden border border-white/30 shadow-[0_40px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl bg-white/10 p-3 animate-float relative z-20">
                    <img 
                      src={articles[0]?.featuredImage || "https://tii.imgix.net/production/articles/1099/7e908221-3641-436c-aecf-223b59bdd2b6.jpg?auto=compress&fit=crop&auto=format"} 
                      alt="UnfilterStory Interface" 
                      className="rounded-2xl w-full aspect-[4/3] object-cover" 
                    />
                    {/* Glass overlay shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
                 </div>
                 
                 {/* Decorative background glass cards */}
                 <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 z-10 animate-float" style={{ animationDelay: '1s' }} />
                 <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 z-10 animate-float" style={{ animationDelay: '2s' }} />
               </div>
          </div>
        </div>
      </section>
    </div>

    <main className="w-full">
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-[#d121b6]/50 border-t-[#d121b6] rounded-full animate-spin" />
        </div>
        ) : articles.length === 0 ? (
          <p className="text-center text-slate-500 py-24 text-lg">No articles found.</p>
        ) : (
          <>
            {/* ══════════════ SPOTLIGHT SECTION ══════════════ */}
            <section className="w-full bg-white py-14 md:py-20 px-4 md:px-8 border-t border-slate-200">
              <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-10">
                  <span className="text-amber-400"><IconStar /></span>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">Spotlight</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                  {/* Main spotlight (large card) */}
                  {spotlightArticles[0] && (
                    <div className="lg:col-span-3 perspective-[1000px]">
                      <Link href={`/article/${spotlightArticles[0].slug}`} className="group block h-full">
                        <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 h-full group-hover:scale-[1.01] group-hover:-translate-y-1 transition-all duration-500 shadow-sm hover:shadow-xl">
                          {spotlightArticles[0].featuredImage && (
                            <img
                              src={spotlightArticles[0].featuredImage}
                              alt={spotlightArticles[0].title}
                              className="w-full h-64 md:h-80 lg:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          {/* Badge */}
                          <span className={`absolute top-5 left-5 px-3 py-1.5 text-[10px] font-black tracking-wider uppercase rounded-md shadow-lg ${getBadgeColor(spotlightArticles[0].category?.name || "spotlight")}`}>
                            {spotlightArticles[0].category?.name || "Spotlight"}
                          </span>
                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight mb-3 group-hover:text-yellow-300 transition-colors">
                              {spotlightArticles[0].title}
                            </h3>
                            {spotlightArticles[0].excerpt && (
                              <p className="text-white/80 text-sm leading-relaxed mb-5 line-clamp-2 max-w-lg">
                                {spotlightArticles[0].excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shadow-sm">
                                  {spotlightArticles[0].author?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white drop-shadow-md">{spotlightArticles[0].author?.name}</p>
                                  <p className="text-xs text-white/70">
                                    {fmtDate(spotlightArticles[0].publishedAt)} &middot; {readTime(spotlightArticles[0])}
                                  </p>
                                </div>
                              </div>
                              <span className="text-white/90 text-sm font-bold group-hover:text-white group-hover:translate-x-1 transition-transform">
                                Read More &rarr;
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Right side spotlight cards */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    {spotlightArticles.slice(1, 3).map((article) => (
                      <Link href={`/article/${article.slug}`} key={article.id} className="group block flex-1">
                        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 h-full flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                          {article.featuredImage && (
                            <div className="h-48 overflow-hidden bg-slate-100">
                              <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-1">
                            <span className={`self-start px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md mb-3 shadow-sm ${getBadgeColor(article.category?.name || "spotlight")}`}>
                              {article.category?.name || "Spotlight"}
                            </span>
                            <h4 className="text-base md:text-lg font-bold leading-snug text-slate-900 group-hover:text-[#d121b6] transition-colors mb-2 flex-1 line-clamp-2">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              {article.author?.name} &middot; {readTime(article)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════ NEWS SECTION ══════════════ */}
            {newsArticles.length > 0 && (
              <section className="w-full bg-slate-50 py-14 md:py-20 px-4 md:px-8 border-t border-slate-200">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-10">
                    UnfilterStory News
                  </h2>

                  {/* Top row: horizontal cards (2 columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {newsArticles.slice(0, 2).map((article) => (
                      <Link href={`/article/${article.slug}`} key={article.id} className="group block">
                        <div className="flex gap-4 bg-white rounded-2xl border border-slate-200 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
                          {article.featuredImage && (
                            <div className="w-28 h-28 md:w-36 md:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                              <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex flex-col justify-center flex-1 min-w-0">
                            <span className={`self-start px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded mb-2 shadow-sm ${getBadgeColor(article.category?.name || "news")}`}>
                              {article.category?.name || "News"}
                            </span>
                            <h4 className="text-sm md:text-[15px] font-bold leading-snug text-slate-900 group-hover:text-[#d121b6] transition-colors mb-2 line-clamp-2">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              {article.author?.name} <span className="inline-flex items-center gap-1 opacity-70"><IconCalendar /> {fmtDateShort(article.publishedAt)}</span>
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Middle row: smaller horizontal cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {newsArticles.slice(2, 4).map((article) => (
                      <Link href={`/article/${article.slug}`} key={article.id} className="group block">
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded mb-3 shadow-sm ${getBadgeColor(article.category?.name || "news")}`}>
                            {article.category?.name || "News"}
                          </span>
                          <h4 className="text-sm md:text-[15px] font-bold leading-snug text-slate-900 group-hover:text-[#d121b6] transition-colors mb-2 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            {article.author?.name} <span className="inline-flex items-center gap-1 opacity-70"><IconCalendar /> {fmtDateShort(article.publishedAt)}</span>
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom row: compact cards grid */}
                  {newsArticles.length > 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {newsArticles.slice(4).map((article) => (
                        <Link href={`/article/${article.slug}`} key={article.id} className="group block">
                          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded mb-3 shadow-sm ${getBadgeColor(article.category?.name || "news")}`}>
                              {article.category?.name || "News"}
                            </span>
                            <h4 className="text-sm font-bold leading-snug text-slate-900 group-hover:text-[#d121b6] transition-colors mb-2 line-clamp-2">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              {article.author?.name} <span className="inline-flex items-center gap-1 opacity-70"><IconCalendar /> {fmtDateShort(article.publishedAt)}</span>
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* More Stories Button */}
                  <div className="flex justify-center mt-10">
                    <Link
                      href="/feeds"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] via-[#d121b6] to-[#8b5cf6] text-white px-8 py-3.5 rounded-full text-sm font-bold hover:scale-105 transition-transform duration-300 shadow-lg"
                    >
                      More Unfiltered Stories <IconArrow />
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* ══════════════ REMAINING ARTICLES ══════════════ */}
            {remainingArticles.length > 0 && (
              <section className="w-full bg-slate-50 py-14 md:py-20 px-4 md:px-8 border-t border-slate-200">
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {remainingArticles.map((article) => (
                      <Link href={`/article/${article.slug}`} key={article.id} className="group">
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                          {article.featuredImage && (
                            <div className="aspect-video w-full bg-slate-100 overflow-hidden">
                              <img
                                src={article.featuredImage}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-1">
                            <span className={`self-start px-2.5 py-1 text-[9px] font-black tracking-wider uppercase rounded-md mb-3 shadow-sm ${getBadgeColor(article.category?.name || "default")}`}>
                              {article.category?.name || "Uncategorized"}
                            </span>
                            <h4 className="text-base md:text-lg font-bold leading-snug text-slate-900 group-hover:text-[#d121b6] transition-colors mb-3 flex-1 line-clamp-2">
                              {article.title}
                            </h4>
                            {article.excerpt && (
                              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{article.excerpt}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                              <span className="font-semibold text-slate-600">{article.author?.name}</span>
                              <span>{fmtDateShort(article.publishedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 py-10 bg-slate-50 px-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-6 py-3 rounded-full bg-white border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  &larr; Previous
                </button>
                <span className="flex items-center text-sm font-semibold text-slate-500 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-6 py-3 rounded-full bg-white border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════ STATS BAR ══════════════ */}
        <section className="w-full stats-rainbow-gradient py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white relative z-10">
            {[
              { value: "2500+", label: "Startups Tracked" },
              { value: "$12B+", label: "Funding Analyzed" },
              { value: "Daily", label: "Unfiltered Updates" },
              { value: "100K+", label: "Sharp Readers" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 hover:scale-105 transition-transform duration-300">
                <span className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md">{stat.value}</span>
                <span className="text-xs md:text-sm font-bold text-white/90 uppercase tracking-wider drop-shadow-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════ NEWSLETTER SECTION ══════════════ */}
        <section className="w-full bg-slate-50 py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="newsletter-rainbow-gradient rounded-3xl p-8 md:p-14 text-center text-white relative overflow-hidden shadow-2xl">
              {/* Decorative glows */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[60px]" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[60px]" />

              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg mb-2">
                  <IconMail />
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight drop-shadow-md">
                  Get The Raw Truth. Weekly.
                </h2>
                <p className="text-white/90 text-base md:text-lg max-w-xl leading-relaxed">
                  No PR spin. No sugarcoating. Just unfiltered startup intelligence, mega deals, and
                  stories that actually matter — straight to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full max-w-lg">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-6 py-4 rounded-xl bg-white/10 backdrop-blur border border-white/30 text-white placeholder-white/70 text-[15px] outline-none focus:ring-2 focus:ring-white/60 shadow-inner"
                  />
                  <button className="px-8 py-4 bg-white text-[#d121b6] rounded-xl text-[15px] font-bold hover:scale-[1.03] transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.2)] whitespace-nowrap">
                    Get Unfiltered
                  </button>
                </div>
                <p className="text-white/70 text-xs mt-2 font-medium">
                  Join 50,000+ founders, investors, and operators who refuse to miss out.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ FEEDS SECTION ══════════════ */}
        <section className="w-full bg-white border-t border-slate-200 py-16 md:py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-4">Stay Connected</h3>
            <p className="text-base text-slate-500 mb-8 font-medium">Subscribe to our feeds in RSS, Atom, or JSON — pick your format.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={`${API_URL}/rss`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-200 px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-100 hover:-translate-y-1 transition-all shadow-sm"
              >
                <IconRss /> RSS 2.0
              </a>
              <a
                href={`${API_URL}/rss/atom`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-100 hover:-translate-y-1 transition-all shadow-sm"
              >
                <IconRss /> Atom
              </a>
              <a
                href={`${API_URL}/rss/json`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-100 hover:-translate-y-1 transition-all shadow-sm"
              >
                <IconRss /> JSON Feed
              </a>
              <Link
                href="/feeds"
                className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 hover:-translate-y-1 transition-all shadow-sm"
              >
                All Feeds &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-slate-950 text-slate-400 pt-16 md:pt-24 pb-8 px-4 md:px-8 mt-auto border-t border-slate-900">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand col */}
            <div>
              <div className="flex items-center gap-1 mb-5">
                <span className="text-white text-xl font-black tracking-tight">UB FilterStory</span>
              </div>
              <p className="text-[15px] leading-relaxed text-slate-400 mb-6 max-w-sm font-medium">
                India&apos;s premier platform for startup news, funding updates, and ecosystem insights.
              </p>
              <div className="flex items-center gap-3">
                {["f", "𝕏", "in", "📷"].map((icon, i) => (
                  <span
                    key={i}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 hover:bg-white hover:text-[#d121b6] hover:scale-110 transition-all cursor-pointer shadow-lg"
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>

            {/* Content col */}
            <div>
              <h4 className="text-white text-base font-bold mb-6">Content</h4>
              <ul className="space-y-3">
                {["Funding News", "Startup Stories", "Industry Analysis", "Expert Opinions"].map((item) => (
                  <li key={item}>
                    <span className="text-[15px] text-slate-400 font-medium hover:text-white hover:translate-x-1 inline-block transition-all cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources col */}
            <div>
              <h4 className="text-white text-base font-bold mb-6">Resources</h4>
              <ul className="space-y-3">
                {["Startup Database", "Investor Directory", "Reports & Research", "Guides & Tools"].map((item) => (
                  <li key={item}>
                    <span className="text-[15px] text-slate-400 font-medium hover:text-white hover:translate-x-1 inline-block transition-all cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company col */}
            <div>
              <h4 className="text-white text-base font-bold mb-6">Company</h4>
              <ul className="space-y-3">
                {["About Us", "Careers", "Contact", "Advertise"].map((item) => (
                  <li key={item}>
                    <span className="text-[15px] text-slate-400 font-medium hover:text-white hover:translate-x-1 inline-block transition-all cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500 font-medium">
            <p>&copy; {new Date().getFullYear()} UB FilterStory. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-white transition-colors cursor-pointer">Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
