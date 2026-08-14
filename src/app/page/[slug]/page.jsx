"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Loader2, Calendar, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pagesApi } from "@/services/pages/pages-api";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export default function PageDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const [page, setPage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allPages, setAllPages] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const response = await pagesApi.getPageBySlug(slug);
        setPage(response.data);
        
        // Fetch all pages for related pages section
        const pagesResponse = await pagesApi.getActivePages();
        setAllPages(pagesResponse.data || []);
      } catch (error) {
        console.error("Error fetching page:", error);
        toast.error("Page not found");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [slug, router]);

  // Reading progress indicator
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page]);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: page.title,
          text: `Check out ${page.title} on Soouq Live`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The page you're looking for doesn't exist.</p>
          <Link href="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Reading Progress Bar */}
      <div 
        ref={progressRef}
        className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50"
      >
        <div
          className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/login" 
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Login</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </>
                  )}
                </Button>
              </div>
              <Link href="/login">
                <Image
                  src="/images/logo.png"
                  alt="Soouq Live Logo"
                  width={100}
                  height={40}
                  className="object-contain hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <article className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Page Header */}
          <div className="relative bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 px-6 sm:px-8 lg:px-12 py-10 sm:py-12 border-b border-gray-200">
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }}
              />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shadow-lg border border-primary/30">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-primary bg-white/80 rounded-full uppercase tracking-wider shadow-sm">
                    {formatType(page.type)}
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {page.title}
              </h1>
              {page.updated_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Last updated: {new Date(page.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div ref={contentRef} className="px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
            <div
              className="prose prose-lg prose-slate max-w-none 
                prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-h1:text-3xl prose-h1:font-extrabold prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
                prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-li:my-2
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6 prose-img:w-full prose-img:h-auto
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:pr-4 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:bg-gray-50 prose-blockquote:rounded-r-lg prose-blockquote:my-6
                prose-code:text-primary prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-6
                prose-hr:border-gray-200 prose-hr:my-8
                prose-table:w-full prose-table:border-collapse prose-th:bg-gray-50 prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-gray-200
                prose-td:p-3 prose-td:border prose-td:border-gray-200"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </article>

        {/* Related Pages */}
        {allPages.length > 1 && (
          <div className="mt-12 bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Related Pages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPages
                .filter((p) => p.id !== page.id)
                .slice(0, 6)
                .map((relatedPage) => (
                  <Link
                    key={relatedPage.id}
                    href={`/page/${relatedPage.slug}`}
                    className="group p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPage.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase">
                          {formatType(relatedPage.type)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/login">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2 w-full sm:w-auto"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-center sm:text-left text-sm text-gray-600 dark:text-gray-300">
              © {new Date().getFullYear()} Soouq Live. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

