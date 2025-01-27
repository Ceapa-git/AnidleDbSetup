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

let i = 1;
const step = 500;
// const aditional = [];
const genres = {};
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

      if (first) console.log(sanitized);
      first = false;
      sanitizedData.push(sanitized);
    } catch (e) {
      console.log(sanitized);
    }
  }
}
await anime.insertMany(sanitizedData);
client.close();

console.timeEnd("Execution Time");
