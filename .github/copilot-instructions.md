# aicar-api - NestJS Backend Development Guidelines

## Package Management & Environment

- **Always use yarn** as the package manager for this project. Enable corepack to ensure that the correct version of yarn is used (`packageManager: yarn@4.9.1`).
- **Node**: 22 (specified in Dockerfile as `node:22.11.0-bullseye`)
- **Module type**: `commonjs`
- Follow semantic versioning and ensure code compatibility with the latest versions of libraries/frameworks.
- Use conventional commit messages (feat, fix, chore, docs, test, refactor).
- Use conventional commit messages in PR titles since we squash commits.
- Always include "Fixes #issue_number" in PR body to automatically close issues.

## Architecture & Project Structure

This is a **NestJS 11 application** with Fastify, MongoDB, and Redis using the following architecture:

### Core Technologies

- **Framework**: NestJS 11 with TypeScript 5.9
- **HTTP Server**: Fastify 5 (not Express) with `@nestjs/platform-fastify`
- **Builder**: SWC via `@nestjs/swc` (configured in `.swcrc`)
- **Database**: MongoDB with Mongoose 8 ODM
- **Cache**: Redis via ioredis (custom `RedisCacheService`, not `cache-manager`)
- **Authentication**: JWT via jose (ES512 algorithm, P-521 curve, auto-generated JWKS)
- **Authorization**: CASL (`@casl/ability` + `@casl/mongoose`) with 53 granular policies
- **File Storage**: Cloudflare R2 (S3-compatible via `@aws-sdk/client-s3`), Cloudflare Images, Cloudflare Stream
- **Email**: Mailgun via `mailgun.js`
- **SMS**: NetGSM (custom integration via Axios)
- **Push Notifications**: Expo Server SDK + web-push
- **Background Jobs**: BullMQ with Redis (two queues: MAIL, NOTIFICATION)
- **WebSockets**: Socket.IO 4 via `@nestjs/platform-socket.io` (chat system)
- **i18n**: nestjs-i18n v10 (Turkish + English, `Accept-Language` resolver)
- **API Versioning**: URI versioning (`/v1/`, `/v2/`)
- **API Documentation**: Swagger/OpenAPI at `/apidocs`
- **Validation**: class-validator + class-transformer with global `ValidationPipe`
- **Serialization**: class-transformer with `ClassSerializerInterceptor`
- **Rate Limiting**: `@nestjs/throttler` with 4 tiers (default/strict/medium/long)
- **Scheduling**: `@nestjs/schedule` for cron jobs
- **Events**: `@nestjs/event-emitter` (EventEmitter2) for activity logging and cache invalidation
- **Security**: `@fastify/helmet` (CSP, HSTS, XSS protection), `@fastify/cors`
- **OAuth**: Google (`google-auth-library`), Facebook, Twitter/X, Apple
- **WebAuthn/FIDO2**: `@simplewebauthn/server` for passkey authentication
- **CAPTCHA**: Cloudflare Turnstile verification

### Project Directory Structure

