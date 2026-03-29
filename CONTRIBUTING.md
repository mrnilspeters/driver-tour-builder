# Contributing to Driver.js Tour Builder

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/mrnilspeters/driver-tour-builder/issues) to avoid duplicates
2. Use the **Bug Report** issue template
3. Include:
   - Chrome version
   - Extension version
   - Steps to reproduce
   - Expected vs. actual behavior
   - Console error output (if any)

### Suggesting Features

1. Open an issue using the **Feature Request** template
2. Describe the use case and expected behavior
3. Include mockups or examples if possible

### Submitting Code

1. **Fork** the repository
2. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
3. Make your changes
4. Test the extension manually in Chrome (`chrome://extensions/` → Load unpacked)
5. **Commit** with a descriptive message:
   ```bash
   git commit -m "feat: add timing delay between steps"
   ```
6. **Push** to your fork and open a **Pull Request**

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style (formatting, no logic change) |
| `refactor:` | Code refactoring |
| `chore:` | Maintenance tasks |
| `i18n:` | Translation updates |

### Code Style

- **No build tools required** — this is a vanilla JS project
- Use `const`/`let`, no `var`
- Template literals over string concatenation
- Descriptive variable names
- Comment complex logic

### Adding Translations

1. Open `sidepanel/i18n.js`
2. Add your language key to the `I18N` object (e.g., `fr: { ... }`)
3. Copy all keys from the `en` block and translate them
4. Add the language option to `sidepanel/sidepanel.html` in the `#lang-select` dropdown

## Development Setup

```bash
# Clone the repo
git clone https://github.com/mrnilspeters/driver-tour-builder.git
cd driver-tour-builder

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked" → select the project folder
```

There is no build step — all files are served directly as a Chrome extension.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
