"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Moon,
  Sun,
  Globe,
  ShoppingCart,
  Menu,
  BookOpen,
  Trophy,
  ShoppingBag,
  ShieldCheck,
  HelpCircle,
  Info,
  Phone,
  LayoutDashboard,
  User as UserIcon,
  LogIn,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { useAuth } from "@/lib/auth-context"
import { t } from "@/lib/i18n"
import { getCartCountAction } from "@/lib/actions"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function NavBar() {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const dashboardLink = user?.role === "admin" 
    ? `/${language}/admin`
    : user?.role === "instructor" 
      ? `/${language}/instructor/dashboard`
      : `/${language}/student/dashboard`

  useEffect(() => {
    let cancelled = false

    if (!user?.id) {
      setCartCount(0)
      return
    }

    getCartCountAction()
      .then((result) => {
        if (cancelled) return
        setCartCount(result.count ?? 0)
      })
      .catch(() => {
        if (cancelled) return
        setCartCount(0)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, pathname])

  const navItems = [
    { href: `/${language}/courses`, label: t("courses", language) },
    { href: `/${language}/challenges`, label: language === "ar" ? "التحديات" : "Challenges" },
    { href: `/${language}/store`, label: t("store", language) },
    { href: `/${language}/consultations`, label: language === "ar" ? "الاستشارات" : "Consultations" },
    ...(user && user.role === "student" ? [{ href: `/${language}/student/my-courses`, label: t("myLibrary", language) }] : []),
    { href: `/${language}/verify`, label: t("verify", language) },
  ]
  const iconGapClass = language === "ar" ? "ml-2" : "mr-2"

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        <div className="flex items-center gap-6">
          <Link href={`/${language}`} className="flex items-center gap-2">
            {/* <Image src="/logo.svg" alt="Neon Logo" width={60} height={34} className="h-10 w-auto" /> */}
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
              {language === "ar" ? "نيون" : "Neon"}
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm">
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-12 md:pr-0">
          <Link href={`/${language}/cart`}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("ar")}>العربية {language === "ar" && "✓"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")}>English {language === "en" && "✓"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={dashboardLink}>{language === "ar" ? "لوحة التحكم" : "Dashboard"}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={user.role === "student" ? `/${language}/student/profile` : `/${language}/instructor/profile`}>{t("profile", language)}</Link>
                </DropdownMenuItem>
                {user.role === "student" && (
                   <DropdownMenuItem asChild>
                    <Link href={`/${language}/student/my-courses`}>{t("myLibrary", language)}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>{t("logout", language)}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/${language}/auth/login`}>
              <Button size="sm">{t("login", language)}</Button>
            </Link>
          )}
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-1/2 sm:max-w-none p-0">
            <div dir={language === "ar" ? "rtl" : "ltr"} className="h-full flex flex-col">
              <div className="p-4 border-b bg-gradient-to-r from-primary/10 via-accent/10 to-background">
                <SheetHeader className="pb-0">
                  <SheetTitle className="text-base">{language === "ar" ? "القائمة" : "Menu"}</SheetTitle>
                </SheetHeader>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-3 grid gap-1.5">
                  <Link href={`/${language}/courses`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/courses") ? "secondary" : "ghost"} className="w-full justify-start">
                      <BookOpen className={`${iconGapClass} h-4 w-4`} />
                      {t("courses", language)}
                    </Button>
                  </Link>
                  <Link href={`/${language}/challenges`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/challenges") ? "secondary" : "ghost"} className="w-full justify-start">
                      <Trophy className={`${iconGapClass} h-4 w-4`} />
                      {language === "ar" ? "التحديات" : "Challenges"}
                    </Button>
                  </Link>
                  <Link href={`/${language}/store`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/store") ? "secondary" : "ghost"} className="w-full justify-start">
                      <ShoppingBag className={`${iconGapClass} h-4 w-4`} />
                      {t("store", language)}
                    </Button>
                  </Link>
                  <Link href={`/${language}/consultations`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Calendar className={`${iconGapClass} h-4 w-4`} />
                      {language === "ar" ? "الاستشارات" : "Consultations"}
                    </Button>
                  </Link>
                  <Link href={`/${language}/verify`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/verify") ? "secondary" : "ghost"} className="w-full justify-start">
                      <ShieldCheck className={`${iconGapClass} h-4 w-4`} />
                      {t("verify", language)}
                    </Button>
                  </Link>

                  <div className="my-2 border-t" />

                  <Link href={`/${language}/about`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/about") ? "secondary" : "ghost"} className="w-full justify-start">
                      <Info className={`${iconGapClass} h-4 w-4`} />
                      {language === "ar" ? "من نحن" : "About"}
                    </Button>
                  </Link>
                  <Link href={`/${language}/faq`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/faq") ? "secondary" : "ghost"} className="w-full justify-start">
                      <HelpCircle className={`${iconGapClass} h-4 w-4`} />
                      {language === "ar" ? "الأسئلة الشائعة" : "FAQ"}
                    </Button>
                  </Link>
                  <Link href={`/${language}/contact`} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant={pathname.endsWith("/contact") ? "secondary" : "ghost"} className="w-full justify-start">
                      <Phone className={`${iconGapClass} h-4 w-4`} />
                      {language === "ar" ? "تواصل معنا" : "Contact"}
                    </Button>
                  </Link>

                  <div className="my-2 border-t" />

                  {user ? (
                    <>
                      <Link href={dashboardLink} onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full justify-start">
                          <LayoutDashboard className={`${iconGapClass} h-4 w-4`} />
                          {language === "ar" ? "لوحة التحكم" : "Dashboard"}
                        </Button>
                      </Link>
                      <Link
                        href={`/${language}/profile`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button variant="outline" className="w-full justify-start">
                          <UserIcon className={`${iconGapClass} h-4 w-4`} />
                          {t("profile", language)}
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href={`/${language}/auth/login`} onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start">
                        <LogIn className={`${iconGapClass} h-4 w-4`} />
                        {t("login", language)}
                      </Button>
                    </Link>
                  )}

                  <div className="my-2 border-t" />

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={toggleTheme}>
                      {theme === "light"
                        ? language === "ar"
                          ? "الوضع الداكن"
                          : "Dark Mode"
                        : language === "ar"
                          ? "الوضع الفاتح"
                          : "Light Mode"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          {language === "ar" ? "اللغة" : "Language"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLanguage("ar")}>العربية {language === "ar" && "✓"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage("en")}>English {language === "en" && "✓"}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
