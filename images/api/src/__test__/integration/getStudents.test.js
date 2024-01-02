const request = require("supertest");
const app = require("../../app");
describe("GET /students", () => {
  test("Returns all students", async () => {
    const response = await request(app).get("/students");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Object);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
