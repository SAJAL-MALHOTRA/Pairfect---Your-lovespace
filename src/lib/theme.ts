/**
 * Design System Theme Constants v2.0
 * Centralized style definitions matching our custom Tailwind v4 configurations.
 */

export const THEME = {
  // Brand color tokens
  colors: {
    pink: "#f472b6",
    blue: "#60a5fa",
    gradient: {
      from: "#f472b6",
      to: "#60a5fa",
      class: "from-[#f472b6] to-[#60a5fa]",
      gradientText: "bg-gradient-to-r from-[#f472b6] to-[#60a5fa] bg-clip-text text-transparent",
    },
  },

  // Border Radius mappings (defined as custom tokens in globals.css)
  radius: {
    hero: "rounded-hero",     // 28px
    card: "rounded-card",     // 20px
    button: "rounded-button", // 14px
    image: "rounded-image",   // 16px
    chip: "rounded-chip",     // 999px (full pill)
  },

  // Standardized spacing tokens
  spacing: {
    sectionMargin: "my-8", // 32px
    sectionSpace: "space-y-8",
    pagePadding: "px-4 sm:px-6 lg:px-8 py-8",
    itemGap: "gap-4",
  },

  // Reusable styling class presets
  classes: {
    // 1. Button Variants
    button: {
      primary: "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-button shadow-sm hover:opacity-95 active:scale-95 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none",
      secondary: "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-foreground bg-card border border-border rounded-button shadow-sm hover:bg-muted hover:border-foreground active:scale-95 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none",
      pillPrimary: "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-chip shadow-sm hover:opacity-95 active:scale-95 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none",
      pillSecondary: "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-foreground bg-muted hover:bg-accent rounded-chip active:scale-95 transition-all duration-200 cursor-pointer select-none",
    },

    // 2. Input Fields
    input: "w-full px-4 py-3 bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-button text-sm focus:outline-none transition-all placeholder:text-muted-foreground text-foreground",

    // 3. Card Elements
    card: {
      hero: "card-hero", // Uses advanced custom border-gradient logic from globals.css
      standard: "card-standard",
      secondary: "card-secondary",
    },

    // 4. Typography Scale
    typography: {
      hero: "font-sans font-black text-hero tracking-tight leading-tight text-foreground",
      h1: "font-sans font-black text-h1 tracking-tight text-foreground",
      h2: "font-sans font-extrabold text-h2 tracking-tight text-foreground",
      h3: "font-sans font-bold text-h3 tracking-tight text-foreground",
      body: "text-body text-card-foreground leading-relaxed",
      label: "text-tiny font-mono font-bold uppercase tracking-wider text-muted-foreground",
    },

    // 5. Icon sizing standards (using lucide-react)
    icon: {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    },
  },
};
