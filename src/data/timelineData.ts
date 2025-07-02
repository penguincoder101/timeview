import { Topic } from '../types';

export const timelineTopics: Topic[] = [
  {
    id: "seven-wonders",
    name: "Seven Wonders of the World",
    events: [
      {
        id: "great-pyramid",
        title: "Great Pyramid of Giza",
        date: "2580–2560 BCE",
        year: -2570,
        shortDescription: "The Great Pyramid of Giza, built as Pharaoh Khufu's tomb, is the oldest and largest of the ancient world's wonders.",
        description: "Constructed around 2560 BCE, the Great Pyramid of Giza is the oldest and largest of the three pyramids at Giza. Built as the tomb of Pharaoh Khufu, it originally stood 146.6 meters tall and remained the tallest man-made structure for millennia. It is the only one of the Seven Wonders of the Ancient World still largely intact.",
        imageUrl: "https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza",
        tags: ["Ancient Egypt", "Pyramids", "Architecture", "Old Kingdom"]
      },
      {
        id: "hanging-gardens",
        title: "Hanging Gardens of Babylon",
        date: "c. 600 BCE",
        year: -600,
        shortDescription: "Legendary tiered gardens with diverse vegetation, resembling a large green mountain.",
        description: "Described by ancient writers as an ascending series of tiered gardens with a wide variety of trees, shrubs, and vines, the Hanging Gardens were considered an engineering marvel of the ancient world.",
        imageUrl: "https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Hanging_Gardens_of_Babylon",
        tags: ["Babylon", "Gardens", "Engineering"]
      },
      {
        id: "statue-zeus",
        title: "Statue of Zeus at Olympia",
        date: "435 BCE",
        year: -435,
        shortDescription: "A giant 12‑meter tall seated statue of Zeus, crafted by Phidias.",
        description: "Crafted by the sculptor Phidias around 435 BCE, this seated statue of Zeus was approximately 12 meters tall and regarded as one of the greatest sculptures of the ancient world.",
        imageUrl: "https://images.pexels.com/photos/16437843/pexels-photo-16437843/free-photo-of-ancient-greek-statue.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Statue_of_Zeus_at_Olympia",
        tags: ["Ancient Greece", "Sculpture", "Zeus"]
      },
      {
        id: "temple-artemis",
        title: "Temple of Artemis at Ephesus",
        date: "c. 550 BCE",
        year: -550,
        shortDescription: "A magnificent Greek temple dedicated to Artemis, rebuilt twice after destruction.",
        description: "Dedicated to the goddess Artemis, this temple was rebuilt twice due to fire and flood, and in its final form stood as one of the most ornate structures of the ancient world.",
        imageUrl: "https://images.pexels.com/photos/8134595/pexels-photo-8134595.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Temple_of_Artemis",
        tags: ["Ancient Greece", "Temple", "Artemis"]
      },
      {
        id: "mausoleum-halicarnassus",
        title: "Mausoleum at Halicarnassus",
        date: "353–350 BCE",
        year: -353,
        shortDescription: "A 45‑meter tall tomb built for Mausolus and his sister-wife Artemisia II.",
        description: "Erected for Mausolus, a Persian satrap, and his sister-wife Artemisia II, this ornate tomb stood approximately 45 meters high and combined Greek, Egyptian, and Lycian design elements.",
        imageUrl: "https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Mausoleum_at_Halicarnassus",
        tags: ["Persian Empire", "Tomb", "Architecture"]
      },
      {
        id: "colossus-rhodes",
        title: "Colossus of Rhodes",
        date: "280 BCE",
        year: -280,
        shortDescription: "A towering 33‑meter statue of Helios built to celebrate victory over Cyprus.",
        description: "This bronze statue of Helios stood over 30 meters high at the harbor entrance in Rhodes, commemorating the island's defense against Cyprus and becoming one of the tallest statues of its time.",
        imageUrl: "https://images.pexels.com/photos/8728382/pexels-photo-8728382.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Colossus_of_Rhodes",
        tags: ["Ancient Greece", "Statue", "Helios"]
      },
      {
        id: "lighthouse-alexandria",
        title: "Lighthouse of Alexandria",
        date: "c. 280–247 BCE",
        year: -280,
        shortDescription: "A massive lighthouse (120–137 m tall) guiding ships into Alexandria harbor.",
        description: "Built by the Ptolemaic Kingdom, this lighthouse stood between 120 and 137 meters tall, making it one of the tallest man-made structures of the ancient world and a vital navigational aid.",
        imageUrl: "https://images.pexels.com/photos/1840624/pexels-photo-1840624.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Lighthouse_of_Alexandria",
        tags: ["Ancient Egypt", "Lighthouse", "Navigation"]
      }
    ]
  },
  {
    id: "wwii",
    name: "World War II Timeline",
    events: [
      {
        id: "invasion-poland",
        title: "Invasion of Poland",
        date: "September 1, 1939",
        year: 1939,
        shortDescription: "Germany invades Poland, marking the start of WWII.",
        description: "Germany invaded Poland on 1 September 1939, prompting Britain and France to declare war two days later, officially beginning World War II in Europe.",
        imageUrl: "https://images.pexels.com/photos/63324/pexels-photo-63324.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Invasion_of_Poland",
        tags: ["Germany", "Poland", "Invasion"]
      },
      {
        id: "battle-britain",
        title: "Battle of Britain",
        date: "July–October 1940",
        year: 1940,
        shortDescription: "The first major campaign fought entirely by air forces.",
        description: "From 10 July to 31 October 1940, the RAF defended the UK against the Luftwaffe in the first major military campaign fought entirely by air.",
        imageUrl: "https://images.pexels.com/photos/62622/pexels-photo-62622.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Battle_of_Britain",
        tags: ["Britain", "Air Force", "Defense"]
      },
      {
        id: "operation-barbarossa",
        title: "Operation Barbarossa",
        date: "June 22, 1941",
        year: 1941,
        shortDescription: "Nazi Germany launches its invasion of the Soviet Union.",
        description: "On 22 June 1941, Nazi Germany initiated the largest military operation in history by invading the Soviet Union, ultimately involving over 3.8 million troops.",
        imageUrl: "https://images.pexels.com/photos/12461486/pexels-photo-12461486.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Operation_Barbarossa",
        tags: ["Germany", "Soviet Union", "Invasion"]
      },
      {
        id: "pearl-harbor",
        title: "Attack on Pearl Harbor",
        date: "December 7, 1941",
        year: 1941,
        shortDescription: "Japanese carriers launch a surprise attack on the US Pacific Fleet.",
        description: "On 7 December 1941, the Imperial Japanese Navy Air Service carried out a surprise strike on Pearl Harbor, prompting the United States to enter WWII.",
        imageUrl: "https://images.pexels.com/photos/12935206/pexels-photo-12935206.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Attack_on_Pearl_Harbor",
        tags: ["Japan", "United States", "Naval Attack"]
      },
      {
        id: "d-day",
        title: "D-Day Normandy Landings",
        date: "June 6, 1944",
        year: 1944,
        shortDescription: "Allied forces launch the largest amphibious invasion to liberate Western Europe.",
        description: "On 6 June 1944, Allied forces launched Operation Overlord, the largest seaborne invasion in history, marking the liberation of German-occupied Western Europe.",
        imageUrl: "https://images.pexels.com/photos/12935195/pexels-photo-12935195.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Normandy_landings",
        tags: ["Allies", "Normandy", "Liberation"]
      },
      {
        id: "victory-europe",
        title: "Victory in Europe Day",
        date: "May 8, 1945",
        year: 1945,
        shortDescription: "Germany surrenders unconditionally, ending WWII in Europe.",
        description: "Victory in Europe Day marks the 8 May 1945 surrender of Nazi Germany to the Allies, ending WWII in Europe.",
        imageUrl: "https://images.pexels.com/photos/12935211/pexels-photo-12935211.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Victory_in_Europe_Day",
        tags: ["Victory", "Europe", "Surrender"]
      }
    ]
  },
  {
    id: "ancient-civilizations",
    name: "Ancient Civilizations",
    events: [
      {
        id: "mesopotamia",
        title: "Rise of Mesopotamia",
        date: "c. 3500 BCE",
        year: -3500,
        shortDescription: "The \"Cradle of Civilization\" where the first cities and writing systems emerged.",
        description: "Around 3500 BCE in modern Iraq, the Sumerians built Uruk with its ziggurats and developed cuneiform writing, establishing one of humanity's first civilizations.",
        imageUrl: "https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Mesopotamia",
        tags: ["Mesopotamia", "Sumerians", "Civilization"]
      },
      {
        id: "ancient-egypt",
        title: "Ancient Egyptian Civilization",
        date: "c. 3100 BCE",
        year: -3100,
        shortDescription: "Unification of Egypt launches one of history's longest empires under the pharaohs.",
        description: "In c. 3100 BCE, King Narmer unified Upper and Lower Egypt, beginning dynastic rule that built pyramids, developed hieroglyphs, and established complex religious practices lasting millennia.",
        imageUrl: "https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Ancient_Egypt",
        tags: ["Egypt", "Pharaohs", "Pyramids"]
      },
      {
        id: "indus-valley",
        title: "Indus Valley Civilization",
        date: "c. 2600 BCE",
        year: -2600,
        shortDescription: "A Bronze Age civilization in South Asia known for planned cities and drainage.",
        description: "Flourishing from c. 2600–1900 BCE in present‑day Pakistan and northwest India, cities like Mohenjo‑daro featured grid layouts, advanced drainage, and standardized weights, reflecting remarkable urban planning.",
        imageUrl: "https://images.pexels.com/photos/12935195/pexels-photo-12935195.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Indus_Valley_Civilisation",
        tags: ["Indus Valley", "Urban Planning", "Bronze Age"]
      },
      {
        id: "ancient-china",
        title: "Ancient Chinese Civilization",
        date: "c. 2070 BCE",
        year: -2070,
        shortDescription: "The Xia Dynasty marks the beginning of dynastic rule; later innovations include paper and gunpowder.",
        description: "The Xia Dynasty (c. 2070–1600 BCE) is traditionally China's first dynasty. Subsequent dynasties introduced the compass, gunpowder, paper, and printing, profoundly influencing global history.",
        imageUrl: "https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/History_of_China",
        tags: ["China", "Xia Dynasty", "Innovation"]
      },
      {
        id: "ancient-greece",
        title: "Ancient Greek Civilization",
        date: "c. 800 BCE",
        year: -800,
        shortDescription: "The Archaic period begins; Greeks develop democracy, philosophy, theater, and the Olympics.",
        description: "Starting around 800 BCE, Greek city‑states laid foundations for democracy (Athens), philosophy (Plato, Aristotle), theater, and the Olympic Games, shaping Western civilization.",
        imageUrl: "https://images.pexels.com/photos/16437843/pexels-photo-16437843/free-photo-of-ancient-greek-statue.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Ancient_Greece",
        tags: ["Greece", "Democracy", "Philosophy"]
      },
      {
        id: "roman-empire",
        title: "Roman Empire",
        date: "27 BCE",
        year: -27,
        shortDescription: "Augustus becomes first emperor, transforming the Republic into an empire.",
        description: "In 27 BCE, Octavian (Augustus) became the first Roman Emperor, ending the Republic and initiating centuries of Roman rule that spread law, architecture, and Latin across Europe.",
        imageUrl: "https://images.pexels.com/photos/8134595/pexels-photo-8134595.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Roman_Empire",
        tags: ["Rome", "Empire", "Augustus"]
      }
    ]
  },
  {
    id: "ancient-rwanda",
    name: "Ancient History of Rwanda",
    defaultDisplayMode: "years",
    events: [
      {
        id: "early-settlement",
        title: "Early Human Settlement",
        date: "10,000 BCE",
        year: -10000,
        shortDescription: "Hunter-gatherer groups, ancestors of the Twa, establish the earliest known settlements.",
        description: "The earliest inhabitants were hunter-gatherer communities (ancestors of the Twa pygmies) who settled in forested regions of present-day Rwanda, developing deep knowledge of the local environment.",
        imageUrl: "https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/History_of_Rwanda",
        tags: ["Twa", "Hunter-Gatherers", "Settlement"]
      },
      {
        id: "bantu-migration",
        title: "Bantu Migrations and Iron Age",
        date: "c. 1000 BCE",
        year: -1000,
        shortDescription: "Bantu-speaking farmers migrate in, introducing iron-working and agriculture.",
        description: "Around 1000 BCE, Bantu-speaking peoples entered the Great Lakes region, bringing iron-smelting technology and settled agriculture, reshaping local economies and societies.",
        imageUrl: "https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Bantu_expansion",
        tags: ["Bantu Migration", "Iron Age", "Agriculture"]
      },
      {
        id: "clan-societies",
        title: "Formation of Clans and Chieftaincies",
        date: "c. 500 CE",
        year: 500,
        shortDescription: "Clan-based chieftaincies emerge as early political structures.",
        description: "By 500 CE, Rwandan society organized into clans led by chieftains who governed local affairs, setting the stage for later centralized kingdoms.",
        imageUrl: "https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/History_of_Rwanda",
        tags: ["Clans", "Chieftaincies", "Social Structure"]
      },
      {
        id: "first-kingdoms",
        title: "Emergence of Small Kingdoms",
        date: "c. 1000 CE",
        year: 1000,
        shortDescription: "Several small kingdoms form, each with its own customs and rulers.",
        description: "By the 11th century, multiple small kingdoms had formed, with distinct dynasties and cultural practices, often competing or allying with neighbors.",
        imageUrl: "https://images.pexels.com/photos/8134595/pexels-photo-8134595.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/History_of_Rwanda",
        tags: ["Kingdoms", "Political Development", "Great Lakes"],
        relatedTopicId: "rwandan-kingdoms"
      },
      {
        id: "gihanga-legend",
        title: "Legendary Founder Gihanga",
        date: "c. 1400 CE",
        year: 1400,
        shortDescription: "Gihanga, in oral tradition, is credited with founding the Rwandan kingdom.",
        description: "Rwandan oral histories recount Gihanga as the first king, introducing cattle herding, fire, and metalworking, thus shaping early cultural and political structures.",
        imageUrl: "https://images.pexels.com/photos/1840624/pexels-photo-1840624.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Gihanga",
        tags: ["Gihanga", "Oral Tradition", "Kingdom"],
        relatedTopicId: "rwandan-kingdoms"
      },
      {
        id: "nyiginya-dynasty",
        title: "Rise of the Nyiginya Dynasty",
        date: "c. 1500 CE",
        year: 1500,
        shortDescription: "The Nyiginya (Tutsi) dynasty consolidates power in central Rwanda.",
        description: "Between the 15th and 16th centuries, the Tutsi Nyiginya clan unified territory and established the institutions of the Rwandan kingdom that would endure for centuries.",
        imageUrl: "https://images.pexels.com/photos/16437843/pexels-photo-16437843/free-photo-of-ancient-greek-statue.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kingdom_of_Rwanda",
        tags: ["Nyiginya Dynasty", "Tutsi Monarchy", "Centralization"],
        relatedTopicId: "rwandan-kingdoms"
      },
      {
        id: "ruganzu-ndori",
        title: "Reign of Ruganzu Ndori",
        date: "c. 1510 CE",
        year: 1510,
        shortDescription: "King Ruganzu II Ndoli expands territory and strengthens institutions.",
        description: "Ruganzu the Great led military campaigns that extended Rwandan borders and built the royal institutions that underpinned the kingdom's power for generations.",
        imageUrl: "https://images.pexels.com/photos/8728382/pexels-photo-8728382.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Ruganzu_II_Ndoli",
        tags: ["Ruganzu II Ndoli", "Expansion", "Institution Building"],
        relatedTopicId: "rwandan-kingdoms"
      },
      {
        id: "ubuhake-system",
        title: "Establishment of Ubuhake",
        date: "c. 1600 CE",
        year: 1600,
        shortDescription: "The cattle-based patronage system underpins social hierarchy.",
        description: "By the 17th century, ubuhake (cattle-client) relationships structured Rwandan society, with cattle-owners granting livestock to clients in exchange for service and loyalty.",
        imageUrl: "https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Ubuhake",
        tags: ["Ubuhake", "Social System", "Cattle Patronage"],
        relatedTopicId: "rwandan-kingdoms"
      },
      {
        id: "mazimpaka",
        title: "Reign of Mazimpaka",
        date: "1746 CE",
        year: 1746,
        shortDescription: "King Mazimpaka expands territory and refines court rituals.",
        description: "King Mazimpaka's mid-18th-century reign saw significant territorial expansion and sophistication of royal ceremonies, marking the apex of precolonial Rwandan monarchy.",
        imageUrl: "https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Mazimpaka",
        tags: ["Mazimpaka", "Expansion", "Court Rituals"],
        relatedTopicId: "rwandan-kingdoms"
      },
      {
        id: "rwabugiri-reign",
        title: "Reign of Kigeli IV Rwabugiri",
        date: "1853–1895 CE",
        year: 1853,
        shortDescription: "Rwabugiri expands Rwanda to its greatest extent and engages with Europeans.",
        description: "Rwabugiri led military campaigns that brought Rwanda to its largest size and oversaw initial contact with European explorers, maintaining independence through diplomacy and force.",
        imageUrl: "https://images.pexels.com/photos/8134595/pexels-photo-8134595.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kigeli_IV_Rwabugiri",
        tags: ["Rwabugiri", "Expansion", "Explorers"],
        relatedTopicId: "rwandan-kingdoms"
      }
    ]
  },
  {
    id: "rwandan-kingdoms",
    name: "Details of Rwandan Kingdoms",
    defaultDisplayMode: "years",
    events: [
      {
        id: "gihanga-founding",
        title: "Gihanga Founds the Kingdom",
        date: "c. 1091 CE",
        year: 1091,
        shortDescription: "Legendary king Gihanga establishes the first Rwandan kingdom.",
        description: "According to oral tradition, Gihanga was the first king of Rwanda who came from the heavens and established the kingdom. He is credited with introducing cattle, fire, and iron-working to the people of Rwanda.",
        imageUrl: "https://images.pexels.com/photos/1840624/pexels-photo-1840624.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Gihanga",
        tags: ["Gihanga", "Foundation", "Oral Tradition"]
      },
      {
        id: "kigwa-dynasty",
        title: "Kigwa and the Divine Lineage",
        date: "c. 1120 CE",
        year: 1120,
        shortDescription: "Kigwa, son of Gihanga, establishes the divine royal lineage.",
        description: "Kigwa, believed to be the son of Gihanga, continued the royal lineage and established many of the royal customs and ceremonies that would define Rwandan kingship for centuries.",
        imageUrl: "https://images.pexels.com/photos/16437843/pexels-photo-16437843/free-photo-of-ancient-greek-statue.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kingdom_of_Rwanda",
        tags: ["Kigwa", "Royal Lineage", "Divine Kingship"]
      },
      {
        id: "nyiginya-consolidation",
        title: "Nyiginya Clan Consolidation",
        date: "c. 1400 CE",
        year: 1400,
        shortDescription: "The Nyiginya clan consolidates power and establishes lasting institutions.",
        description: "The Nyiginya clan, claiming descent from Gihanga, consolidated power in central Rwanda and established the administrative and military institutions that would govern the kingdom for centuries.",
        imageUrl: "https://images.pexels.com/photos/8134595/pexels-photo-8134595.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kingdom_of_Rwanda",
        tags: ["Nyiginya", "Consolidation", "Institutions"]
      },
      {
        id: "ruganzu-ndori-reign",
        title: "Ruganzu II Ndori's Expansion",
        date: "c. 1510–1543 CE",
        year: 1510,
        shortDescription: "Ruganzu II Ndori expands the kingdom and strengthens royal power.",
        description: "King Ruganzu II Ndori, known as 'Ruganzu the Great,' led successful military campaigns that significantly expanded Rwanda's territory and established many of the kingdom's lasting political and social institutions.",
        imageUrl: "https://images.pexels.com/photos/8728382/pexels-photo-8728382.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Ruganzu_II_Ndoli",
        tags: ["Ruganzu II Ndori", "Expansion", "Military"]
      },
      {
        id: "mutara-semugeshi",
        title: "Mutara I Semugeshi's Reforms",
        date: "c. 1600–1624 CE",
        year: 1600,
        shortDescription: "King Mutara I implements administrative and social reforms.",
        description: "Mutara I Semugeshi introduced significant administrative reforms, including the ubuhake system of cattle clientship and the organization of the kingdom into provinces with appointed governors.",
        imageUrl: "https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kingdom_of_Rwanda",
        tags: ["Mutara I", "Reforms", "Administration"]
      },
      {
        id: "yuhi-gahima",
        title: "Yuhi II Gahima's Cultural Renaissance",
        date: "c. 1648–1672 CE",
        year: 1648,
        shortDescription: "A period of cultural flourishing under King Yuhi II Gahima.",
        description: "King Yuhi II Gahima's reign marked a cultural renaissance with the development of royal poetry, dance, and ceremonies. The famous Intore dancers and royal drummers reached new heights of artistic expression.",
        imageUrl: "https://images.pexels.com/photos/12935073/pexels-photo-12935073.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kingdom_of_Rwanda",
        tags: ["Yuhi II Gahima", "Culture", "Arts"]
      },
      {
        id: "mazimpaka-expansion",
        title: "Mazimpaka's Territorial Peak",
        date: "1746–1802 CE",
        year: 1746,
        shortDescription: "King Mazimpaka expands Rwanda to its greatest territorial extent.",
        description: "Under King Mazimpaka, Rwanda reached its largest territorial extent through successful military campaigns. He also refined the royal court ceremonies and strengthened the kingdom's administrative structure.",
        imageUrl: "https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Mazimpaka",
        tags: ["Mazimpaka", "Territorial Peak", "Administration"]
      },
      {
        id: "rwabugiri-modernization",
        title: "Rwabugiri's Modernization Efforts",
        date: "1853–1895 CE",
        year: 1853,
        shortDescription: "King Kigeli IV Rwabugiri modernizes the kingdom while maintaining independence.",
        description: "Kigeli IV Rwabugiri was the last independent king of Rwanda. He modernized the military, established diplomatic relations with European explorers, and maintained Rwanda's independence through strategic alliances and military strength.",
        imageUrl: "https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kigeli_IV_Rwabugiri",
        tags: ["Rwabugiri", "Modernization", "Independence"]
      },
      {
        id: "colonial-encounter",
        title: "First Colonial Encounters",
        date: "1897–1900 CE",
        year: 1897,
        shortDescription: "European colonial powers begin to establish control over Rwanda.",
        description: "Following Rwabugiri's death, Rwanda faced increasing pressure from German colonial forces. The kingdom's traditional structures began to be challenged by European administrative systems and Christian missionary activities.",
        imageUrl: "https://images.pexels.com/photos/63324/pexels-photo-63324.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/German_East_Africa",
        tags: ["Colonial Period", "German Rule", "Traditional Authority"]
      },
      {
        id: "monarchy-end",
        title: "End of the Monarchy",
        date: "1961 CE",
        year: 1961,
        shortDescription: "The Rwandan monarchy is abolished, ending centuries of royal rule.",
        description: "The Rwandan Revolution of 1959-1961 led to the abolition of the monarchy and the establishment of a republic. King Kigeli V was forced into exile, ending over 500 years of continuous royal rule in Rwanda.",
        imageUrl: "https://images.pexels.com/photos/12935211/pexels-photo-12935211.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Rwandan_Revolution",
        tags: ["Revolution", "Republic", "End of Monarchy"]
      }
    ]
  },
  {
    id: "independence-movements",
    name: "Independence Movements",
    events: [
      {
        id: "rwanda-independence",
        title: "Rwandan Independence",
        date: "July 1, 1962",
        year: 1962,
        shortDescription: "Rwanda becomes independent from Belgian administration.",
        description: "On July 1, 1962, Rwanda and neighboring Burundi were granted independence by Belgium after decades under League of Nations and UN trusteeship. Grégoire Kayibanda became the first President in the new republic.",
        imageUrl: "https://images.pexels.com/photos/874517/pexels-photo-874517.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/History_of_Rwanda#Independence_and_Republic",
        tags: ["Rwanda", "Independence", "1962"]
      },
      {
        id: "burundi-independence",
        title: "Burundi Independence",
        date: "July 1, 1962",
        year: 1962,
        shortDescription: "Burundi declares independence from Belgium.",
        description: "On July 1, 1962, the Kingdom of Burundi gained full sovereignty under King Mwambutsa IV before a republican coup later that year replaced the monarchy with a presidential government.",
        imageUrl: "https://images.pexels.com/photos/716411/pexels-photo-716411.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Burundi#History",
        tags: ["Burundi", "Independence", "1962"]
      },
      {
        id: "congo-independence",
        title: "Congo Independence",
        date: "June 30, 1960",
        year: 1960,
        shortDescription: "The Belgian Congo becomes the Republic of the Congo (Léopoldville).",
        description: "On June 30, 1960, the Belgian Congo achieved independence as the Republic of the Congo (Léopoldville). Patrice Lumumba became the first Prime Minister, but internal conflicts soon plunged the nation into the Congo Crisis.",
        imageUrl: "https://images.pexels.com/photos/261949/pexels-photo-261949.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Congo_Crisis",
        tags: ["DRC", "Independence", "1960"]
      },
      {
        id: "kenya-independence",
        title: "Kenya Independence",
        date: "December 12, 1963",
        year: 1963,
        shortDescription: "Kenya gains independence from the United Kingdom.",
        description: "On December 12, 1963, after the Mau Mau Uprising and political negotiation, Kenya became independent as a Dominion under Queen Elizabeth II with Jomo Kenyatta as Prime Minister; it became a republic in 1964.",
        imageUrl: "https://images.pexels.com/photos/20787/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kenya#Independence",
        tags: ["Kenya", "Independence", "1963"]
      },
      {
        id: "uganda-independence",
        title: "Uganda Independence",
        date: "October 9, 1962",
        year: 1962,
        shortDescription: "Uganda achieves independence from Britain.",
        description: "Uganda became a sovereign state on October 9, 1962, ending British colonial rule. Milton Obote served as the first Prime Minister under a constitutional monarchy, which was replaced by a republic in 1963.",
        imageUrl: "https://images.pexels.com/photos/1641182/pexels-photo-1641182.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Uganda#Independence_and_republic",
        tags: ["Uganda", "Independence", "1962"]
      },
      {
        id: "tanzania-independence",
        title: "Tanganyika Independence",
        date: "December 9, 1961",
        year: 1961,
        shortDescription: "Tanganyika (mainland Tanzania) becomes independent.",
        description: "Tanganyika, a former British mandate, attained independence on December 9, 1961. Julius Nyerere became its first Prime Minister, and in 1964 it united with Zanzibar to form Tanzania.",
        imageUrl: "https://images.pexels.com/photos/689610/pexels-photo-689610.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Tanganyika_(1961%E2%80%931964)",
        tags: ["Tanzania", "Independence", "1961"]
      },
      {
        id: "ghana-independence",
        title: "Ghana Independence",
        date: "March 6, 1957",
        year: 1957,
        shortDescription: "Gold Coast becomes independent as Ghana.",
        description: "On March 6, 1957, the Gold Coast gained independence from Britain, becoming Ghana. Kwame Nkrumah became the first Prime Minister, marking the first sub‑Saharan African nation to achieve independence.",
        imageUrl: "https://images.pexels.com/photos/104521/pexels-photo-104521.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Ghana#Independence",
        tags: ["Ghana", "Independence", "1957"]
      }
    ]
  },
  {
    id: "scientific-milestones",
    name: "Scientific Milestones",
    events: [
      {
        id: "lucy-discovery",
        title: "Discovery of 'Lucy'",
        date: "November 24, 1974",
        year: 1974,
        shortDescription: "Discovery of a 3.2‑million‑year‑old Australopithecus afarensis skeleton in Ethiopia.",
        description: "Paleoanthropologist Donald Johanson uncovered 'Lucy' in the Afar Depression, Ethiopia. The almost 40% complete skeleton provided key evidence that early hominins walked upright over 3 million years ago.",
        imageUrl: "https://images.pexels.com/photos/1588668/pexels-photo-1588668.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Australopithecus_afarensis",
        tags: ["Lucy", "Ethiopia", "Evolution", "Paleoanthropology"]
      },
      {
        id: "heart-transplant-1967",
        title: "First Human Heart Transplant",
        date: "December 3, 1967",
        year: 1967,
        shortDescription: "Dr. Christiaan Barnard performs the first successful human heart transplant in South Africa.",
        description: "At Groote Schuur Hospital in Cape Town, Dr. Barnard transplanted the heart of Denise Darvall into Louis Washkansky. Although Washkansky died 18 days later, the surgery proved the procedure's viability and revolutionized cardiac medicine.",
        imageUrl: "https://images.pexels.com/photos/219529/pexels-photo-219529.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Christiaan_Barnard",
        tags: ["Medicine", "Heart Transplant", "1967"]
      },
      {
        id: "penicillin-discovery",
        title: "Discovery of Penicillin",
        date: "1928",
        year: 1928,
        shortDescription: "Alexander Fleming discovers the first true antibiotic.",
        description: "In 1928, Alexander Fleming noted that Penicillium notatum mold killed Staphylococcus bacteria, leading to penicillin's development as the world's first antibiotic and ushering in modern antimicrobial therapy.",
        imageUrl: "https://images.pexels.com/photos/841333/pexels-photo-841333.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Penicillin",
        tags: ["Medicine", "Antibiotic", "1928"]
      },
      {
        id: "apollo-11",
        title: "Apollo 11 Moon Landing",
        date: "July 20, 1969",
        year: 1969,
        shortDescription: "First humans land and walk on the Moon.",
        description: "NASA's Apollo 11 mission carried Neil Armstrong and Buzz Aldrin to the lunar surface. Armstrong's 'one small step' and Aldrin's exploration marked humanity's first footsteps on another world.",
        imageUrl: "https://images.pexels.com/photos/269321/pexels-photo-269321.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Apollo_11",
        tags: ["Space", "Moon", "1969", "NASA"]
      }
    ]
  },
  {
    id: "cultural-revolutions",
    name: "Cultural Revolutions and Movements",
    events: [
      {
        id: "rwandan-social-revolution",
        title: "Rwandan Social Revolution",
        date: "1959–1961",
        year: 1959,
        shortDescription: "Uprising ending the monarchy and leading to a republic.",
        description: "Between 1959 and 1961, a popular uprising overthrew Rwanda's monarchy, resulting in the exile of many royal family members and establishment of a republic under majority rule.",
        imageUrl: "https://images.pexels.com/photos/63324/pexels-photo-63324.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Rwandan_Revolution",
        tags: ["Rwanda", "Revolution", "1959"]
      },
      {
        id: "china-cultural-revolution",
        title: "China's Cultural Revolution",
        date: "1966–1976",
        year: 1966,
        shortDescription: "Mass political campaign led by Mao Zedong to enforce communism.",
        description: "From 1966 to 1976, Mao Zedong mobilized youth Red Guards to attack perceived 'bourgeois' elements, leading to widespread chaos, persecution, and cultural destruction across China.",
        imageUrl: "https://images.pexels.com/photos/100815/pexels-photo-100815.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Cultural_Revolution",
        tags: ["China", "1966", "Mao Zedong"]
      },
      {
        id: "negritude",
        title: "Negritude Movement",
        date: "1930s–1950s",
        year: 1935,
        shortDescription: "Pan-African literary movement celebrating Black identity.",
        description: "Founded in the 1930s by francophone African and Caribbean intellectuals like Aimé Césaire and Léopold Senghor, Negritude affirmed African cultural heritage and opposed colonial assimilation.",
        imageUrl: "https://images.pexels.com/photos/208820/pexels-photo-208820.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Negritude",
        tags: ["Literature", "Pan-Africanism", "1930s"]
      },
      {
        id: "african-union-foundation",
        title: "Founding of the African Union",
        date: "July 9, 2002",
        year: 2002,
        shortDescription: "AU launched, succeeding the OAU to promote unity and development.",
        description: "On July 9, 2002, the African Union replaced the Organisation of African Unity to deepen political and economic integration among African states and address continental challenges collectively.",
        imageUrl: "https://images.pexels.com/photos/712786/pexels-photo-712786.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/African_Union",
        tags: ["Africa", "2002", "Pan-Africanism"]
      }
    ]
  },
  {
    id: "global-conflicts",
    name: "Global Conflicts",
    events: [
      {
        id: "wwi-east-africa",
        title: "WWI East African Campaign",
        date: "1914–1918",
        year: 1914,
        shortDescription: "Allied forces clash with German East Africa during WWI.",
        description: "From 1914–1918, the East African Campaign pitted British, Belgian, and Portuguese forces against German colonial troops under Lettow-Vorbeck, tying down Allied resources until the war's end.",
        imageUrl: "https://images.pexels.com/photos/28476/pexels-photo-28476.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/East_African_campaign_(World_War_I)",
        tags: ["WWI", "East Africa", "1914"]
      },
      {
        id: "wwii-east-africa",
        title: "WWII East African Campaign",
        date: "June 1940–November 1941",
        year: 1940,
        shortDescription: "Allied victory over Italian forces in East Africa.",
        description: "Between 1940 and 1941, British and Commonwealth troops defeated Italian forces in Ethiopia, Eritrea, and Somaliland, securing critical Red Sea supply routes.",
        imageUrl: "https://images.pexels.com/photos/62622/pexels-photo-62622.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/East_African_campaign_(World_War_II)",
        tags: ["WWII", "East Africa", "1940"]
      },
      {
        id: "rwandan-genocide",
        title: "Rwandan Genocide",
        date: "April 7–July 19, 1994",
        year: 1994,
        shortDescription: "Mass killings targeting Tutsi and moderate Hutu carried out over 100 days.",
        description: "From April to July 1994, extremist militias imposed a campaign of mass violence that resulted in 500,000–800,000 deaths, ending when the RPF captured Kigali on July 19.",
        imageUrl: "https://images.pexels.com/photos/250701/pexels-photo-250701.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Rwandan_genocide",
        tags: ["Rwanda", "1994", "Genocide"]
      }
    ]
  },
  {
    id: "influential-figures",
    name: "Influential Figures",
    events: [
      {
        id: "mandela",
        title: "Nelson Mandela",
        date: "1918–2013",
        year: 1918,
        shortDescription: "Anti‑apartheid leader and first Black President of South Africa.",
        description: "Nelson Mandela led the struggle against apartheid, was imprisoned for 27 years, then became South Africa's first Black president (1994–1999) and a global symbol of reconciliation.",
        imageUrl: "https://images.pexels.com/photos/3308892/pexels-photo-3308892.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Nelson_Mandela",
        tags: ["Mandela", "South Africa", "Apartheid"]
      },
      {
        id: "selassie",
        title: "Haile Selassie I",
        date: "1892–1975",
        year: 1892,
        shortDescription: "Emperor of Ethiopia who modernized and championed African unity.",
        description: "Haile Selassie I modernized Ethiopia's institutions, led resistance to Italian invasion, and was a founding figure of the Organisation of African Unity in 1963.",
        imageUrl: "https://images.pexels.com/photos/2467285/pexels-photo-2467285.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Haile_Selassie",
        tags: ["Selassie", "Ethiopia", "Emperor"]
      },
      {
        id: "nkrumah",
        title: "Kwame Nkrumah",
        date: "1909–1972",
        year: 1909,
        shortDescription: "Leader of Ghanaian independence and Pan‑Africanist thinker.",
        description: "Kwame Nkrumah led Ghana to independence in 1957, served as its first Prime Minister and President, and was a leading advocate of Pan‑African unity.",
        imageUrl: "https://images.pexels.com/photos/104521/pexels-photo-104521.jpeg?auto=compress&cs=tinysrgb&w=800",
        detailsUrl: "https://en.wikipedia.org/wiki/Kwame_Nkrumah",
        tags: ["Nkrumah", "Ghana", "Pan-Africanism"]
      }
    ]
  }
];