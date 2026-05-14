# New Endpoints Guide

This guide explains how to add new backend endpoints that follow the exact structure already used by the auth module.

The current auth flow is:

- Route layer: `src/routes/auth.route.ts`
- Controller layer: `src/controllers/auth.controller.ts`
- Service layer: `src/services/auth.service.ts`
- Repository layer: `src/repositories/*.repository.ts`
- Middleware: `src/middlewares/auth.middleware.ts`
- App mount point: `src/app.ts`
- Swagger config and shared schemas: `src/swagger.ts`

Use this same layering for all new endpoints.

## 1. Architecture Rules To Keep

1. Keep HTTP concerns in controllers only.
2. Keep business logic in services only.
3. Keep database access in repositories only.
4. Keep route files focused on:
- dependency wiring (repo -> service -> controller)
- endpoint registration
- swagger JSDoc comments
5. Keep response format consistent:
- Success: `{ status: "success", data: ... }`
- Error: `{ status: "error", message: "..." }`
6. Keep protected routes behind middleware:
- `authenticate(authService)` first
- then optional `authorize(...)`

## 2. File Ownership By Layer

### Route (`src/routes/<module>.route.ts`)

Responsibilities:

- Create router
- Instantiate repositories/services/controllers once at module scope
- Register endpoint handlers
- Add full swagger comments above each route

Do not:

- write business logic
- write SQL/ORM queries
- parse complex request state

### Controller (`src/controllers/<module>.controller.ts`)

Responsibilities:

- Parse request (`req.body`, `req.params`, `req.query`, cookies, headers)
- Validate required input fields
- Call service methods
- Map known errors to proper HTTP status codes
- Return unified JSON shape

Do not:

- access TypeORM directly
- hold authentication or token logic if it belongs in service

### Service (`src/services/<module>.service.ts`)

Responsibilities:

- Business rules
- Orchestration across repositories
- Token/hash/security logic if needed
- Throw clear `Error` messages for controller mapping

Do not:

- access `req` or `res`
- write HTTP response objects

### Repository (`src/repositories/<module>.repository.ts`)

Responsibilities:

- Encapsulate TypeORM operations
- Return entities or null
- Keep methods focused and reusable

Do not:

- format API responses
- know about route/controller status codes

## 3. Standard Endpoint Workflow

## Step 1: Define the API contract first

For each endpoint, define:

- Method and path (example: `POST /api/users/invite`)
- Auth requirement (public, authenticated, role-restricted)
- Request schema
- Response schema
- Error cases and status codes

Write this first to avoid rewriting logic later.

## Step 2: Add or update types (optional but recommended)

Create or extend `src/types/<module>.types.ts` for payload contracts.

Example:

```ts
export interface CreateThingRequest {
  name: string;
}

export interface ThingResponse {
  id: number;
  name: string;
}
```

If middleware adds custom request fields, augment `Express.Request` like `src/types/auth.types.ts` does.

## Step 3: Add repository methods (if DB is involved)

Add data access methods in an existing or new repository.

Pattern:

```ts
import { DataSource, Repository } from "typeorm";
import { Thing } from "../entities/Thing";

export class ThingRepository {
  private readonly repo: Repository<Thing>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Thing);
  }

  async findByName(name: string): Promise<Thing | null> {
    return this.repo.findOneBy({ name });
  }

  async save(entity: Thing): Promise<Thing> {
    return this.repo.save(entity);
  }
}
```

## Step 4: Implement service logic

Service methods should throw specific errors for known business failures.

Pattern:

```ts
export class ThingService {
  constructor(private thingRepo: ThingRepository) {}

  async createThing(name: string): Promise<Thing> {
    const exists = await this.thingRepo.findByName(name);
    if (exists) {
      throw new Error("Thing already exists");
    }

    const thing = new Thing(name);
    return this.thingRepo.save(thing);
  }
}
```

## Step 5: Implement controller method

Controller handles validation and status-code mapping.

Pattern:

```ts
import { Request, Response } from "express";

export class ThingController {
  constructor(private thingService: ThingService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.body;

      if (!name) {
        res.status(400).json({
          status: "error",
          message: "Name is required",
        });
        return;
      }

      const thing = await this.thingService.createThing(name);

      res.status(201).json({
        status: "success",
        data: thing,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Thing already exists") {
        res.status(409).json({
          status: "error",
          message: error.message,
        });
        return;
      }

      console.error("Create thing error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error",
      });
    }
  };
}
```

## Step 6: Register route and wire dependencies

In `src/routes/<module>.route.ts`:

- create `Router()`
- instantiate repositories using `AppDataSource`
- instantiate services
- instantiate controller
- register routes

Pattern:

```ts
import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ThingRepository } from "../repositories/thing.repository";
import { ThingService } from "../services/thing.service";
import { ThingController } from "../controllers/thing.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { AuthService } from "../services/auth.service";

const router = Router();

const thingRepository = new ThingRepository(AppDataSource);
const thingService = new ThingService(thingRepository);
const thingController = new ThingController(thingService);

// If route is protected, reuse an AuthService instance with required repos
// or import one from shared module if you centralize this later.

router.post("/", thingController.create);

export default router;
```

## Step 7: Add Swagger docs above each route

The project reads route-level swagger comments using:

- `apis: ["./src/routes/*.ts"]` in `src/swagger.ts`