```
aicar-api/
├── docker-compose.yml        # Redis for local development
├── Dockerfile                # Multi-stage build (builder → cache → runner)
├── nest-cli.json             # SWC builder config + i18n assets
├── .swcrc                    # SWC config (decorators, sourceMaps, minify)
├── render.yaml               # Render deployment config
└── src/
    ├── main.ts               # Bootstrap (Fastify, Helmet, CORS, Swagger, ValidationPipe)
    ├── app.module.ts          # Root module (all imports, global guards/filters)
    ├── seed.ts                # Database seeder runner
    ├── modules.d.ts           # Module type declarations
    ├── libs/
    │   ├── adapters/
    │   │   └── socket-io.adapter.ts    # Custom Socket.IO adapter with CORS
    │   ├── cache/
    │   │   ├── index.ts                # Barrel export
    │   │   ├── cache.constants.ts      # CACHE_KEYS, CACHE_TTL, CACHE_PATTERNS
    │   │   ├── redis-cache.module.ts   # Global Redis cache module
    │   │   └── redis-cache.service.ts  # Redis cache service (ioredis)
    │   ├── config/
    │   │   └── throttler.config.ts     # Rate limiting tiers
    │   ├── exceptions/
    │   │   └── CaslForbiddenFilter.ts  # Global CASL ForbiddenError filter
    │   ├── helpers/
    │   │   ├── common.enums.ts         # LogLevel, HttpMethod, Environment enums
    │   │   └── sortBy.ts              # Sort string parser
    │   ├── i18n/
    │   │   ├── i18n.module.ts          # Global I18n module (nestjs-i18n)
    │   │   ├── i18n-exception.filter.ts # Translates exception messages
    │   │   └── variables/
    │   │       ├── en/ (28 JSON files)
    │   │       └── tr/ (28 JSON files)
    │   ├── seeder/
    │   │   ├── seeder.service.ts       # Centralized seeder (all domains)
    │   │   └── seeds.module.ts         # Seeder module
    │   ├── types/
    │   │   ├── fastify-request-abilities.d.ts  # Extends FastifyRequest with abilities/user/company
    │   │   ├── fastify-session.d.ts            # Extends FastifySessionObject
    │   │   └── fido.types.ts                   # WebAuthn types
    │   └── utils/
    │       ├── constants.ts            # MAX_LIMIT_ALLOWED=100, MIN_LIMIT_ALLOWED=1
    │       ├── objectId.transform.ts   # @Transform decorator for ObjectId↔string
    │       ├── constants/
    │       │   └── turnstile.constants.ts
    │       ├── errors/
    │       │   └── exceptions.ts       # DatabaseElementNotFoundError
    │       ├── events/
    │       │   └── events.enum.ts      # All 78+ application events
    │       ├── filters/
    │       │   ├── filters.ts                  # DatabaseElementNotFoundErrorFilter
    │       │   ├── http-exception.filter.ts    # Global HTTP exception filter with i18n
    │       │   └── mongo-exception.filter.ts   # MongoDB error code → HTTP status mapping
    │       ├── templates/
    │       │   └── etemplate-*.ts      # Email HTML templates
    │       ├── transformers/
    │       │   ├── MongoObjectTransformer.ts   # toMongoObjectId / fromMongoObjectId
    │       │   └── ParseObjectId.pipe.ts       # ParseObjectIdPipe
    │       └── validations/
    │           └── password-strength.validator.ts  # @IsStrongPassword decorator
    └── modules/ (30 modules)
        ├── common/              # Base entity, service, enums, exceptions
        ├── auth/                # Authentication (login, register, OAuth, FIDO)
        ├── user/                # User management
        ├── company/             # Company management
        ├── company-request/     # Company registration requests
        ├── aicar/           # Aicar management
        ├── aicar-request/   # Aicar listing requests
        ├── aicar-category/  # Aicar categories
        ├── location/            # Turkey location data (provinces/districts/neighborhoods)
        ├── token/               # JWT token service (ES512, JWKS)
        ├── policies/            # CASL policy enums and defaults
        ├── activity/            # Audit trail / activity logging
        ├── chat/                # Real-time chat (Socket.IO gateway)
        ├── favorite/            # User favorites
        ├── favorite-category/   # Favorite categories
        ├── invitation/          # Company user invitations
        ├── session/             # User sessions
        ├── device/              # Device registration (push notifications)
        ├── notification/        # Push notifications (Expo + web-push)
        ├── app-version/         # Mobile app version management
        ├── mail/                # Email sending (Mailgun)
        ├── sms/                 # SMS OTP (NetGSM)
        ├── queue/               # BullMQ job queues (MAIL, NOTIFICATION)
        ├── oauth/               # Social OAuth (Facebook, Twitter/X)
        ├── cloudflare-images/   # Cloudflare Images integration
        ├── cloudflare-r2/       # Cloudflare R2 storage (S3-compatible)
        ├── cloudflare-stream/   # Cloudflare Stream video
        ├── cfturnstile/         # Cloudflare Turnstile CAPTCHA verification
        ├── healthcheck/         # Health check endpoints (MongoDB, Redis, system)
        └── url-shortener/       # URL shortening
```

## Application Bootstrap (main.ts)

The app uses **Fastify** (not Express). Key bootstrap sequence:

1. Creates `NestFastifyApplication` with `FastifyAdapter`
2. Registers `@fastify/helmet` with strict CSP, HSTS, X-Frame-Options: DENY
3. Registers `@fastify/cors` with configurable `CORS_ORIGINS` (comma-separated, **required in production**)
4. Enables **URI versioning**: `VersioningType.URI`, prefix `v`, default version `1` → all routes under `/v1/`
5. Global `ValidationPipe`: `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`, `stopAtFirstError: true`
6. Swagger at `/apidocs` (disabled in production unless `SWAGGER_ENABLED=true`)
7. Registers `@fastify/cookie` and `@fastify/session`
8. Custom `SocketIoAdapter` for WebSocket CORS handling
9. Listens on `PORT` env var (default 8080), host `0.0.0.0`

## Global Guards & Filters (AppModule)

Registered as `APP_GUARD`/`APP_FILTER`:

1. **`JwtAuthGuard`** (global guard) — All routes require auth unless marked `@Public()`
2. **`HttpExceptionFilter`** — Translates exception messages via i18n
3. **`ForbiddenErrorFilter`** — Catches CASL `ForbiddenError` → 403
4. **`MongoExceptionFilter`** — Maps MongoDB error codes to HTTP status codes with i18n

