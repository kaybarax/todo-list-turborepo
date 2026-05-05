import { readFileSync } from 'fs';
import { resolve } from 'path';

// @ts-ignore
import openapiDiff from 'openapi-diff';

async function compareOpenAPI() {
  const baselinePath = resolve(__dirname, '../../../docs/api/openapi/bun-elysia-api-baseline.openapi.json');
  const currentPath = resolve(__dirname, '../../../docs/api/openapi/bun-elysia-api-current.openapi.json');

  console.log(`Comparing: \nBaseline: ${baselinePath}\nCurrent:  ${currentPath}\n`);

  try {
    const baseline = readFileSync(baselinePath, 'utf8');
    const current = readFileSync(currentPath, 'utf8');

    const result = await openapiDiff.diffSpecs({
      sourceSpec: {
        content: baseline,
        location: baselinePath,
        format: 'openapi3',
      },
      destinationSpec: {
        content: current,
        location: currentPath,
        format: 'openapi3',
      },
    });

    if (result.breakingDifferencesFound) {
      console.error('❌ Breaking changes found in OpenAPI spec!');
      console.error(JSON.stringify(result.breakingDifferences, null, 2));
      process.exit(1);
    }

    if (result.nonBreakingDifferences.length > 0) {
      console.warn('⚠️ Non-breaking changes found:');
      console.warn(JSON.stringify(result.nonBreakingDifferences, null, 2));
    } else {
      console.log('✅ No differences found. Parity maintained!');
    }
  } catch (error) {
    console.error('Failed to compare OpenAPI specs:', error);
    process.exit(1);
  }
}

compareOpenAPI().catch(err => {
  console.error(err);
  process.exit(1);
});
