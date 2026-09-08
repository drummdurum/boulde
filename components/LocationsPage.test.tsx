import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ClimbingLocation } from "@/types";
import { LocationsPage } from "./LocationsPage";

const location: ClimbingLocation = {
  id: "test-location",
  name: "Testhallen",
  region: "Hovedstaden",
  address: "Testvej 1, København",
  hours: "10–22",
  hoursNote: "hver dag",
  status: "open",
  type: "Bouldering",
  chain: "Test",
  country: "Danmark",
  imageUrl: "https://example.com/test.jpg",
  mapsUrl: "https://maps.example.com",
};

describe("LocationsPage", () => {
  afterEach(cleanup);

  it("viser en tydelig handling, der åbner stedets detaljeside", () => {
    render(<LocationsPage locations={[location]} />);

    const locationLink = screen.getByRole("link", { name: /Testhallen.*Læs mere/i });
    expect(locationLink).toHaveAttribute("href", "/klatresteder/test-location");
    expect(screen.queryByText("Åben")).not.toBeInTheDocument();
  });
});
