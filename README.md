# Workday Copilot 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![WXT](https://img.shields.io/badge/Built%20with-WXT-blue)
![Local LLM](https://img.shields.io/badge/Powered%20by-Local%20LLM-green)

A Chrome extension built with WXT that automates Workday job application forms using local LLM integration. Save time by automatically filling out job applications with your saved resume data.

## 🎥 Demo

[![Watch Demo Video](https://i.ytimg.com/vi/1Nw_XkKJPCw/hqdefault.jpg?sqp=-oaymwFBCNACELwBSFryq4qpAzMIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB8AEB-AHSBoAC4AOKAgwIABABGBMgUSh_MA8=&rs=AOn4CLA0E_0Jlp15k3rFM7sUty6u0ZaUng)](https://www.youtube.com/watch?v=1Nw_XkKJPCw)

## 🌟 Features

- **Local LLM Integration**: Privacy-focused form filling using your local machine's computing power
- **Smart Form Detection**: Automatically identifies and fills Workday application forms
- **Resume Data Management**: Save and manage resume data.
- **Automatic Navigation**: Seamlessly moves through application pages
- **Error Recovery**: Intelligent retry mechanism for failed form fields
- **Privacy First**: All data stays on your local machine

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Chrome/Chromium browser
- LM Studio installed

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/workday-copilot.git
cd workday-copilot
```

2. Install dependencies:

```bash
pnpm install
```

3. Start development server:

```bash
pnpm dev
```

4. Build for production (optional):

```bash
pnpm build
```

### Local LLM Setup

1. Download and install [LM Studio](https://lmstudio.ai)
2. Download your preferred model from Hugging Face
   - Recommended models:
     - Mixtral
     - Llama 2
     - OpenHermes
3. Load the model in LM Studio and start the local API server
4. Update the model endpoint in the extension configuration

## 💡 Usage

1. **Initial Setup**

   - Install the extension
   - Open extension popup
   - Navigate to settings
   - Add your resume data

2. **Using the Extension**

   - Navigate to any Workday job application
   - Click the extension icon
   - Select your resume profile
   - Click "Start Autofill"

3. **Managing Data**
   - Access saved data through the extension popup
   - Edit or delete existing data

## 🛠️ Technical Details

### Architecture

```
workday-copilot/
├── src/
│   ├── components/       # React components
│   ├── content/         # Content scripts
│   ├── background/      # Service worker
│   ├── popup/          # Extension popup
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── public/             # Static assets
└── wxt.config.ts       # WXT configuration
```

### Tech Stack

- 🛠️ WXT (Web Extension Tools)
- ⚛️ React + TypeScript
- 🎨 TailwindCSS
- 🤖 Local LLM Integration
- 📦 pnpm for package management

## 🤝 Contributing

We love contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit your changes

```bash
git commit -m 'Add some amazing feature'
```

4. Push to your branch

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Add meaningful commit messages

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Run linting
pnpm lint
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] Support for multiple job board platforms
- [ ] AI-powered cover letter generation
- [ ] Custom form field mapping
- [ ] Resume parsing improvements
- [ ] Multi-language support

## ⚠️ Troubleshooting

### Common Issues

1. **LLM Connection Failed**

   - Ensure LM Studio is running
   - Check if the API endpoint is correct
   - Verify model is properly loaded

2. **Form Fill Errors**
   - Check console for specific error messages
   - Verify resume data format
   - Ensure all required fields have mappings

## 📞 Support

- Create an issue in the GitHub repository
- Join our [Discord community](your-discord-link)
- Check the [FAQ](link-to-faq) section

## 🙏 Acknowledgments

- WXT team for the amazing extension framework
- LM Studio for local LLM capabilities
- All our contributors and supporters

---

Made with ❤️ by the open-source community
