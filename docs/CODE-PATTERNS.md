# Code Patterns and Conventions

This document outlines the standardized patterns and conventions used in the PRD Creator codebase to reduce boilerplate and improve maintainability.

## Backend Patterns

### 1. Service Factory Pattern

All services should extend `BaseServiceClass` for consistent error handling, logging, and validation.

```typescript
import { BaseServiceClass, createService, RegisterService } from '../utils/serviceFactory';

@RegisterService('myService')
export class MyService extends BaseServiceClass {
  constructor() {
    super({
      serviceName: 'MyService',
      dependencies: { db }
    });
  }

  async myMethod(param: string): Promise<Result> {
    try {
      this.validateRequired(param, 'param');
      this.log('Executing myMethod', { param });
      
      // Your logic here
      
      return result;
    } catch (error) {
      this.handleError(error, 'myMethod');
    }
  }
}

export const myService = createService(MyService, {
  serviceName: 'MyService',
  dependencies: { db }
});
```

**Benefits:**
- Consistent error handling and logging
- Built-in validation helpers
- Service registry for dependency injection
- Standardized service lifecycle

### 2. Unified Validation Pattern

Use the consolidated validation middleware for all request validation:

```typescript
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { mySchema } from '../utils/validation';

// For body validation
router.post('/endpoint', validateBody(mySchema), handler);

// For query validation  
router.get('/endpoint', validateQuery(mySchema), handler);

// For params validation
router.get('/endpoint/:id', validateParams(mySchema), handler);

// For custom validation target
import { validate } from '../middleware/validation';
router.post('/endpoint', validate(mySchema, 'body'), handler);
```

**Benefits:**
- Single import for all validation types
- Consistent error response format
- Reduced code duplication

## Frontend Patterns

### 1. Component Factory Pattern

Use the component factory for consistent page layouts and reduced boilerplate:

```typescript
import { createPage, PageWrapper, withPageWrapper } from '../utils/componentFactory';

// Method 1: Using createPage factory
const MyContent = () => (
  <>
    <h1>My Page Title</h1>
    <p>Page content here...</p>
  </>
);

export const MyPage = createPage(MyContent, {
  variant: 'glass', // 'glass' | 'animated' | 'centered'
  className: 'custom-class',
  displayName: 'MyPage'
});

// Method 2: Using HOC pattern
const MyPageContent: React.FC = () => (
  <>
    <h1>My Page Title</h1>
    <p>Page content here...</p>
  </>
);

export const MyPage = withPageWrapper(MyPageContent, {
  variant: 'animated',
  className: 'custom-class'
});

// Method 3: Direct wrapper usage
export const MyPage: React.FC = () => (
  <PageWrapper variant="centered">
    <h1>My Page Title</h1>
    <p>Page content here...</p>
  </PageWrapper>
);
```

**Benefits:**
- Consistent page layouts
- Reduced boilerplate code
- Easy to change global styling
- Better component composition

### 2. Hook Factory Patterns

Use hook factories for common patterns:

#### CRUD Hook Factory
```typescript
import { createCRUDHook } from '../hooks/hookFactory';
import { myApiService } from '../services/myApiService';

const useMyCRUD = createCRUDHook('myEntity', myApiService);

// Usage in component
const MyComponent = () => {
  const {
    items,
    isLoadingList,
    create,
    update,
    delete: deleteItem,
    isCreating,
    createError
  } = useMyCRUD();

  // Component logic...
};
```

#### Form Hook Factory
```typescript
import { createFormHook } from '../hooks/hookFactory';

const useMyForm = createFormHook(
  { name: '', email: '' }, // initial values
  (values) => { // validation schema
    const errors: Record<string, string> = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    return errors;
  }
);

// Usage in component
const MyForm = () => {
  const {
    values,
    errors,
    getFieldProps,
    validate,
    isValid
  } = useMyForm();

  return (
    <form>
      <input {...getFieldProps('name')} placeholder="Name" />
      {errors.name && <span>{errors.name}</span>}
      
      <input {...getFieldProps('email')} placeholder="Email" />
      {errors.email && <span>{errors.email}</span>}
    </form>
  );
};
```

#### Async State Hook
```typescript
import { useAsyncState } from '../hooks/hookFactory';

const MyComponent = () => {
  const {
    state,
    loading,
    error,
    execute,
    reset
  } = useAsyncState([], () => fetchMyData());

  // Component logic...
};
```

**Benefits:**
- Consistent state management patterns
- Reduced hook boilerplate
- Reusable logic across components
- Type-safe implementations

## Migration Guide

### Migrating Existing Services

1. **Extend BaseServiceClass:**
   ```typescript
   // Before
   export class MyService {
     async myMethod() {
       // method implementation
     }
   }

   // After
   export class MyService extends BaseServiceClass {
     constructor() {
       super({ serviceName: 'MyService', dependencies: { db } });
     }
     
     async myMethod() {
       try {
         this.log('Executing myMethod');
         // method implementation
       } catch (error) {
         this.handleError(error, 'myMethod');
       }
     }
   }
   ```

2. **Use service factory:**
   ```typescript
   // Before
   export const myService = new MyService();

   // After
   export const myService = createService(MyService, {
     serviceName: 'MyService',
     dependencies: { db }
   });
   ```

### Migrating Existing Components

1. **Simple pages:**
   ```typescript
   // Before
   export const MyPage: React.FC = () => (
     <div className="glass-card p-8">
       <h1>Title</h1>
       <p>Content</p>
     </div>
   );

   // After
   const MyContent = () => (
     <>
       <h1>Title</h1>
       <p>Content</p>
     </>
   );

   export const MyPage = createPage(MyContent, {
     variant: 'glass',
     displayName: 'MyPage'
   });
   ```

2. **Complex components:**
   ```typescript
   // Before
   export const MyComponent: React.FC<Props> = (props) => (
     <div className="glass-card p-8">
       <ComplexLogic {...props} />
     </div>
   );

   // After
   const MyComponent: React.FC<Props> = (props) => (
     <ComplexLogic {...props} />
   );

   export default withPageWrapper(MyComponent, { variant: 'glass' });
   ```

### Migrating Validation

1. **Update imports:**
   ```typescript
   // Before
   import { validateBody } from '../utils/validation';

   // After
   import { validateBody } from '../middleware/validation';
   ```

2. **Use new validation helpers:**
   ```typescript
   // Before
   router.post('/endpoint', validateBody(schema), handler);
   router.get('/endpoint', validateQuery(schema), handler);

   // After (same usage, but now consolidated)
   import { validateBody, validateQuery } from '../middleware/validation';
   router.post('/endpoint', validateBody(schema), handler);
   router.get('/endpoint', validateQuery(schema), handler);
   ```

## Best Practices

1. **Always use the service factory for new services**
2. **Prefer component factories for simple pages**
3. **Use hook factories for common patterns**
4. **Import validation from middleware, not utils**
5. **Add proper TypeScript types to all factory functions**
6. **Use the service registry for dependency injection**
7. **Follow the established error handling patterns**

## Testing Patterns

The factories are designed to be easily testable:

```typescript
// Service testing
const mockService = createService(MyService, {
  serviceName: 'TestMyService',
  dependencies: { db: mockDb }
});

// Component testing
const TestPage = createPage(<div>Test Content</div>, {
  displayName: 'TestPage'
});

// Hook testing
const useTestHook = createFormHook({ field: '' });
```

This ensures consistent testing patterns across the codebase.