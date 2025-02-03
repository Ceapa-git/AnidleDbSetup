console.time("Execution Time");

import { MongoClient } from "mongodb";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.DATABASE_URL);
await client.connect();
const db = client.db(process.env.DATABASE);

const anime = db.collection("anime");
anime.deleteMany({});
const genresDb = db.collection("genres");
genresDb.deleteMany({});
const studiosDb = db.collection("studios");
studiosDb.deleteMany({});

let i = 1;
const step = 500;
// const aditional = [];
const genres = {};
const studios = {};

const sanitizedData = [];

let first = true;

for (; i <= 6000; i = i + step) {
  const fileName = `${i}-${i + step - 1}.json`;
  console.log(fileName);

  const file = JSON.parse(await readFile(fileName, "utf8"));
  const data = file["data"];

  for (const entryNode of data) {
    const entry = entryNode["node"];
    const sanitized = {};

    sanitized["title"] = entry["title"];
    sanitized["title_en"] = entry["alternative_titles"]["en"];
    sanitized["titles"] = [];
    sanitized["titles"].push(
      entry["title"],
      entry["alternative_titles"]["en"],
      ...entry["alternative_titles"]["synonyms"],
    );

    sanitized["image"] = entry["main_picture"]["medium"];
    sanitized["year"] = entry["start_date"].split("-")[0];
    sanitized["description"] = entry["synopsis"];
    sanitized["score"] = entry["mean"];
    sanitized["source"] = entry["source"];

    sanitized["genres"] = [];
    try {
      for (const genre of entry["genres"]) {
        let id;
        if (genres.hasOwnProperty(genre["name"])) {
          id = genres[genre["name"]];
        } else {
          const insertId = await genresDb.insertOne({ name: genre["name"] });
          id = insertId.insertedId;
          genres[genre["name"]] = id;
        }
        sanitized["genres"].push(id);
      }
    } catch (e) {
      console.log(sanitized);
    }

    sanitized["studios"] = [];
    try {
      for (const studio of entry["studios"]) {
        let id;
        if (studios.hasOwnProperty(studio["name"])) {
          id = studios[studio["name"]];
        } else {
          const insertId = await studiosDb.insertOne({ name: studio["name"] });
          id = insertId.insertedId;
          studios[studio["name"]] = id;
        }
        sanitized["studios"].push(id);
      }
    } catch (e) {
      console.log(sanitized);
    }

    sanitized["lastUpdated"] = new Date();

    if (first) console.log(sanitized);
    first = false;
    sanitizedData.push(sanitized);
  }
}
await anime.insertMany(sanitizedData);
client.close();

console.timeEnd("Execution Time");
