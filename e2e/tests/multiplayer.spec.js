const { test, expect } = require("@playwright/test");

test("two browsers can create, join and complete a multiplayer round", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();

  await host.goto("/");
  await host.getByRole("link", { name: "CREATE ROOM" }).click();
  await host.getByLabel("YOUR NAME").fill("Host");
  await host.getByRole("button", { name: "CREATE ROOM" }).click();

  await expect(host).toHaveURL(/\/waiting-room/);
  const roomCode = (await host.locator(".code-box strong").textContent()).trim();
  expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

  await guest.goto("/join-room");
  await guest.getByLabel("YOUR NAME").fill("Guest");
  await guest.getByLabel("ROOM CODE").fill(roomCode);
  await guest.getByRole("button", { name: "JOIN ROOM" }).click();

  await expect(guest).toHaveURL(/\/waiting-room/);
  await expect(host.locator(".player-list .player-card")).toHaveCount(2);

  await host.getByRole("button", { name: "START GAME" }).click();
  await expect(host).toHaveURL(/\/game/);
  await expect(guest).toHaveURL(/\/game/);

  const letter = (await host.locator(".letter").textContent()).trim();
  for (const field of ["name", "place", "thing", "animal", "food"]) {
    await host.locator("#" + field).fill(letter + field);
    await guest.locator("#" + field).fill(letter + field);
  }

  await host.getByRole("button", { name: "SUBMIT ANSWERS" }).click();
  await guest.getByRole("button", { name: "SUBMIT ANSWERS" }).click();

  await expect(host).toHaveURL(/\/round-result/);
  await expect(guest).toHaveURL(/\/round-result/);
  await expect(host.getByText("5 / 5 correct")).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
