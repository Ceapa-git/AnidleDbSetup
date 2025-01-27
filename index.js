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

let i = 1;
const step = 500;
// const aditional = [];
const sanitizedData = [];

for (; i <= 6000; i = i + step) {
  const fileName = `${i}-${i + step - 1}.json`;
  console.log(fileName);

  const file = JSON.parse(await readFile(fileName, "utf8"));
  const data = file["data"];

  data.forEach((entryNode, index) => {
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
    if (i === 1 && index === 0) console.log(sanitized);

    sanitizedData.push(sanitized);
  });
}
await anime.insertMany(sanitizedData);
client.close();

console.timeEnd("Execution Time");
