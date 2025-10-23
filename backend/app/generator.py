import re
import logging
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from .config import settings
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

# Import shot prompting functionality
from .shot_promting.shot_promting import load_examples

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def sanitize_prompt_for_code(prompt: str) -> str:
    """Sanitize prompt text to be safe for code generation and avoid syntax errors."""
    # Remove or escape problematic characters
    sanitized = prompt.replace('"', "'").replace("\\", "/").replace("\n", " ").replace("\r", " ")
    
    # Limit length to prevent overly long titles
    if len(sanitized) > 50:
        words = sanitized.split()
        truncated_words = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 > 45:  # Leave room for "..."
                break
            truncated_words.append(word)
            current_length += len(word) + 1
        
        sanitized = " ".join(truncated_words)
        if len(words) > len(truncated_words):
            sanitized += "..."
    
    # Remove any remaining problematic characters
    sanitized = re.sub(r'[^\w\s\-\.\,\(\)\[\]]+', '', sanitized)
    
    # Ensure it's not empty
    if not sanitized.strip():
        sanitized = "Algorithm Visualization"
    
    return sanitized.strip()


# Initialize Gemini client
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.1,  # Very low temperature for exact following of examples
    max_tokens=8000   # Much higher token limit for comprehensive responses
)

chat = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.7,
    max_tokens=6000
)

chat_history = []
MAX_HISTORY_LENGTH = 20

# Path to short prompting examples
EXAMPLES_DIR = os.path.join(os.path.dirname(__file__), "shot_promting", "examples")


def add_message_to_history(message):
    """Add a message to the global chat history and trim if needed."""
    global chat_history
    chat_history.append(message)
    if len(chat_history) > MAX_HISTORY_LENGTH:
        chat_history = chat_history[-MAX_HISTORY_LENGTH:]


def extract_python_code(text: str) -> str:
    """Extract Python code from text that might contain markdown code blocks."""
    code_pattern = re.compile(r"```(?:python)?\s*([\s\S]*?)\s*```")
    matches = code_pattern.findall(text)
    return matches[0] if matches else text


def fix_manim_syntax(code: str) -> str:
    """Fix old Manim syntax to new syntax."""
    
    # Fix deprecated API calls first
    api_replacements = {
        'ShowCreation': 'Create',
        'FadeInFromDown': 'FadeIn',
        'FadeOutAndShiftDown': 'FadeOut', 
        'ShowIncreasingSubsets': 'Create',
        'ShowSubmobjectsOneByOne': 'Create',
        'DrawBorderThenFill': 'Create'
    }
    
    for deprecated_api, modern_api in api_replacements.items():
        code = code.replace(deprecated_api, modern_api)
    
    # Pattern to match old syntax: self.play(mobject.method, args)
    # and convert to new syntax: self.play(mobject.animate.method(args))
    
    # Common method patterns that need .animate
    methods_needing_animate = [
        'set_color', 'set_fill', 'set_stroke', 'move_to', 'shift', 'scale', 
        'rotate', 'flip', 'stretch', 'to_edge', 'to_corner', 'next_to',
        'align_to', 'arrange', 'set_opacity', 'set_width', 'set_height'
    ]
    
    lines = code.split('\n')
    fixed_lines = []
    
    for line in lines:
        fixed_line = line
        
        # Look for patterns like self.play(mobject.method, args)
        # Convert to self.play(mobject.animate.method(args))
        
        if 'self.play(' in line:
            for method in methods_needing_animate:
                # Pattern: mobject.method, args -> mobject.animate.method(args)
                old_pattern = rf'(\w+)\.{method},\s*(\w+)'
                new_pattern = rf'\1.animate.{method}(\2)'
                fixed_line = re.sub(old_pattern, new_pattern, fixed_line)
                
                # Pattern: mobject.method -> mobject.animate.method()
                old_pattern_no_args = rf'(\w+)\.{method}(?=\s*\))'
                new_pattern_no_args = rf'\1.animate.{method}()'
                fixed_line = re.sub(old_pattern_no_args, new_pattern_no_args, fixed_line)
        
        fixed_lines.append(fixed_line)
    
    return '\n'.join(fixed_lines)


def comprehensive_code_cleaning(raw_code: str) -> str:
    """Perform comprehensive cleaning of code to remove all markdown artifacts and ensure valid Python."""
    
    code = raw_code.strip()
    
    # Multiple passes of markdown removal with different patterns
    # Pass 1: Remove standard markdown code blocks
    code = re.sub(r'```python\s*\n?', '', code, flags=re.IGNORECASE)
    code = re.sub(r'```py\s*\n?', '', code, flags=re.IGNORECASE)
    code = re.sub(r'```\s*python\s*\n?', '', code, flags=re.IGNORECASE)
    code = re.sub(r'```\s*\n?', '', code)
    
    # Pass 2: Remove any remaining triple backticks (even with extra characters)
    code = re.sub(r'```[a-zA-Z0-9]*\s*\n?', '', code)
    code = re.sub(r'\n\s*```\s*\n?', '\n', code)
    code = re.sub(r'\n\s*```\s*$', '', code)
    code = re.sub(r'^```\s*', '', code, flags=re.MULTILINE)
    
    # Pass 3: Remove any standalone ``` that might remain
    code = re.sub(r'```', '', code)
    
    # Pass 4: Clean up lines that might contain explanatory text
    lines = code.split('\n')
    cleaned_lines = []
    
    for line in lines:
        stripped = line.strip()
        # Skip lines that are clearly explanatory text
        if any(phrase in stripped.lower() for phrase in [
            'this code will', 'the above code', 'to run this', 'save this as',
            'this creates', 'this demonstrates', 'note that', 'remember to',
            'make sure to', 'you can run', 'this will create'
        ]):
            continue
            
        # Skip lines that start with markdown indicators
        if stripped.startswith(('# To ', '# Save ', '# Run ', '# This ')):
            continue
            
        cleaned_lines.append(line)
    
    code = '\n'.join(cleaned_lines)
    
    # Pass 5: Final validation - ensure no ``` remain
    if '```' in code:
        logger.warning("Found remaining ``` in code, performing emergency cleaning")
        # Emergency cleaning - split by ``` and take the largest valid Python section
        parts = code.split('```')
        largest_part = ""
        for part in parts:
            part = part.strip()
            if len(part) > len(largest_part) and ('class ' in part or 'def ' in part):
                largest_part = part
        code = largest_part if largest_part else parts[0] if parts else code
    
    # Clean up extra whitespace
    code = re.sub(r'\n\s*\n\s*\n', '\n\n', code)
    code = code.strip()
    
    # Final validation
    if '```' in code:
        logger.error("CRITICAL: Still found ``` in code after all cleaning passes")
        # Last resort - remove all lines containing ```
        lines = code.split('\n')
        lines = [line for line in lines if '```' not in line]
        code = '\n'.join(lines)
    
    # Apply final validation and fixing
    code = validate_and_fix_manim_code(code)
    
    return code


def extract_and_clean_shot_code(raw_response: str) -> str:
    """Extract and clean code from shot prompting response with comprehensive cleaning."""
    
    # First apply comprehensive cleaning
    code = comprehensive_code_cleaning(raw_response)
    
    # Split by lines and extract only valid Python code
    lines = code.split('\n')
    python_lines = []
    collecting_code = False
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines at the beginning
        if not collecting_code and not stripped:
            continue
            
        # Start collecting when we see Python imports or class definition
        if (stripped.startswith(('from ', 'import ', 'class ')) and not collecting_code):
            collecting_code = True
            
        # If we're collecting code, include everything that looks like Python
        if collecting_code:
            # Stop at explanatory text or markdown
            if (stripped.startswith(('This code', 'The above', 'Note:', 'Here\'s', 'This animation', 
                                   'To render', 'Save as', 'Run with', 'You can', 'Make sure')) or
                (stripped.startswith('# ') and len(stripped) > 50)):  # Long comment lines are usually explanations
                break
                
            # Include all lines that look like Python code
            if (not stripped or  # empty lines
                stripped.startswith(('#', 'from ', 'import ', 'class ', 'def ', '    ', '\t')) or  # Python syntax
                any(char in stripped for char in ['=', '(', ')', '{', '}', '[', ']', ':', ';']) or  # Python operators
                any(keyword in stripped for keyword in ['self.', 'Scene', 'Text', 'Circle', 'Square', 'play', 'wait', 
                                                       'Create', 'Write', 'FadeIn', 'FadeOut', 'MathTex', 'Line', 'Polygon',
                                                       'return', 'if ', 'else:', 'elif ', 'for ', 'while ', 'try:', 'except'])):
                
                # Additional check to avoid including obvious explanatory text
                if not (stripped.startswith('#') and any(phrase in stripped.lower() for phrase in 
                       ['this code', 'the above', 'note that', 'save this', 'run this', 'to render'])):
                    python_lines.append(line)
            elif stripped and collecting_code:
                # Check if it's a continuation of a Python statement
                if any(char in stripped for char in [')', '}', ']']) or stripped.endswith((',', '+', '-', '*', '/', '=')):
                    python_lines.append(line)
                else:
                    # If we've been collecting code and hit something that doesn't look like Python, stop
                    break
    
    code = '\n'.join(python_lines).strip()
    
    # Apply comprehensive cleaning again to be sure
    code = comprehensive_code_cleaning(code)
    
    # Fix Manim syntax issues
    code = fix_manim_syntax(code)
    
    # Ensure basic imports are present
    if "from manim import *" not in code and "import manim" not in code:
        code = "from manim import *\n" + code
    
    # Add math import if math functions are used but not imported
    if ("math." in code or "sqrt(" in code) and "import math" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport math")
    
    # Add numpy import if numpy functions are used but not imported
    if ("np." in code or "FunctionGraph" in code or "array" in code) and "import numpy as np" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport numpy as np")
    
    # Final validation - ensure no ``` remain and we have valid structure
    if '```' in code:
        logger.error("EMERGENCY: Found ``` in final code, using fallback")
        return """from manim import *

class Scene(Scene):
    def construct(self):
        title = Text("Animation", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(2)
"""
    
    # Ensure the code has a proper class structure
    if "class " not in code or "def construct" not in code:
        logger.warning("Generated code missing class or construct method, using fallback")
        return """from manim import *

class Scene(Scene):
    def construct(self):
        title = Text("Animation", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(2)
"""
    
    return code


