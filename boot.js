// IMPORTS
const fs = require('fs');
const path = require('path');

// CONSTANTS
const INPUT_FILE = 'sample.csv';
const INPUT_DIR = 'input';
const OUTPUT_FILE = 'script';
const OUTPUT_FILE_EXT = '.sql';
const OUTPUT_DIR = 'output';
const HAS_HEADER = true;
const SQL_BATCH_SIZE = 50;
const SCRIPT_SIZE = 500;

// FUNCTION DECLARATIONS
function createStatement({cnpj, hashcode} = columns) {
  return `INSERT INTO DBO.TABLE (CNPJ, HASHCODE) VALUES ('${cnpj}', '${
      hashcode}')`;
}

function parseLine(line) {
  let [cnpj, hashcode] = line.split(';');
  return {cnpj, hashcode};
}

function parseContent(content) {
  return content.split('\n').filter(x => !!x);
}

function process(content) {
  if (HAS_HEADER) {
    content.shift();
  }
  let results = [];
  for (let i = 0; i < content.length; i++) {
    if (i % SQL_BATCH_SIZE == 0 && i != 0) {
      results.push('GO\n\n');
    }
    results.push(createStatement(parseLine(content[i])));
  }
  results.push('GO');
  return results.join('\n');
}

function splitInBatches(content) {
  return content.split('\n\n');
}

function splitInFiles(content) {
  let results = [];
  let batches = splitInBatches(content)
  const NUMBER_OF_BATCHES = batches.length;
  const BATCHES_IN_FILE = SCRIPT_SIZE / SQL_BATCH_SIZE;
  let numberOfFile = 0;
  let filename = '';
  let data = [];
  for (let i = 0; i < NUMBER_OF_BATCHES; i++) {
    if (i % BATCHES_IN_FILE == 0 && i != 0) {
      filename =
          path.join(OUTPUT_DIR, OUTPUT_FILE + numberOfFile + OUTPUT_FILE_EXT);
      results.push({filename, content: data.join('\n')});
      data = [];
      numberOfFile++;
      continue;
    }
    data.push(batches[i]);
  }
  return results;
}

// RUN
(function() {
fs.readFile(path.join(INPUT_DIR, INPUT_FILE), 'utf-8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const outputFiles = splitInFiles(process(parseContent(data)));
  outputFiles.forEach(({filename, content}) => {
    fs.writeFile(filename, content, (e) => {
      if (e) {
        console.error(e);
        return;
      }
      console.log(`File <<${filename}>> successfully written.`);
    });
  });
});
})();
