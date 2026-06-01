export type PromptType = "text" | "photo" | "link_or_text" | "text_or_link";

export interface Prompt {
  id: number;
  category: string;
  type: PromptType;
  prompt: string;
  expected_sec: number;
}

export const PROMPTS: Prompt[] = [
  { id: 1,  category: "current_life",    type: "text_or_link", prompt: "What song are you currently low-key obsessed with but wouldn't normally share?",                   expected_sec: 20 },
  { id: 2,  category: "current_life",    type: "text",         prompt: "If you could instantly have one thing to eat right now, what would it be?",                         expected_sec: 10 },
  { id: 3,  category: "visual_life",     type: "photo",        prompt: "Take a picture of something within arm's reach that says a lot about your current life",            expected_sec: 25 },
  { id: 4,  category: "discovery",       type: "link_or_text", prompt: "Share something you discovered recently (YouTube, podcast, creator, article) you think I'd like",   expected_sec: 25 },
  { id: 5,  category: "personal_light",  type: "text",         prompt: "What's something that's been on your mind lately (big or small)?",                                  expected_sec: 30 },
  { id: 6,  category: "slam_book",       type: "text",         prompt: "Describe your current life mood in 3 words",                                                         expected_sec: 10 },
  { id: 7,  category: "visual_life",     type: "photo",        prompt: "Take a picture of something that made you smile today",                                              expected_sec: 20 },
  { id: 8,  category: "imagination",     type: "text",         prompt: "If we could both teleport somewhere this weekend, where are we going?",                              expected_sec: 15 },
  { id: 9,  category: "comfort",         type: "text",         prompt: "What's your current comfort watch or rewatch?",                                                      expected_sec: 15 },
  { id: 10, category: "identity",        type: "text",         prompt: "What's something very 'you' that you've done or enjoyed recently?",                                  expected_sec: 25 },
  { id: 11, category: "joy",             type: "text",         prompt: "What's the last thing that genuinely made you laugh out loud?",                                      expected_sec: 20 },
  { id: 12, category: "current_life",    type: "text_or_link", prompt: "If your week had a theme song, what would it be?",                                                   expected_sec: 15 },
  { id: 13, category: "visual_life",     type: "photo",        prompt: "Take a photo of the most recent picture on your camera roll (if you're comfortable)",               expected_sec: 20 },
  { id: 14, category: "anticipation",    type: "text",         prompt: "What's something you've been quietly looking forward to?",                                           expected_sec: 20 },
  { id: 15, category: "connection",      type: "text",         prompt: "Describe the last really good conversation you had",                                                  expected_sec: 25 },
  { id: 16, category: "gratitude",       type: "text",         prompt: "What's one small thing you're grateful for right now?",                                              expected_sec: 15 },
  { id: 17, category: "imagination",     type: "text",         prompt: "If you could add one free hour to today, what would you do with it?",                                expected_sec: 15 },
  { id: 18, category: "curiosity",       type: "text",         prompt: "What's a skill or hobby you've been curious about but haven't tried yet?",                           expected_sec: 20 },
  { id: 19, category: "visual_life",     type: "photo",        prompt: "Take a photo of your current view",                                                                  expected_sec: 15 },
  { id: 20, category: "growth",          type: "text",         prompt: "What's something you've changed your mind about recently?",                                          expected_sec: 25 },
  { id: 21, category: "random",          type: "text",         prompt: "What's the most random thing that crossed your mind today?",                                         expected_sec: 15 },
  { id: 22, category: "discovery",       type: "link_or_text", prompt: "If you could send me one video to watch tonight, what would it be?",                                 expected_sec: 20 },
  { id: 23, category: "comfort",         type: "text",         prompt: "What does your ideal Sunday look like right now?",                                                    expected_sec: 20 },
  { id: 24, category: "personal_light",  type: "text",         prompt: "What's something you're working on that almost no one knows about?",                                 expected_sec: 25 },
  { id: 25, category: "reading",         type: "text",         prompt: "Share a sentence from whatever you're currently reading (book, article, thread)",                   expected_sec: 20 },
  { id: 26, category: "current_life",    type: "text",         prompt: "What's the last thing you bought that was completely worth it?",                                     expected_sec: 15 },
  { id: 27, category: "self_care",       type: "text",         prompt: "What's one thing you did for yourself this week?",                                                   expected_sec: 20 },
  { id: 28, category: "visual_life",     type: "photo",        prompt: "Take a photo of something beautiful you've been overlooking",                                        expected_sec: 25 },
  { id: 29, category: "wins",            type: "text",         prompt: "What's a small win you had recently?",                                                               expected_sec: 15 },
  { id: 30, category: "connection",      type: "text",         prompt: "If we were hanging out right now, what would we be doing?",                                          expected_sec: 15 },
];

