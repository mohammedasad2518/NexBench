import type { 
  SimulatedPin, 
  PinMode, 
  RuntimeStatus, 
  ConsoleMessage, 
  ArduinoProgramStats 
} from '../types/workbench';
import type { 
  UltrasonicCircuitState, 
  PotentiometerCircuitState,
  LineSensorCircuitState,
  ServoCircuitState
} from './hardwareBridge';

// ============================================================================
// Phase 4A: Arduino Sandboxed Lexer, Parser & AST Types
// ============================================================================

export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'PUNCTUATOR'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export type ASTNode =
  | Program
  | FunctionDecl
  | VariableDecl
  | BlockStatement
  | ExpressionStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | ReturnStatement;

export interface Program {
  type: 'Program';
  body: ASTNode[];
  line: number;
}

export interface FunctionDecl {
  type: 'FunctionDecl';
  name: string;
  returnType: string;
  params: string[];
  body: BlockStatement;
  line: number;
}

export interface VariableDecl {
  type: 'VariableDecl';
  varType: string;
  name: string;
  init: Expression | null;
  line: number;
}

export interface BlockStatement {
  type: 'BlockStatement';
  body: ASTNode[];
  line: number;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
  line: number;
}

export interface IfStatement {
  type: 'IfStatement';
  test: Expression;
  consequent: ASTNode;
  alternate: ASTNode | null;
  line: number;
}

export interface WhileStatement {
  type: 'WhileStatement';
  test: Expression;
  body: ASTNode;
  line: number;
}

export interface ForStatement {
  type: 'ForStatement';
  init: ASTNode | null;
  test: Expression | null;
  update: Expression | null;
  body: ASTNode;
  line: number;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  argument: Expression | null;
  line: number;
}

export type Expression =
  | BinaryExpr
  | UnaryExpr
  | UpdateExpr
  | AssignmentExpr
  | CallExpr
  | LiteralExpr
  | IdentifierExpr;

export interface BinaryExpr {
  type: 'BinaryExpr';
  operator: string;
  left: Expression;
  right: Expression;
  line: number;
}

export interface UnaryExpr {
  type: 'UnaryExpr';
  operator: string;
  argument: Expression;
  line: number;
}

export interface UpdateExpr {
  type: 'UpdateExpr';
  operator: '++' | '--';
  argument: string;
  isPrefix: boolean;
  line: number;
}

export interface AssignmentExpr {
  type: 'AssignmentExpr';
  operator: '=' | '+=' | '-=' | '*=' | '/=';
  target: string;
  value: Expression;
  line: number;
}

export interface CallExpr {
  type: 'CallExpr';
  callee: string;
  args: Expression[];
  line: number;
}

export interface LiteralExpr {
  type: 'LiteralExpr';
  value: number | string | boolean;
  raw: string;
  line: number;
}

export interface IdentifierExpr {
  type: 'IdentifierExpr';
  name: string;
  line: number;
}

// ============================================================================
// Safe Lexer (Tokenizes Arduino C++ Code)
// ============================================================================

const KEYWORDS = new Set([
  'void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'char', 'const', 'volatile', 'unsigned',
  'if', 'else', 'while', 'for', 'return',
  'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN',
  'RISING', 'FALLING', 'CHANGE',
  'true', 'false',
  'Servo'
]);

export class ArduinoLexer {
  private code: string;
  private pos = 0;
  private line = 1;
  private col = 1;

  constructor(code: string) {
    this.code = code;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.code.length) {
      const char = this.code[this.pos];

      // Newlines & Whitespace
      if (char === '\n') {
        this.line++;
        this.col = 1;
        this.pos++;
        continue;
      }
      if (char === '\r') {
        this.pos++;
        continue;
      }
      if (/\s/.test(char)) {
        this.col++;
        this.pos++;
        continue;
      }

      // Preprocessor directives (e.g. '#include <Servo.h>', '#define ...')
      if (char === '#') {
        while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
          this.pos++;
        }
        continue;
      }

      // Comments: Single-line '//'
      if (char === '/' && this.code[this.pos + 1] === '/') {
        this.pos += 2;
        while (this.pos < this.code.length && this.code[this.pos] !== '\n') {
          this.pos++;
        }
        continue;
      }

      // Comments: Multi-line '/* ... */'
      if (char === '/' && this.code[this.pos + 1] === '*') {
        this.pos += 2;
        this.col += 2;
        while (this.pos < this.code.length && !(this.code[this.pos] === '*' && this.code[this.pos + 1] === '/')) {
          if (this.code[this.pos] === '\n') {
            this.line++;
            this.col = 1;
          } else {
            this.col++;
          }
          this.pos++;
        }
        if (this.pos < this.code.length) {
          this.pos += 2;
          this.col += 2;
        }
        continue;
      }

      const startLine = this.line;
      const startCol = this.col;

      // String literals
      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        this.pos++;
        this.col++;
        while (this.pos < this.code.length && this.code[this.pos] !== quote) {
          if (this.code[this.pos] === '\\' && this.pos + 1 < this.code.length) {
            this.pos++;
            this.col++;
            const esc = this.code[this.pos];
            if (esc === 'n') str += '\n';
            else if (esc === 't') str += '\t';
            else str += esc;
          } else {
            str += this.code[this.pos];
          }
          this.pos++;
          this.col++;
        }
        if (this.pos < this.code.length) {
          this.pos++;
          this.col++;
        }
        tokens.push({ type: 'STRING', value: str, line: startLine, col: startCol });
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let numStr = '';
        while (this.pos < this.code.length && /[0-9.]/.test(this.code[this.pos])) {
          numStr += this.code[this.pos];
          this.pos++;
          this.col++;
        }
        tokens.push({ type: 'NUMBER', value: numStr, line: startLine, col: startCol });
        continue;
      }

      // Identifiers & Keywords (including member expressions like Serial.println)
      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (this.pos < this.code.length && /[a-zA-Z0-9_.]/.test(this.code[this.pos])) {
          ident += this.code[this.pos];
          this.pos++;
          this.col++;
        }

        const type: TokenType = KEYWORDS.has(ident) ? 'KEYWORD' : 'IDENTIFIER';
        tokens.push({ type, value: ident, line: startLine, col: startCol });
        continue;
      }

      // Two-character operators
      const twoChars = this.code.slice(this.pos, this.pos + 2);
      if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/='].includes(twoChars)) {
        tokens.push({ type: 'OPERATOR', value: twoChars, line: startLine, col: startCol });
        this.pos += 2;
        this.col += 2;
        continue;
      }

      // Single-character operators
      if (['=', '+', '-', '*', '/', '%', '<', '>', '!'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char, line: startLine, col: startCol });
        this.pos++;
        this.col++;
        continue;
      }

      // Punctuators
      if (['(', ')', '{', '}', ';', ',', '[', ']'].includes(char)) {
        tokens.push({ type: 'PUNCTUATOR', value: char, line: startLine, col: startCol });
        this.pos++;
        this.col++;
        continue;
      }

      // Unknown character fallback
      this.pos++;
      this.col++;
    }

    tokens.push({ type: 'EOF', value: '', line: this.line, col: this.col });
    return tokens;
  }
}

// ============================================================================
// Safe Parser (Recursive Descent AST Builder)
// ============================================================================