Additionally, `I18nExceptionFilter` is registered via `app.useGlobalFilters()` in `main.ts`.

## Module Pattern

Every domain module follows this exact structure:

```
module-name/
├── casl/                         # CASL ability definition
│   └── module-name.ability.ts
├── decorators/                   # Parameter decorators
│   └── module-name.abilities.decorator.ts
├── dto/                          # Data Transfer Objects
│   ├── create-module-name.dto.ts
│   ├── update-module-name.dto.ts
│   ├── query-module-name.dto.ts
│   ├── module-name-response.dto.ts
│   └── paged-module-name-response.dto.ts
├── entities/                     # Mongoose schemas
│   └── module-name.entity.ts
├── enum/                         # Domain-specific enums
│   └── module-name.enum.ts
├── exceptions/                   # Domain-specific exceptions
│   └── module-name.exceptions.ts
├── interceptors/                 # Abilities interceptor
│   └── module-name.abilities.interceptor.ts
├── seeder/                       # Optional: seed data + seeder class
│   ├── module-name-seed.data.ts
│   └── module-name.seeder.ts
├── module-name.controller.ts
├── module-name.service.ts        # Extends CommonService<T>
└── module-name.module.ts
```

### Module Registration Pattern

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }]),
    ConfigModule // if needed
  ],
  controllers: [Controller],
  providers: [Service, AbilityService],
  exports: [Service, AbilityService]
})
export class SomeModule {}
```

### Configurable Module Pattern

Used for modules requiring dynamic configuration (`TokenModule`, `SmsModule`, `CloudflareR2Module`, `CloudflareStreamModule`):

```typescript
// module-definition.ts
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ModuleOptions>()
    .setClassMethodName("forRoot")
    .setExtras({ isGlobal: true }, (definition, extras) => ({
      ...definition,
      global: extras.isGlobal
    }))
    .build();

// module.ts
export class SomeModule extends ConfigurableModuleClass {}
```

Registered in `AppModule` with `.forRootAsync()`:

```typescript
SomeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    /* options */
  }),
  inject: [ConfigService],
  isGlobal: true
});
```

## Common Module (Base Patterns)

### CommonEntity

Base class for **ALL** entities:

```typescript
@Schema({ timestamps: true })
export class CommonEntity {
  @Expose()
  @ApiProperty()
  @Transform(/* ObjectId to hex string */)
  get id(): string | undefined {
    return this._id?.toHexString();
  }

  @Expose() @Prop({ type: Date, default: Date.now }) createdAt: Date;
  @Expose() @Prop({ type: Date, default: Date.now }) updatedAt: Date;
  @Expose() @Prop({ type: Boolean, default: false }) isDeleted: boolean;
}
```

**Rules:**

- All entities **must** extend `CommonEntity`
- All entities use `@Schema({ timestamps: true })`
- Export `HydratedDocument<Entity>` type and `SchemaFactory.createForClass(Entity)` schema
- Use `@Expose()` on all fields that should appear in API responses
- Use `@ApiProperty()` for Swagger documentation
- Use `@Transform(ObjectIdTransform())` for ObjectId fields

### CommonService (Abstract)

All domain services **must** extend `CommonService<T extends Document>`:

```typescript
@Injectable()
export abstract class CommonService<T extends Document> {
  constructor(readonly repository: Model<T>) {}
}
```

**Inherited methods:**

| Method               | Signature                                                                                | Description                                                   |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `getSession()`       | `(): Promise<ClientSession>`                                                             | Start MongoDB session for transactions                        |
| `findOne`            | `(id, session?, includeDeleted?)`                                                        | Find by ID, excludes soft-deleted by default                  |
| `findIn`             | `(ids, ability?)`                                                                        | Find multiple by ID array with optional CASL                  |
| `findAll`            | `(ability?, filter?, limit=10, skip=0, action="read", sortBy={_id:-1}, includeDeleted?)` | Paginated query with CASL, Turkish collation (`locale: "tr"`) |
| `save`               | `(document, session?)`                                                                   | Save document                                                 |
| `remove`             | `(id)`                                                                                   | Hard delete                                                   |
| `softDelete`         | `(id, session?)`                                                                         | Sets `isDeleted = true`                                       |
| `getImageUploadUrl`  | `()`                                                                                     | Get Cloudflare Images direct-upload URL                       |
| `confirmImageUpload` | `(id, entityId, photoFieldUpdater)`                                                      | Confirm CF Images upload, delete existing, build URL          |
| `deletePhoto`        | `(id, entityId, photoFieldClearer)`                                                      | Delete image from Cloudflare + clear field                    |

**Key note:** `findAll` uses **Turkish collation** (`{ locale: "tr", strength: 1 }`) for sorting.

### ActionEnum

```typescript
enum ActionEnum {
  MANAGE = "manage", // Full access
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  DELETE_ALL = "delete_all",
  REVIEW = "review",
  CANCEL = "cancel",
  UPLOAD = "upload"
}
```

## Entity Pattern

```typescript
@Schema({ timestamps: true })
export class EntityName extends CommonEntity {
  @ApiProperty({ description: "Field description", required: true })
  @Prop({ required: true, index: true })
  @Expose()
  @IsString()
  fieldName: string;

