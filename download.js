import { writeFileSync } from "fs";

async function getTop500(offset) {
  const url =
    `${process.env.MAL_URL}/anime/ranking?` +
    `/anime/ranking?` +
    `ranking_type=all&` +
    `limit=500&` +
    `offset=${offset}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-MAL-CLIENT-ID": process.env.MAL_KEY,
      "User-Agent": "my-cool-app/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    console.log(`error for offset: ${offset}`);
    throw new Error("fetch error");
  }

  return response.json();
}

async function getDetails(id) {
  const url =
    `${process.env.MAL_URL}/anime/${id}?` +
    `fields=rank,title,main_picture,alternative_titles,start_date,synopsis,mean,genres,source,related_anime,studios`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-MAL-CLIENT-ID": process.env.MAL_KEY,
      "User-Agent": "my-cool-app/1.0",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    console.log(`error for details: ${id}`);
    throw new Error("fetch error");
  }

  return response.json();
}

function writeData(data) {
  const dataString = JSON.stringify(data);
  writeFileSync("animes.json", dataString, "utf8");
}

async function fetch6000(ids, data, i, j) {
  try {
    let requests = [];
    for (; i < 6000; i = i + 500) {
      const entries = await getTop500(i);
      j = 0;
      for (; j < 500; j = j + 1) {
        const id = entries.data[j].node.id;
        if (ids.includes(id)) {
          continue;
        }
        ids.push(id);
        requests.push(getDetails(id));
        if (requests.length >= 100) {
          const results = await Promise.all(requests);
          requests = [];
          data.push(...results);
          console.log(`Progress: ${ids.length}/6000+`);
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
      if (requests.length > 0) {
        const results = await Promise.all(requests);
        data.push(...results);
        requests = [];
      }
    }
  } catch (e) {
    return { ids, data, i, j };
  }
}

export default async () => {
  let ids = [];
  let data = [];
  let i = 0;
  let j = 0;
  while (i < 6000 && j < 500) {
    const fetchData = await fetch6000(ids, data, i, j);
    ids = fetchData.ids;
    data = fetchData.data;
    i = fetchData.i;
    j = fetchData.j;
    if (i < 6000 && j < 500) {
      console.log(`waiting: i=${i} j=${j}`);
      await new Promise((r) => setTimeout(r, 5 * 60000));
      console.log("wait done");
    }
  }
  writeData(data);
};