export class ArduinoParser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const body: ASTNode[] = [];
    const startLine = this.peek().line;

    while (!this.isAtEnd()) {
      // Optional trailing semicolons
      if (this.match('PUNCTUATOR', ';')) continue;
      body.push(this.declaration());
    }

    return { type: 'Program', body, line: startLine };
  }

  private declaration(): ASTNode {
    // Check for optional type modifiers (e.g. 'volatile', 'const', 'unsigned')
    while (this.isTypeModifier(this.peek())) {
      this.advance();
    }

    // Check for variable declaration: int x = 10;
    if (this.isTypeKeyword(this.peek())) {
      const typeToken = this.advance();

      // Check if it's a function declaration, e.g. void setup()
      if (this.peek().type === 'IDENTIFIER' && this.lookAhead(1)?.value === '(') {
        const nameToken = this.advance();
        return this.functionDeclaration(typeToken.value, nameToken.value, typeToken.line);
      }

      // Otherwise it's a variable declaration
      return this.variableDeclaration(typeToken.value, typeToken.line);
    }

    return this.statement();
  }

  private functionDeclaration(returnType: string, name: string, line: number): FunctionDecl {
    this.consume('PUNCTUATOR', '(', `Expected '(' after function name at line ${line}`);
    const params: string[] = [];
    if (!this.check('PUNCTUATOR', ')')) {
      do {
        while (this.isTypeModifier(this.peek())) this.advance();
        if (this.isTypeKeyword(this.peek())) this.advance();
        if (this.peek().type === 'IDENTIFIER') {
          params.push(this.advance().value);
        }
      } while (this.match('PUNCTUATOR', ','));
    }
    this.consume('PUNCTUATOR', ')', `Expected ')' after parameters at line ${line}`);

    const body = this.blockStatement();
    return {
      type: 'FunctionDecl',
      name,
      returnType,
      params,
      body,
      line,
    };
  }

  private variableDeclaration(varType: string, line: number): VariableDecl {
    const nameToken = this.consume('IDENTIFIER', undefined, `Expected variable name at line ${line}`);
    let init: Expression | null = null;

    if (this.match('OPERATOR', '=')) {
      init = this.expression();
    }

    this.consume('PUNCTUATOR', ';', `Expected ';' after variable declaration at line ${line}`);
    return {
      type: 'VariableDecl',
      varType,
      name: nameToken.value,
      init,
      line,
    };
  }

  private statement(): ASTNode {
    if (this.match('KEYWORD', 'if')) return this.ifStatement();
    if (this.match('KEYWORD', 'while')) return this.whileStatement();
    if (this.match('KEYWORD', 'for')) return this.forStatement();
    if (this.match('KEYWORD', 'return')) return this.returnStatement();
    if (this.check('PUNCTUATOR', '{')) return this.blockStatement();

    return this.expressionStatement();
  }

  private ifStatement(): IfStatement {
    const line = this.previous().line;
    this.consume('PUNCTUATOR', '(', `Expected '(' after 'if' at line ${line}`);
    const test = this.expression();
    this.consume('PUNCTUATOR', ')', `Expected ')' after if condition at line ${line}`);

    const consequent = this.statement();
    let alternate: ASTNode | null = null;
    if (this.match('KEYWORD', 'else')) {
      alternate = this.statement();
    }

    return { type: 'IfStatement', test, consequent, alternate, line };
  }

  private whileStatement(): WhileStatement {
    const line = this.previous().line;
    this.consume('PUNCTUATOR', '(', `Expected '(' after 'while' at line ${line}`);
    const test = this.expression();
    this.consume('PUNCTUATOR', ')', `Expected ')' after while condition at line ${line}`);

    const body = this.statement();
    return { type: 'WhileStatement', test, body, line };
  }

  private forStatement(): ForStatement {
    const line = this.previous().line;
    this.consume('PUNCTUATOR', '(', `Expected '(' after 'for' at line ${line}`);

    let init: ASTNode | null = null;
    if (!this.match('PUNCTUATOR', ';')) {
      while (this.isTypeModifier(this.peek())) this.advance();
      if (this.isTypeKeyword(this.peek())) {
        const typeToken = this.advance();
        init = this.variableDeclaration(typeToken.value, typeToken.line);
      } else {
        init = this.expressionStatement();
      }
    }

    let test: Expression | null = null;
    if (!this.check('PUNCTUATOR', ';')) {
      test = this.expression();
    }
    this.consume('PUNCTUATOR', ';', `Expected ';' after for loop condition at line ${line}`);

    let update: Expression | null = null;
    if (!this.check('PUNCTUATOR', ')')) {
      update = this.expression();
    }
    this.consume('PUNCTUATOR', ')', `Expected ')' after for loop clauses at line ${line}`);

    const body = this.statement();
    return { type: 'ForStatement', init, test, update, body, line };
  }

  private returnStatement(): ReturnStatement {
    const line = this.previous().line;
    let argument: Expression | null = null;
    if (!this.check('PUNCTUATOR', ';')) {
      argument = this.expression();
    }
    this.consume('PUNCTUATOR', ';', `Expected ';' after return at line ${line}`);
    return { type: 'ReturnStatement', argument, line };
  }

  private blockStatement(): BlockStatement {
    const line = this.peek().line;
    this.consume('PUNCTUATOR', '{', `Expected '{' at line ${line}`);
    const body: ASTNode[] = [];

    while (!this.check('PUNCTUATOR', '}') && !this.isAtEnd()) {
      body.push(this.declaration());
    }

    this.consume('PUNCTUATOR', '}', `Expected '}' at line ${line}`);
    return { type: 'BlockStatement', body, line };
  }

  private expressionStatement(): ExpressionStatement {
    const expr = this.expression();
    const line = expr.line;
    this.consume('PUNCTUATOR', ';', `Expected ';' after expression at line ${line}`);
    return { type: 'ExpressionStatement', expression: expr, line };
  }

  // Expression Parsing (Operator Precedence)
  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expr = this.logicalOr();

    if (this.match('OPERATOR', '=', '+=', '-=', '*=', '/=')) {
      const op = this.previous().value as '=' | '+=' | '-=' | '*=' | '/=';
      const value = this.assignment();

      if (expr.type === 'IdentifierExpr') {
        return {
          type: 'AssignmentExpr',
          operator: op,
          target: expr.name,
          value,
          line: expr.line,
        };
      }
      throw new Error(`Invalid assignment target at line ${expr.line}`);
    }

    return expr;
  }

  private logicalOr(): Expression {
    let expr = this.logicalAnd();
    while (this.match('OPERATOR', '||')) {
      const op = this.previous().value;
      const right = this.logicalAnd();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private logicalAnd(): Expression {
    let expr = this.equality();
    while (this.match('OPERATOR', '&&')) {
      const op = this.previous().value;
      const right = this.equality();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private equality(): Expression {
    let expr = this.comparison();
    while (this.match('OPERATOR', '==', '!=')) {
      const op = this.previous().value;
      const right = this.comparison();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();
    while (this.match('OPERATOR', '<', '<=', '>', '>=')) {
      const op = this.previous().value;
      const right = this.term();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private term(): Expression {
    let expr = this.factor();
    while (this.match('OPERATOR', '+', '-')) {
      const op = this.previous().value;
      const right = this.factor();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();
    while (this.match('OPERATOR', '*', '/', '%')) {
      const op = this.previous().value;
      const right = this.unary();
      expr = { type: 'BinaryExpr', operator: op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private unary(): Expression {
    if (this.match('OPERATOR', '!', '-', '+')) {
      const op = this.previous().value;
      const arg = this.unary();
      return { type: 'UnaryExpr', operator: op, argument: arg, line: this.previous().line };
    }
    if (this.match('OPERATOR', '++', '--')) {
      const op = this.previous().value as '++' | '--';
      const token = this.consume('IDENTIFIER', undefined, `Expected variable for prefix ${op}`);
      return {
        type: 'UpdateExpr',
        operator: op,
        argument: token.value,
        isPrefix: true,
        line: token.line,
      };
    }

    return this.postfix();
  }

  private postfix(): Expression {
    const expr = this.primary();

    if (this.match('OPERATOR', '++', '--')) {
      const op = this.previous().value as '++' | '--';
      if (expr.type === 'IdentifierExpr') {
        return {
          type: 'UpdateExpr',
          operator: op,
          argument: expr.name,
          isPrefix: false,
          line: expr.line,
        };
      }
      throw new Error(`Invalid target for ${op} at line ${expr.line}`);
    }

    return expr;
  }

  private primary(): Expression {
    const token = this.peek();

    // Constant Literals
    if (token.type === 'NUMBER') {
      this.advance();
      return { type: 'LiteralExpr', value: Number(token.value), raw: token.value, line: token.line };
    }

    if (token.type === 'STRING') {
      this.advance();
      return { type: 'LiteralExpr', value: token.value, raw: token.value, line: token.line };
    }

    if (token.type === 'KEYWORD') {
      if (token.value === 'true') {
        this.advance();
        return { type: 'LiteralExpr', value: true, raw: 'true', line: token.line };
      }
      if (token.value === 'false') {
        this.advance();
        return { type: 'LiteralExpr', value: false, raw: 'false', line: token.line };
      }
      if (token.value === 'HIGH') {
        this.advance();
        return { type: 'LiteralExpr', value: 1, raw: 'HIGH', line: token.line };
      }
      if (token.value === 'LOW') {
        this.advance();
        return { type: 'LiteralExpr', value: 0, raw: 'LOW', line: token.line };
      }
      if (token.value === 'OUTPUT') {
        this.advance();
        return { type: 'LiteralExpr', value: 1, raw: 'OUTPUT', line: token.line };
      }
      if (token.value === 'INPUT') {
        this.advance();
        return { type: 'LiteralExpr', value: 0, raw: 'INPUT', line: token.line };
      }
      if (token.value === 'INPUT_PULLUP') {
        this.advance();
        return { type: 'LiteralExpr', value: 2, raw: 'INPUT_PULLUP', line: token.line };
      }
      if (token.value === 'LED_BUILTIN') {
        this.advance();
        return { type: 'LiteralExpr', value: 13, raw: 'LED_BUILTIN', line: token.line };
      }
      if (token.value === 'RISING') {
        this.advance();
        return { type: 'LiteralExpr', value: 1, raw: 'RISING', line: token.line };
      }
      if (token.value === 'FALLING') {
        this.advance();
        return { type: 'LiteralExpr', value: 2, raw: 'FALLING', line: token.line };
      }
      if (token.value === 'CHANGE') {
        this.advance();
        return { type: 'LiteralExpr', value: 3, raw: 'CHANGE', line: token.line };
      }
    }

    // Function calls or variable references
    if (token.type === 'IDENTIFIER') {
      this.advance();
      const name = token.value;

      // Function call: foo(...)
      if (this.match('PUNCTUATOR', '(')) {
        const args: Expression[] = [];
        if (!this.check('PUNCTUATOR', ')')) {
          do {
            args.push(this.expression());
          } while (this.match('PUNCTUATOR', ','));
        }
        this.consume('PUNCTUATOR', ')', `Expected ')' after function arguments at line ${token.line}`);
        return { type: 'CallExpr', callee: name, args, line: token.line };
      }

      return { type: 'IdentifierExpr', name, line: token.line };
    }

    // Parenthesized expressions: (x + 1)
    if (this.match('PUNCTUATOR', '(')) {
      const expr = this.expression();
      this.consume('PUNCTUATOR', ')', `Expected ')' after expression at line ${token.line}`);
      return expr;
    }

    throw new Error(`Unexpected token '${token.value || token.type}' at line ${token.line}, column ${token.col}`);
  }

  // Helpers
  private match(type: TokenType, ...values: string[]): boolean {
    for (const val of values) {
      if (this.check(type, val)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', line: 1, col: 1 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private lookAhead(n: number): Token | undefined {
    return this.tokens[this.current + n];
  }

  private consume(type: TokenType, value?: string, errorMsg?: string): Token {
    if (this.check(type, value)) return this.advance();
    const token = this.peek();
    throw new Error(errorMsg || `Syntax Error at line ${token.line}: expected ${value || type}, got '${token.value}'`);
  }

  private isTypeModifier(token: Token): boolean {
    return token.type === 'KEYWORD' && ['volatile', 'const', 'unsigned'].includes(token.value);
  }

  private isTypeKeyword(token: Token): boolean {
    return token.type === 'KEYWORD' && ['void', 'int', 'long', 'float', 'double', 'bool', 'boolean', 'char', 'Servo'].includes(token.value);
  }
}

// ============================================================================
// Virtual Hardware State Manager (Simulated Arduino Uno Pin Bank)
// ============================================================================

export function createDefaultUnoPins(): Record<number, SimulatedPin> {
  const pins: Record<number, SimulatedPin> = {};

  // Digital Pins D0 - D13
  for (let i = 0; i <= 13; i++) {
    pins[i] = {
      pin: i,
      name: `D${i}`,
      mode: 'INPUT',
      digitalValue: 0,
      analogValue: 0,
      pwmValue: 0,
      isPwm: [3, 5, 6, 9, 10, 11].includes(i),
      lastUpdated: Date.now(),
    };
  }

  // Analog Pins A0 - A5 (mapped to 14 - 19)
  for (let a = 0; a <= 5; a++) {
    const pinNum = 14 + a;
    pins[pinNum] = {
      pin: pinNum,
      name: `A${a}`,
      mode: 'INPUT',
      digitalValue: 0,
      analogValue: 0,
      pwmValue: 0,
      isPwm: false,
      lastUpdated: Date.now(),
    };
  }

  return pins;
}

// ============================================================================
// Safe Interpreter & Execution Sandbox (Zero eval / Zero new Function)
// ============================================================================

export interface VirtualServoState {
  name: string;
  pin: number;
  angle: number; // 0 to 180 degrees (clamped)
  isAttached: boolean;
  minPulseUs: number; // default 544
  maxPulseUs: number; // default 2400
  lastUpdated: number;
}

export interface RuntimeCallbacks {
  onStatusChange: (status: RuntimeStatus) => void;
  onConsoleMessage: (msg: ConsoleMessage) => void;
  onPinChange: (pin: SimulatedPin) => void;
  onStatsUpdate: (stats: ArduinoProgramStats) => void;
  onServoChange?: (servos: Map<string, VirtualServoState>) => void;
}

export type SensorStateResolver = () => {
  ultrasonics: Map<string, UltrasonicCircuitState>;
  potentiometers: Map<string, PotentiometerCircuitState>;
  lineSensors?: Map<string, LineSensorCircuitState>;
  servos?: Map<string, ServoCircuitState>;
};

export type InterruptMode = 'RISING' | 'FALLING' | 'CHANGE' | number;

export interface InterruptRegistration {
  pin: number;
  functionName: string;
  mode: InterruptMode;
}

export class SafeArduinoRuntime {
  private status: RuntimeStatus = 'stopped';
  private pins: Record<number, SimulatedPin> = createDefaultUnoPins();
  private callbacks: RuntimeCallbacks;
  private sensorResolver: SensorStateResolver | null = null;
  private abortController: AbortController | null = null;
  private globals: Map<string, any> = new Map();
  private functions: Map<string, FunctionDecl> = new Map();
  private interrupts: Map<number, InterruptRegistration> = new Map();
  private interruptsEnabled: boolean = true;
  private servos: Map<string, VirtualServoState> = new Map();
  private startTime = 0;
  private loopCount = 0;
  private stepCount = 0;
  private readonly MAX_STEPS_PER_TICK = 10000;

  constructor(callbacks: RuntimeCallbacks) {
    this.callbacks = callbacks;
    this.initDefaultConstants();
  }

  getServos(): Map<string, VirtualServoState> {
    return new Map(this.servos);
  }

  getServo(nameOrPin: string | number): VirtualServoState | undefined {
    if (typeof nameOrPin === 'string') {
      return this.servos.get(nameOrPin);
    }
    for (const s of this.servos.values()) {
      if (s.pin === nameOrPin) return s;
    }
    return undefined;
  }

  getPrimaryServoAngle(): number {
    for (const s of this.servos.values()) {
      if (s.isAttached) return s.angle;
    }
    return 90;
  }

  setSensorResolver(resolver: SensorStateResolver | null) {
    this.sensorResolver = resolver;
  }

  private initDefaultConstants() {
    this.globals.set('HIGH', 1);
    this.globals.set('LOW', 0);
    this.globals.set('OUTPUT', 1);
    this.globals.set('INPUT', 0);
    this.globals.set('INPUT_PULLUP', 2);
    this.globals.set('LED_BUILTIN', 13);
    this.globals.set('true', 1);
    this.globals.set('false', 0);
    // Interrupt Modes
    this.globals.set('RISING', 1);
    this.globals.set('FALLING', 2);
    this.globals.set('CHANGE', 3);
    // Pin name aliases
    this.globals.set('A0', 14);
    this.globals.set('A1', 15);
    this.globals.set('A2', 16);
    this.globals.set('A3', 17);
    this.globals.set('A4', 18);
    this.globals.set('A5', 19);
  }

  getStatus(): RuntimeStatus {
    return this.status;
  }

  getPins(): Record<number, SimulatedPin> {
    return { ...this.pins };
  }

  setVirtualInput(pinNumber: number, value: number) {
    if (this.pins[pinNumber]) {
      this.pins[pinNumber] = {
        ...this.pins[pinNumber],
        digitalValue: value > 0 ? 1 : 0,
        analogValue: value,
        lastUpdated: Date.now(),
      };
      this.callbacks.onPinChange(this.pins[pinNumber]);
    }
  }

  async run(code: string): Promise<boolean> {
    // 1. Terminate any previous running execution
    this.stop();

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.globals.clear();
    this.functions.clear();
    this.servos.clear();
    this.initDefaultConstants();
    this.startTime = Date.now();
    this.loopCount = 0;
    this.stepCount = 0;

    this.callbacks.onConsoleMessage({
      id: `msg_${Date.now()}_start`,
      type: 'info',
      text: 'Starting Arduino Simulated Runtime sandbox (No physical hardware attached)...',
      timestamp: new Date().toLocaleTimeString(),
    });

    try {
      // 2. Lexical analysis & AST Parsing
      const lexer = new ArduinoLexer(code);
      const tokens = lexer.tokenize();
      const parser = new ArduinoParser(tokens);
      const program = parser.parse();

      // 3. Register Top-Level Functions & Global Variables
      for (const node of program.body) {
        if (node.type === 'FunctionDecl') {
          this.functions.set(node.name, node);
        } else if (node.type === 'VariableDecl') {
          const initVal = node.init ? await this.evaluateExpression(node.init, this.globals, signal) : 0;
          this.globals.set(node.name, initVal);
        }
      }

      // Check required Arduino entry point functions
      const setupFn = this.functions.get('setup');
      const loopFn = this.functions.get('loop');

      if (!setupFn && !loopFn) {
        throw new Error("Missing Arduino entry points: sketch must define 'void setup()' or 'void loop()'.");
      }

      this.status = 'running';
      this.callbacks.onStatusChange('running');

      // 4. Execute setup() once
      if (setupFn) {
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_setup`,
          type: 'info',
          text: '→ Executing setup() once...',
          timestamp: new Date().toLocaleTimeString(),
        });
        const setupScope = new Map<string, any>();
        await this.executeBlock(setupFn.body, setupScope, signal);
      }

      // 5. Repeated execution of loop() with bounded yields
      if (loopFn) {
        this.runLoopCycle(loopFn, signal);
      } else {
        // Only setup was defined
        this.status = 'stopped';
        this.callbacks.onStatusChange('stopped');
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_done`,
          type: 'info',
          text: '✓ Execution complete (no loop() defined).',
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      return true;
    } catch (err: any) {
      this.status = 'error';
      this.callbacks.onStatusChange('error');
      const errMsg = err?.message || String(err);
      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_err`,
        type: 'error',
        text: `Runtime Error: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      return false;
    }
  }

  private async runLoopCycle(loopFn: FunctionDecl, signal: AbortSignal) {
    while (!signal.aborted && this.status === 'running') {
      const loopStart = Date.now();
      this.stepCount = 0;

      try {
        const loopScope = new Map<string, any>();
        await this.executeBlock(loopFn.body, loopScope, signal);
        this.loopCount++;

        const duration = Date.now() - loopStart;
        this.callbacks.onStatsUpdate({
          cyclesCount: this.loopCount,
          elapsedMs: Date.now() - this.startTime,
          lastLoopDurationMs: duration,
        });

        // Safe tick yield: If loop completed with 0 delay calls, yield 16ms (60Hz) to prevent UI freeze
        if (!signal.aborted) {
          await this.delay(10, signal);
        }
      } catch (loopErr: any) {
        if (signal.aborted) return;
        this.status = 'error';
        this.callbacks.onStatusChange('error');
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_loop_err`,
          type: 'error',
          text: `Error in loop(): ${loopErr?.message || String(loopErr)}`,
          timestamp: new Date().toLocaleTimeString(),
        });
        break;
      }
    }
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.interrupts.clear();
    if (this.status === 'running') {
      this.status = 'stopped';
      this.callbacks.onStatusChange('stopped');
      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_stopped`,
        type: 'info',
        text: '■ Arduino Simulated Runtime stopped.',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }

  reset() {
    this.stop();
    this.pins = createDefaultUnoPins();
    this.globals.clear();
    this.functions.clear();
    this.interrupts.clear();
    this.interruptsEnabled = true;
    this.servos.clear();
    this.initDefaultConstants();
    this.status = 'stopped';
    this.callbacks.onStatusChange('stopped');
    this.callbacks.onServoChange?.(this.servos);

    // Notify all pins reset
    Object.values(this.pins).forEach((p) => this.callbacks.onPinChange(p));

    this.callbacks.onConsoleMessage({
      id: `msg_${Date.now()}_reset`,
      type: 'info',
      text: '↺ Runtime state and all virtual pins have been reset.',
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // ==========================================================================
  // AST Execution Engine
  // ==========================================================================

  private async executeBlock(block: BlockStatement, scope: Map<string, any>, signal: AbortSignal): Promise<any> {
    for (const stmt of block.body) {
      if (signal.aborted) return;
      this.checkStepLimit(stmt.line);
      const res = await this.executeStatement(stmt, scope, signal);
      if (res && res.__isReturn) return res.value;
    }
  }

  private async executeStatement(node: ASTNode, scope: Map<string, any>, signal: AbortSignal): Promise<any> {
    if (signal.aborted) return;
    this.checkStepLimit(node.line);

    switch (node.type) {
      case 'VariableDecl': {
        const val = node.init ? await this.evaluateExpression(node.init, scope, signal) : 0;
        scope.set(node.name, val);
        return;
      }

      case 'ExpressionStatement': {
        return await this.evaluateExpression(node.expression, scope, signal);
      }

      case 'BlockStatement': {
        const innerScope = new Map(scope);
        const result = await this.executeBlock(node, innerScope, signal);
        for (const [k] of scope) {
          if (innerScope.has(k)) {
            scope.set(k, innerScope.get(k));
          }
        }
        return result;
      }


      case 'IfStatement': {
        const cond = await this.evaluateExpression(node.test, scope, signal);
        if (Boolean(cond)) {
          return await this.executeStatement(node.consequent, scope, signal);
        } else if (node.alternate) {
          return await this.executeStatement(node.alternate, scope, signal);
        }
        return;
      }

      case 'WhileStatement': {
        let iterations = 0;
        while (!signal.aborted && Boolean(await this.evaluateExpression(node.test, scope, signal))) {
          this.checkStepLimit(node.line);
          iterations++;
          if (iterations > 50000) {
            throw new Error(`Infinite loop detected at line ${node.line}: while condition never became false. Use delay() or adjust break condition.`);
          }
          const res = await this.executeStatement(node.body, scope, signal);
          if (res && res.__isReturn) return res;
        }
        return;
      }

      case 'ForStatement': {
        const forScope = new Map(scope);
        if (node.init) await this.executeStatement(node.init, forScope, signal);

        let iterations = 0;
        while (!signal.aborted) {
          this.checkStepLimit(node.line);
          if (node.test) {
            const cond = await this.evaluateExpression(node.test, forScope, signal);
            if (!Boolean(cond)) break;
          }

          iterations++;
          if (iterations > 50000) {
            throw new Error(`Infinite loop detected in for-loop at line ${node.line}.`);
          }

          const res = await this.executeStatement(node.body, forScope, signal);
          if (res && res.__isReturn) return res;

          if (node.update) {
            await this.evaluateExpression(node.update, forScope, signal);
          }
        }
        return;
      }

      case 'ReturnStatement': {
        const value = node.argument ? await this.evaluateExpression(node.argument, scope, signal) : undefined;
        return { __isReturn: true, value };
      }

      default:
        return;
    }
  }

  // ==========================================================================
  // Expression Evaluator (Arithmetic, Variables, Functions)
  // ==========================================================================

  private async evaluateExpression(expr: Expression, scope: Map<string, any>, signal: AbortSignal): Promise<any> {
    if (signal.aborted) return 0;
    this.checkStepLimit(expr.line);

    switch (expr.type) {
      case 'LiteralExpr':
        return expr.value;

      case 'IdentifierExpr': {
        if (scope.has(expr.name)) return scope.get(expr.name);
        if (this.globals.has(expr.name)) return this.globals.get(expr.name);
        if (this.functions.has(expr.name)) return { __isFunctionRef: true, name: expr.name };
        throw new Error(`Undefined variable '${expr.name}' at line ${expr.line}`);
      }

      case 'AssignmentExpr': {
        const val = await this.evaluateExpression(expr.value, scope, signal);
        const current = scope.has(expr.target) ? scope.get(expr.target) : this.globals.get(expr.target) || 0;

        let finalVal = val;
        if (expr.operator === '+=') finalVal = current + val;
        else if (expr.operator === '-=') finalVal = current - val;
        else if (expr.operator === '*=') finalVal = current * val;
        else if (expr.operator === '/=') finalVal = val !== 0 ? current / val : 0;

        if (scope.has(expr.target)) {
          scope.set(expr.target, finalVal);
        } else {
          this.globals.set(expr.target, finalVal);
        }
        return finalVal;
      }

      case 'UpdateExpr': {
        const current = scope.has(expr.argument) ? scope.get(expr.argument) : this.globals.get(expr.argument) || 0;
        const diff = expr.operator === '++' ? 1 : -1;
        const updated = current + diff;

        if (scope.has(expr.argument)) {
          scope.set(expr.argument, updated);
        } else {
          this.globals.set(expr.argument, updated);
        }

        return expr.isPrefix ? updated : current;
      }

      case 'UnaryExpr': {
        const arg = await this.evaluateExpression(expr.argument, scope, signal);
        if (expr.operator === '!') return !arg ? 1 : 0;
        if (expr.operator === '-') return -arg;
        if (expr.operator === '+') return +arg;
        return arg;
      }

      case 'BinaryExpr': {
        const left = await this.evaluateExpression(expr.left, scope, signal);
        const right = await this.evaluateExpression(expr.right, scope, signal);

        switch (expr.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right !== 0 ? Math.floor(left / right) : 0;
          case '%': return right !== 0 ? left % right : 0;
          case '==': return left === right ? 1 : 0;
          case '!=': return left !== right ? 1 : 0;
          case '<': return left < right ? 1 : 0;
          case '<=': return left <= right ? 1 : 0;
          case '>': return left > right ? 1 : 0;
          case '>=': return left >= right ? 1 : 0;
          case '&&': return left && right ? 1 : 0;
          case '||': return left || right ? 1 : 0;
          default: return 0;
        }
      }

      case 'CallExpr': {
        return await this.executeCall(expr, scope, signal);
      }
    }
  }

  // ==========================================================================
  // Arduino Builtin Functions
  // ==========================================================================

  private async executeCall(expr: CallExpr, scope: Map<string, any>, signal: AbortSignal): Promise<any> {
    const args: any[] = [];
    for (const a of expr.args) {
      args.push(await this.evaluateExpression(a, scope, signal));
    }

    const callee = expr.callee;

    // 1. pinMode(pin, mode)
    if (callee === 'pinMode') {
      const pinNum = Number(args[0]);
      const modeVal = Number(args[1]);
      const mode: PinMode = modeVal === 1 ? 'OUTPUT' : modeVal === 2 ? 'INPUT_PULLUP' : 'INPUT';

      if (this.pins[pinNum]) {
        this.pins[pinNum] = {
          ...this.pins[pinNum],
          mode,
          digitalValue: mode === 'INPUT_PULLUP' ? 1 : this.pins[pinNum].digitalValue,
          lastUpdated: Date.now(),
        };
        this.callbacks.onPinChange(this.pins[pinNum]);
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_pm_${pinNum}`,
          type: 'pin',
          text: `[Pin ${pinNum} (${this.pins[pinNum].name})] MODE set to ${mode}`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
      }
      return;
    }

    // 2. digitalWrite(pin, value)
    if (callee === 'digitalWrite') {
      const pinNum = Number(args[0]);
      const val: 0 | 1 = (args[1] === 1 || args[1] === true || args[1] === 'HIGH') ? 1 : 0;

      if (this.pins[pinNum]) {
        this.pins[pinNum] = {
          ...this.pins[pinNum],
          digitalValue: val,
          pwmValue: val === 1 ? 255 : 0,
          lastUpdated: Date.now(),
        };
        this.callbacks.onPinChange(this.pins[pinNum]);
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_dw_${pinNum}`,
          type: 'pin',
          text: `[Pin ${pinNum} (${this.pins[pinNum].name})] WRITE → ${val === 1 ? 'HIGH (1)' : 'LOW (0)'}`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
      }
      return;
    }

    // 3. digitalRead(pin)
    if (callee === 'digitalRead') {
      const pinNum = Number(args[0]);
      if (this.sensorResolver) {
        const sensors = this.sensorResolver();
        if (sensors.lineSensors) {
          for (const ls of sensors.lineSensors.values()) {
            if (ls.isCircuitComplete && ls.doPin === pinNum) {
              if (this.pins[pinNum]) {
                this.pins[pinNum].digitalValue = (ls.digitalOutput === 1 ? 1 : 0);
              }
              return ls.digitalOutput;
            }
          }
        }
      }
      if (this.pins[pinNum]) {
        return this.pins[pinNum].digitalValue;
      }
      return 0;
    }

    // 4. analogRead(pin)
    if (callee === 'analogRead') {
      const pinNum = Number(args[0]);
      // If a potentiometer or line sensor is wired to this analog pin and has a complete circuit, return its live reading
      if (this.sensorResolver) {
        const sensors = this.sensorResolver();
        for (const pot of sensors.potentiometers.values()) {
          if (pot.isCircuitComplete && pot.wiperPin === pinNum) {
            if (this.pins[pinNum]) {
              this.pins[pinNum].analogValue = pot.potValue;
            }
            return pot.potValue;
          }
        }
        if (sensors.lineSensors) {
          for (const ls of sensors.lineSensors.values()) {
            if (ls.isCircuitComplete && ls.aoPin === pinNum) {
              if (this.pins[pinNum]) {
                this.pins[pinNum].analogValue = ls.analogOutput;
              }
              return ls.analogOutput;
            }
          }
        }
      }
      if (this.pins[pinNum]) {
        return this.pins[pinNum].analogValue;
      }
      return 0;
    }

    // 4b. pulseIn(pin, value, timeout) - Safe bounded ultrasonic pulse measurement
    if (callee === 'pulseIn') {
      const pinNum = Number(args[0]);
      const targetState = (args[1] === 1 || args[1] === true || args[1] === 'HIGH') ? 1 : 0;
      // Default Arduino pulseIn timeout is 1,000,000 us (1 second); clamp to bounded 60,000 us max for smooth 60Hz UI
      const timeoutUs = args[2] !== undefined ? Math.max(1, Math.min(60000, Number(args[2]))) : 30000;

      if (this.sensorResolver && targetState === 1) {
        const sensors = this.sensorResolver();
        for (const sonar of sensors.ultrasonics.values()) {
          if (sonar.echoPin === pinNum) {
            // Verify circuit is complete (power + ground + trig + echo all wired)
            if (sonar.isCircuitComplete) {
              const duration = sonar.pulseDurationUs;
              if (duration <= timeoutUs) {
                // Yield small async delay proportional to duration (bounded 1-15 ms)
                await this.delay(Math.max(1, Math.min(15, Math.ceil(duration / 1000))), signal);
                return duration;
              }
            }
          }
        }
      }

      // If circuit incomplete or timed out, yield a small timeout delay and return 0
      await this.delay(Math.max(1, Math.min(10, Math.ceil(timeoutUs / 1000))), signal);
      return 0;
    }

    // 4c. readDistance(trigPin, echoPin) or readDistance(echoPin) - High-level distance helper in cm
    if (callee === 'readDistance') {
      const echoPin = args.length > 1 ? Number(args[1]) : Number(args[0]);
      if (this.sensorResolver) {
        const sensors = this.sensorResolver();
        for (const sonar of sensors.ultrasonics.values()) {
          if (sonar.echoPin === echoPin && sonar.isCircuitComplete) {
            return sonar.distanceCm;
          }
        }
      }
      return 0;
    }

    // 5. analogWrite(pin, value) (PWM)
    if (callee === 'analogWrite') {
      const pinNum = Number(args[0]);
      const pwm = Math.max(0, Math.min(255, Math.floor(Number(args[1]) || 0)));

      if (this.pins[pinNum]) {
        this.pins[pinNum] = {
          ...this.pins[pinNum],
          mode: 'OUTPUT',
          pwmValue: pwm,
          digitalValue: pwm > 127 ? 1 : 0,
          lastUpdated: Date.now(),
        };
        this.callbacks.onPinChange(this.pins[pinNum]);
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_aw_${pinNum}`,
          type: 'pin',
          text: `[Pin ${pinNum} (${this.pins[pinNum].name})] PWM → ${pwm}/255 (${Math.round((pwm / 255) * 100)}%)`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
      }
      return;
    }

    // 6. delay(ms)
    if (callee === 'delay') {
      const ms = Math.max(1, Math.min(15000, Number(args[0]) || 0));
      await this.delay(ms, signal);
      return;
    }

    // 7. delayMicroseconds(us)
    if (callee === 'delayMicroseconds') {
      const us = Number(args[0]) || 0;
      await this.delay(Math.max(1, Math.ceil(us / 1000)), signal);
      return;
    }

    // 8. millis()
    if (callee === 'millis') {
      return Date.now() - this.startTime;
    }

    // 9. micros()
    if (callee === 'micros') {
      return (Date.now() - this.startTime) * 1000;
    }

    // 10. Serial.begin(baud)
    if (callee === 'Serial.begin') {
      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_sb`,
        type: 'serial',
        text: `[Serial] Connected at ${args[0] || 9600} baud (Simulated UART)`,
        timestamp: new Date().toLocaleTimeString(),
        lineNumber: expr.line,
      });
      return;
    }

    // 11. Serial.print(val) / Serial.println(val)
    if (callee === 'Serial.print' || callee === 'Serial.println') {
      const text = args.map((a) => (a === undefined ? '' : String(a))).join(' ');
      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_sp`,
        type: 'serial',
        text: `[Serial] ${text}`,
        timestamp: new Date().toLocaleTimeString(),
        lineNumber: expr.line,
      });
      return;
    }

    // 12. Standard Math Helpers
    if (callee === 'min') return Math.min(args[0], args[1]);
    if (callee === 'max') return Math.max(args[0], args[1]);
    if (callee === 'abs') return Math.abs(args[0]);
    if (callee === 'constrain') return Math.max(args[1], Math.min(args[2], args[0]));
    if (callee === 'map') {
      const [x, inMin, inMax, outMin, outMax] = args;
      if (inMax - inMin === 0) return outMin;
      return Math.round(((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
    }

    // 13. digitalPinToInterrupt(pin) - Uno maps Pin 2 -> 0 (INT0), Pin 3 -> 1 (INT1)
    if (callee === 'digitalPinToInterrupt') {
      const pinNum = Number(args[0]);
      if (pinNum === 2) return 0;
      if (pinNum === 3) return 1;
      return -1;
    }

    // 14. attachInterrupt(interrupt, ISR, mode)
    if (callee === 'attachInterrupt') {
      const intOrPin = Number(args[0]);
      let pin = -1;
      let intNum = -1;
      if (intOrPin === 0 || intOrPin === 2) {
        intNum = 0;
        pin = 2;
      } else if (intOrPin === 1 || intOrPin === 3) {
        intNum = 1;
        pin = 3;
      }

      if (pin === -1) {
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_att_err`,
          type: 'error',
          text: `[Interrupt Error] Unsupported interrupt ${intOrPin}. Uno supports Pin 2 (INT0) and Pin 3 (INT1).`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
        return;
      }

      let isrName = '';
      if (typeof args[1] === 'string') {
        isrName = args[1];
      } else if (args[1] && typeof args[1] === 'object' && args[1].__isFunctionRef) {
        isrName = args[1].name;
      }

      if (!isrName || !this.functions.has(isrName)) {
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_att_isr_err`,
          type: 'error',
          text: `[Interrupt Error] Function '${isrName || args[1]}' not found for attachInterrupt.`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
        return;
      }

      let modeVal: InterruptMode = args[2];
      let modeName = 'RISING';
      if (modeVal === 2 || modeVal === 'FALLING') {
        modeVal = 2;
        modeName = 'FALLING';
      } else if (modeVal === 3 || modeVal === 'CHANGE') {
        modeVal = 3;
        modeName = 'CHANGE';
      } else {
        modeVal = 1;
        modeName = 'RISING';
      }

      this.interrupts.set(intNum, {
        pin,
        functionName: isrName,
        mode: modeVal,
      });

      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_att_${intNum}`,
        type: 'info',
        text: `[Interrupt] Attached '${isrName}' to Pin ${pin} (INT${intNum}) mode ${modeName}`,
        timestamp: new Date().toLocaleTimeString(),
        lineNumber: expr.line,
      });
      return;
    }

    // 15. detachInterrupt(interrupt)
    if (callee === 'detachInterrupt') {
      const intOrPin = Number(args[0]);
      const intNum = (intOrPin === 2 || intOrPin === 0) ? 0 : (intOrPin === 3 || intOrPin === 1) ? 1 : -1;
      if (intNum !== -1) {
        this.interrupts.delete(intNum);
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_det_${intNum}`,
          type: 'info',
          text: `[Interrupt] Detached interrupt INT${intNum}`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
      }
      return;
    }

    // 16. interrupts() / noInterrupts()
    if (callee === 'interrupts') {
      this.interruptsEnabled = true;
      return;
    }
    if (callee === 'noInterrupts') {
      this.interruptsEnabled = false;
      return;
    }

    // 17. Servo support: attach(pin), write(angle), read(), attached(), detach()
    if (callee.endsWith('.attach') || callee === 'attach' || callee === 'servoAttach') {
      const servoName = callee.includes('.') ? callee.split('.')[0] : 'servo';
      const pinNum = Number(args[0]);
      const minPulseUs = args.length > 1 ? Number(args[1]) : 544;
      const maxPulseUs = args.length > 2 ? Number(args[2]) : 2400;

      const existing = this.servos.get(servoName);
      const angle = existing ? existing.angle : 90;

      const servoState: VirtualServoState = {
        name: servoName,
        pin: pinNum,
        angle,
        isAttached: true,
        minPulseUs,
        maxPulseUs,
        lastUpdated: Date.now(),
      };
      this.servos.set(servoName, servoState);

      if (this.pins[pinNum]) {
        this.pins[pinNum] = {
          ...this.pins[pinNum],
          mode: 'OUTPUT',
          pwmValue: Math.round((angle / 180) * 255),
          lastUpdated: Date.now(),
        };
        this.callbacks.onPinChange(this.pins[pinNum]);
      }

      this.callbacks.onServoChange?.(this.servos);
      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_servo_att`,
        type: 'info',
        text: `[Servo] ${servoName} attached to Pin ${pinNum} (Default angle: ${angle}°)`,
        timestamp: new Date().toLocaleTimeString(),
        lineNumber: expr.line,
      });
      return;
    }

    if (callee.endsWith('.write') || callee === 'write' || callee === 'servoWrite') {
      const servoName = callee.includes('.') ? callee.split('.')[0] : 'servo';
      const rawAngle = Number(args[0]) || 0;
      // Clamped strictly to [0, 180] physical Servo limits
      const clampedAngle = Math.max(0, Math.min(180, Math.round(rawAngle)));

      let servoState = this.servos.get(servoName);
      if (!servoState) {
        servoState = {
          name: servoName,
          pin: 9,
          angle: clampedAngle,
          isAttached: true,
          minPulseUs: 544,
          maxPulseUs: 2400,
          lastUpdated: Date.now(),
        };
      } else {
        servoState.angle = clampedAngle;
        servoState.lastUpdated = Date.now();
      }
      this.servos.set(servoName, servoState);

      const pinNum = servoState.pin;
      if (this.pins[pinNum]) {
        this.pins[pinNum] = {
          ...this.pins[pinNum],
          mode: 'OUTPUT',
          pwmValue: Math.round((clampedAngle / 180) * 255),
          lastUpdated: Date.now(),
        };
        this.callbacks.onPinChange(this.pins[pinNum]);
      }

      this.callbacks.onServoChange?.(this.servos);
      return;
    }

    if (callee.endsWith('.read') || callee === 'read' || callee === 'servoRead') {
      const servoName = callee.includes('.') ? callee.split('.')[0] : 'servo';
      const servoState = this.servos.get(servoName);
      if (servoState) return servoState.angle;
      for (const s of this.servos.values()) {
        if (s.isAttached) return s.angle;
      }
      return 90;
    }

    if (callee.endsWith('.attached') || callee === 'attached') {
      const servoName = callee.includes('.') ? callee.split('.')[0] : 'servo';
      const servoState = this.servos.get(servoName);
      return servoState && servoState.isAttached ? 1 : 0;
    }

    if (callee.endsWith('.detach') || callee === 'detach') {
      const servoName = callee.includes('.') ? callee.split('.')[0] : 'servo';
      const servoState = this.servos.get(servoName);
      if (servoState) {
        servoState.isAttached = false;
        servoState.lastUpdated = Date.now();
        this.callbacks.onServoChange?.(this.servos);
        this.callbacks.onConsoleMessage({
          id: `msg_${Date.now()}_servo_det`,
          type: 'info',
          text: `[Servo] ${servoName} detached from Pin ${servoState.pin}`,
          timestamp: new Date().toLocaleTimeString(),
          lineNumber: expr.line,
        });
      }
      return;
    }

    // User-defined function call
    const userFn = this.functions.get(callee);
    if (userFn) {
      const localScope = new Map<string, any>();
      for (let i = 0; i < userFn.params.length; i++) {
        localScope.set(userFn.params[i], args[i]);
      }
      return await this.executeBlock(userFn.body, localScope, signal);
    }

    throw new Error(`Unsupported or unknown function '${callee}' at line ${expr.line}`);
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        resolve();
      }, ms);

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private checkStepLimit(line: number) {
    this.stepCount++;
    if (this.stepCount > this.MAX_STEPS_PER_TICK) {
      throw new Error(`Execution limit exceeded (>10,000 steps without yield) at line ${line}. Add delay(ms) inside long-running loops.`);
    }
  }

  // ==========================================================================
  // Interrupt Trigger & State Inspection (Zero eval / Pure AST execution)
  // ==========================================================================

  getRegisteredInterrupts(): Map<number, InterruptRegistration> {
    return new Map(this.interrupts);
  }

  areInterruptsEnabled(): boolean {
    return this.interruptsEnabled;
  }

  getGlobal(name: string): any {
    return this.globals.get(name);
  }

  async triggerInterrupt(pin: number, edge: 'RISING' | 'FALLING' | 'CHANGE' = 'RISING'): Promise<boolean> {
    if (!this.interruptsEnabled || this.status !== 'running') {
      return false;
    }

    let matchedBinding: InterruptRegistration | null = null;
    for (const binding of this.interrupts.values()) {
      if (binding.pin === pin) {
        if (binding.mode === 3 || binding.mode === 'CHANGE') {
          matchedBinding = binding;
          break;
        }
        if ((binding.mode === 1 || binding.mode === 'RISING') && (edge === 'RISING' || edge === 'CHANGE')) {
          matchedBinding = binding;
          break;
        }
        if ((binding.mode === 2 || binding.mode === 'FALLING') && (edge === 'FALLING' || edge === 'CHANGE')) {
          matchedBinding = binding;
          break;
        }
      }
    }

    if (!matchedBinding) return false;

    const isrFunc = this.functions.get(matchedBinding.functionName);
    if (!isrFunc) return false;

    // Pulse pin state briefly
    if (this.pins[pin]) {
      this.pins[pin] = {
        ...this.pins[pin],
        digitalValue: edge === 'FALLING' ? 0 : 1,
        lastUpdated: Date.now(),
      };
      this.callbacks.onPinChange(this.pins[pin]);
    }

    // Safely execute ISR body with its own local scope, writing to globals
    try {
      const isrScope = new Map<string, any>();
      const signal = this.abortController ? this.abortController.signal : new AbortController().signal;
      await this.executeBlock(isrFunc.body, isrScope, signal);
      return true;
    } catch (err: any) {
      this.callbacks.onConsoleMessage({
        id: `msg_${Date.now()}_isr_err`,
        type: 'error',
        text: `[ISR Error] Exception in '${matchedBinding.functionName}': ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      return false;
    }
  }
}

// ============================================================================
// Built-in Example Arduino Sketches
// ============================================================================

export interface SketchPreset {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const SKETCH_PRESETS: SketchPreset[] = [
  {
    id: 'blink',
    name: '1. Standard Blink (Pin 13)',
    description: 'Toggles digital Pin 13 (LED_BUILTIN) every 1 second.',
    code: `// Standard Arduino Blink Example
// Controls virtual pin 13 (Built-in LED)

int ledPin = 13;
int delayTime = 1000;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  Serial.println("System initialized. Starting LED blink loop...");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("LED status: ON (HIGH)");
  delay(delayTime);

  digitalWrite(ledPin, LOW);
  Serial.println("LED status: OFF (LOW)");
  delay(delayTime);
}
`,
  },
  {
    id: 'motor_alternator',
    name: '2. Dual Motor Alternator (Pins 5 & 6)',
    description: 'Alternates power between two DC motor driver pins using PWM.',
    code: `// Dual Motor Driver Alternator
// Pin 5 = Left Motor, Pin 6 = Right Motor

int motorLeft = 5;
int motorRight = 6;
int speed = 200;

void setup() {
  Serial.begin(9600);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  Serial.println("Robot Drive Actuator Controller online.");
}

void loop() {
  // Drive Left Motor Forward
  Serial.println("Steering Left: Motor 5 active");
  analogWrite(motorLeft, speed);
  analogWrite(motorRight, 0);
  delay(1200);

  // Drive Right Motor Forward
  Serial.println("Steering Right: Motor 6 active");
  analogWrite(motorLeft, 0);
  analogWrite(motorRight, speed);
  delay(1200);

  // Stop both motors briefly
  analogWrite(motorLeft, 0);
  analogWrite(motorRight, 0);
  Serial.println("Motors idle.");
  delay(500);
}
`,
  },
  {
    id: 'button_read',
    name: '3. Digital Button / Sensor Input (Pin 2 → Pin 13)',
    description: 'Reads digital input on Pin 2 and mirrors state to Pin 13.',
    code: `// Digital Input Reader
// Reads Pin 2 (Button/Switch) and mirrors to Pin 13

int inputPin = 2;
int ledPin = 13;
int buttonState = 0;

void setup() {
  Serial.begin(9600);
  pinMode(inputPin, INPUT);
  pinMode(ledPin, OUTPUT);
  Serial.println("Input Monitor ready. Toggle Pin 2 in Virtual Pin Monitor!");
}

void loop() {
  buttonState = digitalRead(inputPin);

  if (buttonState == HIGH) {
    digitalWrite(ledPin, HIGH);
    Serial.println("Sensor triggered: HIGH -> LED ON");
  } else {
    digitalWrite(ledPin, LOW);
  }

  delay(200);
}
`,
  },
  {
    id: 'analog_pot',
    name: '4. Analog Sensor Reader (A0 → Pin 9 PWM)',
    description: 'Reads analog input A0 (0-1023) and scales to PWM on Pin 9 (0-255).',
    code: `// Analog Sensor to PWM Dimmer
// Reads analog pin A0 and maps to PWM output on Pin 9

int sensorPin = 14; // A0 is pin 14
int outputPwmPin = 9;
int sensorVal = 0;
int outputVal = 0;

void setup() {
  Serial.begin(9600);
  pinMode(outputPwmPin, OUTPUT);
  Serial.println("Analog to PWM mapper online.");
}

void loop() {
  sensorVal = analogRead(sensorPin);
  outputVal = map(sensorVal, 0, 1023, 0, 255);

  analogWrite(outputPwmPin, outputVal);

  Serial.print("A0 Value: ");
  Serial.print(sensorVal);
  Serial.print(" -> PWM: ");
  Serial.println(outputVal);

  delay(350);
}
`,
  },
  {
    id: 'pwm_fade',
    name: '5. PWM LED Breathing / Fader (Pin 13)',
    description: 'Smoothly modulates 3D LED brightness using analogWrite() PWM.',
    code: `// LED PWM Breathing / Fader
// Modulates brightness of 3D LED using analogWrite()

int ledPin = 13;
int brightness = 0;
int fadeAmount = 25;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  Serial.println("3D LED PWM Fader active.");
}

void loop() {
  analogWrite(ledPin, brightness);

  Serial.print("LED Brightness PWM: ");
  Serial.print(brightness);
  Serial.println("/255");

  brightness = brightness + fadeAmount;

  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
    if (brightness > 255) brightness = 255;
    if (brightness < 0) brightness = 0;
  }

  delay(120);
}
`,
  },
  {
    id: 'ultrasonic_obstacle',
    name: '6. Sonar Obstacle Avoidance (HC-SR04 → Motors)',
    description: 'Reads HC-SR04 distance via pulseIn() and stops/reduces motor output when obstacle < 25cm.',
    code: `// Ultrasonic Obstacle Avoidance Autopilot
// HC-SR04: TRIG = Pin 11, ECHO = Pin 12
// Motor Left = Pin 5, Motor Right = Pin 6, Status LED = Pin 13

int trigPin = 11;
int echoPin = 12;
int motorLeft = 5;
int motorRight = 6;
int ledPin = 13;
int safeThreshold = 25; // 25 cm threshold

void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);
  Serial.println("Obstacle Avoidance Autopilot initialized.");
}

void loop() {
  // Trigger 10us ultrasonic ping
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Measure echo pulse width duration (microseconds)
  long duration = pulseIn(echoPin, HIGH);
  long distance = duration / 58;

  Serial.print("Sonar Ping Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance > 0 && distance < safeThreshold) {
    // Obstacle close! Emergency stop motors and activate warning LED
    analogWrite(motorLeft, 0);
    analogWrite(motorRight, 0);
    digitalWrite(ledPin, HIGH);
    Serial.println(">>> OBSTACLE DETECTED! Braking motors, Warning LED ON.");
  } else {
    // Path clear: Drive motors forward and turn warning LED off
    analogWrite(motorLeft, 190);
    analogWrite(motorRight, 190);
    digitalWrite(ledPin, LOW);
    Serial.println("Path clear: Cruising forward (PWM 190).");
  }

  delay(250);
}
`,
  },
  {
    id: 'odometry_closed_loop',
    name: '7. Closed-Loop Odometry & Precision Distance Drive',
    description: 'Uses wheel encoders on pins D2 & D3 (interrupts) to travel a commanded distance and actively balance motor speeds.',
    code: `// Closed-Loop Odometry & Precision Distance Drive
// Uses optical wheel encoders on external interrupt pins:
// Left Encoder = Pin 2 (INT0), Right Encoder = Pin 3 (INT1)
// Left Motor = Pin 5, Right Motor = Pin 6, Status LED = Pin 13

volatile long leftTicks = 0;
volatile long rightTicks = 0;

int motorLeft = 5;
int motorRight = 6;
int ledPin = 13;
int targetTicks = 11; // 11 ticks * ~5.65 cm/tick ~= 62 cm travel

void leftISR() {
  leftTicks++;
}

void rightISR() {
  rightTicks++;
}

void setup() {
  Serial.begin(9600);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);
  pinMode(2, INPUT_PULLUP);
  pinMode(3, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(2), leftISR, RISING);
  attachInterrupt(digitalPinToInterrupt(3), rightISR, RISING);

  Serial.println("Preset 7: Closed-Loop Odometry Controller initialized.");
  Serial.println("Driving target distance with active motor balancing...");
}

void loop() {
  if (leftTicks < targetTicks && rightTicks < targetTicks) {
    // Proportional speed balancing to maintain dead-straight heading
    long diff = leftTicks - rightTicks;
    int basePwm = 190;
    int leftPwm = constrain(basePwm - diff * 8, 120, 255);
    int rightPwm = constrain(basePwm + diff * 8, 120, 255);

    analogWrite(motorLeft, leftPwm);
    analogWrite(motorRight, rightPwm);
    digitalWrite(ledPin, LOW);

    Serial.print("Ticks L: ");
    Serial.print(leftTicks);
    Serial.print(" | R: ");
    Serial.print(rightTicks);
    Serial.print(" -> PWM L: ");
    Serial.print(leftPwm);
    Serial.print(" R: ");
    Serial.println(rightPwm);
  } else {
    // Target distance reached! Precision stop
    analogWrite(motorLeft, 0);
    analogWrite(motorRight, 0);
    digitalWrite(ledPin, HIGH);
    Serial.println(">>> Target distance reached! Closed-loop precision halt.");
  }

  delay(60);
}
`,
  },
  {
    id: 'potentiometer_throttle',
    name: '8. Potentiometer Motor Throttle (A0 → Motors)',
    description: 'Reads rotary potentiometer on A0 (0-1023) and modulates dual motor speeds (0-255 PWM).',
    code: `// Potentiometer Analog Motor Throttle
// Potentiometer Wiper = A0 (Pin 14)
// Motor Left = Pin 5, Motor Right = Pin 6

int potPin = 14; // A0 analog input
int motorLeft = 5;
int motorRight = 6;
int potVal = 0;
int motorSpeed = 0;

void setup() {
  Serial.begin(9600);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  Serial.println("Potentiometer Dual Motor Throttle ready.");
}

void loop() {
  potVal = analogRead(potPin);
  motorSpeed = map(potVal, 0, 1023, 0, 255);

  analogWrite(motorLeft, motorSpeed);
  analogWrite(motorRight, motorSpeed);

  Serial.print("Pot A0: ");
  Serial.print(potVal);
  Serial.print("/1023 -> Motor PWM: ");
  Serial.print(motorSpeed);
  Serial.println("/255");

  delay(200);
}
`,
  },
  {
    id: 'line_sensor_monitor',
    name: '9. IR Line-Sensor Monitor & Calibration (D4/D7, A1/A2)',
    description: 'Inspects real-time digital (DO) switching and analog (AO) reflectance readings from dual TCRT5000 IR sensors.',
    code: `// Dual TCRT5000 IR Line Sensor Inspector
// Left Sensor: DO = Pin 4, AO = Pin A1 (Pin 15)
// Right Sensor: DO = Pin 7, AO = Pin A2 (Pin 16)
// Status LED: Pin 13

int pinLeftDO = 4;
int pinRightDO = 7;
int pinLeftAO = 15;
int pinRightAO = 16;
int pinLED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(pinLeftDO, INPUT);
  pinMode(pinRightDO, INPUT);
  pinMode(pinLED, OUTPUT);

  Serial.println("=========================================");
  Serial.println("Phase 8A: TCRT5000 IR Line Sensor Monitor");
  Serial.println("Black Line: DO = 1 (HIGH), AO ~ 100-250");
  Serial.println("White Floor: DO = 0 (LOW),  AO ~ 850-980");
  Serial.println("=========================================");
}

void loop() {
  int leftDO = digitalRead(pinLeftDO);
  int rightDO = digitalRead(pinRightDO);
  int leftAO = analogRead(pinLeftAO);
  int rightAO = analogRead(pinRightAO);

  // Status LED lights up if either sensor detects black track line
  if (leftDO == 1 || rightDO == 1) {
    digitalWrite(pinLED, HIGH);
  } else {
    digitalWrite(pinLED, LOW);
  }

  Serial.print("[Line Sensor] Left DO: ");
  Serial.print(leftDO);
  Serial.print(" (");
  if (leftDO == 1) {
    Serial.print("BLACK");
  } else {
    Serial.print("WHITE");
  }
  Serial.print(") AO: ");
  Serial.print(leftAO);

  Serial.print(" | Right DO: ");
  Serial.print(rightDO);
  Serial.print(" (");
  if (rightDO == 1) {
    Serial.print("BLACK");
  } else {
    Serial.print("WHITE");
  }
  Serial.print(") AO: ");
  Serial.println(rightAO);

  delay(250);
}
`,
  },
  {
    id: 'line_follower',
    name: '10. Autonomous Line Following Robot (Phase 8B)',
    description: 'Autonomous closed-loop line following using dual IR reflectance sensors, differential motor steering, and lost-line recovery.',
    code: `// Autonomous Closed-Loop Line Following Robot
// Left Sensor DO = Pin 4, Right Sensor DO = Pin 7
// Left Motor = Pin 5, Right Motor = Pin 6
// Status LED = Pin 13

int pinLeftDO = 4;
int pinRightDO = 7;
int motorLeft = 5;
int motorRight = 6;
int ledPin = 13;

int baseSpeed = 160;
int turnSpeedLow = 0;
int turnSpeedHigh = 190;

// Memory of last corrective steer (-1: left, 1: right, 0: none) for curve recovery
int lastTurnDir = 0;
int lostLineCounter = 0;

void setup() {
  Serial.begin(9600);
  pinMode(pinLeftDO, INPUT);
  pinMode(pinRightDO, INPUT);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);

  Serial.println("Preset 10: Autonomous Line Following Robot active.");
  Serial.println("Tracking black line on high-contrast floor...");
}

void loop() {
  int leftDO = digitalRead(pinLeftDO);
  int rightDO = digitalRead(pinRightDO);

  // Case 1: Drift Right -> Left sensor touches black line -> Steer LEFT
  if (leftDO == 1 && rightDO == 0) {
    lostLineCounter = 0;
    lastTurnDir = -1;
    analogWrite(motorLeft, turnSpeedLow);
    analogWrite(motorRight, turnSpeedHigh);
    digitalWrite(ledPin, HIGH);
    Serial.println("State: DRIFT RIGHT -> Left Sensor ON Line -> Steering LEFT");
  }
  // Case 2: Drift Left -> Right sensor touches black line -> Steer RIGHT
  else if (leftDO == 0 && rightDO == 1) {
    lostLineCounter = 0;
    lastTurnDir = 1;
    analogWrite(motorLeft, turnSpeedHigh);
    analogWrite(motorRight, turnSpeedLow);
    digitalWrite(ledPin, HIGH);
    Serial.println("State: DRIFT LEFT -> Right Sensor ON Line -> Steering RIGHT");
  }
  // Case 3: Intersection / Checkered bar (Both sensors on line)
  else if (leftDO == 1 && rightDO == 1) {
    lostLineCounter = 0;
    lastTurnDir = 0;
    analogWrite(motorLeft, 110);
    analogWrite(motorRight, 110);
    digitalWrite(ledPin, HIGH);
    Serial.println("State: INTERSECTION -> Slow Straight Crossing");
  }
  // Case 4: Neither sensor on line (White floor)
  else {
    // If we were recently turning, continue the curve until line reacquired!
    if (lastTurnDir == 1 && lostLineCounter < 30) {
      lostLineCounter++;
      analogWrite(motorLeft, turnSpeedHigh);
      analogWrite(motorRight, turnSpeedLow);
      digitalWrite(ledPin, HIGH);
      Serial.println("State: CURVE CONTINUATION -> Steering RIGHT");
    } else if (lastTurnDir == -1 && lostLineCounter < 30) {
      lostLineCounter++;
      analogWrite(motorLeft, turnSpeedLow);
      analogWrite(motorRight, turnSpeedHigh);
      digitalWrite(ledPin, HIGH);
      Serial.println("State: CURVE CONTINUATION -> Steering LEFT");
    } else {
      lostLineCounter++;
      if (lostLineCounter > 40) {
        // Recovery search sweep
        int searchDir = -1;
        if (lastTurnDir != 0) {
          searchDir = lastTurnDir;
        }
        if (searchDir == -1) {
          analogWrite(motorLeft, 0);
          analogWrite(motorRight, 140);
        } else {
          analogWrite(motorLeft, 140);
          analogWrite(motorRight, 0);
        }
        digitalWrite(ledPin, HIGH);
        Serial.println("State: OFF-TRACK -> Searching for Line");
      } else {
        lastTurnDir = 0;
        analogWrite(motorLeft, baseSpeed);
        analogWrite(motorRight, baseSpeed);
        digitalWrite(ledPin, LOW);
        Serial.println("State: ON TRACK (Center) -> Driving Straight Forward");
      }
    }
  }

  delay(25);
}
`,
  },
  {
    id: 'pid_line_follower',
    name: '11. High-Speed PID Line Following Robot (Phase 9A)',
    description: 'Continuous closed-loop discrete PID line follower using analog reflectance readings (A1 & A2), anti-windup clamping, and differential steering.',
    code: `// High-Speed Discrete PID Line Following Robot (Phase 9A)
// Analog Pin A1 = Left Sensor AO (Pin 15), Analog Pin A2 = Right Sensor AO (Pin 16)
// Digital Pin 5 = Left Motor PWM, Digital Pin 6 = Right Motor PWM
// Digital Pin 13 = Status LED

int pinLeftAO = 15;
int pinRightAO = 16;
int motorLeft = 5;
int motorRight = 6;
int ledPin = 13;

int baseSpeed = 185;
int maxCorrection = 180;

// Scaled Discrete PID Parameters
// Kp scaled by 100: 20 -> Kp = 0.20
// Ki scaled by 1000: 3 -> Ki = 0.003
// Kd scaled by 100: 35 -> Kd = 0.35
int Kp = 20;
int Ki = 3;
int Kd = 35;

int integral = 0;
int maxIntegral = 30000;
int lastError = 0;

int lostCounter = 0;
int lastTurnDir = 0; // -1: Left, 1: Right, 0: Straight

void setup() {
  Serial.begin(9600);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);

  Serial.println("Preset 11: Discrete PID Closed-Loop Controller active.");
  Serial.println("Reading analog reflectance on pins A1 & A2...");
  Serial.println("Discrete PID loop initialized with anti-windup clamping.");
}

void loop() {
  int leftAO = analogRead(pinLeftAO);
  int rightAO = analogRead(pinRightAO);

  // Black line ~100-250 (absorbs), White floor ~850-980 (reflects)
  // When centered: leftAO ~ rightAO -> error ~ 0
  // Drift RIGHT -> left sensor enters black line (leftAO drops) -> error > 0 -> steer LEFT
  // Drift LEFT  -> right sensor enters black line (rightAO drops) -> error < 0 -> steer RIGHT
  int error = rightAO - leftAO;

  // Case 1: Both sensors detect white floor -> Line Lost / Curve overshoot
  if (leftAO > 750 && rightAO > 750) {
    lostCounter++;
    integral = 0; // Anti-windup: reset integral on loss

    if (lostCounter < 30) {
      // Memory continuation: continue steering along last curve
      if (lastTurnDir == -1) {
        analogWrite(motorLeft, 20);
        analogWrite(motorRight, 210);
      } else if (lastTurnDir == 1) {
        analogWrite(motorLeft, 210);
        analogWrite(motorRight, 20);
      } else {
        analogWrite(motorLeft, baseSpeed);
        analogWrite(motorRight, baseSpeed);
      }
      digitalWrite(ledPin, HIGH);
      Serial.println("State: LINE LOST -> Curve Continuation");
    } else {
      // Search sweep pivot
      if (lastTurnDir == -1) {
        analogWrite(motorLeft, 0);
        analogWrite(motorRight, 150);
      } else {
        analogWrite(motorLeft, 150);
        analogWrite(motorRight, 0);
      }
      digitalWrite(ledPin, HIGH);
      Serial.println("State: OFF-TRACK -> Search Sweep Pivot");
    }
  }
  // Case 2: Intersection / Transverse Bar -> Both sensors detect black line
  else if (leftAO < 300 && rightAO < 300) {
    lostCounter = 0;
    integral = 0;
    analogWrite(motorLeft, 120);
    analogWrite(motorRight, 120);
    digitalWrite(ledPin, HIGH);
    Serial.println("State: INTERSECTION -> Slow Straight Crossing");
  }
  // Case 3: Closed-Loop Discrete PID Tracking
  else {
    lostCounter = 0;

    // Track last turn direction for curve memory
    if (error > 60) {
      lastTurnDir = -1; // Steering Left
    } else if (error < -60) {
      lastTurnDir = 1;  // Steering Right
    }

    // Deadband around line center (line centered between dual sensors)
    int activeError = error;
    if (abs(error) < 40) {
      activeError = 0;
    }

    // 1. Proportional Term (scaled by 100)
    int pTerm = (Kp * activeError) / 100;

    // 2. Integral Term (scaled by 1000) with Anti-Windup Clamping
    if (activeError == 0 || (activeError > 0 && lastError < 0) || (activeError < 0 && lastError > 0)) {
      integral = integral / 2;
    }
    integral = constrain(integral + activeError, -maxIntegral, maxIntegral);
    int iTerm = (Ki * integral) / 1000;

    // 3. Derivative Term (scaled by 100)
    int dError = activeError - lastError;
    int dTerm = (Kd * dError) / 100;
    lastError = activeError;

    // Total Steering Correction
    int correction = pTerm + iTerm + dTerm;
    correction = constrain(correction, -maxCorrection, maxCorrection);

    int leftPwm = constrain(baseSpeed - correction, 0, 255);
    int rightPwm = constrain(baseSpeed + correction, 0, 255);

    analogWrite(motorLeft, leftPwm);
    analogWrite(motorRight, rightPwm);

    // LED illuminates proportionally to cross-track correction magnitude
    if (abs(activeError) > 60) {
      digitalWrite(ledPin, HIGH);
    } else {
      digitalWrite(ledPin, LOW);
    }
  }

  delay(25);
}
`,
  },
  {
    id: 'radar_scanner',
    name: '12. Servo-Mounted Ultrasonic Radar Scanner (Phase 9B)',
    description: 'Servo-mounted HC-SR04 sonar scanning from 45° to 135°, real-time sector distance profiling, and closed-loop obstacle avoidance.',
    code: `// ============================================================================
// Phase 9B: Servo-Mounted Ultrasonic Radar Scanner & Sector Obstacle Avoidance
// Compatible with Sandboxed AST Interpreter: No ternary operators, bounded execution
// Sweeps SG90 Micro Servo 45° to 135° while measuring HC-SR04 sonar distances
// ============================================================================

#include <Servo.h>

Servo radarServo;

const int pinServo = 9;
const int trigPin = 11;
const int echoPin = 12;
const int motorLeft = 5;
const int motorRight = 6;
const int ledPin = 13;

int currentAngle = 90;
int sweepStep = 15;
int sweepDir = 1;

int distLeft = 100;
int distCenter = 100;
int distRight = 100;

const int safeThresholdCm = 25;
const int cruiseSpeed = 160;

void setup() {
  Serial.begin(9600);
  radarServo.attach(pinServo);
  radarServo.write(90);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(motorLeft, OUTPUT);
  pinMode(motorRight, OUTPUT);
  pinMode(ledPin, OUTPUT);

  Serial.println("Preset 12: Servo-Mounted Ultrasonic Radar Scanner Active");
  Serial.println("Sweeping servo 45 deg to 135 deg in 15 deg steps...");
  delay(100);
}

void loop() {
  // 1. Move servo to current sweep angle
  radarServo.write(currentAngle);
  delay(30);

  // 2. Measure distance using ultrasonic sensor
  int dist = readDistance(echoPin);
  if (dist <= 0) {
    dist = 400;
  }

  // 3. Update sector distance buffers
  if (currentAngle < 75) {
    distRight = dist;
  } else if (currentAngle > 105) {
    distLeft = dist;
  } else {
    distCenter = dist;
  }

  Serial.print("Radar Angle: ");
  Serial.print(currentAngle);
  Serial.print(" deg | Dist: ");
  Serial.print(dist);
  Serial.println(" cm");

  // 4. Closed-Loop Obstacle Avoidance Decision
  if (distCenter <= safeThresholdCm || dist <= safeThresholdCm) {
    digitalWrite(ledPin, HIGH);
    Serial.println("RADAR ALERT: Obstacle within 25cm!");

    if (distLeft > distRight) {
      // Steer Left (Left motor stopped, right motor forward)
      analogWrite(motorLeft, 0);
      analogWrite(motorRight, 160);
      Serial.println("Steering LEFT to avoid obstacle");
    } else {
      // Steer Right (Left motor forward, right motor stopped)
      analogWrite(motorLeft, 160);
      analogWrite(motorRight, 0);
      Serial.println("Steering RIGHT to avoid obstacle");
    }
  } else {
    digitalWrite(ledPin, LOW);
    analogWrite(motorLeft, cruiseSpeed);
    analogWrite(motorRight, cruiseSpeed);
  }

  // 5. Advance sweep angle
  currentAngle = currentAngle + (sweepDir * sweepStep);
  if (currentAngle >= 135) {
    currentAngle = 135;
    sweepDir = -1;
  } else if (currentAngle <= 45) {
    currentAngle = 45;
    sweepDir = 1;
  }

  delay(40);
}
`,
  },
];

