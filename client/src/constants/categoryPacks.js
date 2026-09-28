export const CATEGORY_PACKS = [
  {
    id: "classic",
    name: "Classic",
    icon: "🎯",
    description: "Name · Place · Thing · Animal · Food",
    categories: [
      { key: "name", label: "Name", placeholder: "Enter a name" },
      { key: "place", label: "Place", placeholder: "Enter a place" },
      { key: "thing", label: "Thing", placeholder: "Enter a thing" },
      { key: "animal", label: "Animal", placeholder: "Enter an animal" },
      { key: "food", label: "Food", placeholder: "Enter a food" },
    ],
  },
  {
    id: "india",
    name: "India",
    icon: "🇮🇳",
    description: "Indian people, places, culture & food",
    categories: [
      { key: "name", label: "Person", placeholder: "Enter a person's name" },
      { key: "place", label: "Indian Place", placeholder: "Enter an Indian place" },
      { key: "thing", label: "Indian Thing", placeholder: "Enter a cultural thing" },
      { key: "animal", label: "Animal", placeholder: "Enter an animal" },
      { key: "food", label: "Indian Food", placeholder: "Enter Indian food" },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    description: "Actors, movies, characters, games & brands",
    categories: [
      { key: "name", label: "Actor / Actress", placeholder: "Enter a performer" },
      { key: "place", label: "Movie", placeholder: "Enter a movie" },
      { key: "thing", label: "Character", placeholder: "Enter a character" },
      { key: "animal", label: "Game", placeholder: "Enter a game" },
      { key: "food", label: "Brand", placeholder: "Enter a brand" },
    ],
  },
  {
    id: "tech",
    name: "Tech",
    icon: "💻",
    description: "Developers, companies, tech, languages & tools",
    categories: [
      { key: "name", label: "Developer", placeholder: "Enter a developer" },
      { key: "place", label: "Company", placeholder: "Enter a tech company" },
      { key: "thing", label: "Technology", placeholder: "Enter a technology" },
      { key: "animal", label: "Language", placeholder: "Enter a programming language" },
      { key: "food", label: "Tool", placeholder: "Enter a tech tool" },
    ],
  },
];

export function getCategoryPack(packId) {
  return CATEGORY_PACKS.find((pack) => pack.id === packId) || CATEGORY_PACKS[0];
}