  @ApiProperty({ description: "Reference field" })
  @Prop({ type: Types.ObjectId, ref: "OtherEntity", index: true })
  @Expose()
  @Transform(ObjectIdTransform())
  refId?: Types.ObjectId;
}

export type EntityNameDocument = HydratedDocument<EntityName>;
export const EntityNameSchema = SchemaFactory.createForClass(EntityName);
```

**Rules:**

- Use `@Prop()` for Mongoose schema definition
- Use `@ApiProperty()` for Swagger
- Use `@Expose()` for serialization (only `@Expose()` fields are included in responses)
- Use `@Transform(ObjectIdTransform())` for all ObjectId fields
- Use `@ValidateNested()` and `@Type()` for embedded sub-documents
- Define sub-documents with `@Schema({ _id: false })` when they don't need their own ID

## DTO Patterns

### Query DTO (with convertToQuery)

```typescript
export class QueryEntityDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  limit: number = 10;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page: number = 0;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // Domain-specific optional filters...

  convertToQuery(): FilterQuery<EntityDocument> {
    const query: FilterQuery<EntityDocument> = {};
    // Build MongoDB filter from DTO fields
    if (this.search) {
      query.name = { $regex: removeAccents(this.search), $options: "i" };
    }
    return query;
  }
}
```

**Important:** Query DTOs have a `convertToQuery()` method that returns a `FilterQuery<T>` for MongoDB.

### Response DTO (Single)

```typescript
export class EntityResponseDto {
  @Expose()
  @Type(() => Entity)
  result: Entity;

  constructor(entity?: Entity) {
    this.result = entity;
  }
}
```

### Response DTO (Paged)

```typescript
export class PagedEntityResponseDto {
  @Expose()
  @Type(() => Entity)
  results: Entity[];

  @Expose() page: number;
  @Expose() limit: number;
  @Expose() count: number;

  constructor(results: Entity[], page: number, limit: number, count: number) {
    this.results = results;
    this.page = page;
    this.limit = limit;
    this.count = count;
  }
}
```

### Create/Update DTO

- `CreateEntityDto` — All required fields with validation decorators
- `UpdateEntityDto` — `extends PartialType(CreateEntityDto)` — makes everything optional
- Use `@Transform(ObjectIdTransform())` for ObjectId fields
- Use `class-validator` decorators: `@IsString`, `@IsOptional`, `@IsEnum`, `@IsNumber`, `@Min`, `@Max`, etc.

## Controller Pattern

All controllers share these class-level decorators:

```typescript
@ApiTags("resource-name")
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(EntityAbilitiesInterceptor)
@SerializeOptions({
  excludeExtraneousValues: true,
  excludePrefixes: ["_", "$"],
  enableCircularCheck: true,
})
@UseFilters(MongoExceptionFilter)
@UseFilters(ForbiddenErrorFilter)
@Throttle(THROTTLE_MEDIUM)
@Controller("resource-name")
```

**Rules:**

- Public routes are marked with `@Public()` decorator (skips JWT guard)
- Use `@CurrentUser()` to extract the authenticated user from the request
- Use domain-specific `@EntityAbilities()` to extract CASL abilities
- Use `ParseObjectIdPipe` for `:id` params: `@Param("id", ParseObjectIdPipe) id: Types.ObjectId`
- Emit activity events via `EventEmitter2` for audit trail
- Use response DTOs to wrap results: `new EntityResponseDto(entity)`, `new PagedEntityResponseDto(results, page, limit, count)`
- CASL authorization: `ForbiddenError.from(abilities).throwUnlessCan(ActionEnum.READ, entity)`

## Service Pattern

```typescript
@Injectable()
export class EntityService extends CommonService<EntityDocument> {
  constructor(
    @InjectModel(Entity.name) private entityModel: Model<EntityDocument>,
    // Other injected services...
    private cacheService: RedisCacheService
  ) {
    super(entityModel);
  }

