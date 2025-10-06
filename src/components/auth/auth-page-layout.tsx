import { type ReactNode } from "react";

import {
  AuthIllustration,
  type AuthIllustrationProps,
} from "@/components/auth/auth-illustration";

import Logo from "@/assets/images/logo-vdm.png";

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  accent: AuthIllustrationProps["accent"];
  heroImage?: AuthIllustrationProps["image"];
  children: ReactNode;
}

export function AuthPageLayout({
  title,
  subtitle,
  accent,
  heroImage,
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 py-10 md:flex-row md:items-center md:px-8 lg:gap-16">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-6">
            <LogoBlock />
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                {title}
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                {subtitle}
              </p>
            </div>
          </div>
          {/* <div className="space-y-6 rounded-3xl border border-border/60 bg-white p-6 shadow-sm"> */}
          <div className="space-y-6">{children}</div>
          <footer className="text-xs text-muted-foreground">
            © 2025 VDM. Tous droits réservés
          </footer>
        </div>
        <div className="hidden flex-1 md:block">
          <AuthIllustration accent={accent} image={heroImage} />
        </div>
      </div>
    </div>
  );
}

function LogoBlock() {
  return (
    <div>
      <img src={Logo} alt={"logo vdm"} className="h-[173px] w-[246px]" />
    </div>
  );
}