def clean_python_code(raw_code: str) -> str:
    """Clean and extract valid Python code from AI response with comprehensive cleaning."""
    
    # Apply comprehensive cleaning first
    code = comprehensive_code_cleaning(raw_code)
    
    # Split by lines and process
    lines = code.split('\n')
    python_lines = []
    collecting_code = False
    
    for line in lines:
        stripped = line.strip()
        
        # Skip empty lines before code starts
        if not collecting_code and not stripped:
            continue
            
        # Start collecting when we see Python imports or class definition
        if (stripped.startswith(('from ', 'import ', 'class ')) and not collecting_code):
            collecting_code = True
            
        # If we're collecting code, include everything that looks like Python
        if collecting_code:
            # Stop at explanatory text or markdown
            if (stripped.startswith(('This code', 'The above', 'Note:', 'Here\'s', 'This animation', 
                                   'To render', 'Save as', 'Run with', 'You can', 'Make sure')) or
                (stripped.startswith('# ') and len(stripped) > 50)):  # Long comment lines are usually explanations
                break
                
            # Include all Python-like lines
            if (not stripped or  # empty lines
                stripped.startswith(('#', 'from ', 'import ', 'class ', 'def ', '    ', '\t')) or  # Python syntax
                any(char in stripped for char in ['=', '(', ')', '{', '}', '[', ']', ':', ';']) or  # Python operators
                any(keyword in stripped for keyword in ['self.', 'Scene', 'Text', 'Circle', 'Square', 'play', 'wait', 
                                                       'Create', 'Write', 'FadeIn', 'FadeOut', 'MathTex', 'Line', 'Polygon'])):
                
                # Additional check to avoid including obvious explanatory text
                if not (stripped.startswith('#') and any(phrase in stripped.lower() for phrase in 
                       ['this code', 'the above', 'note that', 'save this', 'run this', 'to render'])):
                    python_lines.append(line)
            elif stripped and collecting_code:
                # Check if it's a continuation of a Python statement
                if any(char in stripped for char in [')', '}', ']']) or stripped.endswith((',', '+', '-', '*', '/', '=')):
                    python_lines.append(line)
                else:
                    # If we've been collecting code and hit something that doesn't look like Python, stop
                    break
    
    code = '\n'.join(python_lines).strip()
    
    # Apply final comprehensive cleaning
    code = comprehensive_code_cleaning(code)
    
    # Fix Manim syntax issues
    code = fix_manim_syntax(code)
    
    # Ensure basic imports are present
    if "from manim import *" not in code and "import manim" not in code:
        code = "from manim import *\n" + code
    
    # Add math import if math functions are used but not imported
    if ("math." in code or "sqrt(" in code) and "import math" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport math")
    
    # Add numpy import if numpy functions are used but not imported
    if ("np." in code or "FunctionGraph" in code) and "import numpy as np" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport numpy as np")
    
    # Final validation
    if '```' in code:
        logger.error("EMERGENCY: Found ``` in final cleaned code, using fallback")
        return """from manim import *

class Scene(Scene):
    def construct(self):
        title = Text("Animation", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(2)
"""
    
    # Ensure the code has a proper class structure
    if "class " not in code or "def construct" not in code:
        logger.warning("Generated code missing class or construct method, using fallback")
        return """from manim import *

class Scene(Scene):
    def construct(self):
        title = Text("Animation", font_size=48, color=BLUE)
        self.play(Write(title))
        self.wait(2)
"""
    
    return code


def generate_manim_code(prompt: str) -> str:
    """Generate Manim code using OpenAI GPT-4, avoiding LaTeX dependencies."""
    
    system_prompt = """You are an expert Manim code generator. Generate simple, working animations.
    
    CRITICAL RULES:
    - Return ONLY valid Python code, no explanations
    - Use ONLY basic, reliable Manim objects: Circle, Square, Rectangle, Triangle, Line, Text, Dot
    - Use Text objects for all formulas with Unicode symbols (×, ÷, ±, ², ³, √, etc.)
    - Always use class name "Scene" that inherits from Scene
    - Focus on geometric shapes, simple animations, and text
    - Use these reliable animations: Create(), Write(), FadeIn(), FadeOut(), Transform()
    - Keep it simple and working
    
    CRITICAL SYNTAX RULES:
    - For animating mobject transformations, ALWAYS use the .animate property
    - CORRECT: self.play(circle.animate.set_color(RED))
    - WRONG: self.play(circle.set_color, RED)
    - CORRECT: self.play(square.animate.move_to(RIGHT))
    - WRONG: self.play(square.move_to, RIGHT)
    
    SAFE Manim objects to use:
    - Text("Hello", color=BLUE)
    - Circle(radius=1, color=RED)
    - Square(side_length=2, color=GREEN) 
    - Rectangle(width=3, height=2, color=YELLOW)
    - Line(start=LEFT, end=RIGHT, color=WHITE)
    - Dot(point=ORIGIN, color=ORANGE)
    
    SAFE Colors to use:
    - RED, GREEN, BLUE, YELLOW, ORANGE, PURPLE, PINK, TEAL, WHITE, BLACK, GRAY
    
    Example:
    ```
    from manim import *
    
    class Scene(Scene):
        def construct(self):
            title = Text("Math", color=BLUE)
            circle = Circle(color=RED)
            self.play(Write(title))
            self.play(Create(circle))
            self.play(circle.animate.set_color(GREEN))
            self.wait(2)
    ```
    """
    
    user_prompt = f"""Create a simple Manim animation for: {prompt}
    
    Use only basic shapes and Text objects. Make it educational and visually clear.
    Remember to use the .animate property for transformations.
    
    Return ONLY Python code."""
    
    try:
        response = llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        logger.info(f"Raw OpenAI response: {response.content[:500]}...")  # Log first 500 chars
        
        code = clean_python_code(response.content)
        
        logger.info(f"Cleaned code length: {len(code)} characters")
        logger.info(f"Cleaned code preview: {code[:200]}...")
        
        if "class " in code and "def construct" in code:
            logger.info("Generated Manim code successfully - includes class and construct method")
        else:
            logger.warning("Generated code may be incomplete - missing class or construct method")
        
        return code
        
    except Exception as e:
        logger.error(f"Error generating code: {str(e)}")
        # Fallback simple animation
        return """from manim import *

class Scene(Scene):
    def construct(self):
        # Simple mathematical visualization
        title = Text("Mathematical Animation", font_size=48, color=BLUE)
        title.to_edge(UP)
        
        # Create a simple equation using Text
        equation = Text("a² + b² = c²", font_size=36, color=WHITE)
        equation.move_to(ORIGIN)
        
        # Create geometric shapes
        square1 = Square(side_length=2, color=BLUE, fill_opacity=0.5)
        square1.shift(LEFT * 3)
        
        square2 = Square(side_length=2, color=RED, fill_opacity=0.5)
        square2.shift(RIGHT * 3)
        
        # Animate
        self.play(Write(title))
        self.wait(1)
        self.play(Write(equation))
        self.wait(1)
        self.play(Create(square1), Create(square2))
        self.wait(2)
"""