  // Override extractPhotoUrl for entities with photos
  protected extractPhotoUrl(entity: EntityDocument): string | undefined {
    return entity.photo;
  }
}
```

**Rules:**

- Always extend `CommonService<EntityDocument>`
- Pass model to `super(entityModel)`
- Override `extractPhotoUrl?()` if the entity has a photo field managed by Cloudflare Images
- Use MongoDB sessions for multi-document operations
- Implement cache invalidation when modifying data

## Authorization Pattern (CASL)

### Three-File Pattern Per Module

**1. Ability Service** (`casl/entity.ability.ts`):

```typescript
export type EntityAbilitiesType = MongoAbility<
  [ActionEnum, Require_id<Entity> | string]
>;

@Injectable()
export class EntityAbilityService {
  getPolicies(user: UserDocument): PolicyEnum[] {
    return user.enabledPolicies;
  }

  fetchAbilities(user: Require_id<UserDocument>): EntityAbilitiesType {
    const { can, build } = new AbilityBuilder<EntityAbilitiesType>(
      createMongoAbility
    );
    const policies = this.getPolicies(user);

    if (policies.includes(PolicyEnum.superAdmin)) {
      can(ActionEnum.MANAGE, "all");
    }
    // Define granular rules based on policies...
    return build();
  }
}
```

**2. Abilities Decorator** (`decorators/entity.abilities.decorator.ts`):

```typescript
export const EntityAbilities = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return request.abilities?.entity;
  }
);
```

**3. Abilities Interceptor** (`interceptors/entity.abilities.interceptor.ts`):

```typescript
@Injectable()
export class EntityAbilitiesInterceptor implements NestInterceptor {
  constructor(private abilityService: EntityAbilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (request.user) {
      request.abilities = request.abilities || {};
      request.abilities.entity = this.abilityService.fetchAbilities(
        request.user
      );
    }
    return next.handle();
  }
}
```

### Policy System

- **`PolicyEnum`** — 53 granular permissions defined in `modules/policies/policies.enums.ts`
- **`DEFAULT_USER_POLICIES`** — 19 policies for individual users
- **`DEFAULT_COMPANY_ADMIN_POLICIES`** — Extends user policies with 15 additional company management policies
- **`superAdmin`** policy grants `can(ActionEnum.MANAGE, "all")`
- Abilities are built from user's `enabledPolicies` array

## Authentication

### Auth Decorators

- **`@Public()`** — Marks route as public, skips JWT guard
- **`@CurrentUser()`** — Extracts `UserDocument` from `request.user`

### JWT Guard (Global)

The `JwtAuthGuard` is registered as `APP_GUARD`:

- Extracts token from `Authorization: Bearer <token>` header or `?token=` query param
- Verifies via `TokenService.verifyToken(token, "login")`
- Loads user by `decoded.sub` and sets `request.user`
- Routes with `@Public()` are skipped

### Token Service

- Uses **jose** library with ES512 algorithm (P-521 curve)
- Auto-generates JWKS on first run if no keys configured
- `TokenModule.forRootAsync()` — configurable module pattern
- Stores refresh tokens in MongoDB

### Auth Endpoints

| Method | Path                               | Description                           |
| ------ | ---------------------------------- | ------------------------------------- |
| `POST` | `/v1/auth/login`                   | Email/password + Turnstile CAPTCHA    |
| `POST` | `/v1/auth/admin-login`             | Same but requires `superAdmin` policy |
| `POST` | `/v1/auth/register`                | User registration                     |
| `POST` | `/v1/auth/activate-user`           | Activate via token + set password     |
| `POST` | `/v1/auth/refresh`                 | Refresh token                         |
| `GET`  | `/v1/auth/me`                      | Current user (CASL-protected)         |
| `POST` | `/v1/auth/forgot-password`         | Send password reset email             |
| `POST` | `/v1/auth/reset-password`          | Reset password with token             |
| `POST` | `/v1/auth/send-verification-email` | Send email verification               |
| `POST` | `/v1/auth/verify-email`            | Verify email with token               |

### Supported Auth Methods

- Email/password with bcryptjs hashing
- Google OAuth via `google-auth-library`
- Facebook OAuth with PKCE (Redis-backed session store)
- Twitter/X OAuth 2.0
- Apple Sign-In
- FIDO2/WebAuthn passkeys via `@simplewebauthn/server`
- SMS OTP via NetGSM

## Caching (Redis)

### RedisCacheModule (Global)

Provides `RedisCacheService` globally — no need to import per module.

### RedisCacheService Methods

| Method                   | Signature                              | Description                                     |
| ------------------------ | -------------------------------------- | ----------------------------------------------- |
| `get<T>`                 | `(key): Promise<T \| null>`            | Get cached JSON value                           |
| `set<T>`                 | `(key, value, ttl?): Promise<boolean>` | Set with TTL (default from `CACHE_TTL.DEFAULT`) |
| `del`                    | `(key): Promise<boolean>`              | Delete single key                               |
| `delMany`                | `(keys[]): Promise<boolean>`           | Delete multiple keys                            |
| `delByPattern`           | `(pattern): Promise<boolean>`          | SCAN + DEL by glob pattern                      |
| `getOrSet<T>`            | `(key, factory, ttl?): Promise<T>`     | Cache-aside pattern                             |
| `exists`                 | `(key): Promise<boolean>`              | Check key existence                             |
| `incr`                   | `(key, increment?): Promise<number>`   | Atomic increment                                |
| `hget/hset/hgetall/hdel` | Hash operations                        | Redis hash operations                           |

**All methods gracefully return null/false when Redis is unavailable — they never throw.**

### Cache Constants

- **`CACHE_KEYS`** — Typed key builders organized by domain (e.g., `CACHE_KEYS.LOCATION.PROVINCE_BY_ID(id)`)
- **`CACHE_TTL`** — TTL values in seconds per domain (60s → 86400s)
- **`CACHE_PATTERNS`** — Glob patterns for bulk invalidation (e.g., `"aicar:*"`)

## Background Jobs (BullMQ)

### Queues

| Queue          | Purpose            | Processors              |
| -------------- | ------------------ | ----------------------- |
| `MAIL`         | Email sending      | `MailProcessor`         |
| `NOTIFICATION` | Push notifications | `NotificationProcessor` |

### QueueService Methods

- `addPasswordResetMail(to, token, language?)`
- `addEmailVerificationMail(to, verificationLink, language?)`
- `addInvitationMail(to, companyName, code, expiresAt, language?)`
- `addBugReportMail(to, userId, description, attachments?, language?)`
- `addGenericMail(to, subject, html, language?)`
- `addCompanyRequestApprovedMail(to, companyName, language?)`
- `addCompanyRequestRejectedMail(to, companyName, reviewNotes?, language?)`
- `addNotification(data: NotificationJobData)`

### Default Job Options

- 3 attempts, exponential backoff (1s base)
- Remove completed after 1 hour or 100 jobs
- Remove failed after 24 hours

## i18n (Internationalization)

- **Library**: nestjs-i18n v10
- **Fallback language**: `en`
- **Languages**: `en` (28 JSON files), `tr` (28 JSON files)
- **Resolver**: `AcceptLanguageResolver` (reads `Accept-Language` header)
- Translation files are organized per domain in `libs/i18n/variables/{lang}/`
- Exception messages use i18n keys: `"auth.WRONG_EMAIL_OR_PASSWORD"`, `"common.ENTITY_NOT_FOUND"`

### Exception i18n Pattern

```typescript
// Simple key
export class SomeException extends BadRequestException {
  constructor() {
    super("domain.ERROR_KEY");
  }
}

