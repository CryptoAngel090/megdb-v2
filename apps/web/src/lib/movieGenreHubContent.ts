interface GenreFaqItem {
  question: string
  answer: string
}

interface MovieGenreHubContent {
  intro: string
  categoryExplainer: string
  differentiators: string[]
  subgenres: string[]
  relatedGenreSlugs: string[]
  relatedFranchises: string[]
  faq: GenreFaqItem[]
}

type GenreProfile = {
  introFrame: string
  explainerFrame: string
  differentiators: string[]
  subgenres: string[]
  relatedGenreSlugs: string[]
  relatedFranchises: string[]
  faq: GenreFaqItem[]
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
  action: {
    introFrame:
      '{genre} movies are built around momentum: physical conflict, escalating stakes, and tactical decision-making under pressure.',
    explainerFrame:
      'This hub maps how {genre} spans grounded combat stories and spectacle-heavy franchises while preserving kinetic storytelling as the core.',
    differentiators: [
      'Versus thriller: action externalizes conflict through visible confrontation.',
      'Versus adventure: action favors tactical collision over exploration-first quest structure.',
      'Versus crime: legal/moral systems may matter, but execution pressure drives scene design.',
    ],
    subgenres: [
      'Military action',
      'Spy action',
      'Martial arts action',
      'Action-comedy',
      'Superhero action',
      'Post-apocalyptic action',
    ],
    relatedGenreSlugs: ['thriller', 'adventure', 'crime', 'sci-fi'],
    relatedFranchises: [
      'Mission: Impossible',
      'John Wick',
      'The Fast Saga',
      'Mad Max',
      'The Matrix',
    ],
    faq: [
      {
        question: 'What is usually considered an action movie?',
        answer:
          'Sustained physical stakes, pursuit/combat sequences, and plot movement through direct confrontation.',
      },
    ],
  },
  adventure: {
    introFrame:
      '{genre} organizes stories around discovery, traversal, and mission progression across unknown spaces or systems.',
    explainerFrame:
      'This hub separates exploration-led {genre} from pure action by focusing on journey logic, world expansion, and quest structure.',
    differentiators: [
      'Versus action: adventure can include set pieces, but progression and exploration remain primary.',
      'Versus fantasy: fantastical settings are optional; narrative engine is the expedition arc.',
      'Versus drama: stakes are often external and route-based rather than purely interpersonal.',
    ],
    subgenres: ['Treasure hunt', 'Survival adventure', 'Historical adventure', 'Sci-fi adventure'],
    relatedGenreSlugs: ['action', 'fantasy', 'sci-fi', 'family'],
    relatedFranchises: ['Indiana Jones', 'Pirates of the Caribbean', 'Jumanji'],
    faq: [
      {
        question: 'Does adventure always mean family-friendly?',
        answer:
          'No. Adventure can range from all-ages quests to mature survival narratives depending on tone and stakes.',
      },
    ],
  },
  animation: {
    introFrame:
      '{genre} is a medium-driven category where performance, mood, and world design are authored frame by frame.',
    explainerFrame:
      'This hub focuses on storytelling patterns in {genre} across family, fantasy, and mature titles rather than treating animation as one audience segment.',
    differentiators: [
      'Versus family: animation can target children, teens, or adults; audience is not fixed.',
      'Versus fantasy: visual invention may overlap, but animation describes production form.',
      'Versus comedy/drama: tone varies widely; medium does not prescribe genre intent.',
    ],
    subgenres: ['Animated fantasy', 'Anime features', 'Animated comedy', 'Stop-motion'],
    relatedGenreSlugs: ['family', 'fantasy', 'comedy', 'adventure'],
    relatedFranchises: ['Toy Story', 'Shrek', 'How to Train Your Dragon'],
    faq: [
      {
        question: 'Is animation a genre or a format?',
        answer:
          'Primarily a format/medium, but in discovery systems it functions as a practical category for user intent.',
      },
    ],
  },
  comedy: {
    introFrame:
      '{genre} is calibrated around timing, social contrast, and character-driven friction that resolves through humor.',
    explainerFrame:
      'This hub distinguishes broad and satirical {genre} forms while showing where comedy fuses with romance, action, and drama.',
    differentiators: [
      'Versus drama: emotional arcs can be shared, but comic framing determines beat design.',
      'Versus romance: relationship stories may appear, yet humor remains the dominant delivery mode.',
      'Versus action-comedy hybrids: spectacle supports tone instead of replacing it.',
    ],
    subgenres: ['Dark comedy', 'Rom-com', 'Buddy comedy', 'Satire', 'Workplace comedy'],
    relatedGenreSlugs: ['romance', 'drama', 'family', 'action'],
    relatedFranchises: ['The Hangover', 'Bridget Jones', 'Jump Street'],
    faq: [
      {
        question: 'How is dark comedy categorized?',
        answer:
          'By intent: if humor is the primary framing device, dark subject matter can still classify as comedy.',
      },
    ],
  },
  crime: {
    introFrame:
      '{genre} centers systems of law, power, and transgression, tracking choices across institutions and underground networks.',
    explainerFrame:
      'This hub maps procedural, heist, and underworld branches of {genre}, including overlaps with thriller and drama.',
    differentiators: [
      'Versus thriller: crime emphasizes network logic and criminal/legal systems over pure suspense.',
      'Versus action: violence may occur, but strategic/legal consequence is usually foregrounded.',
      'Versus mystery: puzzle-solving can exist, yet power dynamics and moral compromise dominate.',
    ],
    subgenres: ['Heist', 'Gangster', 'Police procedural', 'Courtroom crime'],
    relatedGenreSlugs: ['thriller', 'drama', 'mystery', 'action'],
    relatedFranchises: ['The Godfather', 'Ocean’s', 'Sicario'],
    faq: [
      {
        question: 'Are detective movies always crime films?',
        answer:
          'Often yes, but some detective stories are mystery-first without strong institutional crime framing.',
      },
    ],
  },
  documentary: {
    introFrame:
      '{genre} is evidence-led storytelling that organizes real events, people, and systems into an authored perspective.',
    explainerFrame:
      'This hub differentiates observational, investigative, and biographical {genre} modes while preserving factual-context intent.',
    differentiators: [
      'Versus drama: documentaries prioritize factual sourcing over fictional narrative construction.',
      'Versus history: historical documentaries are one branch; many focus on contemporary systems.',
      'Versus biography films: documentaries use archival/interview evidence rather than dramatized reenactment.',
    ],
    subgenres: ['Investigative', 'Nature', 'Music documentary', 'Political documentary'],
    relatedGenreSlugs: ['history', 'music', 'drama'],
    relatedFranchises: ['Planet Earth', 'The Last Dance', 'Ken Burns Collections'],
    faq: [
      {
        question: 'Can documentaries still be subjective?',
        answer:
          'Yes. Documentary craft includes editorial choices; the distinction is factual grounding, not perfect neutrality.',
      },
    ],
  },
  drama: {
    introFrame:
      '{genre} prioritizes character transformation, social context, and emotional consequence over spectacle-first mechanics.',
    explainerFrame:
      'This hub covers performance-led {genre} across historical, legal, family, and social narratives where interior stakes shape pacing.',
    differentiators: [
      'Versus thriller/action: tension may be present, but emotional causality dominates pacing.',
      'Versus romance: relationships can drive plot, yet drama is broader than couple-centered arcs.',
      'Versus history: historical setting is optional; character consequence is central.',
    ],
    subgenres: ['Family drama', 'Legal drama', 'Social drama', 'Coming-of-age'],
    relatedGenreSlugs: ['crime', 'romance', 'history', 'thriller'],
    relatedFranchises: ['Before Trilogy', 'Manchester by the Sea (related works)'],
    faq: [
      {
        question: 'Why is drama such a broad label?',
        answer:
          'It is a foundational mode covering many settings; intent and emotional architecture are the key classifiers.',
      },
    ],
  },
  family: {
    introFrame:
      '{genre} is audience-calibrated for shared viewing, balancing accessibility with emotional and narrative clarity.',
    explainerFrame:
      'This hub maps all-ages {genre} across animation, fantasy, and adventure while preserving safety/tone expectations for co-viewing.',
    differentiators: [
      'Versus animation: many family films are animated, but live-action family titles are common too.',
      'Versus comedy: humor helps, yet family classification is driven by audience suitability.',
      'Versus adventure: adventure plots may appear, but tonal safety remains a key requirement.',
    ],
    subgenres: ['Family adventure', 'Family fantasy', 'Holiday family', 'Animated family'],
    relatedGenreSlugs: ['animation', 'adventure', 'fantasy', 'comedy'],
    relatedFranchises: ['Paddington', 'Harry Potter', 'Home Alone'],
    faq: [
      {
        question: 'Is family the same as kids-only?',
        answer:
          'Not necessarily. Family titles are designed for cross-age viewing and often include multi-layered tone.',
      },
    ],
  },
  fantasy: {
    introFrame:
      '{genre} builds stories on non-realist world rules: magic systems, mythic structures, and symbolic conflict.',
    explainerFrame:
      'This hub tracks epic and intimate {genre} forms, from high fantasy to urban myth, with attention to world-rule coherence.',
    differentiators: [
      'Versus sci-fi: fantasy derives logic from myth/magic rather than speculative science.',
      'Versus adventure: quests are common, but fantastical ontology is the defining signal.',
      'Versus horror: supernatural elements may overlap, yet fear is not always the dominant emotional target.',
    ],
    subgenres: ['High fantasy', 'Urban fantasy', 'Dark fantasy', 'Mythic fantasy'],
    relatedGenreSlugs: ['adventure', 'sci-fi', 'family', 'horror'],
    relatedFranchises: ['The Lord of the Rings', 'Harry Potter', 'Narnia'],
    faq: [
      {
        question: 'Can fantasy be realistic in tone?',
        answer: 'Yes. Tone can be grounded while world rules remain non-realist.',
      },
    ],
  },
  history: {
    introFrame:
      '{genre} reconstructs past contexts through people, institutions, and turning points shaped by period constraints.',
    explainerFrame:
      'This hub separates event-led and character-led {genre} stories, including overlaps with war, drama, and biographical cinema.',
    differentiators: [
      'Versus drama: history foregrounds period context as structural narrative force.',
      'Versus documentary: historical fiction can dramatize while still anchoring in real frameworks.',
      'Versus war: conflict narratives are one subset; many historical films are political or social.',
    ],
    subgenres: [
      'Historical epic',
      'Biographical history',
      'Political period drama',
      'Historical war',
    ],
    relatedGenreSlugs: ['drama', 'war', 'documentary'],
    relatedFranchises: ['Napoleon-related films', 'WWII cycle films'],
    faq: [
      {
        question: 'How strict is historical accuracy for classification?',
        answer:
          'Classification is about setting and period framework; factual precision varies by title.',
      },
    ],
  },
  thriller: {
    introFrame:
      '{genre} is tension-first storytelling: uncertainty, risk escalation, and delayed reveals that keep viewers in a predictive mode.',
    explainerFrame:
      'This hub tracks how {genre} overlaps with crime, horror, and action while preserving suspense as the main dramatic engine.',
    differentiators: [
      'Versus action: thrillers emphasize anticipation and uncertainty more than spectacle.',
      'Versus horror: fear may exist, but thriller pressure comes from pursuit, deception, and consequence.',
      'Versus mystery: mystery asks "who/what happened", thriller asks "what happens next if we fail".',
    ],
    subgenres: [
      'Psychological thriller',
      'Conspiracy thriller',
      'Crime thriller',
      'Techno-thriller',
    ],
    relatedGenreSlugs: ['action', 'crime', 'mystery', 'horror'],
    relatedFranchises: ['Bourne', 'Se7en', 'Gone Girl', 'Zodiac'],
    faq: [
      {
        question: 'What makes a movie a thriller rather than just drama?',
        answer:
          'Sustained tension and forward risk. The plot is designed around pressure and decision points with visible consequences.',
      },
    ],
  },
  music: {
    introFrame:
      '{genre} builds narrative around performance, composition, and artist identity, often using sound as a primary story driver.',
    explainerFrame:
      'This hub distinguishes concert, biographical, and fiction-first {genre} films while keeping musical expression central.',
    differentiators: [
      'Versus drama: emotional arcs are often organized around performance milestones.',
      'Versus documentary: many music titles are factual, but narrative music films can be fully fictional.',
      'Versus romance/comedy: those tones may appear, yet music remains structural rather than decorative.',
    ],
    subgenres: ['Music biopic', 'Concert film', 'Musical drama', 'Band-formation stories'],
    relatedGenreSlugs: ['drama', 'documentary', 'romance'],
    relatedFranchises: ['A Star Is Born', 'Pitch Perfect'],
    faq: [
      {
        question: 'Is every musical movie in the music category?',
        answer:
          'Usually yes, but tagging may vary when another genre clearly dominates user intent.',
      },
    ],
  },
  mystery: {
    introFrame:
      '{genre} is puzzle-driven storytelling where information release timing and inference design shape viewer engagement.',
    explainerFrame:
      'This hub tracks investigative and puzzle-structure {genre} across crime and thriller overlaps without collapsing them into one bucket.',
    differentiators: [
      'Versus thriller: mystery centers solving unknowns, not only surviving immediate danger.',
      'Versus crime: mystery can be crime-based but may also focus on personal or historical puzzles.',
      'Versus horror: uncertainty may exist, yet mystery aims for explanation rather than dread-first response.',
    ],
    subgenres: ['Whodunit', 'Detective mystery', 'Neo-noir mystery', 'Locked-room mystery'],
    relatedGenreSlugs: ['thriller', 'crime', 'horror'],
    relatedFranchises: ['Knives Out', 'Sherlock Holmes', 'Poirot adaptations'],
    faq: [
      {
        question: 'Can a mystery have no crime?',
        answer:
          'Yes. Mystery can organize around identity, history, or disappearance without formal criminal framing.',
      },
    ],
  },
  romance: {
    introFrame:
      '{genre} is relationship-centered storytelling where emotional reciprocity and attachment progression organize narrative beats.',
    explainerFrame:
      'This hub follows {genre} arcs across comedy, drama, and period forms while preserving intimacy as the principal plot engine.',
    differentiators: [
      'Versus drama: romance narrows the emotional core to relational development.',
      'Versus comedy: humor can support tone, but romantic progression anchors structure.',
      'Versus fantasy/action hybrids: external stakes exist, yet connection arc remains central.',
    ],
    subgenres: ['Rom-com', 'Period romance', 'Melodrama romance', 'Young-adult romance'],
    relatedGenreSlugs: ['drama', 'comedy', 'fantasy'],
    relatedFranchises: ['Before Trilogy', 'Bridget Jones', 'To All the Boys'],
    faq: [
      {
        question: 'Do tragic love stories still count as romance?',
        answer:
          'Yes. Outcome can vary; the defining feature is relationship-centered narrative design.',
      },
    ],
  },
  'sci-fi': {
    introFrame:
      '{genre} explores speculative worlds, technologies, and systems, usually asking how change affects identity, society, or survival.',
    explainerFrame:
      'This hub separates idea-driven {genre} from fantasy and action-heavy hybrids so users can choose the tone they want.',
    differentiators: [
      'Versus fantasy: sci-fi grounds conflict in speculative science or future systems.',
      'Versus action: spectacle can be present, but premise and world rules lead the story.',
      'Versus drama: character arcs are shaped by a transformed environment or paradigm.',
    ],
    subgenres: ['Space opera', 'Cyberpunk', 'Dystopian sci-fi', 'Hard sci-fi', 'Time-loop sci-fi'],
    relatedGenreSlugs: ['action', 'thriller', 'adventure', 'fantasy'],
    relatedFranchises: ['Star Wars', 'Dune', 'Blade Runner', 'The Matrix'],
    faq: [
      {
        question: 'Does sci-fi always mean space movies?',
        answer:
          'No. Sci-fi can be near-future, grounded, or social. The key marker is speculative systems changing the rules of life.',
      },
    ],
  },
  horror: {
    introFrame:
      '{genre} centers fear mechanics: dread, vulnerability, and threat design that targets emotional and physiological response.',
    explainerFrame:
      'This hub helps separate terror-driven {genre} from thrillers and dark fantasy, where fear is present but not dominant.',
    differentiators: [
      'Versus thriller: horror prioritizes fear response over puzzle tension.',
      'Versus fantasy: supernatural elements may overlap, but horror frames them as threat.',
      'Versus drama: emotional realism can exist, yet fear architecture drives pacing.',
    ],
    subgenres: [
      'Supernatural horror',
      'Folk horror',
      'Body horror',
      'Slasher',
      'Psychological horror',
    ],
    relatedGenreSlugs: ['thriller', 'mystery', 'fantasy'],
    relatedFranchises: ['The Conjuring', 'Halloween', 'A Nightmare on Elm Street'],
    faq: [
      {
        question: 'What separates psychological horror from thriller?',
        answer:
          'Psychological horror still aims for dread and disturbance, not only suspense resolution.',
      },
    ],
  },
  war: {
    introFrame:
      '{genre} depicts conflict systems at scale, linking combat, command, and civilian consequence across strategic layers.',
    explainerFrame:
      'This hub separates frontline, political, and survival branches of {genre}, including overlap with history and drama.',
    differentiators: [
      'Versus action: war stories emphasize operational context and institutional stakes.',
      'Versus history: many war films are historical, but war classification is conflict-structure specific.',
      'Versus thriller: tension exists, yet military/civil conflict framing remains primary.',
    ],
    subgenres: ['Combat war', 'Anti-war drama', 'War biopic', 'Resistance stories'],
    relatedGenreSlugs: ['history', 'drama', 'action'],
    relatedFranchises: ['Band of Brothers universe', 'All Quiet on the Western Front adaptations'],
    faq: [
      {
        question: 'Are all military action films war films?',
        answer:
          'No. War classification usually requires broader conflict-system framing, not isolated operations.',
      },
    ],
  },
  western: {
    introFrame:
      '{genre} stages frontier-era conflict through territory, law-formation, and personal code under institutional scarcity.',
    explainerFrame:
      'This hub covers classic and revisionist {genre} forms, from frontier myth to modern deconstruction.',
    differentiators: [
      'Versus action: western conflict is tied to frontier social order and land/power structures.',
      'Versus drama: character arcs are strongly shaped by genre iconography and frontier code.',
      'Versus history: western may use historical setting but often operates through mythic stylization.',
    ],
    subgenres: ['Classic western', 'Revisionist western', 'Spaghetti western', 'Neo-western'],
    relatedGenreSlugs: ['action', 'drama', 'history'],
    relatedFranchises: ['Dollars Trilogy', 'Django cycle', 'The Magnificent Seven'],
    faq: [
      {
        question: 'What is a neo-western?',
        answer:
          'A contemporary setting that preserves western conflict patterns, moral codes, and territorial pressure.',
      },
    ],
  },
}