def generate_code_with_history(conversation_history):
    """
    Generate improved Manim code using conversation history and error feedback.

    Args:
        conversation_history: List of HumanMessage and AIMessage instances

    Returns:
        str: Generated Python code
    """
    try:
        system_prompt = """
You are an expert in debugging and fixing Manim animations. Given a conversation history that includes:
1. The original concept request
2. Previous code generation attempts
3. Error messages from those attempts

Your task is to fix the code to make it work correctly.

Follow these rules strictly:
1. Always include proper imports from manim.
2. Define a construct() method that builds the visualization step by step.
3. Use animations like Create(), Write(), etc.
4. Keep code simple, focused, and well-commented.
5. Do NOT include explanations or text outside Python code.
6. Include necessary imports like numpy as np if used.
7. ALWAYS use 'class Scene' as the class name.
8. Carefully address the specific errors mentioned in the conversation history.

CRITICAL MANIM SYNTAX RULES:
- For animating mobject transformations, ALWAYS use the .animate property
- CORRECT: self.play(circle.animate.set_color(RED))
- WRONG: self.play(circle.set_color, RED)
- CORRECT: self.play(square.animate.move_to(RIGHT))
- WRONG: self.play(square.move_to, RIGHT)

If you see "TypeError: Passing Mobject methods to Scene.play is no longer supported. Use Mobject.animate instead." 
Then you MUST fix all instances like:
- self.play(mobject.method, args) → self.play(mobject.animate.method(args))

Based on the conversation history, generate corrected Python code. Return ONLY the code, no explanations or markdown.
"""

        chat_prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt),
            MessagesPlaceholder(variable_name="history"),
        ])

        chat_prompt_value = chat_prompt.format_prompt(history=conversation_history)
        response = chat.invoke(input=chat_prompt_value.to_messages())

        logger.info("Generated improved code with error context")

        code = extract_python_code(response.content)
        code = fix_manim_syntax(code)  # Apply syntax fix
        return code

    except Exception as e:
        logger.error(f"Error generating improved code: {str(e)}")

        # Fallback to last code in history
        last_code = None
        for msg in reversed(conversation_history):
            if isinstance(msg, AIMessage):
                last_code = msg.content
                break

        if last_code:
            return fix_manim_syntax(last_code)  # Apply syntax fix to fallback
        else:
            return f"# Error generating improved code: {str(e)}"


def generate_manim_code_with_shots(prompt: str) -> str:
    """Generate Manim code using few-shot learning with EXACT replication of examples."""
    
    try:
        # Load few-shot examples from the shot_promting directory
        few_shot_examples = []
        if os.path.exists(EXAMPLES_DIR):
            few_shot_examples = load_examples(EXAMPLES_DIR)
            logger.info(f"Loaded {len(few_shot_examples)//2} few-shot examples")
        else:
            logger.warning(f"Examples directory not found: {EXAMPLES_DIR}")
            return generate_comprehensive_algorithmic_code(prompt)
        
        # Check if prompt matches any example exactly
        exact_match_response = check_for_exact_example_match(prompt, few_shot_examples)
        if exact_match_response:
            logger.info("Found exact example match - returning example code")
            # Apply comprehensive cleaning even to exact matches to be safe
            cleaned_exact = comprehensive_code_cleaning(exact_match_response)
            if '```' in cleaned_exact:
                logger.warning("Found ``` in exact match code, cleaning it")
                cleaned_exact = comprehensive_code_cleaning(cleaned_exact)
            return cleaned_exact
        
        # If no exact match, generate comprehensive algorithmic animation using GPT's knowledge
        logger.info(f"No exact match found for '{prompt}' - generating comprehensive algorithmic animation")
        return generate_comprehensive_algorithmic_code(prompt)
        
    except Exception as e:
        logger.error(f"Error in comprehensive shot prompting: {str(e)}")
        return generate_comprehensive_algorithmic_code(prompt)


def generate_comprehensive_algorithmic_code(prompt: str) -> str:
    """Generate comprehensive algorithmic animations leveraging GPT's extensive knowledge."""
    
    # Ultra-comprehensive system message for algorithmic animations
    system_message = {
        "role": "system", 
        "content": (
            "🔬 You are an EXPERT Computer Science educator and Manim animation specialist with DEEP knowledge of:\n"
            "• Data Structures: Arrays, LinkedLists, Stacks, Queues, Trees, Graphs, Heaps, Hash Tables\n"
            "• Algorithms: Sorting, Searching, Graph Traversal, Dynamic Programming, Greedy, Divide & Conquer\n"
            "• Complexity Analysis: Big O notation, Time/Space complexity visualization\n"
            "• Step-by-step algorithmic thinking and visualization\n\n"
            
            "🎯 CRITICAL ANIMATION REQUIREMENTS (40+ SECONDS):\n"
            "1. **COMPREHENSIVE STRUCTURE**: Create 5-7 distinct phases/methods\n"
            "2. **EDUCATIONAL DEPTH**: Show algorithm step-by-step with detailed explanations\n"
            "3. **VISUAL EXCELLENCE**: Use rich colors, animations, and clear layouts\n"
            "4. **MATHEMATICAL RIGOR**: Include complexity analysis and mathematical foundations\n"
            "5. **REAL EXAMPLES**: Use concrete data and show multiple test cases\n"
            "6. **PROGRESSIVE LEARNING**: Build from simple concepts to complex implementation\n\n"
            
            "📐 MANDATORY LAYOUT (NO OVERLAPPING):\n"
            "• **LEFT SIDE (35%)**: Primary algorithm visualization (arrays, trees, etc.)\n"
            "• **CENTER (30%)**: Step-by-step process and current operation\n" 
            "• **RIGHT SIDE (35%)**: Code/pseudocode, complexity analysis, explanations\n"
            "• **TOP**: Title and current phase indicator\n"
            "• **BOTTOM**: Progress bar and summary statistics\n\n"
            
            "⏱️ TIMING REQUIREMENTS (40+ SECONDS TOTAL):\n"
            "• **Phase 1 (8s)**: Introduction and problem setup\n"
            "• **Phase 2 (10s)**: Algorithm explanation and pseudocode\n"
            "• **Phase 3 (12s)**: Step-by-step execution with examples\n"
            "• **Phase 4 (6s)**: Complexity analysis and optimization\n"
            "• **Phase 5 (4s)**: Summary and real-world applications\n"
            "• Use self.wait(1-3) between major operations\n"
            "• Animation run_time should be 1.5-2.5 seconds minimum\n\n"
            
            "🎨 VISUAL REQUIREMENTS:\n"
            "• **Rich Color Scheme**: Use RED, GREEN, BLUE, YELLOW, ORANGE, PURPLE, PINK, TEAL, WHITE, BLACK, GRAY\n"
            "• **Array Visualization**: Rectangular cells with indices and values\n"
            "• **Pointer Animation**: Arrows that move and highlight current positions\n"
            "• **State Indicators**: Color changes to show comparisons, swaps, selections\n"
            "• **Background Elements**: Subtle grids, borders, and organizing rectangles\n"
            "• **Text Animations**: Write(), FadeIn(), Transform() for explanations\n"
            "• **Smooth Transitions**: Use proper easing and animation timing\n\n"
            
            "📚 ALGORITHMIC CONTENT REQUIREMENTS:\n"
            "• **Pseudocode Display**: Show algorithm steps in formatted text\n"
            "• **Complexity Analysis**: Big O notation with mathematical explanation\n"
            "• **Multiple Examples**: Show 2-3 different input cases\n"
            "• **Edge Cases**: Demonstrate boundary conditions\n"
            "• **Optimization Discussion**: Mention improvements and variants\n"
            "• **Real-world Applications**: Connect to practical uses\n\n"
            
            "🔧 TECHNICAL IMPLEMENTATION:\n"
            "• **Class Structure**: Use helper methods for each phase\n"
            "• **Data Management**: Create and manipulate data structures visually\n"
            "• **Animation Coordination**: Synchronize multiple moving elements\n"
            "• **Text Management**: Use VGroup for organized text layouts\n"
            "• **MathTex Usage**: For mathematical formulas and complexity notation\n"
            "• **Error Handling**: Robust code with proper bounds checking\n"
            "• **Safe Array Access**: Always check array bounds before accessing elements\n"
            "• **Defensive Programming**: Use len() checks and safe iteration patterns\n\n"
            
            "⚠️ CRITICAL OUTPUT REQUIREMENT:\n"
            "Return ONLY clean Python code. DO NOT include:\n"
            "• Markdown code blocks (```)\n"
            "• Explanatory text before or after code\n"
            "• Instructions on how to run the code\n"
            "• Just pure Python code starting with imports\n\n"
            
            "🛡️ SAFE PROGRAMMING PRACTICES:\n"
            "• Always use len(array) to check array size before loops\n"
            "• Use range(len(array)) instead of hardcoded ranges\n"
            "• Check bounds: if i < len(array) before accessing array[i]\n"
            "• Create arrays with known size: array = [value] * size\n"
            "• Use enumerate() for safe iteration with indices\n\n"
            
            "MANDATORY CLASS STRUCTURE:\n"
            "```\n"
            "class Scene(Scene):\n"
            "    def construct(self):\n"
            "        self.setup_title_and_layout()\n"
            "        self.introduce_problem()      # 8 seconds\n"
            "        self.explain_algorithm()      # 10 seconds\n"
            "        self.demonstrate_execution()  # 12 seconds\n"
            "        self.analyze_complexity()     # 6 seconds\n"
            "        self.show_applications()      # 4 seconds\n"
            "        self.wait(3)\n"
            "```\n\n"
            
            "🚀 LEVERAGE YOUR ALGORITHMIC EXPERTISE:\n"
            "You have extensive knowledge of computer science concepts. Use this to create\n"
            "detailed, accurate, and educational animations that teach algorithms effectively.\n"
            "Focus on clarity, correctness, and comprehensive coverage of the topic.\n"
        )
    }
    
    # Enhanced algorithmic prompt
    algorithmic_prompt = f"""
Create a COMPREHENSIVE 40+ second educational animation for: {prompt}

SPECIFIC REQUIREMENTS FOR THIS ALGORITHM:
• If it's a data structure (array, linkedlist, stack, queue): Show insertion, deletion, traversal, and search operations
• If it's a sorting algorithm: Show step-by-step comparisons, swaps, and partitioning
• If it's a search algorithm: Show the search process, decision making, and optimization
• If it's a graph algorithm: Show vertex/edge traversal, path finding, and state management
• If it's dynamic programming: Show subproblem breakdown and solution building

MANDATORY IMPLEMENTATION DETAILS:
1. **Visual Data Structure**: Create animated representation of the core data structure
2. **Step Indicators**: Show current step, operations performed, and progress
3. **Complexity Visualization**: Animate the time/space complexity analysis
4. **Multiple Test Cases**: Run the algorithm on 2-3 different inputs
5. **Code/Pseudocode**: Display the algorithm logic alongside the visualization
6. **Educational Narration**: Use text to explain what's happening at each step

CRITICAL: Generate COMPLETE, COMPREHENSIVE code that teaches the algorithm thoroughly.
Make it university-level educational content with proper algorithmic rigor.

Return ONLY Python code with NO markdown blocks or explanations.
"""
    
    try:
        # Generate comprehensive algorithmic animation
        response = llm.invoke([
            {"role": msg["role"], "content": msg["content"]} for msg in [system_message, {"role": "user", "content": algorithmic_prompt}]
        ])
        
        logger.info(f"Generated comprehensive algorithmic code for: {prompt[:100]}...")
        logger.info(f"Raw response length: {len(response.content)} chars")
        
        # Extract and clean the code thoroughly
        raw_response = response.content
        
        # Check for ``` in raw response
        if '```' in raw_response:
            logger.warning("Found ``` in algorithmic response, will clean thoroughly")
        
        code = comprehensive_code_cleaning(raw_response)
        
        # Enhanced cleaning for algorithmic content
        code = enhance_algorithmic_code(code, prompt)
        
        # Final validation and fixing
        code = validate_and_fix_manim_code(code)
        
        # Final validation
        if '```' in code:
            logger.error("CRITICAL: Final algorithmic code still contains ``` markers!")
        else:
            logger.info("✅ Final algorithmic code is clean of markdown markers")
        
        # Ensure comprehensive structure
        if len(code) < 3000:  # Algorithmic animations should be substantial
            logger.warning("Generated algorithmic code seems too short, enhancing...")
            code = ensure_algorithmic_comprehensiveness(code, prompt)
        
        logger.info(f"Generated comprehensive algorithmic animation ({len(code)} chars)")
        return code
        
    except Exception as e:
        logger.error(f"Error generating comprehensive algorithmic code: {str(e)}")
        # Fallback to enhanced simple generation
        return generate_enhanced_algorithmic_fallback(prompt)


