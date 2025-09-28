import { readable } from "svelte/store";
import { getAllPrompts } from "../../prompts/promptManager";

export const prompts = readable({}, (set) => {
  getAllPrompts().then(set);
  return () => {};
});