const DEFAULT_PROFILE: GenreProfile = {
  introFrame:
    '{genre} movies share a recognizable storytelling contract: specific pacing, tone, and conflict patterns audiences expect.',
  explainerFrame:
    'This hub gives editorial context for {genre}: category boundaries, overlap zones, and practical entry points for discovery.',
  differentiators: [
    'Genre identity is determined by dominant storytelling intent, not just isolated scenes.',
    'Cross-genre overlap is common, but this hub prioritizes titles where the category signal remains primary.',
  ],
  subgenres: [
    'Classical era titles',
    'Modern mainstream',
    'Hybrid crossovers',
    'Experimental edge cases',
  ],
  relatedGenreSlugs: ['drama', 'thriller', 'adventure'],
  relatedFranchises: ['Mission: Impossible', 'James Bond', 'The Fast Saga'],
  faq: [
    {
      question: 'How do you decide if a film belongs to this genre?',
      answer:
        'We prioritize dominant narrative function and audience expectation over single-scene elements.',
    },
  ],
}

function fillFrame(frame: string, genreName: string): string {
  return frame.replaceAll('{genre}', genreName)
}

function fallbackContent(genreSlug: string, genreName: string): MovieGenreHubContent {
  const profile = GENRE_PROFILES[genreSlug] ?? DEFAULT_PROFILE
  return {
    intro: fillFrame(profile.introFrame, genreName),
    categoryExplainer: fillFrame(profile.explainerFrame, genreName),
    differentiators: profile.differentiators.map((item) => fillFrame(item, genreName)),
    subgenres: profile.subgenres,
    relatedGenreSlugs: profile.relatedGenreSlugs,
    relatedFranchises: profile.relatedFranchises,
    faq: [
      ...profile.faq,
      {
        question: `Can one movie be ${genreName} and another genre at the same time?`,
        answer:
          'Yes. Multi-genre labels are normal; hub classification is based on which genre function is strongest in the overall narrative.',
      },
    ],
  }
}

export function getMovieGenreHubContent(
  genreSlug: string,
  genreName: string
): MovieGenreHubContent {
  return fallbackContent(genreSlug, genreName)
}