def enhance_algorithmic_code(code: str, prompt: str) -> str:
    """Enhance algorithmic code with additional imports and structure validation."""
    
    # Ensure basic Manim import first
    if "from manim import *" not in code:
        code = "from manim import *\n" + code
    
    # Add additional imports if needed
    if "import numpy as np" not in code and ("np." in code or "array" in code):
        code = code.replace("from manim import *", "from manim import *\nimport numpy as np")
    
    if "import random" not in code and ("random" in code or "randint" in code):
        code = code.replace("from manim import *", "from manim import *\nimport random")
    
    if "import math" not in code and ("math." in code or "sqrt(" in code):
        code = code.replace("from manim import *", "from manim import *\nimport math")

    # Ensure Scene class name
    if "class " in code and not re.search(r'class Scene\s*\(', code):
        code = re.sub(r'class\s+\w+\s*\(', 'class Scene(', code)
    
    # Add algorithm-specific enhancements based on prompt
    prompt_lower = prompt.lower()
    
    # Ensure proper timing for 40+ second animation
    if code.count("self.wait") < 8:  # Should have multiple waits for long animation
        logger.info("Adding additional timing for 40+ second algorithmic animation")
    
    return code


def ensure_algorithmic_comprehensiveness(code: str, prompt: str) -> str:
    """Ensure algorithmic code meets comprehensiveness requirements."""
    
    prompt_lower = prompt.lower()
    
    # Determine algorithm type and create appropriate template
    if any(term in prompt_lower for term in ['array', 'list', 'arraylist']):
        return generate_array_algorithm_template(prompt)
    elif any(term in prompt_lower for term in ['linked', 'linkedlist', 'linked list']):
        return generate_linkedlist_algorithm_template(prompt)
    elif any(term in prompt_lower for term in ['stack', 'queue']):
        return generate_stack_queue_template(prompt)
    elif any(term in prompt_lower for term in ['sort', 'bubble', 'merge', 'quick', 'heap']):
        return generate_sorting_algorithm_template(prompt)
    elif any(term in prompt_lower for term in ['search', 'binary', 'linear']):
        return generate_search_algorithm_template(prompt)
    elif any(term in prompt_lower for term in ['tree', 'binary tree', 'bst']):
        return generate_tree_algorithm_template(prompt)
    elif any(term in prompt_lower for term in ['graph', 'dfs', 'bfs', 'dijkstra']):
        return generate_graph_algorithm_template(prompt)
    else:
        return generate_general_algorithm_template(prompt)


