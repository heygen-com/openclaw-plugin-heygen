import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { buildHeyGenSpeechProvider } from "./speech-provider.js";
import { buildHeyGenVideoGenerationProvider } from "./video-generation-provider.js";

export default definePluginEntry({
  id: "heygen",
  name: "HeyGen Provider",
  description: "HeyGen avatar video and HeyGen Voice text-to-speech",
  register(api) {
    api.registerVideoGenerationProvider(buildHeyGenVideoGenerationProvider());
    api.registerSpeechProvider(buildHeyGenSpeechProvider());
  },
});
