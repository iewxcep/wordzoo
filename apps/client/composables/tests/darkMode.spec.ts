// 临时验证：默认深色 + 显式浅色被尊重；跑完即删
import { describe, expect, it, beforeEach } from "vitest";
import { Theme, useDarkMode } from "~/composables/darkMode";

describe("darkMode 默认值", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("无缓存时默认深色", () => {
    const { initDarkMode, darkMode } = useDarkMode();
    initDarkMode();
    expect(darkMode.value).toBe(Theme.DARK);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("DARK_MODE")).toBe(Theme.DARK);
  });

  it("用户显式选过浅色则保持浅色", () => {
    localStorage.setItem("DARK_MODE", Theme.LIGHT);
    const { initDarkMode, darkMode } = useDarkMode();
    initDarkMode();
    expect(darkMode.value).toBe(Theme.LIGHT);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("缓存为深色则深色", () => {
    localStorage.setItem("DARK_MODE", Theme.DARK);
    const { initDarkMode } = useDarkMode();
    initDarkMode();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