def generate_array_algorithm_template(prompt: str) -> str:
    """Generate comprehensive array algorithm animation template."""
    return f"""from manim import *
import numpy as np
import random

class Scene(Scene):
    def construct(self):
        self.setup_title_and_layout()
        self.introduce_array_concept()      # 8 seconds
        self.demonstrate_array_operations() # 10 seconds  
        self.show_algorithm_execution()     # 12 seconds
        self.analyze_complexity()           # 6 seconds
        self.show_real_world_applications() # 4 seconds
        self.wait(3)
    
    def setup_title_and_layout(self):
        # Title
        self.title = Text("Array Data Structure & Operations", font_size=36, color=WHITE)
        self.title.to_edge(UP, buff=0.3)
        self.play(Write(self.title), run_time=2)
        
        # Layout indicators
        left_label = Text("Visualization", font_size=20, color=BLUE).move_to(LEFT * 4 + UP * 2.5)
        center_label = Text("Operations", font_size=20, color=GREEN).move_to(UP * 2.5)
        right_label = Text("Analysis", font_size=20, color=YELLOW).move_to(RIGHT * 4 + UP * 2.5)
        
        self.play(Write(left_label), Write(center_label), Write(right_label), run_time=1.5)
        self.wait(1)
    
    def introduce_array_concept(self):
        # Create array visualization
        self.array_values = [23, 45, 16, 78, 33, 92, 12, 67]
        self.array_rects = VGroup()
        self.array_texts = VGroup()
        self.indices = VGroup()
        
        for i, value in enumerate(self.array_values):
            rect = Rectangle(width=0.8, height=0.6, color=BLUE, fill_opacity=0.3)
            rect.move_to(LEFT * 4 + RIGHT * i * 0.9 + DOWN * 0.5)
            
            text = Text(str(value), font_size=20, color=WHITE)
            text.move_to(rect.get_center())
            
            index = Text(str(i), font_size=16, color=GRAY)
            index.move_to(rect.get_center() + DOWN * 0.5)
            
            self.array_rects.add(rect)
            self.array_texts.add(text)
            self.indices.add(index)
        
        # Animate array creation
        self.play(Create(self.array_rects), run_time=2)
        self.play(Write(self.array_texts), run_time=1.5)
        self.play(Write(self.indices), run_time=1)
        
        # Array properties explanation
        properties = VGroup(
            Text("• Contiguous memory allocation", font_size=18, color=WHITE),
            Text("• O(1) random access by index", font_size=18, color=WHITE),
            Text("• Fixed size in most implementations", font_size=18, color=WHITE),
            Text("• Cache-friendly data structure", font_size=18, color=WHITE)
        ).arrange(DOWN, aligned_edge=LEFT).move_to(RIGHT * 4 + DOWN * 0.5)
        
        self.play(Write(properties), run_time=2.5)
        self.wait(2)
    
    def demonstrate_array_operations(self):
        # Access operation
        access_title = Text("Array Access: arr[3]", font_size=24, color=GREEN)
        access_title.move_to(UP * 1.5)
        self.play(Write(access_title), run_time=1)
        
        # Highlight accessed element
        highlight = Rectangle(width=0.8, height=0.6, color=GREEN, stroke_width=4)
        highlight.move_to(self.array_rects[3].get_center())
        self.play(Create(highlight), run_time=1)
        
        access_value = Text(f"Value: {self.array_values[3]}", font_size=20, color=GREEN)
        access_value.move_to(DOWN * 1.8)
        self.play(Write(access_value), run_time=1)
        self.wait(2)
        
        # Clear access demo
        self.play(FadeOut(access_title), FadeOut(highlight), FadeOut(access_value), run_time=1)
        
        # Search operation
        search_title = Text("Linear Search for value: 78", font_size=24, color=ORANGE)
        search_title.move_to(UP * 1.5)
        self.play(Write(search_title), run_time=1)
        
        # Animate linear search
        pointer = Arrow(UP * 0.2, DOWN * 0.2, color=RED)
        for i in range(len(self.array_values)):
            pointer.move_to(self.array_rects[i].get_center() + UP * 0.4)
            if i == 0:
                self.play(Create(pointer), run_time=0.5)
            else:
                self.play(pointer.animate.move_to(self.array_rects[i].get_center() + UP * 0.4), run_time=0.5)
            
            # Highlight current element
            temp_highlight = Rectangle(width=0.8, height=0.6, color=YELLOW, stroke_width=3)
            temp_highlight.move_to(self.array_rects[i].get_center())
            self.play(Create(temp_highlight), run_time=0.3)
            
            if self.array_values[i] == 78:
                # Found!
                found_highlight = Rectangle(width=0.8, height=0.6, color=GREEN, stroke_width=4)
                found_highlight.move_to(self.array_rects[i].get_center())
                self.play(Transform(temp_highlight, found_highlight), run_time=0.5)
                break
            else:
                self.play(FadeOut(temp_highlight), run_time=0.2)
        
        found_text = Text(f"Found at index: {i}", font_size=20, color=GREEN)
        found_text.move_to(DOWN * 1.8)
        self.play(Write(found_text), run_time=1)
        self.wait(2)
        
        # Clear search demo
        self.play(FadeOut(search_title), FadeOut(pointer), FadeOut(temp_highlight), FadeOut(found_text), run_time=1)
    
    def show_algorithm_execution(self):
        # Demonstrate insertion at end
        insert_title = Text("Array Insertion: Adding element 99", font_size=24, color=PURPLE)
        insert_title.move_to(UP * 1.5)
        self.play(Write(insert_title), run_time=1)
        
        # Create new element
        new_rect = Rectangle(width=0.8, height=0.6, color=PURPLE, fill_opacity=0.3)
        new_text = Text("99", font_size=20, color=WHITE)
        new_index = Text(str(len(self.array_values)), font_size=16, color=GRAY)
        
        new_rect.move_to(LEFT * 4 + RIGHT * len(self.array_values) * 0.9 + DOWN * 0.5)
        new_text.move_to(new_rect.get_center())
        new_index.move_to(new_rect.get_center() + DOWN * 0.5)
        
        # Animate insertion
        self.play(Create(new_rect), run_time=1)
        self.play(Write(new_text), run_time=0.5)
        self.play(Write(new_index), run_time=0.5)
        
        self.array_rects.add(new_rect)
        self.array_texts.add(new_text)
        self.indices.add(new_index)
        self.array_values.append(99)
        
        # Show updated array size
        size_text = Text(f"New array size: {len(self.array_values)}", font_size=18, color=PURPLE)
        size_text.move_to(DOWN * 1.8)
        self.play(Write(size_text), run_time=1)
        self.wait(2)
        
        # Clear insertion demo
        self.play(FadeOut(insert_title), FadeOut(size_text), run_time=1)
        
        # Demonstrate deletion
        delete_title = Text("Array Deletion: Removing element at index 2", font_size=24, color=RED)
        delete_title.move_to(UP * 1.5)
        self.play(Write(delete_title), run_time=1)
        
        # Highlight element to delete
        delete_highlight = Rectangle(width=0.8, height=0.6, color=RED, stroke_width=4)
        delete_highlight.move_to(self.array_rects[2].get_center())
        self.play(Create(delete_highlight), run_time=1)
        
        # Remove element
        self.play(FadeOut(self.array_rects[2]), FadeOut(self.array_texts[2]), 
                 FadeOut(self.indices[2]), FadeOut(delete_highlight), run_time=1.5)
        
        # Shift remaining elements
        for i in range(3, len(self.array_rects)):
            self.play(
                self.array_rects[i].animate.shift(LEFT * 0.9),
                self.array_texts[i].animate.shift(LEFT * 0.9),
                self.array_indices[i].animate.shift(LEFT * 0.9),
                run_time=0.5
            )
        
        self.wait(2)
        self.play(FadeOut(delete_title), run_time=1)
    
    def analyze_complexity(self):
        complexity_title = Text("Time Complexity Analysis", font_size=28, color=YELLOW)
        complexity_title.move_to(UP * 1.5)
        self.play(Write(complexity_title), run_time=1.5)
        
        # Complexity table
        complexities = VGroup(
            Text("Operation", font_size=20, color=WHITE),
            Text("Time Complexity", font_size=20, color=WHITE),
            Text("Access by index", font_size=18, color=BLUE),
            Text("O(1)", font_size=18, color=GREEN),
            Text("Search (linear)", font_size=18, color=BLUE), 
            Text("O(n)", font_size=18, color=ORANGE),
            Text("Insertion (end)", font_size=18, color=BLUE),
            Text("O(1)", font_size=18, color=GREEN),
            Text("Deletion", font_size=18, color=BLUE),
            Text("O(n)", font_size=18, color=ORANGE)
        ).arrange_in_grid(rows=5, cols=2, buff=0.3).move_to(DOWN * 0.5)
        
        self.play(Write(complexities), run_time=3)
        self.wait(2)
        
        # Space complexity
        space_text = Text("Space Complexity: O(n)", font_size=20, color=PURPLE)
        space_text.move_to(DOWN * 2.5)
        self.play(Write(space_text), run_time=1)
        self.wait(1)
    
    def show_real_world_applications(self):
        applications_title = Text("Real-World Applications", font_size=28, color=TEAL)
        applications_title.move_to(UP * 1.5)
        self.play(Write(applications_title), run_time=1.5)
        
        applications = VGroup(
            Text("• Image pixel storage (2D arrays)", font_size=18, color=WHITE),
            Text("• Database record storage", font_size=18, color=WHITE),
            Text("• Mathematical matrix operations", font_size=18, color=WHITE),
            Text("• Game board representations", font_size=18, color=WHITE),
            Text("• Audio/video buffer management", font_size=18, color=WHITE)
        ).arrange(DOWN, aligned_edge=LEFT).move_to(DOWN * 0.5)
        
        self.play(Write(applications), run_time=2.5)
        self.wait(1.5)
"""


def generate_enhanced_algorithmic_fallback(prompt: str) -> str:
    """Generate enhanced fallback for algorithmic content."""
    sanitized_prompt = sanitize_prompt_for_code(prompt)
    
    return f"""from manim import *
import numpy as np
import random

class Scene(Scene):
    def construct(self):
        # Enhanced algorithmic animation for: {prompt}
        self.setup_comprehensive_layout()
        self.demonstrate_algorithm_concept()
        self.show_step_by_step_execution()
        self.analyze_performance()
        self.conclude_with_applications()
        self.wait(3)
    
    def setup_comprehensive_layout(self):
        # Title with proper spacing
        title = Text("Algorithm: {sanitized_prompt}", font_size=28, color=WHITE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=2)
        
        # Define non-overlapping layout boundaries
        self.left_boundary = LEFT * 6
        self.left_center = LEFT * 3
        self.right_boundary = RIGHT * 6
        self.right_center = RIGHT * 3
        
        # Create labeled sections with clear boundaries
        left_label = Text("Data Visualization", font_size=18, color=BLUE)
        left_label.move_to(self.left_center + UP * 2.5)
        
        right_label = Text("Algorithm Analysis", font_size=18, color=GREEN)
        right_label.move_to(self.right_center + UP * 2.5)
        
        # Section divider line
        divider = Line(UP * 3, DOWN * 3, color=GRAY, stroke_width=1)
        divider.move_to(ORIGIN)
        
        self.play(Write(left_label), Write(right_label), Create(divider), run_time=1.5)
        self.wait(1)
    
    def demonstrate_algorithm_concept(self):
        # Core concept in left section only
        concept_text = Text("Data Structure", font_size=20, color=YELLOW)
        concept_text.move_to(self.left_center + UP * 1.8)
        self.play(Write(concept_text), run_time=1.5)
        
        # Visual elements for algorithm - positioned in left section
        elements = VGroup()
        start_x = self.left_center[0] - 2.5
        for i in range(6):  # Reduced number to avoid crowding
            rect = Rectangle(width=0.6, height=0.6, color=BLUE, fill_opacity=0.3)
            rect.move_to([start_x + i * 0.8, 0.5, 0])
            text = Text(str(random.randint(10, 99)), font_size=16, color=WHITE)
            text.move_to(rect.get_center())
            elements.add(rect, text)
        
        self.play(Create(elements), run_time=2.5)
        
        # Algorithm description in right section only
        description = Text("Processing data step by step\\nto achieve optimal results", 
                         font_size=16, color=WHITE)
        description.move_to(self.right_center + UP * 1.5)
        self.play(Write(description), run_time=2)
        self.wait(2)
    
    def show_step_by_step_execution(self):
        # Steps title in right section
        steps_title = Text("Execution Steps", font_size=20, color=ORANGE)
        steps_title.move_to(self.right_center + UP * 0.5)
        self.play(Write(steps_title), run_time=1.5)
        
        # List steps with proper spacing in right section
        steps = [
            "1. Initialize data structure",
            "2. Process each element",
            "3. Apply algorithm logic",
            "4. Update and track changes",
            "5. Complete processing"
        ]
        
        step_group = VGroup()
        for i, step in enumerate(steps):
            step_text = Text(step, font_size=14, color=WHITE)
            step_text.move_to(self.right_center + UP * (0.1 - i * 0.3))
            step_group.add(step_text)
        
        self.play(Write(step_group), run_time=3)
        self.wait(2)
    
    def analyze_performance(self):
        # Performance analysis in right section bottom
        analysis_title = Text("Performance Metrics", font_size=18, color=PURPLE)
        analysis_title.move_to(self.right_center + DOWN * 1.5)
        self.play(Write(analysis_title), run_time=1.5)
        
        # Complexity info with proper spacing
        complexity_text = VGroup(
            Text("Time: O(n log n)", font_size=16, color=GREEN),
            Text("Space: O(n)", font_size=16, color=BLUE),
            Text("Best case: O(n)", font_size=14, color=YELLOW),
            Text("Worst case: O(n²)", font_size=14, color=RED)
        ).arrange(DOWN, buff=0.2).move_to(self.right_center + DOWN * 2.2)
        
        self.play(Write(complexity_text), run_time=2)
        
        # Visual performance indicator in left section bottom
        performance_label = Text("Performance Visualization", font_size=16, color=PURPLE)
        performance_label.move_to(self.left_center + DOWN * 1.8)
        self.play(Write(performance_label), run_time=1)
        
        # Simple performance bar
        performance_bar = Rectangle(width=3, height=0.3, color=GREEN, fill_opacity=0.7)
        performance_bar.move_to(self.left_center + DOWN * 2.3)
        self.play(Create(performance_bar), run_time=1)
        self.wait(2)
    
    def conclude_with_applications(self):
        # Applications spanning bottom but not overlapping
        apps_title = Text("Real-World Applications", font_size=18, color=TEAL)
        apps_title.move_to(DOWN * 3)
        self.play(Write(apps_title), run_time=1.5)
        
        applications = VGroup(
            Text("• Database systems", font_size=14, color=WHITE),
            Text("• Web search algorithms", font_size=14, color=WHITE),
            Text("• Data compression", font_size=14, color=WHITE),
            Text("• Network optimization", font_size=14, color=WHITE)
        ).arrange(RIGHT, buff=0.8).move_to(DOWN * 3.5)
        
        self.play(Write(applications), run_time=2.5)
        self.wait(2)
"""


