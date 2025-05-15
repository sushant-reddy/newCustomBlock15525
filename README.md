# Email Block Builder for Salesforce Marketing Cloud

This custom content block for Salesforce Marketing Cloud enables marketers to generate responsive, production-ready email HTML/CSS using natural language prompts powered by OpenAI's GPT models.

## Features

- Simple UI with a prompt input area and code editor
- Integration with OpenAI's API for generating email code
- Full SDK integration with Salesforce Marketing Cloud
- Retains conversation history for iterative refinement
- Responsive design for easy use on any device

## Installation

### Prerequisites

- Access to Salesforce Marketing Cloud
- Content Builder access
- OpenAI API key

### Setup Instructions

1. Clone this repository:
   ```
   git clone https://your-repository-url/email-block-builder.git
   cd email-block-builder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Host the application files on a publicly accessible web server:
   - Upload all files to your web server
   - Make sure the server supports HTTPS

4. Create a new Content Block in Salesforce Marketing Cloud:
   - Go to Content Builder
   - Navigate to Content Builder > Create > Custom Content Block
   - Fill in the required information and link to your hosted application

## Usage

1. Add the Email Block Builder content block to your email
2. Enter your OpenAI API key when prompted (stored locally in your browser)
3. Write a natural language prompt describing the email you want to create
4. Click "Generate Email Code" to get the HTML/CSS
5. Review and edit the generated code if needed
6. Click "Apply Changes" to save the code to your email

### Example Prompts

- "Generate a responsive two-column layout with a hero image, headline in Helvetica, body text, and a rounded CTA button."
- "Create a promotional email with a 30% off code, product grid, and social media footer."
- "Design a newsletter template with a header logo, three article sections, and an unsubscribe footer."

## Configuration

You can modify the system prompt in `js/config.js` to customize how the AI generates email code.

## Technical Details

- Uses the Salesforce Marketing Cloud Block SDK for integration
- Integrates with OpenAI's API for code generation
- Stores conversation history for iterative improvements
- No server-side dependencies required

## License

MIT License