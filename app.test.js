import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname || path.dirname(new URL(import.meta.url).pathname), '..');
test('project uses PostgreSQL driver and does not include SQLite dependency', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.ok(pkg.dependencies.pg, 'pg dependency should be present');
  assert.equal(pkg.dependencies['better-sqlite3'], undefined);
});
test('database configuration documents DATABASE_URL', () => {
  const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  const db = fs.readFileSync(path.join(root, 'src/db.js'), 'utf8');
  assert.match(env, /DATABASE_URL=/);
  assert.match(db, /process\.env\.DATABASE_URL/);
});
test('UI contains requested inventory fields and filters', () => {
  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  for (const id of ['category', 'expiry', 'brand', 'image_url', 'notes', 'search', 'category-filter', 'expiry-filter']) {
    assert.ok(html.includes(`id="${id}"`), `missing UI field: ${id}`);
  }
  assert.match(html, /adjustQty/);
  assert.match(html, /cookRecipe/);
});
test('backend exposes core pantry and recipe workflows', () => {
  const server = fs.readFileSync(path.join(root, 'src/server.js'), 'utf8');
  for (const route of ["'/pantry'", "'/ingredients'", "'/recipes'", "'/suggestions'", "'/recipes/:id/cook'"]) {
    assert.ok(server.includes(route), `missing API route: ${route}`);
  }
});
