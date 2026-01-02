"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun, Globe, ShoppingCart, Menu } from "lucide-react"
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
import { getCart } from "@/lib/mockDb"
import { useEffect, useState } from "react"

export function NavBar() {
  const pathname = usePathname()
  const { language, setLanguage } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { user, logout, isAdmin } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (user) {
      const cart = getCart(user.id)
      setCartCount(cart.reduce((sum, item) => sum + item.qty, 0))
    }
  }, [user, pathname])

  const navItems = [
    { href: "/courses", label: t("courses", language) },
    { href: "/store", label: t("store", language) },
    ...(user ? [{ href: "/library", label: t("myLibrary", language) }] : []),
    { href: "/verify", label: t("verify", language) },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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

        <div className="flex items-center gap-2">
          <Link href="/cart">
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
                  <Link href="/profile">{t("profile", language)}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/library">{t("myLibrary", language)}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">{t("orders", language)}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">{t("adminPanel", language)}</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>{t("logout", language)}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth/login">
              <Button size="sm">{t("login", language)}</Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
