import { describe, expect, it } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useRouter } from "#imports";
import HomeContextMenu from "~/components/HomeContextMenu.vue";

function contextmenuAt(clientX: number, clientY: number) {
  const event = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
  });
  window.dispatchEvent(event);
  return event;
}

describe("HomeContextMenu", () => {
  it("非首页右键在鼠标位置弹出菜单，点击后返回首页", async () => {
    const router = useRouter();
    const wrapper = await mountSuspended(HomeContextMenu, {
      route: "/user/about",
    });

    const event = contextmenuAt(200, 150);
    await flushPromises();

    // 阻止了默认右键菜单
    expect(event.defaultPrevented).toBe(true);

    const panel = document.body.querySelector(
      ".fixed.inset-0 > div",
    ) as HTMLElement;
    expect(panel?.textContent).toContain("返回首页");
    // 菜单以鼠标位置为左上角
    expect(panel.style.left).toBe("200px");
    expect(panel.style.top).toBe("150px");

    // 点击菜单项后跳转首页并关闭菜单
    const homeItem = [...document.body.querySelectorAll("button")].find(
      (button) => button.textContent?.includes("返回首页"),
    )!;
    homeItem.click();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/");
    expect(document.body.querySelector(".fixed.inset-0")).toBeNull();

    wrapper.unmount();
  });

  it("视口边缘右键时菜单向内收拢", async () => {
    const router = useRouter();
    const wrapper = await mountSuspended(HomeContextMenu, {
      route: "/user/about",
    });

    contextmenuAt(window.innerWidth + 2000, window.innerHeight + 2000);
    await flushPromises();

    const panel = document.body.querySelector(
      ".fixed.inset-0 > div",
    ) as HTMLElement;
    expect(panel.style.left).toBe(`${window.innerWidth - 152}px`);
    expect(panel.style.top).toBe(`${window.innerHeight - 64}px`);

    wrapper.unmount();
  });

  it("首页右键保持默认菜单，不弹出", async () => {
    const router = useRouter();
    const wrapper = await mountSuspended(HomeContextMenu, { route: "/" });

    const event = contextmenuAt(200, 150);
    await flushPromises();

    expect(event.defaultPrevented).toBe(false);
    expect(document.body.querySelector(".fixed.inset-0")).toBeNull();

    wrapper.unmount();
  });
});
