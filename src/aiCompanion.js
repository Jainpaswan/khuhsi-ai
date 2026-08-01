// AI Memory Companion Module for Khushi's Memory Keeper

import { searchMemoriesInDB, getMemories } from './memoriesData.js';

export function generateAIResponse(userMessage) {
  const query = userMessage.toLowerCase().trim();
  const matchedMemory = searchMemoriesInDB(query);

  // Check if user explicitly asked for media (photos/videos)
  const isMediaRequested = query.includes("show") || query.includes("photo") || query.includes("picture") || query.includes("see") || query.includes("gallery") || query.includes("video");

  // Specific handler for "show childhood photos" or photo requests
  if ((query.includes("photo") || query.includes("picture")) && (query.includes("show") || query.includes("childhood") || query.includes("all"))) {
    const allMemories = getMemories();
    const mediaMemories = allMemories.filter(m => m.mediaUrl);
    
    return {
      text: `Here are your treasured childhood and family photos, Khushi! Looking at these always brings back so much warmth and giggles! 📸✨`,
      mediaCards: mediaMemories.slice(0, 3).map(m => ({
        url: m.mediaUrl,
        title: m.title,
        caption: m.caption,
        date: m.date
      })),
      isFallback: false
    };
  }

  // If a matching memory is found in the DB
  if (matchedMemory) {
    let warmIntro = "";
    if (matchedMemory.category === "childhood") {
      warmIntro = "Aww, talking about childhood always brings back the sweetest smiles! 🍦✨ ";
    } else if (matchedMemory.category === "siblings") {
      warmIntro = "Haha, Oh dear, sibling stories are always legendary in this house! 😂😼 ";
    } else if (matchedMemory.category === "school") {
      warmIntro = "Ah, school days! Those bright uniforms, canteen secrets, and endless giggles! 📚🌸 ";
    } else if (matchedMemory.category === "food") {
      warmIntro = "Mmmm, just thinking about your favorite dishes makes my heart (and tummy) happy! 🍕🥭 ";
    } else if (matchedMemory.category === "birthday") {
      warmIntro = "Oh, that was such a magical night under the sparkling stars! 🎂✨ ";
    } else {
      warmIntro = "Here is a memory locked safely in our heart vault: 💖 ";
    }

    const fullText = `${warmIntro}${matchedMemory.story}\n\n*(Memory shared by: ${matchedMemory.addedBy} • ${matchedMemory.date})*`;

    let mediaCards = null;
    if (matchedMemory.mediaUrl || isMediaRequested) {
      mediaCards = [{
        url: matchedMemory.mediaUrl || "/images/khushi_childhood.jpg",
        title: matchedMemory.title,
        caption: matchedMemory.caption || matchedMemory.title,
        date: matchedMemory.date
      }];
    }

    return {
      text: fullText,
      mediaCards: mediaCards,
      isFallback: false
    };
  }

  // Fallback: Strictly do not invent facts if memory isn't added yet!
  return {
    text: `Oh sweetie, that special memory hasn't been added to my Memory Vault yet! ✨\n\nI only keep memories that your loving family and friends have added. You or your family can click the **"+ Add New Memory"** button above to save this memory so I can cherish it forever with you! 💖`,
    mediaCards: null,
    isFallback: true
  };
}