// With parameters
export class EntityNotFoundException extends BadRequestException {
  constructor(id: string) {
    super({
      message: { key: "common.ENTITY_NOT_FOUND", args: { id } }
    });
  }
}
```

Three filters handle translation: `I18nExceptionFilter`, `HttpExceptionFilter`, `MongoExceptionFilter`.

## Events System

- Uses `@nestjs/event-emitter` (EventEmitter2)
- **78+ events** defined in `Events` enum covering all domains
- Events are used for: activity logging, real-time notifications, cache invalidation
- Controllers emit events via `eventEmitter.emit(Events.SomeEvent, payload)`

## WebSocket Chat

### Chat Gateway

```typescript
@WebSocketGateway({ namespace: "chat" })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
}
```

- Auth via JWT token on connection (Bearer header or `auth.token` handshake)
- On connect: verifies token → looks up user → sets `client.data.user` → joins user's ObjectId room
- Transports: `["websocket", "polling"]`
- `pingTimeout: 60000`, `pingInterval: 25000`, `connectTimeout: 45000`

### Chat Events

| Event               | Direction       | Description           |
| ------------------- | --------------- | --------------------- |
| `conversation.join` | Client → Server | Join a conversation   |
| `message.send`      | Client → Server | Send a message        |
| `message.receive`   | Server → Client | New message received  |
| `message.read`      | Bidirectional   | Mark messages as read |

## Rate Limiting

Four throttle tiers configured in `libs/config/throttler.config.ts`:

| Name      | TTL | Limit        | Usage                    |
| --------- | --- | ------------ | ------------------------ |
| `default` | 60s | 10 requests  | Sensitive endpoints      |
| `strict`  | 1s  | 100 requests | High-frequency endpoints |
| `medium`  | 10s | 200 requests | **Most controllers**     |
| `long`    | 60s | 300 requests | Public endpoints         |

Usage: `@Throttle(THROTTLE_MEDIUM)` at controller or method level.

## Seeder System

### Per-Module Seeders

Each module with seed data has:

- `seeder/module-seed.data.ts` — Seed data arrays
- `seeder/module.seeder.ts` — Injectable seeder class with `seed()` (skip if docs exist, `insertMany`) and `drop()` methods

### Seeder Runner (`seed.ts`)

Creates a temporary `SeederModule`, runs seeders in order:

1. User → 2. Company → 3. CompanyRequest → 4. Location → 5. Aicar → 6. FavoriteCategory → 7. Favorite → 8. Chat → 9. Notification

Run via: `yarn seed` (ts-node) or `yarn seed:build` (compiled)

## Database Patterns

### MongoDB with Mongoose

- **Soft deletes**: `isDeleted` flag on `CommonEntity` — `softDelete()` sets true
- **Transactions**: Use `getSession()` from `CommonService` for multi-document operations
- **Indexes**: Add proper indexes for query performance (`@Prop({ index: true })`)
- **2dsphere**: GeoJSON index for location-based queries (`"address.location": "2dsphere"`)
- **Collation**: Turkish collation (`{ locale: "tr", strength: 1 }`) in `findAll` for correct sorting
- **References**: Use `Types.ObjectId` with `ref` property for relations
- **Sub-documents**: Use `@Schema({ _id: false })` for embedded schemas

### ObjectId Handling

```typescript
// In DTOs — transform string ↔ ObjectId
@Transform(ObjectIdTransform())
companyId?: Types.ObjectId;

