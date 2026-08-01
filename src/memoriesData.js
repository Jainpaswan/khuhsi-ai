// Memory Database & Knowledge Base for Khushi's Memory Keeper (Updated with Real Family Photos)

const INITIAL_MEMORIES = [
  {
    id: "mem-1",
    title: "The Red Lehenga Royal Princess Day",
    category: "childhood",
    keywords: ["childhood", "lehenga", "red", "princess", "young", "dressed", "cute", "funniest", "kid"],
    story: "When Khushi was younger, she insisted on wearing her favorite heavy red and gold embroidered lehenga all around the house! She sat gracefully on the polished floor like a royal princess, looking super adorable and refusing to change into casual clothes because she said, 'Queens only sit in royal dresses!'",
    date: "Childhood Days",
    mediaType: "photo",
    mediaUrl: "/images/khushi_childhood.jpg",
    caption: "Khushi sitting gracefully in her royal red & gold lehenga!",
    addedBy: "Mom"
  },
  {
    id: "mem-2",
    title: "Brother Jain & Prem",
    category: "siblings",
    keywords: ["annoying", "sibling", "rohan", "brother", "pug", "dog", "goggles", "fight", "fun"],
    story: "Rohan is hands down the most loving yet annoying brother! One cozy afternoon, Rohan sneaked right next to Khushi with a goofy pug filter on his phone, pulled funny faces until Khushi couldn't stop giggling, and captured this legendary sibling selfie together.",
    date: "Family Moments",
    mediaType: "photo",
    mediaUrl: "/images/khushi_family.jpg",
    caption: "Khushi and Rohan smiling together with pug filter fun!",
    addedBy: "Rohan (The Annoying Brother)"
  },
  {
    id: "mem-3",
    title: "Mother's Blessing & The Birthday Tiara",
    category: "birthday",
    keywords: ["happiest", "birthday", "party", "tilak", "mom", "tiara", "sash", "blessing", "balloons", "cake", "best birthday"],
    story: "On Khushi's happiest birthday celebration, surrounded by bright blue party balloons and a delicious sprinkle cake, Mom gently put a loving red tilak on Khushi's forehead. Wearing her sparkling princess tiara and 'Birthday Girl' sash, Khushi felt like the luckiest girl in the world surrounded by family love!",
    date: "Birthday Celebration",
    mediaType: "photo",
    mediaUrl: "/images/khushi_birthday.jpg",
    caption: "Mom giving tilak blessing to Birthday Girl Khushi with tiara & sash!",
    addedBy: "Entire Family"
  },
  {
    id: "mem-4",
    title: "Festive Balloons & Celebration Glow",
    category: "school",
    keywords: ["school", "days", "party", "festive", "balloons", "celebration", "dress", "smile"],
    story: "Khushi dressed up in her stunning red festive outfit and delicate necklace for a special family celebration. Standing under colorful party balloons, her shy smile and graceful pose made everyone admire how fast she's growing up!",
    date: "Festive Memory",
    mediaType: "photo",
    mediaUrl: "/images/khushi_school.jpg",
    caption: "Khushi posing gracefully under the festive balloon decorations!",
    addedBy: "Dad & Mom"
  },
  {
    id: "mem-5",
    title: "Radiant Khushi - Pink Saree Portrait",
    category: "food",
    keywords: ["favorite", "food", "portrait", "pink", "saree", "bindi", "smile", "radiant", "beautiful", "mango", "kheer"],
    story: "A radiant portrait of Khushi wearing a vibrant pink ethnic drape with a traditional red bindi. Known for her sweet tooth (especially Mom's handmade Mango Kheer and cheesy Margherita pizza!), her bright eyes and loving smile light up every room she enters.",
    date: "Recent Portrait",
    mediaType: "photo",
    mediaUrl: "/images/khushi_portrait.jpg",
    caption: "Radiant portrait of Khushi with her infectious sweet smile!",
    addedBy: "Best Friends"
  }
];

export const INITIAL_PHOTOS = [
  {
    id: "p1",
    title: "Birthday Girl Tiara & Mom's Blessing",
    category: "birthday",
    url: "/images/khushi_birthday.jpg",
    date: "Birthday Party",
    caption: "Mom placing a red tilak blessing on Khushi's forehead in front of blue balloons!",
    likes: 88
  },
  {
    id: "p2",
    title: "Red Lehenga Princess",
    category: "childhood",
    url: "/images/khushi_childhood.jpg",
    date: "Childhood Days",
    caption: "Khushi sitting gracefully on the floor in her royal red & gold lehenga.",
    likes: 64
  },
  {
    id: "p3",
    title: "Khushi & Brother Rohan Sibling Fun",
    category: "siblings",
    url: "/images/khushi_family.jpg",
    date: "Home Memories",
    caption: "Sharing giggles with her brother Rohan and playful pug filter overlay!",
    likes: 72
  },
  {
    id: "p4",
    title: "Festive Balloon Celebration",
    category: "school",
    url: "/images/khushi_school.jpg",
    date: "Party Moment",
    caption: "Dressed in red festive wear under colorful party balloons and floral backdrop.",
    likes: 53
  },
  {
    id: "p5",
    title: "Vibrant Pink Saree Portrait",
    category: "food",
    url: "/images/khushi_portrait.jpg",
    date: "Recent Memory",
    caption: "Close-up portrait of Khushi with a sweet bindi and radiant smile.",
    likes: 95
  }
];

