const { after, before, beforeEach, describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const { app, Note, mongoose } = require("./index");

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  await Note.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("notes api", () => {
  it("creates and lists notes", async () => {
    const createResponse = await request(app)
      .post("/api/notes")
      .send({ title: "Ship app", content: "Build, test, deploy" })
      .expect(201);

    assert.equal(createResponse.body.title, "Ship app");

    const listResponse = await request(app).get("/api/notes").expect(200);

    assert.equal(listResponse.body.length, 1);
    assert.equal(listResponse.body[0].content, "Build, test, deploy");
  });

  it("updates and deletes a note", async () => {
    const note = await Note.create({ title: "Old", content: "Draft" });

    const updateResponse = await request(app)
      .put(`/api/notes/${note._id}`)
      .send({ title: "Updated", content: "Done" })
      .expect(200);

    assert.equal(updateResponse.body.title, "Updated");

    await request(app).delete(`/api/notes/${note._id}`).expect(204);

    const remaining = await Note.find();
    assert.equal(remaining.length, 0);
  });
});
