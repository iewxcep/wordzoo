import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentUser } from "~/api/user";
import { useUserStore } from "../user";

vi.mock("~/api/user");

describe("user", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should fetch and init user", async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValue({
      id: "local-user",
      username: "Learner",
      email: null,
      avatar: "",
    });

    const userStore = useUserStore();
    await userStore.initUser();

    expect(userStore.user).toEqual({
      id: "local-user",
      username: "Learner",
      email: null,
      avatar: "",
    });
  });
});