// In controllers — parse path params
@Param("id", ParseObjectIdPipe) id: Types.ObjectId
```

## Serialization

All controllers use:

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({
  excludeExtraneousValues: true,
  excludePrefixes: ["_", "$"],
  enableCircularCheck: true,
})
```

**Only fields with `@Expose()` are included in API responses.** All `_id` and `$`-prefixed internal MongoDB fields are excluded.

## File Storage

### Cloudflare Images

- Direct upload URL flow: `getImageUploadUrl()` → client uploads → `confirmImageUpload()`
- Built into `CommonService` — any entity can use photo management
- Override `extractPhotoUrl?()` in service to specify the entity photo field

### Cloudflare R2

- S3-compatible storage via `@aws-sdk/client-s3`
- Used for aicar images with key pattern: `aicars/{id}/{timestamp}-{filename}`
- Configurable via `CloudflareR2Module.forRootAsync()`

### Cloudflare Stream

- Video upload and playback
- Signed URLs for secure access
- Configurable via `CloudflareStreamModule.forRootAsync()`

## Environment Variables

| Variable                                                                                                         | Description                                                        |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `MONGODB_URL`                                                                                                    | MongoDB connection string                                          |
| `REDIS_URL`                                                                                                      | Redis connection URL (optional, falls back to localhost)           |
| `PORT`                                                                                                           | Server port (default 8080)                                         |
| `NODE_ENV`                                                                                                       | `development` / `production` / `test`                              |
| `CORS_ORIGINS`                                                                                                   | Allowed CORS origins (comma-separated, **required in production**) |
| `JWT_PRIVATE`                                                                                                    | JWT private key (ES512, auto-generated on first run)               |
| `JWT_MOCK_PUBLIC`                                                                                                | JWT public key                                                     |
| `JWT_ISSUER`                                                                                                     | JWT issuer string                                                  |
| `JWT_ACCESS_EXPIRATION_MINUTES`                                                                                  | Access token expiration                                            |
| `JWT_REFRESH_EXPIRATION_MINUTES`                                                                                 | Refresh token expiration                                           |
| `SESSION_SECRET`                                                                                                 | Fastify session secret (min 32 chars)                              |
| `HMAC_SECRET`                                                                                                    | HMAC secret for signatures                                         |
| `EMAIL_VERIFICATION_SECRET`                                                                                      | Email verification secret                                          |
| `FRONTEND_URL`                                                                                                   | Frontend URL for email links                                       |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_REGION`                                            | Mailgun config                                                     |
| `NETGSM_USERNAME`, `NETGSM_PASSWORD`, `NETGSM_SENDER`                                                            | NetGSM SMS config                                                  |
| `GOOGLE_CLIENT_ID`                                                                                               | Google OAuth client ID                                             |
| `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`                                                               | Twitter/X OAuth                                                    |
| `CLOUDFLARE_TURNSTILE_SECRET`                                                                                    | Turnstile CAPTCHA secret                                           |
| `CF_IMAGES_ACCOUNT`, `CF_IMAGES_SECRET`                                                                          | Cloudflare Images                                                  |
| `CF_R2_ACCOUNT_ID`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_DEFAULT_BUCKET`, `CF_R2_PUBLIC_URL` | Cloudflare R2                                                      |
| `CF_STREAM_ACCOUNT_ID`, `CF_STREAM_API_TOKEN`, `CF_STREAM_SIGNING_KEY_ID`, `CF_STREAM_SIGNING_KEY_JWK`           | Cloudflare Stream                                                  |
| `FIDO_RP_ID`, `FIDO_ORIGIN`                                                                                      | WebAuthn/FIDO config                                               |
| `SWAGGER_ENABLED`                                                                                                | Enable Swagger in production (`"true"`)                            |