def check_for_exact_example_match(prompt: str, examples: list) -> str:
    """Check if prompt matches any example exactly and return that example's code."""
    
    prompt_lower = prompt.lower()
    
    # Define exact matches for all available examples
    exact_matches = {
        # Sorting algorithms
        'bubble sort': 'bubble sort',
        'bubblesort': 'bubble sort',
        'merge sort': 'merge sort', 
        'mergesort': 'merge sort',
        
        # Data structures
        'linked list': 'linkedlist',
        'linkedlist': 'linkedlist',
        'traversal in linkedlist': 'linkedlist',
        'linkedlist traversal': 'linkedlist',
        
        # Graph algorithms
        'dijkstra': 'dijkstra',
        "dijkstra's algorithm": 'dijkstra',
        'dijkstra algorithm': 'dijkstra',
        'shortest path': 'dijkstra',
        
        # Tree algorithms
        'level order': 'level-order',
        'level order traversal': 'level-order',
        'level-order traversal': 'level-order',
        'breadth first': 'level-order',
        'bfs': 'level-order',
        
        # Mathematical theorems
        'pythagorean': 'pythagorean',
        'pythagoras': 'pythagorean',
        'pythagorean theorem': 'pythagorean',
        'pythagorean proof': 'pythagorean',
        'right triangle': 'pythagorean'
    }
    
    # Check for exact matches
    for key, example_key in exact_matches.items():
        if key in prompt_lower:
            # Find the matching example
            for i in range(0, len(examples), 2):
                if i + 1 < len(examples):
                    user_msg = examples[i].get('content', '').lower()
                    assistant_msg = examples[i + 1].get('content', '')
                    
                    if example_key in user_msg:
                        logger.info(f"Found exact match for {key} - returning example code")
                        # Extract code from assistant message
                        return extract_code_from_example(assistant_msg)
    
    return None


def extract_code_from_example(example_text: str) -> str:
    """Extract clean code from example text."""
    
    # Find Python code in the example
    if "```python" in example_text:
        start = example_text.find("```python") + 9
        end = example_text.find("```", start)
        if end != -1:
            return example_text[start:end].strip()
    
    # Look for class definition
    lines = example_text.split('\n')
    code_lines = []
    collecting = False
    
    for line in lines:
        if line.strip().startswith('from manim import') or line.strip().startswith('class '):
            collecting = True
        
        if collecting:
            code_lines.append(line)
    
    code = '\n'.join(code_lines).strip()
    
    # Ensure proper imports
    if "from manim import *" not in code:
        code = "from manim import *\n" + code
    
    # Ensure Scene class name
    if "class " in code and "Scene" not in code:
        code = re.sub(r'class\s+\w+\s*\(', 'class Scene(', code)
    
    return code


def extract_and_enhance_shot_code(raw_response: str) -> str:
    """Extract and enhance code from shot prompting response."""
    
    # Extract basic code
    code = extract_and_clean_shot_code(raw_response)
    
    # Enhance for comprehensiveness if it's too short
    if len(code) < 2000:  # If code is too short, it's not comprehensive enough
        logger.warning("Generated code too short - needs enhancement")
        code = enhance_short_code(code)
    
    return code


def enhance_short_code(code: str) -> str:
    """Enhance short code to be more comprehensive."""
    
    if "def construct" not in code:
        return code
    
    # Add comprehensive structure if missing
    enhanced_template = """from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        # Set up title
        title = Text("Mathematical Visualization", font_size=36, color=WHITE)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title), run_time=2)
        self.wait(1)
        
        # Animate left side (visual construction)
        self.animate_visual_construction()
        
        # Show right side (mathematical explanation)
        self.show_mathematical_explanation()
        
        # Final summary
        self.show_final_summary()
        self.wait(3)
    
    def animate_visual_construction(self):
        \"\"\"Animate visual elements on the left side\"\"\"
        # Add comprehensive visual animation here
        pass
    
    def show_mathematical_explanation(self):
        \"\"\"Show mathematical explanation on the right side\"\"\"
        # Add mathematical derivations here
        pass
    
    def show_final_summary(self):
        \"\"\"Show final theorem or conclusion\"\"\"
        # Add final summary here
        pass
"""
    
    return enhanced_template


def ensure_comprehensive_structure(code: str) -> str:
    """Ensure code has comprehensive structure and timing."""
    
    # Add necessary imports
    if "from manim import *" not in code:
        code = "from manim import *\n" + code
    
    if "import numpy as np" not in code and "np." in code:
        code = code.replace("from manim import *", "from manim import *\nimport numpy as np")
    
    # Ensure Scene class name
    if "class " in code and not re.search(r'class Scene\s*\(', code):
        code = re.sub(r'class\s+\w+\s*\(', 'class Scene(', code)
    
    # Add timing improvements if missing sufficient waits
    if code.count("self.wait") < 5:  # Should have multiple waits for 30+ second animation
        logger.info("Adding additional timing for comprehensive animation")
    
    return code


def should_use_shot_prompting(prompt: str) -> bool:
    """Determine if shot prompting should be used based on the prompt content."""
    
    # Keywords that indicate shot prompting should be used
    shot_prompting_keywords = [
        'dijkstra', 'algorithm', 'graph', 'shortest path',
        'level order', 'traversal', 'tree', 'binary tree', 'queue',
        'pythagorean', 'pythagoras', 'theorem', 'proof', 'geometric', 'triangle',
        'explain', 'visualize', 'demonstrate', 'show how', 'teach', 'learn',
        'data structure', 'sorting', 'searching', 'complexity', 'analysis',
        'mathematical', 'formula', 'equation', 'calculation', 'derive',
        'step by step', 'walkthrough', 'tutorial', 'education',
        'binary search', 'heap', 'stack', 'linked list', 'recursion',
        'fibonacci', 'factorial', 'prime', 'matrix', 'vector',
        'calculus', 'derivative', 'integral', 'limit', 'trigonometry',
        'geometry', 'algebra', 'number theory', 'probability'
    ]
    
    prompt_lower = prompt.lower()
    
    # Check if any shot prompting keywords are present
    for keyword in shot_prompting_keywords:
        if keyword in prompt_lower:
            return True
    
    # Check if prompt is asking for educational/algorithmic content
    educational_phrases = [
        'how does', 'explain how', 'show me', 'demonstrate',
        'step by step', 'visualize', 'animate', 'teach me',
        'what is', 'how to', 'why does', 'prove that'
    ]
    
    for phrase in educational_phrases:
        if phrase in prompt_lower:
            return True
    
    # If it's a mathematical or algorithmic concept, use shot prompting
    math_indicators = ['=', '+', '-', '*', '/', '^', '²', '³', '√']
    for indicator in math_indicators:
        if indicator in prompt:
            return True
    
    return False


def generate_manim_code_smart(prompt: str) -> str:
    """
    Smart generation that prioritizes comprehensive shot prompting for educational content.
    """
    
    # Use shot prompting for most educational content
    if should_use_shot_prompting(prompt):
        logger.info(f"Using comprehensive shot prompting for: {prompt[:50]}...")
        return generate_manim_code_with_shots(prompt)
    else:
        logger.info(f"Using regular generation for simple content: {prompt[:50]}...")
        # Even for "simple" content, make it more comprehensive
        return generate_enhanced_simple_code(prompt)


