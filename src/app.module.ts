import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AgentsController } from './modules/agents/agents.controller';
import { ContextsController } from './modules/contexts/contexts.controller';
import { ReportsController } from './modules/reports/reports.controller';
import { CronsController } from './modules/crons/crons.controller';
import { SkillsController } from './modules/skills/skills.controller';
import { SystemController } from './modules/system/system.controller';
import { MetricsController } from './modules/metrics/metrics.controller';
import { LegacyController } from './modules/legacy/legacy.controller';
import { LoggingService } from './common/logging.service';
import { RuntimeService } from './runtime/runtime.service';
import { TelemetryService } from './runtime/telemetry.service';
import { InfraService } from './runtime/infra.service';
import { AuthMiddleware, CostGuardMiddleware, KillSwitchMiddleware, RateLimitMiddleware, RequestLogMiddleware } from './common/middlewares';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { User } from './modules/auth/user.entity';
import { AppDataSource } from './database/typeorm.config';
import { GoogleStrategy } from './modules/auth/google.strategy';
import { FirebaseService } from './modules/auth/firebase.service';

@Module({
  controllers: [
    AgentsController,
    ContextsController,
    ReportsController,
    CronsController,
    SkillsController,
    SystemController,
    MetricsController,
    LegacyController,
    AuthController,
  ],
  providers: [
    LoggingService,
    RuntimeService,
    TelemetryService,
    InfraService,
    FirebaseService,
    {
      provide: AuthService,
      useFactory: () => new AuthService(AppDataSource),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware, RequestLogMiddleware, AuthMiddleware, KillSwitchMiddleware, CostGuardMiddleware).forRoutes('*');
  }
}
