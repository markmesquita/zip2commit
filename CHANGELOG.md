# Change Log

All notable changes to the "zip2commit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0] - 2023-07-15

- Complete code refactoring with componentization for better maintainability
- English translation of all code and documentation
- Added branch name sanitization to ensure the ZIP file is created with a valid name
- Invalid characters in filenames (such as `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) are replaced with underscores (`_`)
- Improved file retrieval process to checkout to the correct branch before compressing files
- Added functionality to automatically return to the original branch after compression
- Enhanced error handling and logging
- Added support for international collaboration

## [0.0.5] - Initial release

- Basic functionality to compress files from a specific commit
