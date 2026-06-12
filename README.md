# Userscript Template

A TypeScript mono repository for building maintainable userscripts using SOLID and Domain-Driven Design principles.

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Build all userscripts
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test
```

## Project Structure

```
src/
├── core/                           # Cross-cutting utilities (NOT onion layers)
│   ├── concurrency/               # Async patterns and utilities
│   ├── logger/                    # Structured logging
│   ├── result/                    # Result monad for error handling
│   ├── utils/                     # Helper functions
│   └── index.ts
├── domain/                         # Innermost: Core business entities
│   ├── Shared/                    # Shared entities & value objects
│   ├── FeatureX/                  # Feature-specific domain logic
│   └── index.ts
├── application/                    # Middle: Use cases & contracts
│   ├── Shared/                    # Abstract contracts all features depend on
│   ├── FeatureX/                  # Feature use cases (extend Shared)
│   └── index.ts
├── infrastructure/                 # Outermost: Concrete implementations
│   ├── Shared/                    # Reusable adapters (LocalStorageAdapter, etc.)
│   ├── FeatureX/                  # Feature-specific wiring
│   └── index.ts
└── entries/                        # Userscript entry points (composition root)
```

## Architecture

The project follows **Clean Architecture** organized as concentric layers:

```
┌─────────────────────────────────────────┐
│      infrastructure/                    │
│   Concrete Implementations              │
│   (Adapters, Repositories, etc.)        │
├─────────────────────────────────────────┤
│      application/                       │
│   Use Cases & Abstract Contracts        │
│   (Business Rules, Interfaces)          │
├─────────────────────────────────────────┤
│      domain/                            │
│   Entities & Value Objects              │
│   (Core Business Logic)                 │
└─────────────────────────────────────────┘
```

### Dependency Rule

- ✅ `infrastructure/FeatureX` → `application/FeatureX` → `domain/FeatureX`
- ✅ `infrastructure/FeatureX` → `infrastructure/Shared`
- ✅ `application/FeatureX` → `application/Shared`
- ✅ `application/FeatureX` → `domain/Shared` & `domain/FeatureX`
- ✅ Everything → `core/`
- ❌ `domain/FeatureX` → `application/` or `infrastructure/`
- ❌ `application/FeatureX` → `infrastructure/FeatureX`
- ❌ `FeatureX` → `FeatureY` (any layer)

## SOLID Principles

- **S**ingle Responsibility: Each class/module has one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Implementations swap seamlessly for contracts
- **I**nterface Segregation: Contracts are focused and minimal
- **D**ependency Inversion: Depend on abstractions, not concrete implementations

## Domain-Driven Design

- **Bounded Contexts**: Each userscript is a separate bounded context
- **Ubiquitous Language**: Use domain terminology consistently in code
- **Entities & Value Objects**: Model domain concepts explicitly
- **Aggregates**: Group related entities with clear boundaries

## Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Abstract Contracts | PascalCase + `-Contract` or `-Port` | `StorageContract.ts` |
| Implementations | PascalCase + `-Adapter` or `-Repository` | `LocalStorageAdapter.ts` |
| Use Cases | PascalCase + `-UseCase` | `SaveItemUseCase.ts` |
| Domain Entities | PascalCase | `RssItem.ts` |
| Utilities/Helpers | camelCase | `stringUtils.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |

## Import Aliases

Always use absolute path aliases — never relative paths (`../`) or bare `src/` prefixes.

| Alias | Maps to |
|---|---|
| `@core/*` | `src/core/*` |
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |

```typescript
// Bad
import { StorageContract } from '../../application/Shared'
import { StorageContract } from 'src/application/Shared'

// Good
import { StorageContract } from '@application/Shared'
```

## Export Patterns

Use barrel exports (`index.ts`) for clean imports:

```typescript
// Bad
import { StorageContract } from '@application/Shared/StorageContract'

// Good
import { StorageContract } from '@application/Shared'
```

## Polymorphic Extension Pattern

Features extend shared abstractions rather than knowing about each other:

```typescript
// application/Shared/OrderFinder.ts (abstract contract)
export abstract class OrderFinder {
  abstract find(request: OrderRequest): Promise<Candidate[]>
}

// application/Rides/RideOrderFinder.ts
export class RideOrderFinder extends OrderFinder {
  async find(request: OrderRequest): Promise<Candidate[]> { ... }
}

// application/Kittens/KittyOrderFinder.ts
export class KittyOrderFinder extends OrderFinder {
  async find(request: OrderRequest): Promise<Candidate[]> { ... }
}
```

Features are **never** direct dependencies of each other. All cross-feature interaction goes through `Shared/` abstractions.

## Dependency Injection

Wire dependencies in the entry point (composition root):

```typescript
// entries/rideService.ts
import { RideOrderFinder } from '@application/Rides'
import { LocalStorageAdapter } from '@infrastructure/Shared'
import { RidePipeline } from '@application/Rides'

export function createRideService() {
  const storage = new LocalStorageAdapter()
  const finder = new RideOrderFinder(storage)
  return new RidePipeline(finder)
}
```

## Error Handling

Use the `Result` monad from `@core/result` instead of throwing:

```typescript
type Result<T, E = Error> = Ok<T> | Err<E>;

function parse(input: string): Result<Data> {
  // ...
}
```

## Logging

Use the `Logger` from `@core/logger` — no `console.log`:

```typescript
import { Logger } from '@core/logger';

const logger = new Logger("MyModule");
logger.info("User action");
logger.error("An error occurred", error);
```

## Concurrency Utilities

Available in `src/core/concurrency/`:

| Utility | Purpose |
|---|---|
| `Executor` | Base interface for async execution |
| `PoolExecutor` | Limits concurrent executions |
| `ThrottledExecutor` | Rate-limits execution |
| `BackoffPolicy` | Retry strategies (constant, exponential) |
| `Batch` | Batch processing utilities |
| `sleep` | Delay utilities |

## Testing Strategy

- **Unit Tests**: Test domain entities and shared abstractions; mock implementations
- **Integration Tests**: Test feature implementations with real adapters

Test files mirror source structure:

```
tests/
├── core/
├── domain/
│   ├── Shared/
│   └── FeatureX/
├── application/
│   ├── Shared/
│   └── FeatureX/
└── infrastructure/
    ├── Shared/
    └── FeatureX/
```

## Adding a New Userscript

1. Define domain entities in `src/domain/FeatureX/`
2. Define application contracts/use cases in `src/application/FeatureX/` (extend `Shared/` abstractions)
3. Implement infrastructure adapters in `src/infrastructure/FeatureX/`
4. Create entry point in `src/entries/FeatureX.ts` and wire dependencies
5. Add tests in `tests/` mirroring the structure

## Code Review Checklist

- [ ] Code follows SOLID principles
- [ ] Layer boundaries are respected (domain / application / infrastructure)
- [ ] Domain layer has zero dependencies on outer layers
- [ ] Application layer depends only on domain and Shared abstractions
- [ ] Infrastructure layer implements application contracts only
- [ ] Features extend Shared abstractions, never import other features
- [ ] All dependencies are injected (not created inline)
- [ ] Tests exist for new logic
- [ ] No `console.log`; use Logger instead
- [ ] Error handling uses Result monad
- [ ] Exports use barrel patterns
- [ ] All imports use `@core`, `@domain`, `@application`, or `@infrastructure` aliases
- [ ] File naming follows conventions
- [ ] TypeScript strict checks pass

## Resources

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/)
- [tsdown Documentation](https://tsdown.dev/)
