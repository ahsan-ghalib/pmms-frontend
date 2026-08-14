"use client";

import { Wrench, ArrowLeft, Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UnderMaintenance({
  title = "Under Maintenance",
  description = "This page is temporarily unavailable while we perform maintenance. We'll be back shortly.",
  showBackButton = true,
  showHomeButton = true,
  showStats = true,
  showProgressBar = true,
  variant = "maintenance",
}) {
  const router = useRouter();
  const Icon = variant === "not-found" ? FileQuestion : Wrench;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Icon */}
        <div className="relative mx-auto w-48 h-48">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-hover rounded-full blur-3xl opacity-20" />
          <div className="relative w-48 h-48 bg-primary-light rounded-full flex items-center justify-center border-2 border-primary/20">
            <Icon className="w-24 h-24 text-primary animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Stats - only for maintenance */}
        {showStats && (
          <div className="flex items-center justify-center gap-8 py-4 border-t border-b border-border">
            <div>
              <div className="text-2xl font-bold text-primary">—</div>
              <div className="text-sm text-muted-foreground">Under Maintenance</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div>
              <div className="text-2xl font-bold text-primary">Soon</div>
              <div className="text-sm text-muted-foreground">Coming Back</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          {showBackButton && (
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </Button>
          )}

          {showHomeButton && (
            <Link href="/dashboard">
              <Button variant="default" size="lg" className="gap-2">
                <Home className="w-5 h-5" />
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Progress indicator - only for maintenance */}
        {showProgressBar && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Maintenance in progress</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full w-full animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
