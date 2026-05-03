import { Type as t, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const EnvSchema = t.Object({
  NODE_ENV: t.Optional(
    t.Enum(
      {
        development: 'development',
        production: 'production',
        test: 'test',
        staging: 'staging',
      },
      { default: 'development' },
    ),
  ),
  PORT: t.Optional(t.Number({ default: 3002 })),
  MONGODB_URI: t.String({ minLength: 1 }),
  JWT_SECRET: t.String({ minLength: 1 }),
  REDIS_URI: t.Optional(t.String()),
  CORS_ORIGIN: t.Optional(t.String({ default: 'http://localhost:3000,http://localhost:5173' })),

  JAEGER_ENDPOINT: t.Optional(t.String()),
});

type Env = Static<typeof EnvSchema>;

function validateEnv(): Env {
  const env: any = { ...process.env };

  if (env.PORT) {
    env.PORT = parseInt(env.PORT, 10);
  } else {
    delete env.PORT;
  }

  Value.Default(EnvSchema, env);

  const errors = [...Value.Errors(EnvSchema, env)];

  if (errors.length > 0) {
    console.error('❌ Invalid environment variables:');
    for (const error of errors) {
      console.error(`  - ${error.path}: ${error.message}`);
    }
    process.exit(1);
  }

  return Value.Cast(EnvSchema, env) as Env;
}

export const config = validateEnv();
