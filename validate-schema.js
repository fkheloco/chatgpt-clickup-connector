const SwaggerParser = require('swagger-parser');

async function validateSchema() {
  try {
    const api = await SwaggerParser.validate('./openapi-schema.json');
    console.log('✅ OpenAPI schema is valid!');
    console.log('API Info:', api.info);
    console.log('Available endpoints:', Object.keys(api.paths));
  } catch (err) {
    console.error('❌ Schema validation failed:', err.message);
  }
}

validateSchema();
