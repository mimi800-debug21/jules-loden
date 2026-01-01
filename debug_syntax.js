import fs from 'fs';
const content = fs.readFileSync('/home/mimi/Downloads/jules-loden-main/jules-loden-next/pages/admin.js', 'utf8');

let parenCount = 0;
let braceCount = 0;
let bracketCount = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let inLineComment = false;
let lineNum = 1;
let colNum = 1;

// Track positions where counts go negative (potential issues)
const parenIssues = [];
const braceIssues = [];
const bracketIssues = [];

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
    } else if (char === stringChar && content[i-1] !== '\\') {
      inString = false;
    }
  }
  // Count brackets/parentheses/braces if not in string or comment
  else if (!inString && !inComment && !inLineComment) {
    if (char === '(') {
      parenCount++;
    } else if (char === ')') {
      parenCount--;
      if (parenCount < 0) {
        parenIssues.push({line: lineNum, col: colNum, char: char, count: parenCount});
        parenCount = 0; // Reset to continue counting
      }
    } else if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount < 0) {
        braceIssues.push({line: lineNum, col: colNum, char: char, count: braceCount});
        braceCount = 0; // Reset to continue counting
      }
    } else if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount < 0) {
        bracketIssues.push({line: lineNum, col: colNum, char: char, count: bracketCount});
        bracketCount = 0; // Reset to continue counting
      }
    }
  }
}

console.log('Final counts:', {paren: parenCount, brace: braceCount, bracket: bracketCount});
console.log('Paren issues:', parenIssues);
console.log('Brace issues:', braceIssues);
console.log('Bracket issues:', bracketIssues);

// Also show the last few places where counts are positive
// This might indicate missing closing brackets
console.log('\\nPotential missing closing brackets:');
if (parenCount > 0) {
  console.log(`Missing ${parenCount} closing parentheses`);
}
if (braceCount > 0) {
  console.log(`Missing ${braceCount} closing braces`);
}
if (bracketCount > 0) {
  console.log(`Missing ${bracketCount} closing brackets`);
}