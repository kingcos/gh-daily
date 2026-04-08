#!/usr/bin/env node
/**
 * Copy data/ into site/public/data/ and generate index.json
 * Run before astro build to make data available at runtime for History/Persistent views.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = path.resolve(__dirname, '../../data');
const publicData = path.resolve(__dirname, '../public/data');

// Clean and recreate
if (fs.existsSync(publicData)) {
  fs.rmSync(publicData, { recursive: true });
}
fs.mkdirSync(publicData, { recursive: true });

const dates = [];

if (fs.existsSync(dataRoot)) {
  const years = fs.readdirSync(dataRoot).filter(f => /^\d{4}$/.test(f)).sort();
  for (const year of years) {
    const months = fs.readdirSync(path.join(dataRoot, year)).filter(f => /^\d{2}$/.test(f)).sort();
    for (const month of months) {
      const days = fs.readdirSync(path.join(dataRoot, year, month)).filter(f => /^\d{2}$/.test(f)).sort();
      for (const day of days) {
        const srcDir = path.join(dataRoot, year, month, day);
        const destDir = path.join(publicData, year, month, day);
        fs.mkdirSync(destDir, { recursive: true });

        for (const file of fs.readdirSync(srcDir)) {
          if (file.endsWith('.json')) {
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
          }
        }
        dates.push(`${year}/${month}/${day}`);
      }
    }
  }
}

dates.sort();
fs.writeFileSync(path.join(publicData, 'index.json'), JSON.stringify(dates, null, 2));
console.log(`Prepared ${dates.length} dates in public/data/`);
