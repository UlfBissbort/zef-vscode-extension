#!/usr/bin/env python3
"""
Zef Notebook Kernel Runner

A simple Python kernel that executes code cells and returns structured output.
Communication is via stdin/stdout using JSON messages.

Protocol:
- Input: JSON object with {"code": "...", "cell_id": "..."}
- Output: JSON object with {
    "cell_id": "...",
    "status": "ok" | "error",
    "result": "repr of last expression or null",
    "stdout": "captured stdout",
    "stderr": "captured stderr", 
    "side_effects": [{"what": "stdout", "content": "..."}, ...],
    "error": {"type": "...", "message": "...", "traceback": "..."} (if status is error)
  }
"""

import sys
import json
import traceback
import io
from contextlib import redirect_stdout, redirect_stderr
from code import InteractiveInterpreter


class SideEffectCapture(io.StringIO):
    """
    A StringIO-like object that captures each write as a separate side effect.
    This allows us to track individual print() calls rather than just the final output.
    """
    def __init__(self, effect_type: str):
        super().__init__()
        self.effect_type = effect_type
        self.effects: list = []
        
    def write(self, s: str) -> int:
        # Don't capture empty strings or pure newlines between prints
        if s and s != '\n':
            # Strip trailing newline that print() adds
            content = s.rstrip('\n')
            if content:
                self.effects.append({
                    "what": self.effect_type,
                    "content": s  # Keep the original with newline
                })
        # Also write to underlying StringIO for backwards compatibility
        return super().write(s)
    
    def get_effects(self) -> list:
        return self.effects


class ZefKernel:
    """Simple Python kernel with persistent namespace."""
    
    def __init__(self):
        self.namespace = {"__name__": "__main__", "__doc__": None}
        self.interpreter = InteractiveInterpreter(self.namespace)
    
    def execute(self, code: str, cell_id: str = "") -> dict:
        """Execute code and return structured output."""
        result = {
            "cell_id": cell_id,
            "status": "ok",
            "result": None,
            "stdout": "",
            "stderr": "",
            "side_effects": [],
            "error": None
        }
        
        # Capture stdout and stderr with side effect tracking
        stdout_capture = SideEffectCapture("stdout")
        stderr_capture = SideEffectCapture("stderr")
        
        try:
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                # Try to compile as an expression first (to get return value)
                # If that fails, compile as exec (statements)
                last_result = self._execute_code(code)
                
                if last_result is not None:
                    result["result"] = repr(last_result)
                    
        except SyntaxError as e:
            result["status"] = "error"
            result["error"] = {
                "type": "SyntaxError",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        except Exception as e:
            result["status"] = "error"
            result["error"] = {
                "type": type(e).__name__,
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        
        result["stdout"] = stdout_capture.getvalue()
        result["stderr"] = stderr_capture.getvalue()
        
        # Collect all side effects (stdout and stderr events)
        result["side_effects"] = stdout_capture.get_effects() + stderr_capture.get_effects()
        
        return result
    
    def _execute_code(self, code: str):
        """
        Execute code and return the result of the last expression.
        
        Strategy:
        1. Try to parse the entire code block
        2. If the last statement is an expression, capture its value
        3. Execute everything and return the last expression's value
        """
        import ast
        
        code = code.strip()
        if not code:
            return None
        
        # Parse the code to analyze its structure
        try:
            tree = ast.parse(code, mode='exec')
        except SyntaxError:
            # Let the actual execution handle the error
            exec(code, self.namespace)
            return None
        
        if not tree.body:
            return None
        
        # Check if the last statement is an expression
        last_stmt = tree.body[-1]
        last_value = None
        
        if isinstance(last_stmt, ast.Expr):
            # The last statement is an expression - we want its value
            # Execute all but the last statement
            if len(tree.body) > 1:
                exec_tree = ast.Module(body=tree.body[:-1], type_ignores=[])
                exec(compile(exec_tree, '<cell>', 'exec'), self.namespace)
            
            # Evaluate the last expression
            expr_code = compile(ast.Expression(body=last_stmt.value), '<cell>', 'eval')
            last_value = eval(expr_code, self.namespace)
            
            # Also store _ for interactive use
            self.namespace['_'] = last_value
        else:
            # Execute all statements normally
            exec(compile(tree, '<cell>', 'exec'), self.namespace)
        
        return last_value


def main():
    """Main loop - read JSON commands from stdin, execute, write JSON results to stdout."""
    kernel = ZefKernel()
    
    # Signal that kernel is ready
    print(json.dumps({"status": "ready", "message": "Zef Kernel ready"}), flush=True)
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        try:
            message = json.loads(line)
            
            if message.get("command") == "shutdown":
                print(json.dumps({"status": "shutdown"}), flush=True)
                break
            
            code = message.get("code", "")
            cell_id = message.get("cell_id", "")
            
            result = kernel.execute(code, cell_id)
            print(json.dumps(result), flush=True)
            
        except json.JSONDecodeError as e:
            print(json.dumps({
                "status": "error",
                "error": {
                    "type": "JSONDecodeError",
                    "message": f"Invalid JSON input: {e}",
                    "traceback": ""
                }
            }), flush=True)
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "error": {
                    "type": type(e).__name__,
                    "message": str(e),
                    "traceback": traceback.format_exc()
                }
            }), flush=True)


if __name__ == "__main__":
    main()
