import { ref } from "vue";

import { fetchAllLearningTime, fetchTotalLearningTime } from "~/api/user-learning-activity";
import { type UserLearningDailyTime } from "~/types/models/user-learning-activity";

const learningDailyTimeList = ref<UserLearningDailyTime[]>([]);
const learningDailyTotalTime = ref(0);

export function useLearningDailyTime() {
  async function setupLearningDailyTime(year?: number) {
    const range = year
      ? { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
      : undefined;
    learningDailyTimeList.value = await fetchAllLearningTime(range);
    learningDailyTotalTime.value = await fetchTotalLearningTime(range);
  }

  return {
    learningDailyTimeList,
    learningDailyTotalTime,
    setupLearningDailyTime,
  };
}
