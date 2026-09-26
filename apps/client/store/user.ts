import { defineStore } from "pinia";
import { ref } from "vue";

import { fetchCurrentUser, fetchUpdateUser } from "~/api/user";
import type { User } from "~/types";

export const useUserStore = defineStore("user", () => {
  const user = ref<User>();

  async function initUser() {
    user.value = await fetchCurrentUser();
  }

  async function updateUser(params: { username?: string; avatar?: string }) {
    const updated = await fetchUpdateUser(params);
    user.value = updated;
    return updated;
  }

  return {
    user,
    initUser,
    updateUser,
  };
});
