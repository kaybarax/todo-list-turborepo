import * as fs from 'fs';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from '../src/app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    const config = new DocumentBuilder()
      .setTitle('Todo API')
      .setDescription('A modern todo application API with blockchain integration')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    fs.writeFileSync('openapi-baseline.json', JSON.stringify(document, null, 2));
    console.log('OpenAPI dump created at openapi-baseline.json');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

void bootstrap();
