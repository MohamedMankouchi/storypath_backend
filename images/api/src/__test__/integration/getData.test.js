const request = require("supertest");
const app = require("./../../app");
describe("GET /", () => {
  test("Returns the storypath data", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
  });
});
