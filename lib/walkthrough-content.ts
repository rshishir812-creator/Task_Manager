export type WalkthroughStep = {
  icon: string;
  title: string;
  body: string;
};

export const PARENT_STEPS: WalkthroughStep[] = [
  {
    icon: "👋",
    title: "Welcome to ChoreQuest",
    body: "Turn daily chores into a game your kids will actually want to play. Here's a quick tour of every tab in the parent dashboard.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family",
    body: "Add each child with their Gmail — they'll sign in with Google to join YOUR family. Use 'Add a co-parent' only for another adult; if you use it for your child by mistake, they'll join as a parent. Only invited emails can join — everyone else who signs in starts their own family.",
  },
  {
    icon: "⚔️",
    title: "Chores",
    body: "Create the daily quests — brush teeth, homework, tidy room. Set points, pick which days they recur, and assign them to each kid.",
  },
  {
    icon: "📋",
    title: "Overview",
    body: "Your home base. See today's completion status for every kid, the family score, and the champion of the week at a glance.",
  },
  {
    icon: "🔍",
    title: "Verify",
    body: "When a kid finishes a chore that needs your approval, it shows up here. Tap to approve or deny — that's how points get awarded.",
  },
  {
    icon: "🎁",
    title: "Rewards",
    body: "Set up real-world prizes — extra screen time, a treat, choosing dinner. Decide the points cost and which kids can earn each one.",
  },
  {
    icon: "📬",
    title: "Redeem",
    body: "When a kid wants to cash in points for a reward, the request lands here. Approve to deduct points and deliver the prize.",
  },
  {
    icon: "🏅",
    title: "Badges",
    body: "Track milestone badges your kids have earned — streaks, perfect weeks, chore mastery. Award special badges by hand any time.",
  },
  {
    icon: "📅",
    title: "Calendar",
    body: "A month-by-month history of every kid's completions. Tap a day to see exactly what got done.",
  },
  {
    icon: "📈",
    title: "Insights",
    body: "Family trends, per-child sparklines, and chore difficulty stats. Spot dips early and see what's working.",
  },
  {
    icon: "💰",
    title: "Points",
    body: "Manually adjust a kid's balance if something needs correcting — bonus points for a great week or a fix for a mistake.",
  },
  {
    icon: "🎉",
    title: "You're all set",
    body: "Add your first chore, invite your kids, and you're off. Tap the ? icon up top any time to reopen this tour.",
  },
];

export const CHILD_STEPS: WalkthroughStep[] = [
  {
    icon: "🎮",
    title: "Welcome, hero!",
    body: "ChoreQuest turns chores into quests. Finish them to earn XP, badges, and real-world rewards. Here's how it works.",
  },
  {
    icon: "🏠",
    title: "Today",
    body: "Your daily quest list. Tap a chore to mark it done. Some need a parent to approve — you'll see a clock icon on those.",
  },
  {
    icon: "📊",
    title: "Stats",
    body: "Your Quest Log. Track XP, level, streaks, and personal records. Open it any time for a confidence boost.",
  },
  {
    icon: "🏆",
    title: "Badges",
    body: "Your trophy cabinet. Earn badges for streaks, perfect weeks, and special achievements. Tap any badge to see how to unlock it.",
  },
  {
    icon: "🎁",
    title: "Rewards",
    body: "Spend your points on real-world prizes set up by your parent. Tap a reward to request it.",
  },
  {
    icon: "📅",
    title: "History",
    body: "A heatmap of every day you've quested. The brighter the colour, the more chores you crushed.",
  },
  {
    icon: "🚀",
    title: "Go quest!",
    body: "That's it — go finish your first chore. Tap the ? icon any time to see this tour again.",
  },
];
