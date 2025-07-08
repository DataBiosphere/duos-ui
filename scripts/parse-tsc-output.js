// Check if a subset of source files have TypeScript errors.
//
// This script takes a list of source file paths from stdin, runs the TypeScript compiler (tsc), and parses the output to find TypeScript errors in those files.
//
// This is necessary because:
// 1. `tsc` does not provide a machine-readable output format.
// 2. `tsc` does not provide a way to filter errors by file paths.
// 3. Running `tsc` on individual files is not sufficient due to TypeScript's module resolution and dependency graph.
//
// Usage:
//   git diff --name-only origin/develop | node scripts/parse-tsc-output.js
import { createInterface } from 'node:readline';
import { spawn } from 'child_process';

// parses the raw tsc output and returns an object with file paths as keys and arrays of error objects as values
const tsc_parse_errors = (lines) => {
  const errors = {};

  for (const line of lines) {
    // skip empty lines
    if (!line.trim()) {
      continue;
    }

    // match typescript compiler error output
    const errorMatch = line.match(/^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/); // NOSONAR

    // if no match, skip to next line
    if (!errorMatch) {
      continue;
    }

    // destructure the match result
    const [_m, filePath, lineNum, columnNum, errorCode, message] = errorMatch;

    // create the error object
    const tsError = {
      line: parseInt(lineNum, 10),
      column: parseInt(columnNum, 10),
      code: errorCode,
      message: message,
    }

    // create empty array if it doesn't exist
    if (!errors[filePath]) {
      errors[filePath] = [];
    }

    // for each file, push the error object
    errors[filePath].push(tsError);
  }

  return errors;
}

// convert tsc errors back to original format
const tsc_errors_to_string = (path, errors) => {
  return errors.map(({line, column, code, message}) => {
    return `${path}(${line},${column}): error ${code}: ${message}`;
  }).join('\n');
}

// check which subset of files has TypeScript errors
const tsc_subset_files = (files, errors) => {
  const subset = [];
  for (const file of files) {
    if (errors[file]) {
      subset.push(tsc_errors_to_string(file, errors[file]));
    }
  }
  return subset;
}

// runs tsc and parse the output
const tsc_run_and_parse = (files) => {
  return new Promise((resolve, reject) => {
    const cmd = ['npx', 'tsc', '--noEmit'];
    const tsc = spawn(cmd[0], cmd.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const buffer = [];

    // fill the buffer with data from stdout
    tsc.stdout.on('data', (data) => {
      buffer.push(data);
    });

    // convert buffer to lines and check which files have errors
    tsc.on('close', (_code) => {
      const lines = Buffer.concat(buffer).toString().split('\n');
      const errors = tsc_parse_errors(lines);
      const subset = tsc_subset_files(files, errors);

      // exit if there are errors
      if (subset.length > 0) {
        console.error('TypeScript errors found in the following files:\n');
        console.error(subset.join('\n'));
        console.error(`\nRun \`${cmd.join(' ')}\` to see the full output.`);
        process.exit(1);
      }

      resolve({
        errors
      });
    });

    tsc.on('error', (error) => {
      console.error('Failed to start TypeScript compiler: ', error);
      reject(error);
    });
  });
}

const files = [];

// read the source file paths from stdin
for await (const line of createInterface({ input: process.stdin })) {
  files.push(line.trim());
}

tsc_run_and_parse(files);