export const INITIAL_VIDEOS = [
  {
    id: "v1",
    title: "Mom & Dad's Birthday Tilak & Blessing 💌",
    duration: "1:45",
    thumbnail: "/images/khushi_birthday.jpg",
    speaker: "Mom & Dad",
    description: "Heartwarming moment of Mom blessing Khushi with a red tilak on her birthday while surrounded by blue balloons.",
    quote: "'You will always be our royal princess, Khushi. Happy Birthday!'"
  },
  {
    id: "v2",
    title: "Rohan & Khushi's Sibling Laughs Reel 😂",
    duration: "1:12",
    thumbnail: "/images/khushi_family.jpg",
    speaker: "Rohan (Brother)",
    description: "Funny video clip of Rohan playing pranks on Khushi, capturing giggles and pug filter moments together.",
    quote: "'You're annoying, but you're still my favorite sister!'"
  },
  {
    id: "v3",
    title: "Red Lehenga Princess Throwback 🌟",
    duration: "2:05",
    thumbnail: "/images/khushi_childhood.jpg",
    speaker: "Family Throwback",
    description: "Reel of Khushi wearing her royal red lehenga and striking graceful poses around the house.",
    quote: "'Born to shine like a true queen!'"
  }
];

export const INITIAL_WISHES = [
  {
    id: "w1",
    sender: "Mom & Dad ❤️",
    relation: "Parents",
    message: "Dearest Khushi, putting the birthday tilak on your forehead today brings back memories of the day you came into our lives. May your year ahead be blessed with pure happiness, good health, and sweet surprises!",
    audioNote: "Happy Birthday my princess! - Mom & Dad",
    likes: 54,
    date: "Today"
  },
  {
    id: "w2",
    sender: "Rohan (Brother) 😼",
    relation: "Sibling",
    message: "Happy Birthday Khushi! Loved our funny photo sessions. I promise to let you pick the TV show today without fighting. Have an awesome birthday!",
    audioNote: "Happy Birthday Khushi! - Rohan",
    likes: 42,
    date: "Today"
  },
  {
    id: "w3",
    sender: "Grandma 👵",
    relation: "Grandmother",
    message: "May God always protect my sweet little queen in her royal lehenga! Keep smiling your radiant smile forever. All my love and blessings!",
    audioNote: "Jug jug jiyo meri pyari bachi! - Dadi",
    likes: 61,
    date: "Today"
  },
  {
    id: "w4",
    sender: "Ananya & Priya 👭",
    relation: "Best Friends",
    message: "HAPPY BIRTHDAY BEAUTIFUL! You look absolutely stunning in your birthday tiara and sash! Can't wait to celebrate together tonight!",
    audioNote: "Besties forever! Woohoo! - Ananya",
    likes: 49,
    date: "Today"
  }
];

export function getMemories() {
  const stored = localStorage.getItem("khushi_memories");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return INITIAL_MEMORIES;
    }
  }
  return INITIAL_MEMORIES;
}

export function saveMemory(newMem) {
  const current = getMemories();
  const memoryObj = {
    id: "mem-" + Date.now(),
    title: newMem.title,
    category: newMem.category || "custom",
    keywords: newMem.title.toLowerCase().split(" ").concat(newMem.story.toLowerCase().split(" ")).filter(w => w.length > 2),
    story: newMem.story,
    date: newMem.date || "Special Memory",
    mediaType: newMem.mediaUrl ? "photo" : null,
    mediaUrl: newMem.mediaUrl || null,
    caption: newMem.title,
    addedBy: newMem.addedBy || "Family Member"
  };
  current.unshift(memoryObj);
  localStorage.setItem("khushi_memories", JSON.stringify(current));
  return memoryObj;
}

export function searchMemoriesInDB(userQuery) {
  const memories = getMemories();
  const q = userQuery.toLowerCase().trim();

  let bestMatch = null;
  let highestScore = 0;

  memories.forEach(mem => {
    let score = 0;
    
    mem.keywords.forEach(kw => {
      if (q.includes(kw)) score += 3;
    });

    if (q.includes(mem.category)) score += 4;
    
    if ((q.includes("funny") || q.includes("funniest") || q.includes("lehenga") || q.includes("childhood")) && (mem.keywords.includes("childhood") || mem.keywords.includes("lehenga"))) {
      score += 12;
    }
    if ((q.includes("annoying") || q.includes("sibling") || q.includes("rohan") || q.includes("brother")) && mem.keywords.includes("annoying")) {
      score += 12;
    }
    if ((q.includes("school") || q.includes("class") || q.includes("balloons") || q.includes("party")) && (mem.keywords.includes("school") || mem.keywords.includes("party"))) {
      score += 12;
    }
    if ((q.includes("food") || q.includes("favorite") || q.includes("portrait") || q.includes("pink")) && mem.keywords.includes("portrait")) {
      score += 12;
    }
    if ((q.includes("happiest") || q.includes("best birthday") || q.includes("tiara") || q.includes("tilak")) && mem.keywords.includes("birthday")) {
      score += 12;
    }
    if ((q.includes("photo") || q.includes("photos") || q.includes("childhood photos") || q.includes("show")) && (mem.keywords.includes("childhood") || mem.keywords.includes("photo") || mem.keywords.includes("birthday"))) {
      score += 10;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = mem;
    }
  });

  if (highestScore >= 3) {
    return bestMatch;
  }
  
  return null;
}
