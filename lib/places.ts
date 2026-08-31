export type Place = {
  id: string;
  slug: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  type: "Bouldering" | "Rebklatring" | "Udendørs" | "Andet";
  image: string;
  imageAlt: string;
};

export const places: Place[] = [
  ["gym-13", "boulders-aalborg", "Boulders Aalborg", "Skjernvej 4D", "9220", "Aalborg"],
  ["gym-11", "boulders-aarhus-aaby", "Boulders Aarhus Aaby", "Søren Frichs Vej 54", "8230", "Aarhus"],
  ["gym-1", "boulders-aarhus-city", "Boulders Aarhus City", "Ankersgade 12", "8000", "Aarhus"],
  ["gym-3", "boulders-aarhus-nord", "Boulders Aarhus Nord", "Graham Bells Vej 18A", "8200", "Aarhus"],
  ["gym-4", "boulders-aarhus-syd", "Boulders Aarhus Syd", "Søren Nymarks Vej 6A", "8270", "Aarhus"],
  ["gym-9", "boulders-amager", "Boulders Amager", "Amager Landevej 233", "2770", "København"],
  ["gym-8", "boulders-hvidovre", "Boulders Hvidovre", "Strandmarksvej 20", "2650", "København"],
  ["gym-6", "boulders-kbh-sydhavn", "Boulders KBH Sydhavn", "Bådehavnsgade 38", "2450", "København"],
  ["gym-5", "boulders-odense", "Boulders Odense", "Wichmandsgade 11", "5000", "Odense"],
  ["gym-7", "boulders-valby", "Boulders Valby", "Vigerslev Allé 47", "2500", "København"],
  ["gym-12", "boulders-vanloese", "Boulders Vanløse", "Vanløse Torv 1, Kronen Vanløse", "2720", "København"],
].map(([id, slug, name, street, postalCode, city]) => ({ id, slug, name, street, postalCode, city, type: "Bouldering", image: "/images/nordic-boulder.png", imageAlt: `Bouldering hos ${name}` } as Place));

export function placeBySlug(slug: string) { return places.find(place => place.slug === slug); }
export function placeById(id: string) { return places.find(place => place.id === id); }
export function mapUrl(place: Place) { return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.street}, ${place.postalCode} ${place.city}`)}`; }