## Code Quality Standards

### TypeScript

- **Strict mode**: enabled (`strict: true`, `strictNullChecks: true`, `noImplicitAny: true`)
- **`strictPropertyInitialization: false`** — disabled for NestJS dependency injection compatibility
- **Type safety**: No `any` types unless absolutely necessary
- **Target**: ES2018, module: CommonJS
- **Decorators**: `emitDecoratorMetadata: true`, `experimentalDecorators: true`

### Linting & Formatting

- **ESLint 9** with flat config (`eslint.config.mjs`)
- Extends: `tseslint.configs.recommended`, `tseslint.configs.recommendedTypeChecked`, `eslint-plugin-prettier/recommended`
- **unused-imports** plugin: `no-unused-imports: error`
- Unused vars with `_` prefix are ignored
- **Prettier**: Inline config in `package.json` — `{ "trailingComma": "none" }`
- Spec files are ignored by ESLint

### Naming Conventions

- **Modules/directories**: kebab-case (`company-request/`, `aicar-category/`)
- **Entities**: PascalCase classes (`CompanyRequest`), files: `kebab-case.entity.ts`
- **DTOs**: `create-*.dto.ts`, `update-*.dto.ts`, `query-*.dto.ts`, `*-response.dto.ts`, `paged-*-response.dto.ts`
- **Enums**: PascalCase enum names in `*.enum.ts` files
- **Services**: `EntityService extends CommonService<EntityDocument>`
- **Controllers**: `EntityController` — resource name matches REST convention
- **CASL abilities**: `entity.ability.ts` → `EntityAbilityService`, export `EntityAbilitiesType`
- **Decorators**: `entity.abilities.decorator.ts` → `EntityAbilities`
- **Interceptors**: `entity.abilities.interceptor.ts` → `EntityAbilitiesInterceptor`
- **Exceptions**: Descriptive PascalCase extending NestJS `HttpException` subclasses
- **Seeders**: `entity.seeder.ts` → `EntitySeeder` with `seed()` and `drop()` methods

### Development Workflow

**Before any commit, run:**

```bash
yarn typecheck   # TypeScript compilation check (tsc --noEmit)
yarn lint        # ESLint validation
yarn build       # Ensure build succeeds
```

### Available Scripts

```bash
yarn dev         # Start dev server (SWC, watch mode)
yarn start       # Start server (SWC)
yarn start:prod  # Start production (node dist/main)
yarn build       # Nest build (SWC)
yarn lint        # Run ESLint
yarn lint:fix    # Run ESLint with auto-fix
yarn typecheck   # TypeScript type check
yarn format      # Prettier format
yarn seed        # Run database seeders (ts-node)
yarn seed:build  # Build + run seeders (production)
```

## API Documentation (Swagger)

- Available at `/apidocs` (disabled in production unless `SWAGGER_ENABLED=true`)
- Every endpoint must have `@ApiOperation`, `@ApiResponse` decorators
- All request/response DTOs must use `@ApiProperty` with descriptions
- Bearer auth via `@ApiBearerAuth()` on all controllers

## Development Setup

1. **MongoDB**: Ensure a MongoDB instance is running (local or Atlas)
2. **Redis**: Run `docker-compose up -d` for local Redis (BullMQ + caching)
3. **Environment**: Create `.env.local` with required variables
4. **JWT keys**: Auto-generated on first application start — save the generated keys
5. **Database seeding**: Run `yarn seed` to populate test data
6. **Swagger**: Visit `http://localhost:8080/apidocs` for API documentation

## Docker

### Multi-Stage Dockerfile

- **Builder**: Install all deps + build with SWC
- **Cache**: Production deps only (`yarn workspaces focus --production`)
- **Runner**: Copy dist + production deps, `NODE_ENV=production`
- Exposes port 3000
- Healthcheck: `curl -f http://localhost:${PORT}/v2/healthcheck/mongo`

### Docker Compose (Local Dev)

- Redis 7 Alpine with password `deponla_redis_secret` on port 6379
- `REDIS_URL: redis://:deponla_redis_secret@localhost:6379`
