import { describe, expect, it } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useRouter } from "#imports";
import FloatingSettingButton from "~/components/FloatingSettingButton.vue";
import HelpPage from "~/pages/User/Help.vue";

/** 帮助页面回归测试：页面内容渲染 + 设置菜单「帮助」入口（关于之上）与跳转 */
describe("Help page", () => {
  it("帮助页面渲染课程包说明与 skill 案例", async () => {
    const wrapper = await mountSuspended(HelpPage, {
      route: "/user/help",
    });
    await flushPromises();

    const body = wrapper.text();
    expect(body).toContain("三步生成专属题库");
    expect(body).toContain("课程包");
    expect(body).toContain("课程");
    expect(body).toContain("语句");
    expect(body).toContain("豆包");
    expect(body).toContain("WorkBuddy");
    expect(body).toContain("ChatGPT");
    expect(body).toContain("Hermes");
    expect(body).toContain("请使用 WordZoo 的 course-pack 技能");
    expect(body).toContain("SKILL.md");
    expect(body).toContain("WordZoo.exe");
    expect(body).toContain(".agents/skills/course-pack");
    expect(body).toContain("小学动物词汇题库");
    expect(body).toContain("L01 动物入门");
    expect(body).toContain("导入课程包");
    // 复制按钮：提示词一处
    expect(wrapper.element.querySelectorAll(".copy-button").length).toBe(1);

    wrapper.unmount();
  });

  it("设置菜单中帮助位于关于之上，点击跳转 /user/help", async () => {
    const router = useRouter();
    const wrapper = await mountSuspended(FloatingSettingButton, {
      route: "/",
    });
    await flushPromises();

    // 打开设置菜单并校验菜单项顺序
    const trigger = wrapper.element.querySelector(
      'button[title="设置"]',
    ) as HTMLButtonElement | null;
    expect(trigger).toBeTruthy();
    trigger.click();
    await flushPromises();

    const titles = [...wrapper.element.querySelectorAll("button span")]
      .map((el) => el.textContent?.trim())
      .filter(Boolean);
    expect(titles).toContain("帮助");
    expect(titles.indexOf("帮助")).toBeLessThan(titles.indexOf("关于"));

    // 点击帮助项跳转
    const helpItem = [...wrapper.element.querySelectorAll("button")].find(
      (button) => button.textContent?.includes("帮助"),
    )!;
    helpItem.click();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/user/help");

    wrapper.unmount();
  });
});
