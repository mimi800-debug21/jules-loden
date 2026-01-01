import fs from 'fs';

const content = fs.readFileSync('/home/mimi/Downloads/jules-loden-main/jules-loden-next/pages/admin.js', 'utf8');

// Track positions of all opening brackets
const openParens = [];
const openBraces = [];
const openBrackets = [];

let inString = false;
let stringChar = '';
let inComment = false;
let inLineComment = false;
let lineNum = 1;
let colNum = 1;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = i < content.length - 1 ? content[i + 1] : '';
  
  // Track line/col numbers
  if (char === '\n') {
    lineNum++;
    colNum = 1;
  } else {
    colNum++;
  }
  
  // Handle comments
  if (!inString && !inLineComment && !inComment && char === '/' && nextChar === '/') {
    inLineComment = true;
  } else if (!inString && !inLineComment && !inComment && char === '/' && nextChar === '*') {
    inComment = true;
  } else if (inComment && char === '*' && nextChar === '/') {
    inComment = false;
  } else if (inLineComment && (char === '\n')) {
    inLineComment = false;
  } 
  // Handle strings
  else if ((char === "'" || char === '"' || char === '`') && !inComment && !inLineComment) {
    if (!inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && content[i-1] !== '\\\\') {
      inString = false;
    }
  }
  // Track brackets if not in string or comment
  else if (!inString && !inComment && !inLineComment) {
    if (char === '(') {
      openParens.push({line: lineNum, col: colNum, pos: i});
    } else if (char === ')') {
      if (openParens.length > 0) {
        openParens.pop();
      } else {
        console.log(`Extra closing parenthesis at line ${lineNum}, col ${colNum}`);
      }
    } else if (char === '{') {
      openBraces.push({line: lineNum, col: colNum, pos: i});
    } else if (char === '}') {
      if (openBraces.length > 0) {
        openBraces.pop();
      } else {
        console.log(`Extra closing brace at line ${lineNum}, col ${colNum}`);
      }
    } else if (char === '[') {
      openBrackets.push({line: lineNum, col: colNum, pos: i});
    } else if (char === ']') {
      if (openBrackets.length > 0) {
        openBrackets.pop();
      } else {
        console.log(`Extra closing bracket at line ${lineNum}, col ${colNum}`);
      }
    }
  }
}

console.log('\\nUnmatched opening parentheses:', openParens.length);
if (openParens.length > 0) {
  console.log('Positions of unmatched parentheses:', openParens.slice(0, 5)); // Show first 5
}

console.log('\\nUnmatched opening braces:', openBraces.length);
if (openBraces.length > 0) {
  console.log('Positions of unmatched braces:', openBraces.slice(0, 5)); // Show first 5
}

console.log('\\nUnmatched opening brackets:', openBrackets.length);
if (openBrackets.length > 0) {
  console.log('Positions of unmatched brackets:', openBrackets.slice(0, 5)); // Show first 5
}