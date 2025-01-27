let i = 1;
const step = 500;

for (; i <= 6000; i = i + step) {
  const fileName = `${i}-${i + step - 1}.json`;
  console.log(fileName);

  const file = require(fileName);
}
