"use client";

import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "./Dashboard";
import ArticlesList from "./ArticlesList";
import ArticleEditor from "./ArticleEditor";
import Categories from "./Categories";
import Tags from "./Tags";
import UsersRoles from "./UsersRoles";
import Account from "./Account";
import { getStoredUser, getToken, clearToken, setStoredUser } from "../lib/api";

export default function CMSApp() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
    }
    setReady(true);

    const onLogout = () => { setUser(null); };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const handleLogin = (u: any) => setUser(u);

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  const handleNavigate = (section: string) => {
    setEditArticleId(null);
    setActiveSection(section);
    setMobileSidebarOpen(false);
  };

  const handleNewArticle = () => {
    setEditArticleId(null);
    setActiveSection("article-editor");
    setMobileSidebarOpen(false);
  };

  const handleEditArticle = (id: string) => {
    setEditArticleId(id);
    setActiveSection("article-editor");
    setMobileSidebarOpen(false);
  };

  if (!ready) return null;

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "articles":
        return <ArticlesList onNewArticle={handleNewArticle} onEdit={handleEditArticle} />;
      case "article-editor":
        return <ArticleEditor articleId={editArticleId} onBack={() => handleNavigate("articles")} />;
      case "categories":
        return <Categories />;
      case "tags":
        return <Tags />;
      case "users":
        return <UsersRoles currentUser={user} />;
      case "account":
        return <Account onUserUpdated={(u: any) => { setUser(u); setStoredUser(u); }} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="cms-layout">
      <Sidebar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="cms-main">
        <Header
          user={user}
          onNewArticle={handleNewArticle}
          onLogout={handleLogout}
          onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        />
        <main className="cms-workspace">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
