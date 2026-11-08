import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "life / manage · 求职期学习助手",
  description: "一个把投递、项目事实、面试练习和每日反思串起来的个人工作台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