export const SIMULATED_RESPONSES: Record<number, string[]> = {
  1:  ["Been playing 'Pink + White' by Frank Ocean on repeat. Just hits different right now.", "Honestly, the Stardew Valley soundtrack. So peaceful.", "Found this weird indie pop band called The Marías, obsessed with 'Cariño'."],
  2:  ["A warm croissant with unreasonable amounts of butter.", "Spicy tonkotsu ramen. Craving it so bad.", "Just a really good, perfectly ripe peach."],
  3:  ["📷 [A snapshot of a half-drunk coffee mug on a messy desk]", "📷 [A pile of books I promised myself I'd read]", "📷 [My cat sleeping on my keyboard]"],
  4:  ["I found this channel making tiny dioramas of old arcades. It's so soothing.", "Just read an article about how they restore old oil paintings. Fascination unlocked.", "https://www.youtube.com/watch?v=dQw4w9WgXcQ — actually a cool deep sea documentary"],
  5:  ["Wondering if I should finally learn how to make pasta from scratch.", "Thinking about how fast this year is going. Need to slow down.", "Just really hoping it rains this weekend so I have an excuse to stay in."],
  6:  ["Tired, hopeful, caffeinated.", "Cozy, quiet, content.", "Busy, scattered, optimistic."],
  7:  ["📷 [A really cute dog I saw on my walk]", "📷 [The way the light hit my room this afternoon]", "📷 [A ridiculous text my mom sent me]"],
  8:  ["A cabin in the woods with terrible Wi-Fi and a huge fireplace.", "Tokyo. Let's just go eat everything.", "Somewhere near the ocean where we can just sit and do nothing."],
  9:  ["Rewatching Parks and Rec for the 4th time.", "Gilmore Girls. Always Gilmore Girls.", "A really long video essay on something I know nothing about."],
  10: ["I spent an hour organizing my digital notes and felt deeply at peace.", "Bought a new plant and spent way too long researching its exact lighting needs.", "Made a ridiculously elaborate sandwich for lunch just for myself."],
  11: ["My friend sent me a video of their dog running into a glass door. I replayed it 10 times.", "A meme that was so specific to my life it felt personal.", "Something my sister said that wasn't even that funny but I couldn't stop."],
  12: ["'Slow Burn' by Kacey Musgraves — steady and kind of hopeful.", "'Dog Days Are Over' because things are actually looking up.", "'September' by Earth, Wind & Fire. Chaotic but good."],
  13: ["📷 [A blurry photo of something I thought looked cool at the time]", "📷 [A screenshot of a conversation that made me smile]", "📷 [A sunset I almost didn't stop to take]"],
  14: ["A long weekend where I genuinely have nothing planned.", "Getting to finally see a friend I haven't seen in months.", "The next episode of a show I'm pacing myself through so it doesn't end."],
  15: ["Talked to my dad for like an hour about nothing in particular. Really needed it.", "A conversation with a stranger at a coffee shop that turned weirdly profound.", "An old friend reached out and we just caught up for hours."],
  16: ["My bed was perfectly made when I got home. Tiny thing, massive peace.", "The sun came out for exactly 20 minutes at the right moment today.", "A playlist someone made for me months ago that I keep going back to."],
  17: ["Honestly? A nap. No guilt, just sleep.", "Start that book I've been putting off for three months.", "Walk somewhere without my phone and just exist for a bit."],
  18: ["Ceramics. Something about making things with your hands sounds grounding right now.", "Learning to cook one thing really well — like, embarrassingly good ramen.", "Film photography. I want to slow down and actually think about each shot."],
  19: ["📷 [My desk in its natural chaotic state]", "📷 [The street from my window — more interesting than it sounds]", "📷 [A very unremarkable but somehow peaceful corner of my room]"],
  20: ["I used to think I needed a rigid morning routine. Turns out I just needed coffee.", "Changed my mind about needing to always have plans. Unstructured time is underrated.", "Used to think being busy meant being productive. Not anymore."],
  21: ["Whether birds ever get surprised by their own reflection in windows.", "What the longest word anyone has ever said in a completely serious conversation is.", "If anyone has ever truly finished a lip balm without losing it."],
  22: ["A short documentary about people who restore antique music boxes. It's oddly emotional.", "A video essay on why 2000s era internet felt different. Super nostalgic.", "A cooking video where someone makes the most elaborate meal for no reason."],
  23: ["Slow morning, good coffee, no alarm. Maybe a walk. Definitely not talking to anyone before noon.", "Farmer's market, something good for lunch, reading in the afternoon. Nothing else.", "Honestly, the same thing I always want — cozy, quiet, and completely unscheduled."],
  24: ["Slowly writing something I don't know what to do with yet.", "Teaching myself something I keep meaning to get serious about.", "A project that feels too personal to share until it's done."],
  25: ["'You can't go back and change the beginning, but you can start where you are and change the ending.'", "'The trick is to enjoy life. Don't wish away your days, waiting for better ones ahead.'", "Something I read today that I immediately screenshot but can't explain why yet."],
  26: ["A good lamp. Sounds boring but it changed the whole vibe of my room.", "A book I almost didn't buy because I thought I'd never have time. Read the whole thing.", "Noise-cancelling headphones. Should have done this years ago."],
  27: ["Cooked an actual meal instead of just eating whatever required least effort.", "Said no to something I didn't want to do and felt zero guilt about it.", "Spent an evening doing nothing and calling it rest instead of laziness."],
  28: ["📷 [A corner of my room I walk past every day but never really look at]", "📷 [The light coming through the window in the late afternoon]", "📷 [A plant that's been quietly thriving despite my inconsistent care]"],
  29: ["Got through my whole to-do list without rolling half of it to tomorrow.", "Finished something I'd been avoiding for two weeks.", "Had a hard conversation I kept putting off. Turns out it was fine."],
  30: ["Probably making up reasons not to go anywhere and ordering food. Comfortable chaos.", "Walking around somewhere without a destination. That's enough.", "Starting three different movies and not finishing any of them. Classic."],
};

export const AVATAR_COLORS = ["#C86B5E", "#EEDCA5", "#A3B19B", "#7E8C9A", "#D8A499", "#8B9D83"];
export const AVATAR_ICONS = ["star", "moon", "sun", "cloud", "heart", "coffee", "music", "book"];
export const REACTIONS = ["❤️", "✨", "😂", "🥺", "🔥", "👀"];

export const DAILY_PROMPT_LIMIT = 3;