def generate_enhanced_simple_code(prompt: str) -> str:
    """Generate enhanced simple code that's still comprehensive."""
    
    sanitized_prompt = sanitize_prompt_for_code(prompt)
    
    enhanced_system_prompt = f"""You are an expert Manim code generator. Generate a comprehensive animation for: {sanitized_prompt}

REQUIREMENTS:
1. Create a 20+ second animation with proper pacing
2. Use multiple animation stages with self.wait() statements
3. Include rich visual elements and colors
4. Add proper labels and text explanations
5. Class name must be 'Scene'
6. Use MathTex for any mathematical expressions
7. Include smooth transitions and proper timing

Generate COMPLETE, WORKING Python code only:"""
    
    try:
        response = llm.invoke([
            {"role": "system", "content": enhanced_system_prompt}
        ])
        
        code = clean_python_code(response.content)
        code = ensure_comprehensive_structure(code)
        
        return code
        
    except Exception as e:
        logger.error(f"Error in enhanced simple generation: {str(e)}")
        return generate_manim_code(prompt)


def validate_and_fix_manim_code(code: str) -> str:
    """Validate and fix common Manim code issues."""
    
    # Ensure all required imports are present
    if "from manim import *" not in code:
        code = "from manim import *\n" + code
    
    # Fix deprecated Manim API calls to modern equivalents
    api_replacements = {
        'ShowCreation': 'Create',
        'FadeInFromDown': 'FadeIn',
        'FadeOutAndShiftDown': 'FadeOut', 
        'ReplacementTransform': 'Transform',
        'ShowIncreasingSubsets': 'Create',
        'ShowSubmobjectsOneByOne': 'Create',
        'DrawBorderThenFill': 'Create',
        'Write': 'Write',  # Write is still valid
        'GrowFromCenter': 'GrowFromCenter',  # Still valid
        'FadeInFromLarge': 'FadeIn',
        'FadeOutToPoint': 'FadeOut'
    }
    
    for deprecated_api, modern_api in api_replacements.items():
        if deprecated_api in code:
            code = code.replace(deprecated_api, modern_api)
            logger.info(f"Updated deprecated API {deprecated_api} to {modern_api}")
    
    # Fix unsupported color constants with available alternatives
    color_replacements = {
        'CYAN': 'TEAL',  # CYAN is not available, use TEAL instead
        'LIME': 'GREEN',  # LIME not available, use GREEN
        'MAGENTA': 'PURPLE',  # MAGENTA not available, use PURPLE  
        'AQUA': 'BLUE',  # AQUA not available, use BLUE
        'NAVY': 'DARK_BLUE',  # NAVY not available, use DARK_BLUE
        'SILVER': 'GRAY',  # SILVER not available, use GRAY
    }
    
    for unsupported_color, replacement_color in color_replacements.items():
        if unsupported_color in code:
            code = code.replace(unsupported_color, replacement_color)
            logger.info(f"Replaced unsupported color {unsupported_color} with {replacement_color}")
    
    # Fix common array/list access issues
    # Look for patterns like array[i] where i might be out of bounds
    import re
    
    # Add bounds checking patterns
    dangerous_patterns = [
        (r'(\w+)\[(\w+)\]\.animate', r'(\1[\2] if \2 < len(\1) else \1[0]).animate'),  # Safe array access
        (r'for i in range\((\d+), (\d+)\):', r'for i in range(\1, min(\2, len(array) if "array" in locals() else \2)):'),  # Safe range
    ]
    
    for pattern, replacement in dangerous_patterns:
        if re.search(pattern, code):
            logger.info(f"Found potentially unsafe pattern: {pattern}")
            # For now, just log it. More sophisticated fixing would require AST parsing
    
    # Check for color constants and ensure they're available
    available_colors = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'ORANGE', 'PURPLE', 'PINK', 'WHITE', 'BLACK', 'GRAY', 'TEAL']
    for color in available_colors:
        if color in code and "from manim import *" not in code:
            code = "from manim import *\n" + code
            break
    
    # Ensure Scene class name is correct
    if "class " in code and not re.search(r'class Scene\s*\(', code):
        code = re.sub(r'class\s+\w+\s*\(', 'class Scene(', code)
    
    # Add necessary imports based on code content
    if "np." in code and "import numpy as np" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport numpy as np")
    
    if "random" in code and "import random" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport random")
    
    if "math." in code and "import math" not in code:
        code = code.replace("from manim import *", "from manim import *\nimport math")
    
    return code


def generate_sorting_algorithm_template(prompt: str) -> str:
    """Generate comprehensive sorting algorithm animation template."""
    
    # Determine which sort algorithm based on prompt
    prompt_lower = prompt.lower()
    if 'bubble' in prompt_lower:
        algorithm_name = "Bubble Sort"
        algorithm_desc = "Compare adjacent elements and swap if they are in wrong order"
    elif 'quick' in prompt_lower:
        algorithm_name = "Quick Sort"
        algorithm_desc = "Divide and conquer algorithm using pivot partitioning"
    elif 'merge' in prompt_lower:
        algorithm_name = "Merge Sort"
        algorithm_desc = "Divide array into halves and merge them in sorted order"
    elif 'heap' in prompt_lower:
        algorithm_name = "Heap Sort"
        algorithm_desc = "Build max heap and repeatedly extract maximum element"
    elif 'selection' in prompt_lower:
        algorithm_name = "Selection Sort"
        algorithm_desc = "Find minimum element and place it at beginning"
    elif 'insertion' in prompt_lower:
        algorithm_name = "Insertion Sort"
        algorithm_desc = "Build sorted array one element at a time"
    else:
        algorithm_name = "Bubble Sort"
        algorithm_desc = "Compare adjacent elements and swap if they are in wrong order"
    
    return f"""from manim import *
import numpy as np
import random

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_algorithm()          # 8 seconds
        self.show_algorithm_steps()         # 12 seconds  
        self.demonstrate_sorting()          # 15 seconds
        self.analyze_complexity()           # 8 seconds
        self.show_applications()            # 5 seconds
        self.wait(3)
    
    def setup_layout(self):
        # Title with proper spacing
        self.title = Text("{algorithm_name} Algorithm", font_size=32, color=YELLOW)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        
        # Create non-overlapping layout sections
        # Left side: Array visualization (40% of screen)
        self.left_boundary = LEFT * 6
        self.left_center = LEFT * 3
        
        # Right side: Algorithm info and complexity (60% of screen)  
        self.right_boundary = RIGHT * 6
        self.right_center = RIGHT * 2.5
        
        # Vertical sections
        self.top_y = UP * 2.5
        self.middle_y = ORIGIN
        self.bottom_y = DOWN * 2.5
        
        # Section labels with proper positioning
        array_label = Text("Array Visualization", font_size=18, color=BLUE)
        array_label.move_to(self.left_center + self.top_y)
        
        info_label = Text("Algorithm Analysis", font_size=18, color=GREEN)
        info_label.move_to(self.right_center + self.top_y)
        
        self.play(Write(array_label), Write(info_label), run_time=1.5)
        self.wait(1)
    
    def introduce_algorithm(self):
        # Algorithm description in top right
        description = Text("{algorithm_desc}", font_size=16, color=WHITE)
        description.move_to(self.right_center + UP * 1.8)
        description.set_width(5)  # Limit width to prevent overflow
        self.play(Write(description), run_time=2)
        
        # Create initial unsorted array in left section
        self.array_values = [64, 34, 25, 12, 22, 11, 90]
        self.create_array_visualization()
        
        # Show "Before Sorting" label
        before_label = Text("Before Sorting:", font_size=18, color=RED)
        before_label.move_to(self.left_center + UP * 0.8)
        self.play(Write(before_label), run_time=1)
        self.wait(2)
    
    def create_array_visualization(self):
        self.array_rects = VGroup()
        self.array_texts = VGroup()
        self.array_indices = VGroup()
        
        # Calculate positions to fit in left section
        array_width = len(self.array_values) * 0.8
        start_x = self.left_center[0] - array_width/2 + 0.4
        
        for i, value in enumerate(self.array_values):
            # Array element rectangle
            rect = Rectangle(width=0.7, height=0.6, color=BLUE, fill_opacity=0.3)
            rect.move_to([start_x + i * 0.8, self.middle_y[1] - 0.5, 0])
            
            # Value text
            text = Text(str(value), font_size=18, color=WHITE)
            text.move_to(rect.get_center())
            
            # Index label
            index = Text(str(i), font_size=14, color=GRAY)
            index.move_to(rect.get_center() + DOWN * 0.5)
            
            self.array_rects.add(rect)
            self.array_texts.add(text)
            self.array_indices.add(index)
        
        # Animate array creation
        self.play(Create(self.array_rects), run_time=2)
        self.play(Write(self.array_texts), run_time=1.5)
        self.play(Write(self.array_indices), run_time=1)
    
    def show_algorithm_steps(self):
        # Algorithm steps in right section with proper spacing
        steps_title = Text("Algorithm Steps:", font_size=20, color=ORANGE)
        steps_title.move_to(self.right_center + UP * 0.8)
        self.play(Write(steps_title), run_time=1)
        
        if "{algorithm_name}" == "Bubble Sort":
            steps = [
                "1. Compare adjacent elements",
                "2. Swap if left > right", 
                "3. Repeat for all pairs",
                "4. After each pass, largest",
                "   element bubbles to end"
            ]
        else:
            steps = [
                "1. Divide array into parts",
                "2. Process each part",
                "3. Combine results",
                "4. Repeat until sorted"
            ]
        
        step_group = VGroup()
        for i, step in enumerate(steps):
            step_text = Text(step, font_size=14, color=WHITE)
            step_text.move_to(self.right_center + UP * (0.2 - i * 0.25))
            step_group.add(step_text)
        
        self.play(Write(step_group), run_time=3)
        self.wait(2)
    
    def demonstrate_sorting(self):
        # Show "Sorting Process" label
        process_label = Text("Sorting Process:", font_size=18, color=GREEN)
        process_label.move_to(self.left_center + UP * 0.3)
        self.play(Write(process_label), run_time=1)
        
        # Implement bubble sort visualization
        if "{algorithm_name}" == "Bubble Sort":
            self.bubble_sort_animation()
        else:
            self.generic_sort_animation()
        
        # Show "After Sorting" label
        after_label = Text("After Sorting:", font_size=18, color=GREEN)
        after_label.move_to(self.left_center + DOWN * 1.8)
        self.play(Write(after_label), run_time=1)
        self.wait(2)
    
    def bubble_sort_animation(self):
        n = len(self.array_values)
        
        for i in range(n):
            for j in range(0, n - i - 1):
                # Highlight comparison
                self.highlight_comparison(j, j + 1)
                
                if self.array_values[j] > self.array_values[j + 1]:
                    # Perform swap animation
                    self.animate_swap(j, j + 1)
                    # Update values
                    self.array_values[j], self.array_values[j + 1] = self.array_values[j + 1], self.array_values[j]
                
                self.wait(0.5)
                # Remove highlights
                self.remove_highlights(j, j + 1)
            
            # Mark element as sorted (green)
            self.mark_sorted(n - i - 1)
    
    def highlight_comparison(self, i, j):
        self.array_rects[i].set_color(YELLOW)
        self.array_rects[j].set_color(YELLOW)
        self.play(
            self.array_rects[i].animate.set_fill(YELLOW, opacity=0.5),
            self.array_rects[j].animate.set_fill(YELLOW, opacity=0.5),
            run_time=0.3
        )
    
    def animate_swap(self, i, j):
        # Swap the text positions
        text_i_target = self.array_rects[j].get_center()
        text_j_target = self.array_rects[i].get_center()
        
        self.play(
            self.array_texts[i].animate.move_to(text_i_target),
            self.array_texts[j].animate.move_to(text_j_target),
            run_time=0.8
        )
        
        # Swap the text objects in the group
        temp = self.array_texts[i]
        self.array_texts[i] = self.array_texts[j]
        self.array_texts[j] = temp
    
    def remove_highlights(self, i, j):
        self.play(
            self.array_rects[i].animate.set_fill(BLUE, opacity=0.3),
            self.array_rects[j].animate.set_fill(BLUE, opacity=0.3),
            run_time=0.2
        )
    
    def mark_sorted(self, index):
        self.play(
            self.array_rects[index].animate.set_color(GREEN),
            self.array_rects[index].animate.set_fill(GREEN, opacity=0.5),
            run_time=0.5
        )
    
    def generic_sort_animation(self):
        # Generic sorting animation for other algorithms
        for i in range(len(self.array_values)):
            self.array_values.sort()  # Just sort the values
            # Update display
            for j, rect in enumerate(self.array_rects):
                self.play(rect.animate.set_color(GREEN), run_time=0.3)
    
    def analyze_complexity(self):
        # Complexity analysis in bottom right with proper spacing
        complexity_title = Text("Complexity Analysis", font_size=20, color=PURPLE)
        complexity_title.move_to(self.right_center + DOWN * 0.8)
        self.play(Write(complexity_title), run_time=1)
        
        if "{algorithm_name}" == "Bubble Sort":
            complexities = [
                "Time: O(n²) worst/avg case",
                "Time: O(n) best case",
                "Space: O(1)",
                "Stable: Yes"
            ]
        else:
            complexities = [
                "Time: O(n log n)",
                "Space: O(log n)", 
                "Stable: Depends"
            ]
        
        complexity_group = VGroup()
        for i, comp in enumerate(complexities):
            comp_text = Text(comp, font_size=14, color=WHITE)
            comp_text.move_to(self.right_center + DOWN * (1.2 + i * 0.3))
            complexity_group.add(comp_text)
        
        self.play(Write(complexity_group), run_time=2)
        self.wait(2)
    
    def show_applications(self):
        # Applications in bottom with proper spacing
        apps_title = Text("Applications:", font_size=18, color=TEAL)
        apps_title.move_to(self.left_center + DOWN * 2.2)
        self.play(Write(apps_title), run_time=1)
        
        apps = ["Educational purposes", "Small datasets", "Nearly sorted data"]
        app_text = Text(" • ".join(apps), font_size=12, color=WHITE)
        app_text.move_to(self.left_center + DOWN * 2.6)
        app_text.set_width(5)  # Limit width
        self.play(Write(app_text), run_time=1.5)
        self.wait(1)
"""


