const request = require("supertest");
const app = require("./../../app");

const { MongoClient } = require("mongodb");

describe("DELETE /scenario/:id", () => {
  const client = new MongoClient(process.env.MONGO_URL);
  const db = client.db("Leerpaden").collection("data");
  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    // Close the database connection
    await client.close();
  });

  beforeEach(async () => {
    // Insert test data into the database before each test
    const testData = {
      id: 30,
      name: "Scenario 1",
    };
    await db.updateOne({}, { $push: { scenarios: testData } });
  });

  test("should delete a scenario and return success message", async () => {
    const scenarioIdToDelete = 30;

    // Make a request to the endpoint using supertest
    const response = await request(app).delete(
      `/scenario/${scenarioIdToDelete}`
    );

    // Check the response status code
    expect(response.status).toBe(200);

    // Check the response body for the success message
    expect(response.body).toEqual({
      message: "Scenario verwijderd",
      status: 200,
    });
  });
});
