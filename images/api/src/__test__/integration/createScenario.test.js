const request = require("supertest");
const app = require("./../../app");

const { MongoClient } = require("mongodb");

describe("POST /scenario", () => {
  const client = new MongoClient(process.env.MONGO_URL);
  const db = client.db("Leerpaden").collection("data");

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    // Close the database connection and remove test data
    await db.updateOne({}, { $pull: { scenarios: { id: 30 } } });
    await client.close();
  });

  test("should create a scenario and return success message", async () => {
    const newScenario = {
      id: 30,
      title: "TEST",
      description: "TEST",
      steps: [
        {
          step: 1,
          title: "Startscene",
          description:
            "Hier kan je een mogelijke beschrijving plaatsen van deze stap",
          videoId: "py53-Lz2aS0",
          titleChoiceA: "Iedereen ligt 's nachts wel eens wakker",
          videoIdChoiceA: "IvTLE25AzeQ",
          titleChoiceB: "Te oud voor geworden?",
          videoIdChoiceB: "mwPB8T30EFU",
          feedbackA: {
            correct: false,
            explanation:
              "In communicatie zijn er verschillende veelgemaakte fouten: verbloemen, minimaliseren, verrechtvaardigen/rationaliseren, over eigen ervaringen praten, in discussie gaan, zorgvrager een oplossing opdringen, negeren van gevoelens",
          },
          feedbackB: {
            correct: true,
            explanation:
              "Zorgverlener gebruikt hier 'echoën' als gespreksvaardigheid en stimuleert op die manier de zorgvrager om verder te praten.   Het gesprek is net gestart waardoor je nog niet veel informatie hebt. Door bij de woorden van de zorgvrager te blijven, wordt de zorgvrager uitgedaagd om verder te vertellen enerzijds en voorkom je eigen invulling anderzijds.",
          },
        },
        {
          step: 2,
          title: "Vervolg scene 1",
          description:
            "Hier kan je een mogelijke beschrijving plaatsen van deze stap",
          videoId: "py53-Lz2aS0",
          titleChoiceA: "Bedoel je dan dat je pijn hebt 's nachts?",
          videoIdChoiceA: "IvTLE25AzeQ",
          titleChoiceB:
            "Met ouder worden, worden de kwaaltjes er ook niet minder op natuurlijk.",
          videoIdChoiceB: "mwPB8T30EFU",
          feedbackA: {
            correct: true,
            explanation:
              "Zorgverlener vraagt door aan de hand van een gesloten vragen. Op die manier maakt ze de boodschap van de zorgvrager concreet + checkt ze of ze de boodschap goed begrepen heeft + eventueel kan de zorgvrager hier nog meer over vertellen.",
          },
          feedbackB: {
            correct: false,
            explanation:
              "Zorgverlener maakt de fout van het verrechtvaardigen/rationaliseren. Hierbij geeft de zorgverlener een rationele verklaring voor de ervaring van de zorgvrager. Het effect is echter dat de zorgvrager zich niet gehoord voelt, zich niet ernstig genomen voelt en het gesprek stilvalt.",
          },
        },
        {
          step: 3,
          title: "Vervolg scene 2",
          description:
            "Hier kan je een mogelijke beschrijving plaatsen van deze stap",
          videoId: "py53-Lz2aS0",
          titleChoiceA: "Oei, hoe bedoel je dat?",
          videoIdChoiceA: "IvTLE25AzeQ",
          titleChoiceB:
            "Het is niet omdat je ouder wordt dat het leven geen zin meer heeft.",
          videoIdChoiceB: "mwPB8T30EFU",
          feedbackA: {
            correct: true,
            explanation:
              "Zorgverlener geeft een korte, echte reactie ('oei') en vraagt door aan de hand van een open vraag. Op die manier nodigt ze de zorgvrager uit om meer te vertellen en creëert ze een goede zorgrelatie.",
          },
          feedbackB: {
            correct: false,
            explanation:
              "Zorgverlener maakt de fout van het in discussie gaan. Ze gaat in discussie met de zorgvrager over diens ervaring en bepaalt voor de zorgvrager hoe ze zich mag/moet voelen of wat ze mag/moet ervaren. Het effect is echter dat de zorgvrager zich niet gehoord voelt, zich niet erkend voelt in haar beleving en het gesprek stilvalt. Zorgverlener negeert de psychosociale achtergrond van de zorgvrager.",
          },
        },
      ],
      final: {
        videoId: "py53-Lz2aS0",
        paragraphs: "TEST",
      },
    };

    // Make a request to the endpoint using supertest
    const response = await request(app).post("/scenario").send(newScenario);

    // Check the response status code
    expect(response.status).toBe(200);

    // Check the response body for the success message
    expect(response.body).toEqual({
      message: "Scenario gemaakt",
      status: 200,
    });
  });

  test("should handle missing fields gracefully", async () => {
    // Make a request to the endpoint using supertest without sending the body
    const response = await request(app).post("/scenario");

    // Check the response status code for a bad request
    expect(response.status).toBe(400);

    // Check the response body for the error message
    expect(response.body).toEqual({
      error: "Gelieve de ontbrekende velden in te vullen",
    });
  });
});