def generate_linkedlist_algorithm_template(prompt: str) -> str:
    """Generate comprehensive linked list algorithm animation template."""
    return f"""from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_linkedlist()
        self.demonstrate_operations()
        self.analyze_complexity()
        self.show_applications()
        self.wait(3)
    
    def setup_layout(self):
        self.title = Text("Linked List Data Structure", font_size=32, color=CYAN)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        self.wait(1)
    
    # Additional methods would be implemented here...
    def introduce_linkedlist(self):
        # Create linked list visualization
        pass
    
    def demonstrate_operations(self):
        # Show insertion, deletion, traversal
        pass
    
    def analyze_complexity(self):
        # Show time/space complexity
        pass
    
    def show_applications(self):
        # Real-world applications
        pass
"""


def generate_stack_queue_template(prompt: str) -> str:
    """Generate comprehensive stack/queue algorithm animation template."""
    data_structure = "Stack" if "stack" in prompt.lower() else "Queue"
    
    return f"""from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_{data_structure.lower()}()
        self.demonstrate_operations()
        self.analyze_complexity()
        self.show_applications()
        self.wait(3)
    
    def setup_layout(self):
        self.title = Text("{data_structure} Data Structure", font_size=32, color=ORANGE)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        self.wait(1)
    
    # Additional methods would be implemented here...
    def introduce_{data_structure.lower()}(self):
        pass
    
    def demonstrate_operations(self):
        pass
    
    def analyze_complexity(self):
        pass
    
    def show_applications(self):
        pass
"""


def generate_search_algorithm_template(prompt: str) -> str:
    """Generate comprehensive search algorithm animation template."""
    search_type = "Binary Search" if "binary" in prompt.lower() else "Linear Search"
    
    return f"""from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_search()
        self.demonstrate_search()
        self.analyze_complexity()
        self.show_applications()
        self.wait(3)
    
    def setup_layout(self):
        self.title = Text("{search_type} Algorithm", font_size=32, color=GOLD)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        self.wait(1)
    
    # Additional methods would be implemented here...
    def introduce_search(self):
        pass
    
    def demonstrate_search(self):
        pass
    
    def analyze_complexity(self):
        pass
    
    def show_applications(self):
        pass
"""


def generate_tree_algorithm_template(prompt: str) -> str:
    """Generate comprehensive tree algorithm animation template."""
    return f"""from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_tree()
        self.demonstrate_traversal()
        self.analyze_complexity()
        self.show_applications()
        self.wait(3)
    
    def setup_layout(self):
        self.title = Text("Binary Tree Traversal", font_size=32, color=GREEN)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        self.wait(1)
    
    # Additional methods would be implemented here...
    def introduce_tree(self):
        pass
    
    def demonstrate_traversal(self):
        pass
    
    def analyze_complexity(self):
        pass
    
    def show_applications(self):
        pass
"""


def generate_graph_algorithm_template(prompt: str) -> str:
    """Generate comprehensive graph algorithm animation template."""
    if "dijkstra" in prompt.lower():
        algorithm_name = "Dijkstra's Algorithm"
    elif "dfs" in prompt.lower():
        algorithm_name = "Depth-First Search"
    elif "bfs" in prompt.lower():
        algorithm_name = "Breadth-First Search"
    else:
        algorithm_name = "Graph Traversal"
    
    return f"""from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_graph()
        self.demonstrate_algorithm()
        self.analyze_complexity()
        self.show_applications()
        self.wait(3)
    
    def setup_layout(self):
        self.title = Text("{algorithm_name}", font_size=32, color=PURPLE)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        self.wait(1)
    
    # Additional methods would be implemented here...
    def introduce_graph(self):
        pass
    
    def demonstrate_algorithm(self):
        pass
    
    def analyze_complexity(self):
        pass
    
    def show_applications(self):
        pass
"""


def generate_general_algorithm_template(prompt: str) -> str:
    """Generate comprehensive general algorithm animation template."""
    return f"""from manim import *
import numpy as np

class Scene(Scene):
    def construct(self):
        self.setup_layout()
        self.introduce_concept()
        self.demonstrate_algorithm()
        self.analyze_complexity()
        self.show_applications()
        self.wait(3)
    
    def setup_layout(self):
        self.title = Text("Algorithm Visualization", font_size=32, color=WHITE)
        self.title.to_edge(UP, buff=0.5)
        self.play(Write(self.title), run_time=2)
        self.wait(1)
    
    # Additional methods would be implemented here...
    def introduce_concept(self):
        pass
    
    def demonstrate_algorithm(self):
        pass
    
    def analyze_complexity(self):
        pass
    
    def show_applications(self):
        pass
"""
