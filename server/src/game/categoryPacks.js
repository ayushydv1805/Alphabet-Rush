const CATEGORY_PACKS = {
  classic: {
    id: "classic",
    name: "Classic",
    icon: "🎯",
    description: "Name · Place · Thing · Animal · Food",
    categories: [
      { key: "name", label: "Name", semantic: "a real person's name" },
      { key: "place", label: "Place", semantic: "a real geographic place" },
      { key: "thing", label: "Thing", semantic: "a tangible object, item, product, or ordinary thing" },
      { key: "animal", label: "Animal", semantic: "an animal, species, or recognized breed" },
      { key: "food", label: "Food", semantic: "a food, dish, ingredient, fruit, vegetable, snack, or beverage" },
    ],
  },
  india: {
    id: "india",
    name: "India",
    icon: "🇮🇳",
    description: "Indian people, places, culture & food",
    categories: [
      { key: "name", label: "Person", semantic: "a real person's name, especially an Indian name" },
      { key: "place", label: "Indian Place", semantic: "a real place in India, including city, town, village, state, region, landmark, river or other geographic feature" },
      { key: "thing", label: "Indian Thing", semantic: "an Indian product, object, cultural item, garment, instrument, vehicle, tradition item, or everyday thing strongly associated with India" },
      { key: "animal", label: "Animal", semantic: "an animal, species, or recognized breed" },
      { key: "food", label: "Indian Food", semantic: "an Indian food, dish, ingredient, snack, sweet, fruit, vegetable, or beverage" },
    ],
  },
  entertainment: {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    description: "Actors, movies, characters, games & brands",
    categories: [
      { key: "name", label: "Actor / Actress", semantic: "a real actor or actress" },
      { key: "place", label: "Movie", semantic: "a real feature film or commonly known movie title" },
      { key: "thing", label: "Character", semantic: "a fictional character from a movie, series, comic, book, game, or story" },
      { key: "animal", label: "Game", semantic: "a real video game, board game, card game, sport game, or recognizable game title" },
      { key: "food", label: "Brand", semantic: "a real consumer, entertainment, technology, fashion, food, or product brand" },
    ],
  },
  tech: {
    id: "tech",
    name: "Tech",
    icon: "💻",
    description: "Developers, companies, tech, languages & tools",
    categories: [
      { key: "name", label: "Developer", semantic: "a real software developer, programmer, engineer, researcher, or notable technology person" },
      { key: "place", label: "Company", semantic: "a real technology, software, hardware, cloud, or internet company" },
      { key: "thing", label: "Technology", semantic: "a real technology, protocol, platform, hardware product, device, or technical concept" },
      { key: "animal", label: "Language", semantic: "a real programming language" },
      { key: "food", label: "Tool", semantic: "a real developer tool, framework, library, IDE, database, package manager, or command-line tool" },
    ],
  },
};

function getCategoryPackConfig(packId) {
  return CATEGORY_PACKS[packId] || CATEGORY_PACKS.classic;
}

module.exports = { CATEGORY_PACKS, getCategoryPackConfig };
