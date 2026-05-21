const fs = require('fs');
const babel = require('@babel/parser');
const code = fs.readFileSync('src/Dashboard.jsx', 'utf8');

const start = code.indexOf('if (loading) return');
const end = code.indexOf('export default Dashboard');
const uiCode = code.substring(start, end);
const lines = uiCode.split('\n');

for (let i = 1; i <= lines.length; i++) {
    const snippet = 'const x = () => {\n' + lines.slice(0, i).join('\n') + '\n};';
    try {
        babel.parse(snippet, { sourceType: 'module', plugins: ['jsx'] });
    } catch (e) {
        if (!e.message.includes('Unexpected token')) {
           // It might complain about unclosed JSX tags, which is fine!
           // But if it complains about something else?
        }
        // Actually, if we just parse the snippet and it fails because of unclosed JSX, that's expected.
        // We want to find where the brace balance goes wrong.
    }
}
