import { beforeEach, describe, expect, it } from "vitest";

import { PronunciationType, usePronunciation } from "../pronunciation";

const PRONUNCIATION_TYPE = "pronunciationType";

function expectPronunciation(type: PronunciationType) {
  const { pronunciation } = usePronunciation();

  expect(pronunciation.value).toBe(type);
  expect(localStorage.getItem(PRONUNCIATION_TYPE)).toBe(type);
}

describe("pronunciation", () => {
  beforeEach(() => {
    const { pronunciation } = usePronunciation();
    pronunciation.value = PronunciationType.EdgeTTS;
    localStorage.clear();
  });

  it("falls back to edge tts for legacy stored values", () => {
    localStorage.setItem(PRONUNCIATION_TYPE, PronunciationType.American);

    expectPronunciation(PronunciationType.EdgeTTS);
  });

  it("get edge tts if nothing was stored", () => {
    expectPronunciation(PronunciationType.EdgeTTS);
  });

  it("get pronunciation options with only edge tts", () => {
    const { getPronunciationOptions } = usePronunciation();

    expect(getPronunciationOptions()).toEqual([{ label: "微软Edge TTS", value: "EdgeTTS" }]);
  });

  it("toggle to edge tts", () => {
    const { togglePronunciation } = usePronunciation();

    togglePronunciation(PronunciationType.EdgeTTS);

    expectPronunciation(PronunciationType.EdgeTTS);
  });
});
