export type PromptType = "text" | "photo" | "link_or_text" | "text_or_link";

export interface Prompt {
  id: number;
  category: string;
  type: PromptType;
  prompt: string;
  expected_sec: number;
}

export const PROMPTS: Prompt[] = [
  { id: 1, category: "current_life", type: "text_or_link", prompt: "What song are you currently low-key obsessed with but wouldn't normally share?", expected_sec: 20 },
  { id: 2, category: "current_life", type: "text", prompt: "If you could instantly have one thing to eat right now, what would it be?", expected_sec: 10 },
  { id: 3, category: "visual_life", type: "photo", prompt: "Take a picture of something within arm's reach that says a lot about your current life", expected_sec: 25 },
  { id: 4, category: "discovery", type: "link_or_text", prompt: "Share something you discovered recently (YouTube, podcast, creator, article) that you think I'd like", expected_sec: 25 },
  { id: 5, category: "personal_light", type: "text", prompt: "What's something that's been on your mind lately (big or small)?", expected_sec: 30 },
  { id: 6, category: "slam_book", type: "text", prompt: "Describe your current life mood in 3 words", expected_sec: 10 },
  { id: 7, category: "visual_life", type: "photo", prompt: "Take a picture of something that made you smile today", expected_sec: 20 },
  { id: 8, category: "imagination", type: "text", prompt: "If we could both teleport somewhere this weekend, where are we going?", expected_sec: 15 },
  { id: 9, category: "comfort", type: "text", prompt: "What's your current comfort watch or rewatch?", expected_sec: 15 },
  { id: 10, category: "identity", type: "text", prompt: "What's something very 'you' that you've done or enjoyed recently?", expected_sec: 25 }
];

export const SIMULATED_RESPONSES: Record<number, string[]> = {
  1: ["Been playing 'Pink + White' by Frank Ocean on repeat. Just hits different right now.", "Honestly, the Stardew Valley soundtrack. So peaceful.", "Found this weird indie pop band called The Marías, obsessed with 'Cariño'."],
  2: ["A warm croissant with unreasonable amounts of butter.", "Spicy tonkotsu ramen. Craving it so bad.", "Just a really good, perfectly ripe peach."],
  3: ["📷 [A snapshot of a half-drunk coffee mug on a messy desk]", "📷 [A pile of books I promised myself I'd read]", "📷 [My cat sleeping on my keyboard]"],
  4: ["I found this channel making tiny dioramas of old arcades. It's so soothing.", "Just read an article about how they restore old oil paintings. Fascination unlocked.", "https://www.youtube.com/watch?v=dQw4w9WgXcQ (kidding, it's actually a cool documentary about deep sea life)"],
  5: ["Wondering if I should finally learn how to make pasta from scratch.", "Thinking about how fast this year is going. Need to slow down.", "Just really hoping it rains this weekend so I have an excuse to stay in."],
  6: ["Tired, hopeful, caffeinated.", "Cozy, quiet, content.", "Busy, scattered, optimistic."],
  7: ["📷 [A really cute dog I saw on my walk]", "📷 [The way the light hit my room this afternoon]", "📷 [A ridiculous text my mom sent me]"],
  8: ["A cabin in the woods with terrible Wi-Fi and a huge fireplace.", "Tokyo. Let's just go eat everything.", "Somewhere near the ocean where we can just sit and do nothing."],
  9: ["Rewatching Parks and Rec for the 4th time.", "Gilmore Girls. Always Gilmore Girls.", "A really long video essay on something I know nothing about."],
  10: ["I spent an hour organizing my digital notes and felt deeply at peace.", "Bought a new plant and spent way too long researching its exact lighting needs.", "Made a ridiculously elaborate sandwich for lunch just for myself."]
};

export const AVATAR_COLORS = ["#C86B5E", "#EEDCA5", "#A3B19B", "#7E8C9A", "#D8A499", "#8B9D83"];
export const AVATAR_ICONS = ["star", "moon", "sun", "cloud", "heart", "coffee", "music", "book"];
export const REACTIONS = ["❤️", "✨", "😂", "🥺", "🔥", "👀"];
