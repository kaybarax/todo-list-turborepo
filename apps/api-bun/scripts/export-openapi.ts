import { writeFileSync } from 'fs';
import { resolve } from 'path';

import { app } from '../src/app';

async function exportOpenAPI() {
  console.log('Exporting OpenAPI spec...');

  // Simulate a request to the OpenAPI JSON endpoint
  const response = await app.handle(new Request('http://localhost/api/docs/json'));

  if (!response.ok) {
    console.error('Failed to fetch OpenAPI spec', await response.text());
    process.exit(1);
  }

  const spec = await response.json();
  const outputPath = resolve(__dirname, '../../../docs/BUN_ELYSIA_API_CURRENT_OPENAPI.json');

  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`OpenAPI spec exported to: ${outputPath}`);
}

exportOpenAPI().catch(err => {
  console.error(err);
  process.exit(1);
});
