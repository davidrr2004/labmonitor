import type React from "react"
import { LoginLayout } from "@/components/login-layout"

export default function LoginRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LoginLayout>{children}</LoginLayout>
}
