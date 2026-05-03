import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';
import { Trace } from '../telemetry/decorators/trace.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,

    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @Trace('HealthController.getHealth')
  async getHealth() {
    const health = await this.healthService.getHealth();

    // Add telemetry information
    const telemetryEnabled = this.configService.get<string>('TELEMETRY_ENABLED') === 'true';

    return {
      ...health,
      telemetry: {
        enabled: telemetryEnabled,
        endpoint: this.configService.get<string>('OTLP_ENDPOINT'),
        serviceName: this.configService.get<string>('OTEL_SERVICE_NAME') || 'todo-api',
      },
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @Trace('HealthController.getReadiness')
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
