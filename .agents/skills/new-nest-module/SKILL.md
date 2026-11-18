---
name: new-nest-module
description: Create a new NestJS feature module in apps/api the SensorHub way (entity, DTOs, service, controller, module, unit test, registration). Use whenever a task adds a new API resource or endpoint group, e.g. alerts, exports, tags.
---

# New NestJS module (apps/api)

Follow this pattern exactly. Look at `apps/api/src/readings/` as the reference implementation.

## Files to create

For a feature called `<feature>` (plural, kebab-case, e.g. `alerts`):

```
apps/api/src/<feature>/
├── <thing>.entity.ts          # TypeORM entity, table name = <feature>
├── dto/
│   ├── create-<thing>.dto.ts  # class-validator decorators on every field
│   └── query-<feature>.dto.ts # optional: filters, limit (use @Type(() => Number))
├── <feature>.service.ts       # all logic; inject repositories with @InjectRepository
├── <feature>.controller.ts    # thin: @Controller('<feature>'), no 'api/' prefix
├── <feature>.module.ts        # TypeOrmModule.forFeature([...]) + providers + exports
└── <feature>.service.spec.ts  # Jest; mock repositories with getRepositoryToken()
```

## Steps

1. **Shared type first.** Add the public shape to `packages/shared/src/index.ts` (dates as ISO
   strings). If it should appear live on the dashboard, add a variant to `StreamEvent`.
   Run `pnpm --filter @sensorhub/shared build`.
2. **Entity.** `@Entity('<feature>')`, `@PrimaryGeneratedColumn('uuid')`, `timestamptz` for dates,
   `real` for decimals. Relate to devices with a plain `deviceId` column plus `@ManyToOne`.
3. **DTOs.** Every field validated. Query numbers need `@Type(() => Number)`.
4. **Service.** Return shared types, not entities. Write a `toX(entity)` mapper like `toReading`.
   To push live updates: inject `StreamService` (it's global) and call `publish()`.
   To react to new readings without touching `ReadingsService`, subscribe in `onModuleInit()`:
   ```ts
   this.stream.events$.pipe(filter((e) => e.type === 'reading')).subscribe(...)
   ```
5. **Controller.** Only parses input and calls the service.
6. **Module.** Register it in `apps/api/src/app.module.ts` `imports`.
7. **Test.** At least: the happy path, one validation/edge case, and the stream publish if any.
   Use `Test.createTestingModule` with `{ provide: getRepositoryToken(Entity), useValue: mock }`.
8. **Verify.** `pnpm --filter api test && pnpm --filter api build && pnpm lint`.
   Then try it: `curl localhost:${API_PORT:-4000}/api/<feature>`.

## Don't

- Don't put logic in controllers or return raw entities.
- Don't change `synchronize` or write migrations by hand; entities drive the schema in dev.
- Don't edit `ReadingsService` just to hook into new readings. Subscribe to the stream instead.