So each endpoint must include an `@swagger` block directly above `router.<method>(...)`.

Pattern:

```ts
/**
 * @swagger
 * /api/things:
 *   post:
 *     summary: Create a thing
 *     tags: [Things]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateThingRequest'
 *     responses:
 *       201:
 *         description: Thing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ThingResponse'
 *       400:
 *         description: Bad request
 *       409:
 *         description: Thing already exists
 *       500:
 *         description: Internal server error
 */
router.post("/", thingController.create);
```

## Step 8: Add/extend schema components in `src/swagger.ts`

Add schema definitions for:

- request body
- success response payload
- any reusable object

Keep error responses using existing `Error` schema format.

## Step 9: Mount route in `src/app.ts` (new module only)

If creating a new route module:

1. import router in `src/app.ts`
2. mount with `app.use("/api/<module>", <module>Router)`

If only adding endpoints to an existing module route file, no app change needed.

## Step 10: If schema changed, add migration

When new entities/columns are needed:

1. update entity files in `src/entities`
2. generate migration:

```bash
npm run migration:generate
```

3. run migration:

```bash
npm run migration:run
```

Use repository methods for all access to these fields.

## 4. Error Mapping Convention

Map known service errors to explicit statuses in controller.

Recommended mapping style (based on auth module):

- validation issue -> 400
- authentication failure -> 401
- permission issue -> 403
- conflict (already exists) -> 409
- unexpected error -> 500

Use exact message checks where the service currently throws deterministic strings.

## 5. Authentication And Authorization Pattern

For protected endpoints:

1. Route uses `authenticate(authService)` middleware.
2. Middleware validates bearer token and populates `req.user`.
3. Controller reads `req.user?.sub` (or `(req as any).user?.sub` in current style).
4. Optional role guard: `authorize("ADMIN")`.

Order matters:

- `authenticate(...)` first
- `authorize(...)` second
- controller handler last

## 6. Response Shape Convention

Success response:

```json
{
  "status": "success",
  "data": {}
}
```

Error response:

```json
{
  "status": "error",
  "message": "Human-readable message"
}
```

No stack traces or internal details in API responses.

## 7. Testing Checklist For Any New Endpoint

1. Happy path returns expected status + payload shape.
2. Missing/invalid input returns 400.
3. Unauthorized request returns 401 when endpoint is protected.
4. Forbidden request returns 403 when role restriction applies.
5. Duplicate/conflict case returns 409 when relevant.
6. Unexpected failure returns 500 with standard error payload.
7. Swagger page includes the endpoint and references valid schemas.
8. Endpoint appears under `/api/docs` and can be executed from Swagger UI.

## 8. Copy-Paste Minimal Template (All Layers)

Use this as a starting scaffold for a new feature module named `things`.

```ts
// src/routes/thing.route.ts
import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ThingRepository } from "../repositories/thing.repository";
import { ThingService } from "../services/thing.service";
import { ThingController } from "../controllers/thing.controller";

const router = Router();

const thingRepo = new ThingRepository(AppDataSource);
const thingService = new ThingService(thingRepo);
const thingController = new ThingController(thingService);

router.post("/", thingController.create);
router.get("/:id", thingController.getById);

export default router;
```

```ts
// src/controllers/thing.controller.ts
import { Request, Response } from "express";
import { ThingService } from "../services/thing.service";

export class ThingController {
  constructor(private thingService: ThingService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ status: "error", message: "Name is required" });
        return;
      }

      const data = await this.thingService.create(name);
      res.status(201).json({ status: "success", data });
    } catch (error) {
      if (error instanceof Error && error.message === "Thing already exists") {
        res.status(409).json({ status: "error", message: error.message });
        return;
      }

      console.error("Thing create error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ status: "error", message: "Invalid id" });
        return;
      }

      const data = await this.thingService.getById(id);
      if (!data) {
        res.status(404).json({ status: "error", message: "Thing not found" });
        return;
      }

      res.status(200).json({ status: "success", data });
    } catch (error) {
      console.error("Thing getById error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };
}
```

```ts
// src/services/thing.service.ts
import { ThingRepository } from "../repositories/thing.repository";

export class ThingService {
  constructor(private thingRepo: ThingRepository) {}

  async create(name: string) {
    const existing = await this.thingRepo.findByName(name);
    if (existing) {
      throw new Error("Thing already exists");
    }

    return this.thingRepo.createAndSave(name);
  }

  async getById(id: number) {
    return this.thingRepo.findById(id);
  }
}
```

## 9. Common Mistakes To Avoid

1. Putting DB queries directly in controllers.
2. Returning inconsistent JSON shapes across endpoints.
3. Forgetting to add swagger docs above route declarations.
4. Forgetting to mount new route modules in `src/app.ts`.
5. Returning 500 for expected business errors (should map to 4xx).
6. Skipping auth middleware ordering on protected endpoints.
7. Adding request parsing logic inside services.

## 10. Practical Definition Of Done

A new endpoint is complete only when all are true:

1. Route registered and reachable.
2. Controller/service/repository responsibilities are separated.
3. Swagger docs and schemas are present.
4. Error mapping follows existing style.
5. Auth and role protection are applied correctly (if needed).
6. DB migration created and applied if schema changed.
7. Manual validation passes via Swagger UI or HTTP client.
