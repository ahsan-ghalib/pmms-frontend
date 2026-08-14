"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

const page = () => {
  const [copiedText, setCopiedText] = useState("");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const colorSections = [
    {
      title: "Primary Colors",
      colors: [
        {
          name: "Primary",
          class: "bg-primary text-primary-foreground",
          description: "Main brand color",
        },
        {
          name: "Primary Light",
          class: "bg-primary-light text-foreground",
          description: "Light variant",
        },
        {
          name: "Secondary",
          class: "bg-secondary text-secondary-foreground",
          description: "Secondary actions",
        },
      ],
    },
    {
      title: "Status Colors",
      colors: [
        {
          name: "Success",
          class: "bg-success text-success-foreground",
          description: "Success states",
        },
        {
          name: "Warning",
          class: "bg-warning text-warning-foreground",
          description: "Warning states",
        },
        {
          name: "Error",
          class: "bg-error text-error-foreground",
          description: "Error states",
        },
        {
          name: "Info",
          class: "bg-info text-info-foreground",
          description: "Info states",
        },
      ],
    },
    {
      title: "Status Light Colors",
      colors: [
        {
          name: "Success Light",
          class: "bg-success-light text-success",
          description: "Light success background",
        },
        {
          name: "Warning Light",
          class: "bg-warning-light text-warning",
          description: "Light warning background",
        },
        {
          name: "Error Light",
          class: "bg-error-light text-error",
          description: "Light error background",
        },
        {
          name: "Info Light",
          class: "bg-info-light text-info",
          description: "Light info background",
        },
      ],
    },
    {
      title: "Grocery Category Colors",
      colors: [
        {
          name: "Fresh Produce",
          class: "bg-fresh-produce text-fresh-produce-foreground",
          description: "Vegetables & Fruits",
        },
        {
          name: "Dairy",
          class: "bg-dairy text-dairy-foreground",
          description: "Milk, Cheese, Yogurt",
        },
        {
          name: "Meat",
          class: "bg-meat text-meat-foreground",
          description: "Fresh meats",
        },
        {
          name: "Bakery",
          class: "bg-bakery text-bakery-foreground",
          description: "Bread & Pastries",
        },
        {
          name: "Pantry",
          class: "bg-pantry text-pantry-foreground",
          description: "Canned & Packaged",
        },
      ],
    },
    {
      title: "Category Light Colors",
      colors: [
        {
          name: "Fresh Produce Light",
          class: "bg-fresh-produce-light text-fresh-produce",
          description: "Light fresh produce",
        },
        {
          name: "Dairy Light",
          class: "bg-dairy-light text-dairy",
          description: "Light dairy",
        },
        {
          name: "Meat Light",
          class: "bg-meat-light text-meat",
          description: "Light meat",
        },
        {
          name: "Bakery Light",
          class: "bg-bakery-light text-bakery",
          description: "Light bakery",
        },
        {
          name: "Pantry Light",
          class: "bg-pantry-light text-pantry",
          description: "Light pantry",
        },
      ],
    },
    {
      title: "Base Colors",
      colors: [
        {
          name: "Background",
          class: "bg-background text-foreground",
          description: "Main background",
        },
        {
          name: "Card",
          class: "bg-card text-card-foreground",
          description: "Card background",
        },
        {
          name: "Popover",
          class: "bg-popover text-popover-foreground",
          description: "Popover background",
        },
        {
          name: "Muted",
          class: "bg-muted text-muted-foreground",
          description: "Muted background",
        },
        {
          name: "Accent",
          class: "bg-accent text-accent-foreground",
          description: "Accent background",
        },
      ],
    },
    {
      title: "Additional Colors",
      colors: [
        {
          name: "Destructive",
          class: "bg-destructive text-destructive-foreground",
          description: "Destructive actions",
        },
        {
          name: "Secondary Accent",
          class: "bg-secondary-accent text-secondary-accent-foreground",
          description: "Secondary accent color",
        },
      ],
    },
    {
      title: "Sidebar Colors",
      colors: [
        {
          name: "Sidebar",
          class: "bg-sidebar text-sidebar-foreground",
          description: "Sidebar background",
        },
        {
          name: "Sidebar Primary",
          class: "bg-sidebar-primary text-sidebar-primary-foreground",
          description: "Sidebar primary",
        },
        {
          name: "Sidebar Accent",
          class: "bg-sidebar-accent text-sidebar-accent-foreground",
          description: "Sidebar accent",
        },
      ],
    },
    {
      title: "Chart Colors",
      colors: [
        {
          name: "Chart 1",
          class: "bg-chart-1 text-white",
          description: "Primary chart color",
        },
        {
          name: "Chart 2",
          class: "bg-chart-2 text-white",
          description: "Secondary chart color",
        },
        {
          name: "Chart 3",
          class: "bg-chart-3 text-white",
          description: "Tertiary chart color",
        },
        {
          name: "Chart 4",
          class: "bg-chart-4 text-white",
          description: "Quaternary chart color",
        },
        {
          name: "Chart 5",
          class: "bg-chart-5 text-white",
          description: "Quinary chart color",
        },
        {
          name: "Chart 6",
          class: "bg-chart-6 text-white",
          description: "Senary chart color",
        },
        {
          name: "Chart 7",
          class: "bg-chart-7 text-white",
          description: "Septenary chart color",
        },
        {
          name: "Chart 8",
          class: "bg-chart-8 text-white",
          description: "Octonary chart color",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Soouq Live Design System
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete design system for Soouq Live Admin Panel - Colors, Typography &
            Components
          </p>
        </div>

        {/* Design System Overview */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Design System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Brand Identity
              </h3>
              <p className="text-sm text-muted-foreground">
                Fresh, organic grocery theme with seafoam green primary colors
                and warm accent colors that reflect freshness and trust.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Typography</h3>
              <p className="text-sm text-muted-foreground">
                Inter for UI text and JetBrains Mono for data/code. Clean,
                readable fonts optimized for admin interfaces and data-heavy
                applications.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Color System
              </h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive color palette with semantic naming,
                category-specific colors for grocery items, and status colors
                for admin operations.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Quick Stats</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Colors:</span>
                <span className="text-muted-foreground ml-1">40+</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Fonts:</span>
                <span className="text-muted-foreground ml-1">2</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Categories:</span>
                <span className="text-muted-foreground ml-1">5</span>
              </div>
              <div>
                <span className="font-medium text-foreground">
                  Status Colors:
                </span>
                <span className="text-muted-foreground ml-1">4</span>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Typography</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Font Families */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Font Families
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Primary Font (Inter)
                  </h4>
                  <p className="text-lg font-sans">
                    The quick brown fox jumps over the lazy dog
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Used for: UI text, headings, body content
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    font-sans
                  </code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Monospace Font (JetBrains Mono)
                  </h4>
                  <p className="text-lg font-mono">
                    The quick brown fox jumps over the lazy dog
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Used for: Code, data, technical content
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                    font-mono
                  </code>
                </div>
              </div>
            </div>

            {/* Font Sizes */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Font Sizes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs">text-xs</span>
                  <span className="text-xs text-muted-foreground">12px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">text-sm</span>
                  <span className="text-sm text-muted-foreground">14px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base">text-base</span>
                  <span className="text-base text-muted-foreground">16px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg">text-lg</span>
                  <span className="text-lg text-muted-foreground">18px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">text-xl</span>
                  <span className="text-xl text-muted-foreground">20px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">text-2xl</span>
                  <span className="text-2xl text-muted-foreground">24px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">text-3xl</span>
                  <span className="text-3xl text-muted-foreground">30px</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-4xl">text-4xl</span>
                  <span className="text-4xl text-muted-foreground">36px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Examples */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Typography Examples
            </h3>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Main Heading (H1)
                </h1>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  text-4xl font-bold text-foreground
                </code>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Section Heading (H2)
                </h2>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  text-2xl font-semibold text-foreground
                </code>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Subsection Heading (H3)
                </h3>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  text-xl font-semibold text-foreground
                </code>
              </div>
              <div>
                <p className="text-base text-foreground mb-2">
                  Body text - Lorem ipsum dolor sit amet, consectetur adipiscing
                  elit. Sed do eiusmod tempor incididunt ut labore et dolore
                  magna aliqua.
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  text-base text-foreground
                </code>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Small text - Used for captions, metadata, and secondary
                  information.
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  text-sm text-muted-foreground
                </code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Extra small text - For fine print and labels.
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  text-xs text-muted-foreground
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Color Sections */}
        {colorSections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.colors.map((color, colorIndex) => (
                <div
                  key={colorIndex}
                  className={`${color.class} p-6 rounded-lg border border-border/20 hover:border-border/40 transition-all duration-200 group relative`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{color.name}</h3>
                    <button
                      onClick={() => copyToClipboard(color.class)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-black/10 rounded"
                      title="Copy class">
                      {copiedText === color.class ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs opacity-90 mb-3">{color.description}</p>
                  <div className="bg-black/10 rounded px-2 py-1 text-xs font-mono break-all">
                    {color.class}
                  </div>
                  {copiedText === color.class && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      Copied!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Usage Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Usage Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Buttons</h3>
              <div className="space-y-3">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Primary Button
                </button>
                <button className="bg-success text-success-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Success Button
                </button>
                <button className="bg-warning text-warning-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
                  Warning Button
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-success-light text-success px-3 py-1 rounded-full text-sm">
                  In Stock
                </span>
                <span className="bg-warning-light text-warning px-3 py-1 rounded-full text-sm">
                  Low Stock
                </span>
                <span className="bg-error-light text-error px-3 py-1 rounded-full text-sm">
                  Out of Stock
                </span>
                <span className="bg-fresh-produce-light text-fresh-produce px-3 py-1 rounded-full text-sm">
                  Organic
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default page;
