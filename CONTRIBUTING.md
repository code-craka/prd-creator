# Contributing to PRD Creator

Thank you for your interest in contributing to PRD Creator! This guide will help you get started with contributing to this project.

## 🎯 How to Contribute

### Types of Contributions

We welcome all types of contributions, including:

- 🐛 **Bug Reports**: Report issues and bugs
- 🚀 **Feature Requests**: Suggest new features or improvements
- 📖 **Documentation**: Improve documentation and guides
- 🔧 **Code Contributions**: Submit bug fixes and new features
- 🎨 **UI/UX Improvements**: Enhance the user experience
- 🧪 **Testing**: Add tests and improve test coverage

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL 14.0 or higher
- Git
- GitHub account

### Development Setup

1. **Fork the repository**
   ```bash
   # Visit https://github.com/code-craka/prd-creator
   # Click "Fork" to create your own copy
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/prd-creator.git
   cd prd-creator
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/code-craka/prd-creator.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up the database**
   ```bash
   createdb prd_creator_dev
   cd backend
   npm run db:migrate
   ```

6. **Create environment files**
   ```bash
   # Backend .env
   cp backend/.env.example backend/.env
   
   # Frontend .env
   cp frontend/.env.example frontend/.env
   ```

7. **Start development servers**
   ```bash
   npm run dev
   ```

## 📋 Development Process

### 1. Choose an Issue

- Browse [open issues](https://github.com/code-craka/prd-creator/issues)
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to let others know you're working on it

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 3. Make Your Changes

- Follow the coding standards (see below)
- Add tests for new features
- Update documentation if needed
- Ensure your code passes all tests

### 4. Test Your Changes

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check

# Test the build
npm run build
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "type: description of changes"
```

#### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality
fix(api): resolve user registration validation error
docs(readme): update installation instructions
style(frontend): improve button component styling
```

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub:
1. Go to your fork on GitHub
2. Click "New pull request"
3. Select your branch and provide a clear description

## 🎨 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type when possible
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for prop types
- Keep components small and focused

### Backend

- Use async/await for asynchronous operations
- Implement proper error handling
- Use TypeScript interfaces for API responses
- Follow RESTful API conventions

### Database

- Use Knex.js migrations for schema changes
- Include proper indexes for performance
- Use transactions for multi-table operations
- Follow PostgreSQL best practices

### Styling

- Use Tailwind CSS classes
- Follow the glassmorphism design system
- Ensure responsive design
- Maintain consistent spacing and typography

## 🧪 Testing

### Writing Tests

- Add unit tests for new functions
- Add integration tests for API endpoints
- Test both success and error scenarios
- Use descriptive test names

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📖 Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Include usage examples
- Keep comments up to date

### User Documentation

- Update README.md for new features
- Add API documentation for new endpoints
- Include screenshots for UI changes
- Update changelog

## 🔍 Code Review Process

### Pull Request Guidelines

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what changes were made and why
3. **Testing**: Describe how the changes were tested
4. **Screenshots**: Include screenshots for UI changes
5. **Breaking Changes**: Note any breaking changes

### Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact is considered
- [ ] Security implications are addressed

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and discussions
- **Email**: codecraka@gmail.com for direct contact

### Resources

- [Project Documentation](./docs/)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Development Guide](./docs/DEVELOPMENT.md)

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes (for significant contributions)

## 📄 License

By contributing to PRD Creator, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You

Thank you for taking the time to contribute to PRD Creator! Your contributions help make this project better for everyone.

---

**Questions?** Don't hesitate to reach out to [@code-craka](https://github.com/code-craka) or open an issue.

*Happy coding!* 🚀